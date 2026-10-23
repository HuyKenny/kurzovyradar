import { describe, expect, it } from 'vitest';
import { testDb } from './d1';
import { storeBook, recordFailure } from '../src/server/store/import';
import { derive, isCurrent } from '../src/server/store/derive';
import { settings, type ProviderResult, type SourceMatch } from '../src/server/types';
import type { RadarSnapshot, UpcomingSnapshot } from '../src/server/view';
import type { FeedBook } from '../src/config/bookmakers';

const cfg = settings({});
const T0 = 1_800_000_000; // first import
const KICK = T0 + 2 * 86400;

const match = (book: FeedBook, over: Partial<SourceMatch> = {}, odds: [number, number, number] = [2100, 3400, 3500]): SourceMatch => ({
  book, srcId: '100', sport: 'fotbal', competition: 'premier-league', srcCompetition: '1. anglická liga', home: 'Liverpool', away: 'Brighton',
  startAt: KICK, path: '/kurzy/zapas/fotbal-liverpool-brighton/100', market: '1x2', marketName: 'Výsledek zápasu',
  outcomes: [{ outcome: '1', odds: odds[0], enabled: true }, { outcome: 'x', odds: odds[1], enabled: true }, { outcome: '2', odds: odds[2], enabled: true }],
  ...over,
});
const res = (book: FeedBook, at: number, matches: SourceMatch[]): ProviderResult => ({ book, fetchedAt: at, matches, rawCount: matches.length });
const count = (db: ReturnType<typeof testDb>, sql: string) => Number((db.raw.prepare(sql).get() as { n: number }).n);

describe('import', () => {
  it('stores events, offers and first history rows', async () => {
    const db = testDb();
    const r = await storeBook(db, res('tipsport', T0, [match('tipsport')]), cfg, T0);
    expect(r.status).toBe('ok');
    expect(count(db, 'SELECT COUNT(*) n FROM events')).toBe(1);
    expect(count(db, 'SELECT COUNT(*) n FROM offers')).toBe(3);
    expect(count(db, 'SELECT COUNT(*) n FROM odds_history')).toBe(3);
  });

  it('is repeatable: the same data again writes no history and no duplicates', async () => {
    const db = testDb();
    await storeBook(db, res('tipsport', T0, [match('tipsport')]), cfg, T0);
    const again = await storeBook(db, res('tipsport', T0 + 900, [match('tipsport')]), cfg, T0 + 900);
    expect(again.changed).toBe(0);
    expect(count(db, 'SELECT COUNT(*) n FROM events')).toBe(1);
    expect(count(db, 'SELECT COUNT(*) n FROM odds_history')).toBe(3);
  });

  it('records a price change once and tracks min/max', async () => {
    const db = testDb();
    await storeBook(db, res('tipsport', T0, [match('tipsport')]), cfg, T0);
    const r = await storeBook(db, res('tipsport', T0 + 900, [match('tipsport', {}, [1900, 3500, 3900])]), cfg, T0 + 900);
    expect(r.changed).toBe(3);
    const o = db.raw.prepare("SELECT * FROM offers WHERE outcome = '1'").get() as Record<string, number>;
    expect(o).toMatchObject({ odds: 1900, first_odds: 2100, min_odds: 1900, max_odds: 2100, changed_at: T0 + 900 });
    expect(count(db, 'SELECT COUNT(*) n FROM odds_history')).toBe(6);
  });

  it('an older response never overwrites newer data', async () => {
    const db = testDb();
    await storeBook(db, res('tipsport', T0 + 900, [match('tipsport', {}, [1900, 3500, 3900])]), cfg, T0 + 900);
    const old = await storeBook(db, res('tipsport', T0, [match('tipsport')]), cfg, T0 + 960);
    expect(old.status).toBe('skipped');
    expect((db.raw.prepare("SELECT odds FROM offers WHERE outcome = '1'").get() as { odds: number }).odds).toBe(1900);
  });

  it('pairs the second book onto the same event by id + facts', async () => {
    const db = testDb();
    await storeBook(db, res('tipsport', T0, [match('tipsport')]), cfg, T0);
    await storeBook(db, res('chance', T0 + 5, [match('chance', {}, [2150, 3400, 3450])]), cfg, T0 + 5);
    expect(count(db, 'SELECT COUNT(*) n FROM events')).toBe(1);
    expect(count(db, "SELECT COUNT(DISTINCT event_id) n FROM offers")).toBe(1);
  });

  it('does not pair a shared id when participants are swapped (different bet)', async () => {
    const db = testDb();
    await storeBook(db, res('tipsport', T0, [match('tipsport')]), cfg, T0);
    await storeBook(db, res('chance', T0 + 5, [match('chance', { home: 'Brighton', away: 'Liverpool' })]), cfg, T0 + 5);
    expect(count(db, 'SELECT COUNT(*) n FROM events')).toBe(2);
  });

  it('does not pair a different kick-off; flags a later divergence and recovers', async () => {
    const db = testDb();
    await storeBook(db, res('tipsport', T0, [match('tipsport')]), cfg, T0);
    await storeBook(db, res('chance', T0 + 5, [match('chance')]), cfg, T0 + 5);
    // Tipsport moves the kick-off; Chance has not yet → Chance is kept out of the comparison
    await storeBook(db, res('tipsport', T0 + 900, [match('tipsport', { startAt: KICK + 3600 })]), cfg, T0 + 900);
    expect(count(db, "SELECT mismatch n FROM event_sources WHERE book = 'chance'")).toBe(1);
    await storeBook(db, res('chance', T0 + 905, [match('chance', { startAt: KICK + 3600 })]), cfg, T0 + 905);
    expect(count(db, "SELECT mismatch n FROM event_sources WHERE book = 'chance'")).toBe(0);
    expect(count(db, 'SELECT start_at n FROM events')).toBe(KICK + 3600);
  });

  it('a vanished match is marked removed, never deleted', async () => {
    const db = testDb();
    await storeBook(db, res('tipsport', T0, [match('tipsport')]), cfg, T0);
    await storeBook(db, res('tipsport', T0 + 900, []), cfg, T0 + 900);
    expect(count(db, 'SELECT COUNT(*) n FROM offers WHERE removed_at IS NOT NULL')).toBe(3);
    expect(count(db, 'SELECT COUNT(*) n FROM event_sources WHERE removed_at IS NOT NULL')).toBe(1);
  });

  it('a failed book keeps its last valid data', async () => {
    const db = testDb();
    await storeBook(db, res('tipsport', T0, [match('tipsport')]), cfg, T0);
    await recordFailure(db, 'tipsport', T0 + 900, 'partners.tipsport.cz matches 503');
    expect(count(db, 'SELECT COUNT(*) n FROM offers WHERE removed_at IS NULL')).toBe(3);
    const s = db.raw.prepare("SELECT * FROM book_state WHERE book = 'tipsport'").get() as Record<string, unknown>;
    expect(s).toMatchObject({ last_success_at: T0, last_error: 'partners.tipsport.cz matches 503' });
  });
});

describe('snapshots and freshness', () => {
  async function seeded() {
    const db = testDb();
    await storeBook(db, res('tipsport', T0, [match('tipsport')]), cfg, T0);
    await storeBook(db, res('chance', T0 + 5, [match('chance')]), cfg, T0 + 5);
    // 2 hours later Tipsport drops the home price, Chance does not
    await storeBook(db, res('tipsport', T0 + 7200, [match('tipsport', {}, [1900, 3500, 3900])]), cfg, T0 + 7200);
    await storeBook(db, res('chance', T0 + 7205, [match('chance')]), cfg, T0 + 7205);
    return db;
  }

  it('upcoming snapshot exposes both books; stale book stops being current', async () => {
    const db = await seeded();
    await derive(db, cfg, T0 + 7300);
    const up = JSON.parse((db.raw.prepare("SELECT json FROM derived WHERE key = 'upcoming'").get() as { json: string }).json) as UpcomingSnapshot;
    const ev = up.events[0]!;
    expect(isCurrent(ev, 'tipsport', '1', up.books, T0 + 7300, cfg)).toBe(true);
    expect(isCurrent(ev, 'tipsport', '1', up.books, T0 + 7200 + cfg.staleAfterMin * 60 + 1, cfg)).toBe(false);
    expect(isCurrent(ev, 'tipsport', '1', up.books, KICK + 1, cfg)).toBe(false); // started
    expect(up.stats.changes24h).toBe(3);
  });

  it('radar: movement against a recorded base; no history = not available', async () => {
    const db = await seeded();
    await derive(db, cfg, T0 + 7300);
    const radar = JSON.parse((db.raw.prepare("SELECT json FROM derived WHERE key = 'radar'").get() as { json: string }).json) as RadarSnapshot;
    expect(radar.windows['1h'].available).toBe(true);
    const drop = radar.windows['1h'].drops[0]!;
    expect(drop).toMatchObject({ book: 'tipsport', outcome: '1', from: { odds: 2100, at: T0 }, to: { odds: 1900, at: T0 + 7200 } });
    expect(drop.pct).toBeCloseTo(-9.52, 2);
    expect(radar.windows['6h'].available).toBe(false); // we have tracked for only ~2 h
    expect(radar.windows['6h'].drops).toHaveLength(0);
    expect(radar.diffs[0]).toMatchObject({ outcome: '2', high: { book: 'tipsport', odds: 3900 }, low: { book: 'chance', odds: 3500 } });
  });
});
