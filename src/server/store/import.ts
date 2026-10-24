/**
 * Stores one provider response. Repeatable without duplicates, order-safe and loss-free:
 *  - a response older than the last stored one for that book is ignored as a whole;
 *  - offers are written only when price or availability changes (upsert guarded by src_ts);
 *  - history rows are keyed by (event, book, market, outcome, at) and inserted OR IGNORE;
 *  - an outcome or match that vanishes from the feed gets removed_at once — nothing is deleted;
 *  - a failed book leaves its last valid data untouched; the other book is stored independently.
 */
import { FEED_BOOKS, type FeedBook } from '../../config/bookmakers';
import { canPair, type PairFacts } from '../normalize/pair';
import { eventSlug } from '../normalize/participants';
import { COMPETITIONS } from '../../config/competitions';
import type { Market, ProviderResult, Settings, SourceMatch } from '../types';
import { Meter, multiInsert, type Db, type Stmt } from './db';

interface SourceRow {
  book: FeedBook; src_id: string; event_id: number; src_competition: string; home: string; away: string;
  start_at: number; path: string; mismatch: number; removed_at: number | null; competition: string; sport: PairFacts['sport'];
  src_sport_id: string; src_comp_id: string; market: Market;
}
interface EventRow { id: number; slug: string; sport: PairFacts['sport']; competition_id: number; home: string; away: string; start_at: number; market: Market }
interface OfferRow {
  event_id: number; book: string; market: string; outcome: string; odds: number; enabled: number; first_odds: number; first_at: number;
  min_odds: number; min_at: number; max_odds: number; max_at: number; changed_at: number; src_ts: number; removed_at: number | null;
}

export interface BookOutcome { book: FeedBook; status: 'ok' | 'skipped' | 'error'; seen: number; changed: number; error?: string }

const offerKey = (o: { event_id: number; book: string; market: string; outcome: string }) => `${o.event_id}|${o.book}|${o.market}|${o.outcome}`;

/** Facts of a source row for pairing: the market is one of them (a three-way result is not a two-way winner). */
const facts = (s: { sport: PairFacts['sport']; competition: string; home: string; away: string; start_at?: number; startAt?: number; market: Market }): PairFacts => ({
  sport: s.sport, competition: s.competition, home: s.home, away: s.away, startAt: s.startAt ?? s.start_at ?? 0, market: s.market,
});

/** Curated competitions plus every competition this response needs (created from the platform's own name). */
async function ensureCompetitions(db: Db, m: Meter, now: number, wanted: SourceMatch[]): Promise<Map<string, number>> {
  const rows = await m.all<{ id: number; slug: string }>(db.prepare('SELECT id, slug FROM competitions'));
  const ids = new Map(rows.map((r) => [r.slug, r.id]));
  const need = new Map<string, [string, string, string, number]>();
  for (const c of COMPETITIONS) if (!ids.has(c.slug)) need.set(c.slug, [c.slug, c.name, c.sport, now]);
  for (const w of wanted) if (!ids.has(w.competition) && !need.has(w.competition)) need.set(w.competition, [w.competition, w.competitionName ?? w.competition, w.sport, now]);
  const missing = [...need.values()];
  if (missing.length) {
    await m.batch(db, multiInsert(db, 'INSERT OR IGNORE INTO competitions (slug, name, sport, created_at)', 4, missing));
    for (const r of await m.all<{ id: number; slug: string }>(db.prepare('SELECT id, slug FROM competitions'))) ids.set(r.slug, r.id);
  }
  return ids;
}

/**
 * Store one book's response. `others` = results already stored in this run (pairing sees their sources through the DB).
 */
export async function storeBook(db: Db, res: ProviderResult, cfg: Settings, now: number): Promise<BookOutcome & { meter: Meter }> {
  const m = new Meter();
  const book = res.book;
  const state = await db.prepare('SELECT last_success_at, tracking_since FROM book_state WHERE book = ?').bind(book).first<{ last_success_at: number | null; tracking_since: number | null }>();
  if (state?.last_success_at && res.fetchedAt <= state.last_success_at) {
    return { book, status: 'skipped', seen: 0, changed: 0, error: 'older than stored data', meter: m };
  }
  const runId = (await db.prepare("INSERT INTO import_runs (book, started_at, status) VALUES (?, ?, 'running') RETURNING id").bind(book, now).first<{ id: number }>())!.id;
  const comps = await ensureCompetitions(db, m, now, res.matches);
  const compSlug = new Map([...comps].map(([slug, id]) => [id, slug]));

  // Window: everything that can still be in a prematch feed (started up to 3 h ago … feed horizon).
  const from = now - 6 * 3600;
  const horizon = now + (cfg.windowDays + 1) * 86400;
  const events = await m.all<EventRow>(db.prepare('SELECT id, slug, sport, competition_id, home, away, start_at, market FROM events WHERE start_at >= ?').bind(from));
  const evById = new Map(events.map((e) => [e.id, e]));
  const sources = (await m.all<Omit<SourceRow, 'competition' | 'sport'>>(db.prepare(
    'SELECT es.book, es.src_id, es.event_id, es.src_competition, es.home, es.away, es.start_at, es.path, es.mismatch, es.removed_at, es.src_sport_id, es.src_comp_id FROM event_sources es JOIN events e ON e.id = es.event_id WHERE e.start_at >= ?',
  ).bind(from))).map((s) => {
    const e = evById.get(s.event_id)!;
    return { ...s, competition: compSlug.get(e.competition_id) ?? '', sport: e.sport, market: e.market } as SourceRow;
  });
  const bySource = new Map(sources.map((s) => [`${s.book}|${s.src_id}`, s]));
  const sourcesOfEvent = new Map<number, SourceRow[]>();
  for (const s of sources) (sourcesOfEvent.get(s.event_id) ?? sourcesOfEvent.set(s.event_id, []).get(s.event_id)!).push(s);
  const offers = await m.all<OfferRow>(db.prepare(
    'SELECT o.* FROM offers o JOIN events e ON e.id = o.event_id WHERE e.start_at >= ? AND o.book = ?',
  ).bind(from, book));
  const offerByKey = new Map(offers.map((o) => [offerKey(o), o]));

  let nextId = ((await db.prepare('SELECT COALESCE(MAX(id), 0) AS n FROM events').first<{ n: number }>())?.n ?? 0) + 1;
  const newEvents: EventRow[] = [];
  const sourceUpserts: unknown[][] = [];
  const offerUpserts: unknown[][] = [];
  const historyRows: unknown[][] = [];
  const touchedEvents = new Set<number>();
  const seenSources = new Set<string>();
  const seenOffers = new Set<string>();
  const t = res.fetchedAt;

  // De-duplicate the response itself (same id twice → keep the first).
  const unique = new Map<string, SourceMatch>();
  for (const s of res.matches) if (!unique.has(s.srcId)) unique.set(s.srcId, s);

  // Soonest matches first: when a run has to stop creating events (maxNewEvents), the far-away ones wait for the next run.
  for (const s of [...unique.values()].sort((a, b) => a.startAt - b.startAt)) {
    const key = `${book}|${s.srcId}`;
    seenSources.add(key);
    let src = bySource.get(key);
    let eventId = src?.event_id;
    if (eventId === undefined) {
      // 1) same platform id at another book, 2) otherwise one unambiguous candidate in the same competition.
      const sameId = FEED_BOOKS.filter((b) => b !== book).map((b) => bySource.get(`${b}|${s.srcId}`)).find(Boolean);
      if (sameId && canPair(facts(sameId), facts(s), cfg.startToleranceMin).ok && !sourcesOfEvent.get(sameId.event_id)?.some((x) => x.book === book)) {
        eventId = sameId.event_id;
      } else {
        const cands = sources.filter((x) => x.book !== book && x.competition === s.competition && canPair(facts(x), facts(s), cfg.startToleranceMin).ok
          && !sourcesOfEvent.get(x.event_id)?.some((y) => y.book === book));
        const evs = [...new Set(cands.map((c) => c.event_id))];
        if (evs.length === 1) eventId = evs[0];
      }
      if (eventId === undefined) {
        const compId = comps.get(s.competition);
        if (!compId || newEvents.length >= cfg.maxNewEvents) continue;
        const e: EventRow = { id: nextId++, slug: eventSlug(s.home, s.away), sport: s.sport, competition_id: compId, home: s.home, away: s.away, start_at: s.startAt, market: s.market };
        newEvents.push(e);
        evById.set(e.id, e);
        eventId = e.id;
      }
    }
    const row: SourceRow = {
      book, src_id: s.srcId, event_id: eventId!, src_competition: s.srcCompetition, home: s.home, away: s.away, start_at: s.startAt,
      path: s.path, mismatch: 0, removed_at: null, competition: s.competition, sport: s.sport,
      src_sport_id: s.srcSportId ?? '', src_comp_id: s.srcCompId ?? '', market: s.market,
    };
    const changed = !src || src.removed_at !== null || src.home !== row.home || src.away !== row.away || src.start_at !== row.start_at
      || src.path !== row.path || src.src_competition !== row.src_competition || src.competition !== row.competition
      || src.src_sport_id !== row.src_sport_id || src.src_comp_id !== row.src_comp_id;
    if (!src) {
      src = row;
      bySource.set(key, row);
      sources.push(row);
      (sourcesOfEvent.get(row.event_id) ?? sourcesOfEvent.set(row.event_id, []).get(row.event_id)!).push(row);
    } else if (changed) {
      Object.assign(src, { ...row, mismatch: src.mismatch });
    }
    if (changed) touchedEvents.add(row.event_id);

    for (const o of s.outcomes) {
      const k = `${row.event_id}|${book}|${s.market}|${o.outcome}`;
      seenOffers.add(k);
      const prev = offerByKey.get(k);
      const en = o.enabled ? 1 : 0;
      if (prev && prev.odds === o.odds && prev.enabled === en && prev.removed_at === null) continue;
      const next: OfferRow = prev
        ? {
            ...prev, odds: o.odds, enabled: en, changed_at: t, src_ts: t, removed_at: null,
            ...(en && o.odds < prev.min_odds ? { min_odds: o.odds, min_at: t } : {}),
            ...(en && o.odds > prev.max_odds ? { max_odds: o.odds, max_at: t } : {}),
          }
        : { event_id: row.event_id, book, market: s.market, outcome: o.outcome, odds: o.odds, enabled: en, first_odds: o.odds, first_at: t,
            min_odds: o.odds, min_at: t, max_odds: o.odds, max_at: t, changed_at: t, src_ts: t, removed_at: null };
      offerUpserts.push(offerValues(next));
      historyRows.push([row.event_id, book, s.market, o.outcome, t, o.odds, en]);
    }
  }

  // Vanished from the feed: only what the feed should still contain (not started, inside the horizon).
  const removedSources: string[] = [];
  for (const s of sources) {
    if (s.book !== book || s.removed_at !== null || seenSources.has(`${s.book}|${s.src_id}`)) continue;
    if (s.start_at <= now || s.start_at > horizon) continue;
    s.removed_at = t;
    removedSources.push(s.src_id);
    touchedEvents.add(s.event_id);
  }
  for (const o of offers) {
    const k = offerKey(o);
    if (o.removed_at !== null || seenOffers.has(k)) continue;
    const ev = evById.get(o.event_id);
    if (!ev || ev.start_at <= now) continue; // closed at kick-off, not withdrawn
    offerUpserts.push(offerValues({ ...o, removed_at: t, src_ts: t }));
  }

  // Pairing re-check for every event this book touched: a source that no longer agrees with the event's
  // primary source (first book in FEED_BOOKS order) is flagged and kept out of the comparison.
  const eventUpdates: Stmt[] = [];
  const flagChanged = new Set<SourceRow>();
  for (const id of new Set([...touchedEvents, ...newEvents.map((e) => e.id)])) {
    const list = (sourcesOfEvent.get(id) ?? []).filter((x) => x.removed_at === null);
    if (!list.length) continue;
    list.sort((a, b) => FEED_BOOKS.indexOf(a.book) - FEED_BOOKS.indexOf(b.book));
    const primary = list[0]!;
    for (const x of list) {
      const mm = x === primary || canPair(facts(primary), facts(x), cfg.startToleranceMin).ok ? 0 : 1;
      if (mm !== x.mismatch) { x.mismatch = mm; flagChanged.add(x); touchedEvents.add(id); }
    }
    const ev = evById.get(id)!;
    const compId = comps.get(primary.competition) ?? ev.competition_id;
    if (!newEvents.includes(ev) && (ev.home !== primary.home || ev.away !== primary.away || ev.start_at !== primary.start_at || ev.competition_id !== compId)) {
      eventUpdates.push(db.prepare('UPDATE events SET home = ?, away = ?, start_at = ?, competition_id = ?, updated_at = ? WHERE id = ?')
        .bind(primary.home, primary.away, primary.start_at, compId, now, id));
    }
  }
  for (const s of sources) {
    if (s.book === book && (touchedEvents.has(s.event_id) || removedSources.includes(s.src_id))) {
      sourceUpserts.push([s.book, s.src_id, s.event_id, s.src_competition, s.home, s.away, s.start_at, s.path, s.mismatch, s.removed_at, now, s.src_sport_id, s.src_comp_id]);
    }
  }
  // Other books' sources whose mismatch flag changed because of this book's update.
  for (const s of flagChanged) {
    if (s.book !== book) eventUpdates.push(db.prepare('UPDATE event_sources SET mismatch = ? WHERE book = ? AND src_id = ?').bind(s.mismatch, s.book, s.src_id));
  }

  const writes: Stmt[] = [
    ...multiInsert(db, 'INSERT INTO events (id, slug, sport, competition_id, home, away, start_at, created_at, updated_at, market)', 10,
      newEvents.map((e) => [e.id, e.slug, e.sport, e.competition_id, e.home, e.away, e.start_at, now, now, e.market])),
    ...multiInsert(db, 'INSERT INTO event_sources (book, src_id, event_id, src_competition, home, away, start_at, path, mismatch, removed_at, updated_at, src_sport_id, src_comp_id)', 13, sourceUpserts,
      `ON CONFLICT (book, src_id) DO UPDATE SET event_id = excluded.event_id, src_competition = excluded.src_competition, home = excluded.home,
       away = excluded.away, start_at = excluded.start_at, path = excluded.path, mismatch = excluded.mismatch, removed_at = excluded.removed_at,
       updated_at = excluded.updated_at, src_sport_id = excluded.src_sport_id, src_comp_id = excluded.src_comp_id`),
    ...eventUpdates,
    ...multiInsert(db, 'INSERT INTO offers (event_id, book, market, outcome, odds, enabled, first_odds, first_at, min_odds, min_at, max_odds, max_at, changed_at, src_ts, removed_at)', 15, offerUpserts,
      `ON CONFLICT (event_id, book, market, outcome) DO UPDATE SET odds = excluded.odds, enabled = excluded.enabled, min_odds = excluded.min_odds,
       min_at = excluded.min_at, max_odds = excluded.max_odds, max_at = excluded.max_at, changed_at = excluded.changed_at, src_ts = excluded.src_ts,
       removed_at = excluded.removed_at WHERE excluded.src_ts >= offers.src_ts`),
    ...multiInsert(db, 'INSERT OR IGNORE INTO odds_history (event_id, book, market, outcome, at, odds, enabled)', 7, historyRows),
    db.prepare(`INSERT INTO book_state (book, last_success_at, last_attempt_at, last_error, tracking_since) VALUES (?, ?, ?, NULL, ?)
      ON CONFLICT (book) DO UPDATE SET last_success_at = MAX(COALESCE(book_state.last_success_at, 0), excluded.last_success_at),
      last_attempt_at = excluded.last_attempt_at, last_error = NULL, tracking_since = COALESCE(book_state.tracking_since, excluded.tracking_since)`)
      .bind(book, t, now, state?.tracking_since ?? t),
  ];
  await m.batch(db, writes);
  const changed = historyRows.length;
  await db.prepare("UPDATE import_runs SET finished_at = ?, status = 'ok', matches_seen = ?, offers_changed = ?, rows_read = ?, rows_written = ? WHERE id = ?")
    .bind(Math.floor(Date.now() / 1000), unique.size, changed, m.read, m.written, runId).run();
  return { book, status: 'ok', seen: unique.size, changed, meter: m };
}

function offerValues(o: OfferRow): unknown[] {
  return [o.event_id, o.book, o.market, o.outcome, o.odds, o.enabled, o.first_odds, o.first_at, o.min_odds, o.min_at, o.max_odds, o.max_at, o.changed_at, o.src_ts, o.removed_at];
}

/** A failed fetch: record it, keep every stored offer as it was. */
export async function recordFailure(db: Db, book: FeedBook, now: number, error: string): Promise<void> {
  const msg = error.slice(0, 300);
  await db.batch([
    db.prepare("INSERT INTO import_runs (book, started_at, finished_at, status, error) VALUES (?, ?, ?, 'error', ?)").bind(book, now, now, msg),
    db.prepare(`INSERT INTO book_state (book, last_attempt_at, last_error) VALUES (?, ?, ?)
      ON CONFLICT (book) DO UPDATE SET last_attempt_at = excluded.last_attempt_at, last_error = excluded.last_error`).bind(book, now, msg),
  ]);
}

