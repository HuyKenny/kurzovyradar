/**
 * After each import: rebuild the snapshots pages read (`derived` table). A page then costs one row read
 * instead of scanning events and offers. Freshness is re-evaluated at render time from `books`.
 */
import { FEED_BOOKS, type FeedBook } from '../../config/bookmakers';
import { computeRadar, type TrackedOffer } from '../radar/compute';
import type { Market, Outcome, Settings } from '../types';
import type { BookStateView, EventView, OfferView, UpcomingSnapshot } from '../view';
import { Meter, type Db } from './db';

export const eventUrl = (slug: string, id: number) => `/zapas/${slug}-${id}/`;

export const isFresh = (b: BookStateView | undefined, now: number, cfg: Settings) =>
  !!b?.lastSuccessAt && now - b.lastSuccessAt <= cfg.staleAfterMin * 60;

/** Current = may take part in "highest odds": fresh book, offered, paired, still listed, not started. */
export function isCurrent(ev: EventView, book: FeedBook, outcome: Outcome, books: UpcomingSnapshot['books'], now: number, cfg: Settings): boolean {
  const b = ev.books[book];
  const o = b?.outcomes[outcome];
  return !!o && !!b && !b.mismatch && !b.removed && o.enabled && o.removedAt === null && ev.startAt > now && isFresh(books[book], now, cfg);
}

export async function derive(db: Db, cfg: Settings, now: number): Promise<{ meter: Meter; events: number }> {
  const m = new Meter();
  const from = now - 2 * 3600;
  const states = await m.all<{ book: FeedBook; last_success_at: number | null; last_attempt_at: number | null; last_error: string | null; tracking_since: number | null }>(
    db.prepare('SELECT book, last_success_at, last_attempt_at, last_error, tracking_since FROM book_state'));
  const books: UpcomingSnapshot['books'] = {};
  for (const s of states) {
    if (!FEED_BOOKS.includes(s.book)) continue;
    books[s.book] = { lastSuccessAt: s.last_success_at, lastAttemptAt: s.last_attempt_at, failing: !!s.last_error, trackingSince: s.tracking_since };
  }
  const evRows = await m.all<{ id: number; slug: string; sport: EventView['sport']; comp: string; comp_name: string; market: Market; home: string; away: string; start_at: number }>(db.prepare(
    'SELECT e.id, e.slug, e.sport, c.slug AS comp, c.name AS comp_name, e.market, e.home, e.away, e.start_at FROM events e JOIN competitions c ON c.id = e.competition_id WHERE e.start_at >= ? ORDER BY e.start_at, e.id',
  ).bind(from));
  const events = new Map<number, EventView>();
  for (const r of evRows) {
    events.set(r.id, {
      id: r.id, url: eventUrl(r.slug, r.id), sport: r.sport, comp: r.comp, compName: r.comp_name,
      home: r.home, away: r.away, startAt: r.start_at, market: r.market, books: {},
    });
  }
  const srcRows = await m.all<{ event_id: number; book: FeedBook; mismatch: number; removed_at: number | null }>(db.prepare(
    'SELECT es.event_id, es.book, es.mismatch, es.removed_at FROM event_sources es JOIN events e ON e.id = es.event_id WHERE e.start_at >= ?',
  ).bind(from));
  for (const s of srcRows) {
    const ev = events.get(s.event_id);
    if (ev && FEED_BOOKS.includes(s.book)) ev.books[s.book] = { mismatch: !!s.mismatch, removed: s.removed_at !== null, outcomes: {} };
  }
  const offRows = await m.all<{ event_id: number; book: FeedBook; outcome: Outcome; odds: number; enabled: number; removed_at: number | null; changed_at: number;
    first_odds: number; first_at: number; min_odds: number; max_odds: number }>(db.prepare(
    `SELECT o.event_id, o.book, o.outcome, o.odds, o.enabled, o.removed_at, o.changed_at, o.first_odds, o.first_at, o.min_odds, o.max_odds
     FROM offers o JOIN events e ON e.id = o.event_id WHERE e.start_at >= ? AND o.market = e.market`,
  ).bind(from));
  let offers = 0;
  for (const o of offRows) {
    const b = events.get(o.event_id)?.books[o.book];
    if (!b) continue;
    const v: OfferView = { odds: o.odds, enabled: !!o.enabled, removedAt: o.removed_at, changedAt: o.changed_at, firstOdds: o.first_odds, firstAt: o.first_at, minOdds: o.min_odds, maxOdds: o.max_odds };
    b.outcomes[o.outcome] = v;
    offers++;
  }

  // History of every offer that moved in the last 24 h (index offers_changed → history by primary key).
  const hist = await m.all<{ event_id: number; book: FeedBook; outcome: Outcome; at: number; odds: number; enabled: number }>(db.prepare(
    `SELECT h.event_id, h.book, h.outcome, h.at, h.odds, h.enabled FROM offers o
     JOIN odds_history h ON h.event_id = o.event_id AND h.book = o.book AND h.market = o.market AND h.outcome = o.outcome
     JOIN events e ON e.id = o.event_id
     WHERE o.changed_at >= ? AND o.market = e.market ORDER BY h.event_id, h.book, h.outcome, h.at`,
  ).bind(now - 86400));
  const byOffer = new Map<string, { at: number; odds: number; enabled: boolean }[]>();
  let changes24h = 0;
  for (const h of hist) {
    const k = `${h.event_id}|${h.book}|${h.outcome}`;
    const list = byOffer.get(k) ?? byOffer.set(k, []).get(k)!;
    if (list.length && h.at >= now - 86400) changes24h++; // the first record of an offer is not a change
    list.push({ at: h.at, odds: h.odds, enabled: !!h.enabled });
  }

  // Last change of each offer that moved in 24 h: the value before it (enabled records only).
  for (const ev of events.values()) {
    for (const book of FEED_BOOKS) {
      for (const [outcome, o] of Object.entries(ev.books[book]?.outcomes ?? {}) as [Outcome, OfferView][]) {
        const h = byOffer.get(`${ev.id}|${book}|${outcome}`)?.filter((x) => x.enabled);
        if (h && h.length >= 2 && h[h.length - 1]!.odds === o.odds && o.changedAt >= now - 86400) {
          const before = [...h].reverse().find((x) => x.odds !== o.odds);
          if (before) o.prev = { odds: before.odds, at: before.at };
        }
      }
    }
  }

  const tracked: TrackedOffer[] = [];
  const evList = [...events.values()];
  for (const ev of evList) {
    for (const book of FEED_BOOKS) {
      for (const [outcome, o] of Object.entries(ev.books[book]?.outcomes ?? {}) as [Outcome, OfferView][]) {
        const history = byOffer.get(`${ev.id}|${book}|${outcome}`);
        if (!history) continue;
        tracked.push({ event: ev, book, outcome, odds: o.odds, changedAt: o.changedAt, current: isCurrent(ev, book, outcome, books, now, { ...cfg }), history });
      }
    }
  }
  const radar = computeRadar(tracked, Object.fromEntries(FEED_BOOKS.map((b) => [b, books[b]?.trackingSince ?? null])), now);
  const tracking = FEED_BOOKS.map((b) => books[b]?.trackingSince).filter((x): x is number => !!x);
  const upcoming: UpcomingSnapshot = {
    at: now, books, events: evList,
    stats: { events: evList.filter((e) => e.startAt > now).length, offers, changes24h, firstRecordAt: tracking.length ? Math.min(...tracking) : null },
  };
  const put = db.prepare('INSERT INTO derived (key, json, at) VALUES (?, ?, ?) ON CONFLICT (key) DO UPDATE SET json = excluded.json, at = excluded.at');
  await m.batch(db, [put.bind('upcoming', snapshotJson(upcoming), now), put.bind('radar', JSON.stringify(radar), now)]);
  return { meter: m, events: evList.length };
}

/** A D1 value may be at most 2 MB; stay clear of it. */
export const SNAPSHOT_MAX_BYTES = 1_800_000;
/** Detail-only history fields: pages read them from the event's own rows (lib/data.ts eventDetail), never from the snapshot. */
const DETAIL_ONLY = new Set(['firstOdds', 'firstAt', 'minOdds', 'maxOdds']);

/**
 * The upcoming snapshot as JSON: without the detail-only fields, and if the offer is still too large for one D1 value, without the
 * matches that start last (the page lists are sorted by start, so the nearest matches always stay).
 */
export function snapshotJson(s: UpcomingSnapshot, max = SNAPSHOT_MAX_BYTES): string {
  const lean = (x: UpcomingSnapshot) => JSON.stringify(x, (k, v) => (DETAIL_ONLY.has(k) ? undefined : v));
  let json = lean(s);
  let events = s.events;
  while (json.length > max && events.length > 10) {
    events = events.slice(0, Math.floor(events.length * 0.9));
    json = lean({ ...s, events });
  }
  // Visible in the Worker logs long before matches silently disappear from the site (a split of the snapshot is the next step).
  if (events.length < s.events.length) console.error('snapshot truncated', events.length, 'of', s.events.length, 'events');
  else if (json.length > max * 0.8) console.warn('snapshot at', Math.round((json.length / max) * 100), '% of its limit,', s.events.length, 'events');
  return json;
}

/** Daily: drop detail rows of events that started more than `historyDays` ago. */
export async function cleanup(db: Db, cfg: Settings, now: number): Promise<Meter> {
  const m = new Meter();
  const cut = now - cfg.historyDays * 86400;
  const old = 'SELECT id FROM events WHERE start_at < ?';
  await m.batch(db, [
    db.prepare(`DELETE FROM odds_history WHERE event_id IN (${old})`).bind(cut),
    db.prepare(`DELETE FROM offers WHERE event_id IN (${old})`).bind(cut),
    db.prepare(`DELETE FROM event_sources WHERE event_id IN (${old})`).bind(cut),
    db.prepare('DELETE FROM events WHERE start_at < ?').bind(cut),
    db.prepare('DELETE FROM import_runs WHERE started_at < ?').bind(now - 14 * 86400),
  ]);
  return m;
}
