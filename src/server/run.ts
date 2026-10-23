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
      const out = await storeBook(db, r.value, cfg, now);
      report.books.push({ book: out.book, status: out.status, seen: out.seen, changed: out.changed, error: out.error,
        rowsRead: out.meter.read, rowsWritten: out.meter.written, queries: out.meter.queries, ms: Date.now() - t0 });
    } catch (e) {
      const msg = String(e instanceof Error ? e.message : e);
      await recordFailure(db, book, now, `store: ${msg}`);
      report.books.push({ book, status: 'error', seen: 0, changed: 0, error: msg, rowsRead: 0, rowsWritten: 0, queries: 0, ms: Date.now() - t0 });
    }
  }
  const d = await derive(db, cfg, now);
  report.derived = { events: d.events, rowsRead: d.meter.read, rowsWritten: d.meter.written };
  // Once a day (the 03:xx UTC run): detail history older than HISTORY_DAYS goes.
  if (new Date(now * 1000).getUTCHours() === 3 && new Date(now * 1000).getUTCMinutes() < cfg.importIntervalMin) await cleanup(db, cfg, now);
  return report;
}
