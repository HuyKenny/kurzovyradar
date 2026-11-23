/**
 * One scheduled import: fetch each feed book (one bulk request each), store each independently, then rebuild
 * the page snapshots. Visitors never trigger a fetch; only this runs it.
 */
import { FEED_BOOKS, type FeedBook } from '../config/bookmakers';
import { fetchMatches } from './providers/platform';
import { toSource } from './normalize/source';
import { storeBook, recordFailure, type BookOutcome } from './store/import';
import { derive, cleanup } from './store/derive';
import type { Db } from './store/db';
import { settings, type Env, type ProviderResult, type SourceMatch } from './types';

const PROVIDERS: Record<FeedBook, (env: Env, days: number) => Promise<unknown[]>> = {
  tipsport: (env, days) => fetchMatches('partners.tipsport.cz', env.TIPSPORT_CLIENT_ID, env.TIPSPORT_CLIENT_SECRET, days),
  chance: (env, days) => fetchMatches('partners.chance.cz', env.CHANCE_API_USER, env.CHANCE_API_PASS, days),
};

export function normalize(book: FeedBook, raw: unknown[], fetchedAt: number): ProviderResult {
  const matches = raw.map((r) => toSource(book, r as Record<string, unknown>)).filter((x): x is SourceMatch => !!x);
  return { book, fetchedAt, matches, rawCount: raw.length };
}

/**
 * A response that answered 200 but lost most of the offer (empty or cut-off body, an incident at the provider) must not be stored:
 * every missing match would be marked as withdrawn and the book would look freshly checked. It is recorded as a failure instead, so the
 * last valid prices stay and age out honestly. A real lasting drop (end of season) is accepted after it repeats `REPEATS` times in a row.
 */
export const COLLAPSE_RATIO = 0.4;
export const COLLAPSE_MIN_PREVIOUS = 100;
export const REPEATS = 3;
export function collapsed(current: number, previous: number | null, rejectedInRow: number): boolean {
  if (previous === null || previous < COLLAPSE_MIN_PREVIOUS) return false;
  if (rejectedInRow >= REPEATS - 1) return false;
  return current < previous * COLLAPSE_RATIO;
}

export interface RunReport { books: (BookOutcome & { rowsRead: number; rowsWritten: number; queries: number; ms: number })[]; derived: { events: number; rowsRead: number; rowsWritten: number } }

export async function runImport(env: Env, db: Db = env.DB as unknown as Db, now = Math.floor(Date.now() / 1000)): Promise<RunReport> {
  const cfg = settings(env);
  const report: RunReport = { books: [], derived: { events: 0, rowsRead: 0, rowsWritten: 0 } };
  // Both fetches in parallel; a failure of one never touches the other's data.
  const fetched = await Promise.allSettled(FEED_BOOKS.map(async (b) => {
    const raw = await PROVIDERS[b](env, cfg.windowDays);
    return normalize(b, raw, Math.floor(Date.now() / 1000));
  }));
  for (const [i, r] of fetched.entries()) {
    const book = FEED_BOOKS[i]!;
    const t0 = Date.now();
    if (r.status === 'rejected') {
      const msg = String(r.reason instanceof Error ? r.reason.message : r.reason);
      await recordFailure(db, book, now, msg);
      report.books.push({ book, status: 'error', seen: 0, changed: 0, error: msg, rowsRead: 0, rowsWritten: 0, queries: 0, ms: 0 });
      continue;
    }
    try {
      const last = await db.prepare("SELECT matches_seen FROM import_runs WHERE book = ? AND status = 'ok' ORDER BY started_at DESC LIMIT 1").bind(book).first<{ matches_seen: number }>();
      const recent = await db.prepare('SELECT status, error FROM import_runs WHERE book = ? ORDER BY started_at DESC LIMIT ?').bind(book, REPEATS - 1).all<{ status: string; error: string | null }>();
      let inRow = 0;
      for (const x of recent.results ?? []) { if (x.status === 'error' && (x.error ?? '').startsWith('collapse:')) inRow++; else break; }
      if (collapsed(r.value.matches.length, last?.matches_seen ?? null, inRow)) {
        const msg = `collapse: ${r.value.matches.length} matches (raw ${r.value.rawCount}) after ${last!.matches_seen}`;
        await recordFailure(db, book, now, msg);
        report.books.push({ book, status: 'error', seen: 0, changed: 0, error: msg, rowsRead: 0, rowsWritten: 0, queries: 0, ms: Date.now() - t0 });
        continue;
      }
      const out = await storeBook(db, r.value, cfg, now);
      report.books.push({ book: out.book, status: out.status, seen: out.seen, changed: out.changed, error: out.error,
        rowsRead: out.meter.read, rowsWritten: out.meter.written, queries: out.meter.queries, ms: Date.now() - t0 });
    } catch (e) {
      const msg = String(e instanceof Error ? e.message : e);
      await recordFailure(db, book, now, `store: ${msg}`);
      report.books.push({ book, status: 'error', seen: 0, changed: 0, error: msg, rowsRead: 0, rowsWritten: 0, queries: 0, ms: Date.now() - t0 });
    }
  }
  // The snapshot is stamped after the newest record it contains: changes are stored with the fetch time, which is a few seconds
  // later than `now` (taken before the fetch). Otherwise the detail page, which measures a radar period as of this time, would miss
  // the very changes the radar showed.
  const stamp = Math.max(now, ...fetched.map((r) => (r.status === 'fulfilled' ? r.value.fetchedAt : 0)));
  const d = await derive(db, cfg, stamp);
  report.derived = { events: d.events, rowsRead: d.meter.read, rowsWritten: d.meter.written };
  // Once a day (the runs in the 03:xx UTC hour; GitHub Actions schedules drift, so the whole hour counts and a repeat is a no-op):
  // detail history older than HISTORY_DAYS goes.
  if (new Date(now * 1000).getUTCHours() === 3) await cleanup(db, cfg, now);
  return report;
}
