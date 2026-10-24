/**
 * Page data access. Pages read the precomputed snapshots (one D1 row each); only the match detail reads
 * its own rows (event + offers + history by primary key). A visit never triggers a feed request.
 */
import { env } from 'cloudflare:workers';
import type { FeedBook } from '../config/bookmakers';
import { FEED_BOOKS } from '../config/bookmakers';
import { isCurrent, isFresh, eventUrl } from '../server/store/derive';
import { bestOf } from '../server/calc/odds';
import { isDemo } from '../server/demo';
import { settings, type Env, type Market, type Outcome, type Settings } from '../server/types';
import type { EventView, RadarSnapshot, UpcomingSnapshot } from '../server/view';

export const E = env as unknown as Env;
export const cfg = (): Settings => settings(E);
export const demo = () => isDemo(E);
export const now = () => Math.floor(Date.now() / 1000);

const EMPTY_UP: UpcomingSnapshot = { at: 0, books: {}, events: [], stats: { events: 0, offers: 0, changes24h: 0, firstRecordAt: null } };

async function derived<T>(key: string): Promise<T | null> {
  try {
    const row = await E.DB.prepare('SELECT json FROM derived WHERE key = ?').bind(key).first<{ json: string }>();
    return row ? (JSON.parse(row.json) as T) : null;
  } catch (e) {
    console.error('derived read failed', key, String(e));
    return null;
  }
}

export const upcoming = async () => (await derived<UpcomingSnapshot>('upcoming')) ?? EMPTY_UP;
export const radar = async () => derived<RadarSnapshot>('radar');

export { OUTCOMES, outcomesFor } from './ticket';
import { outcomesFor } from './ticket';

export interface Cell {
  book: FeedBook;
  odds: number | null; // thousandths; null = no offer from this book
  current: boolean;
  state: 'current' | 'stale' | 'suspended' | 'removed' | 'mismatch' | 'missing' | 'started';
  best: boolean;
  tie: boolean;
}
export interface Row { outcome: Outcome; cells: Cell[]; best: ReturnType<typeof bestOf> }

/** Comparison rows of one event, evaluated at render time (freshness depends on "now"). */
export function compare(ev: EventView, books: UpcomingSnapshot['books'], t: number, c: Settings): Row[] {
  return outcomesFor(ev).map((outcome) => {
    const cells: Cell[] = FEED_BOOKS.map((book) => {
      const b = ev.books[book];
      const o = b?.outcomes[outcome];
      const current = isCurrent(ev, book, outcome, books, t, c);
      const state: Cell['state'] = !b || !o ? 'missing' : b.mismatch ? 'mismatch' : ev.startAt <= t ? 'started' : b.removed || o.removedAt !== null ? 'removed'
        : !o.enabled ? 'suspended' : !isFresh(books[book], t, c) ? 'stale' : 'current';
      return { book, odds: o ? o.odds : null, current, state, best: false, tie: false };
    });
    const best = bestOf(cells.map((x) => ({ book: x.book, odds: (x.odds ?? 0) / 1000, enabled: true, fresh: x.current })));
    if (best.kind === 'best') for (const x of cells) if (best.books.includes(x.book)) { x.best = !best.tie; x.tie = best.tie; }
    return { outcome, cells, best };
  });
}

/** Events with at least one current offer, not started, soonest first. */
export function listable(up: UpcomingSnapshot, t: number, c: Settings): EventView[] {
  return up.events.filter((e) => e.startAt > t && FEED_BOOKS.some((b) => outcomesFor(e).some((o) => isCurrent(e, b, o, up.books, t, c))));
}

/** Last successful check across feed books (for "aktualizováno"). */
export function lastCheck(up: UpcomingSnapshot): number | null {
  const v = FEED_BOOKS.map((b) => up.books[b]?.lastSuccessAt ?? 0).filter(Boolean);
  return v.length ? Math.max(...v) : null;
}

export interface EventDetail {
  ev: EventView;
  sources: { book: FeedBook; path: string; mismatch: boolean; removed: boolean }[];
  history: { book: FeedBook; outcome: Outcome; at: number; odds: number; enabled: boolean }[];
}

/** Full detail of one event straight from D1 (primary-key lookups only). */
export async function eventDetail(id: number): Promise<EventDetail | null> {
  const e = await E.DB.prepare('SELECT e.id, e.slug, e.sport, c.slug AS comp, c.name AS comp_name, e.market, e.home, e.away, e.start_at FROM events e JOIN competitions c ON c.id = e.competition_id WHERE e.id = ?')
    .bind(id).first<{ id: number; slug: string; sport: EventView['sport']; comp: string; comp_name: string; market: Market; home: string; away: string; start_at: number }>();
  if (!e) return null;
  const [src, off, hist] = await E.DB.batch([
    E.DB.prepare('SELECT book, path, mismatch, removed_at FROM event_sources WHERE event_id = ?').bind(id),
    E.DB.prepare("SELECT book, outcome, odds, enabled, removed_at, changed_at, first_odds, first_at, min_odds, max_odds FROM offers WHERE event_id = ? AND market = ?").bind(id, e.market),
    E.DB.prepare("SELECT book, outcome, at, odds, enabled FROM odds_history WHERE event_id = ? AND market = ? ORDER BY at").bind(id, e.market),
  ]);
  const ev: EventView = {
    id: e.id, url: eventUrl(e.slug, e.id), sport: e.sport, comp: e.comp, compName: e.comp_name,
    home: e.home, away: e.away, startAt: e.start_at, market: e.market, books: {},
  };
  const sources = (src!.results as { book: FeedBook; path: string; mismatch: number; removed_at: number | null }[])
    .filter((s) => FEED_BOOKS.includes(s.book))
    .map((s) => ({ book: s.book, path: s.path, mismatch: !!s.mismatch, removed: s.removed_at !== null }));
  for (const s of sources) ev.books[s.book] = { mismatch: s.mismatch, removed: s.removed, outcomes: {} };
  for (const o of off!.results as { book: FeedBook; outcome: Outcome; odds: number; enabled: number; removed_at: number | null; changed_at: number; first_odds: number; first_at: number; min_odds: number; max_odds: number }[]) {
    const b = ev.books[o.book];
    if (b) b.outcomes[o.outcome] = { odds: o.odds, enabled: !!o.enabled, removedAt: o.removed_at, changedAt: o.changed_at, firstOdds: o.first_odds, firstAt: o.first_at, minOdds: o.min_odds, maxOdds: o.max_odds };
  }
  const history = (hist!.results as { book: FeedBook; outcome: Outcome; at: number; odds: number; enabled: number }[])
    .filter((h) => FEED_BOOKS.includes(h.book)).map((h) => ({ ...h, enabled: !!h.enabled }));
  return { ev, sources, history };
}

/** Cache-Control for SSR pages: the worker keeps them `CACHE_TTL_S` at the edge (stale-while-revalidate). */
export const cacheHeader = () => `public, max-age=0, s-maxage=${cfg().cacheTtlS}`;

/** Same event, outcome and recorded change at several books → one radar item listing every book. */
export function mergeMoves<T extends { eventId: number; outcome: string; from: { odds: number; at: number }; to: { odds: number; at: number }; book: FeedBook }>(list: T[]): (T & { books: FeedBook[] })[] {
  const out = new Map<string, T & { books: FeedBook[] }>();
  for (const m of list) {
    // Both books are fetched in the same run seconds apart: records within 5 min count as the same change.
    const k = `${m.eventId}|${m.outcome}|${m.from.odds}|${m.to.odds}|${Math.round(m.from.at / 300)}|${Math.round(m.to.at / 300)}`;
    const prev = out.get(k);
    if (prev) prev.books.push(m.book);
    else out.set(k, { ...m, books: [m.book] });
  }
  return [...out.values()];
}
