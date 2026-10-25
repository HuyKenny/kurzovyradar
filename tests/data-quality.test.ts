import { describe, expect, it } from 'vitest';
import { ticketView } from '../src/lib/ticket';
import { compare } from '../src/lib/data-pure';
import { inSync, isCurrent } from '../src/server/store/derive';
import { computeDiffs, computeRadar, coveredAt, type TrackedOffer } from '../src/server/radar/compute';
import { changePct, implied } from '../src/server/calc/odds';
import { settings } from '../src/server/types';
import type { EventView, OfferView, UpcomingSnapshot } from '../src/server/view';

const cfg = settings({});
const NOW = 1_800_000_000;
const offer = (odds: number, extra: Partial<OfferView> = {}): OfferView => ({
  odds, enabled: true, removedAt: null, changedAt: NOW - 3 * 86400, firstOdds: odds, firstAt: NOW - 4 * 86400, minOdds: odds, maxOdds: odds, ...extra,
});
const ev = (t: number, c: number): EventView => ({
  id: 7, url: '/zapas/a-b-7/', sport: 'fotbal', comp: 'premier-league', compName: 'Premier League', home: 'A', away: 'B', startAt: NOW + 86400, market: '1x2',
  books: {
    tipsport: { mismatch: false, removed: false, outcomes: { '1': offer(t), x: offer(3400), '2': offer(4000) } },
    chance: { mismatch: false, removed: false, outcomes: { '1': offer(c), x: offer(3400), '2': offer(4000) } },
  },
});
const books = (tAge: number, cAge: number): UpcomingSnapshot['books'] => ({
  tipsport: { lastSuccessAt: NOW - tAge, lastAttemptAt: NOW - 60, failing: tAge > 900, trackingSince: NOW - 9 * 86400 },
  chance: { lastSuccessAt: NOW - cAge, lastAttemptAt: NOW - 60, failing: cAge > 900, trackingSince: NOW - 9 * 86400 },
});

describe('freshness and comparability', () => {
  it('an unchanged price confirmed by the last check is current, however old its last change', () => {
    const e = ev(2000, 2000);
    expect(isCurrent(e, 'tipsport', '1', books(300, 300), NOW, cfg)).toBe(true); // changed 3 days ago, checked 5 min ago
  });
  it('a book whose checks lag the other by more than MAX_SKEW_MIN is not compared (and cannot win "highest")', () => {
    const b = books(35 * 60, 120); // Tipsport last checked 35 min ago (still under the 45 min stale limit), Chance 2 min ago
    expect(inSync(b, 'tipsport', NOW, cfg)).toBe(false);
    expect(inSync(b, 'chance', NOW, cfg)).toBe(true);
    const v = ticketView(ev(2200, 2000), b, NOW, cfg);
    expect(v.outcomes[0]!.best?.books).toEqual(['chance']); // the older, higher Tipsport price does not win
    const rows = compare(ev(2200, 2000), b, NOW, cfg);
    expect(rows[0]!.cells.find((x) => x.book === 'tipsport')!.state).toBe('stale');
  });
  it('identical prices are a tie, never a difference', () => {
    const rows = compare(ev(2000, 2000), books(300, 300), NOW, cfg);
    expect(rows[0]!.best).toMatchObject({ kind: 'best', tie: true });
  });
  it('a suspended or withdrawn offer does not take part', () => {
    const e = ev(2500, 2000);
    e.books.tipsport!.outcomes['1'] = offer(2500, { enabled: false });
    expect(isCurrent(e, 'tipsport', '1', books(300, 300), NOW, cfg)).toBe(false);
    e.books.tipsport!.outcomes['1'] = offer(2500, { removedAt: NOW - 600 });
    expect(isCurrent(e, 'tipsport', '1', books(300, 300), NOW, cfg)).toBe(false);
  });
});

const tracked = (book: 'tipsport' | 'chance', odds: number, history: { at: number; odds: number }[], current = true): TrackedOffer => ({
  event: { id: 7, url: '/zapas/a-b-7/', home: 'A', away: 'B', comp: 'premier-league', compName: 'Premier League', sport: 'fotbal', startAt: NOW + 86400, market: '1x2' },
  book, outcome: '1', odds, changedAt: history.at(-1)?.at ?? NOW - 3 * 86400, current, history: history.map((h) => ({ ...h, enabled: true })),
});

describe('radar', () => {
  it('a difference between books is found even when one price has not moved for days', () => {
    const d = computeDiffs([tracked('tipsport', 2200, []), tracked('chance', 2000, [])]);
    expect(d).toHaveLength(1);
    expect(d[0]).toMatchObject({ high: { book: 'tipsport', odds: 2200 }, low: { book: 'chance', odds: 2000 } });
    expect(d[0]!.pct).toBeCloseTo(10, 6);
  });
  it('a stale offer creates no difference', () => {
    expect(computeDiffs([tracked('tipsport', 2200, [], false), tracked('chance', 2000, [])])).toHaveLength(0);
  });
  it('an outage over the period start means no claim about that period', () => {
    const o = tracked('tipsport', 2200, [{ at: NOW - 10 * 3600, odds: 2000 }, { at: NOW - 600, odds: 2200 }]);
    const ts = { tipsport: NOW - 9 * 86400, chance: NOW - 9 * 86400 };
    const runsOk = { tipsport: [NOW - 6 * 3600 - 300], chance: [NOW - 6 * 3600 - 300] };
    const runsGap = { tipsport: [NOW - 10 * 3600], chance: [NOW - 10 * 3600] };
    expect(computeRadar([o], ts, NOW, { runs: runsOk, gapS: 1800 }).windows['6h'].rises).toHaveLength(1);
    const r = computeRadar([o], ts, NOW, { runs: runsGap, gapS: 1800 });
    expect(r.windows['6h'].available).toBe(false);
    expect(r.windows['6h'].rises).toHaveLength(0);
    expect(coveredAt(undefined, NOW, 1800)).toBe(false);
  });
});

describe('arithmetic', () => {
  it('2,00 → 2,20 is +10 %, 2,00 → 1,80 is −10 %', () => {
    expect(changePct(2000, 2200)).toBeCloseTo(10, 9);
    expect(changePct(2000, 1800)).toBeCloseTo(-10, 9);
  });
  it('implied probability moves in percentage points, which is not the same number as the change of the price', () => {
    const pp = (implied(2.0) - implied(2.2)) * 100; // 50 % → 45,45 %
    expect(pp).toBeCloseTo(4.545, 3);
    expect(Math.abs(changePct(2000, 2200))).not.toBeCloseTo(pp, 1);
  });
});

describe('radar card wording', () => {
  it('states the implied probability change in percentage points and says it is not a real chance', async () => {
    const { impliedLine } = await import('../src/lib/findings');
    const t = impliedLine(2000, 2200);
    expect(t).toContain('45,5 % místo 50,0 %');
    expect(t).toContain('−4,5 procentního bodu');
    expect(t).toContain('ne skutečná šance');
  });
});

describe('price agreement (one wording everywhere)', () => {
  it('equal, slightly different, different, one book, none: never "same" for different numbers', async () => {
    const { priceAgreement, AGREEMENT_TEXT, oddsPair } = await import('../src/lib/agreement');
    expect(priceAgreement([{ odds: 3400 }, { odds: 3400 }])).toBe('same');
    expect(priceAgreement([{ odds: 3430 }, { odds: 3400 }])).toBe('slight'); // 0,9 % < 1 % radar threshold, still not "same"
    expect(priceAgreement([{ odds: 2200 }, { odds: 2000 }])).toBe('differ');
    expect(priceAgreement([{ odds: 3400 }])).toBe('single');
    expect(priceAgreement([])).toBe('none');
    expect(AGREEMENT_TEXT.slight).toBe('Kurzy se mírně liší.');
    expect(AGREEMENT_TEXT.single).toContain('chybí');
    expect(oddsPair(3400, 3430)).toEqual(['3,40', '3,43']);
    expect(oddsPair(3401, 3404)).toEqual(['3,401', '3,404']); // would round to the same text: show three decimals
  });
});
