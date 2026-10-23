import { describe, expect, it } from 'vitest';
import { bestOf, changePct, implied, overround, payout } from '../src/server/calc/odds';
import { canPair, type PairFacts } from '../src/server/normalize/pair';
import { classifyMarket, outcomesOf } from '../src/server/normalize/markets';
import { toSource } from '../src/server/normalize/source';
import sample from './fixtures/platform-sample.json';

describe('calculations', () => {
  it('percentage change = (new / old − 1) × 100', () => {
    expect(changePct(2, 1.8)).toBeCloseTo(-10, 10);
    expect(changePct(1.5, 1.65)).toBeCloseTo(10, 10);
    expect(() => changePct(1, 2)).toThrow();
  });
  it('implied probability = 1 / odds', () => {
    expect(implied(2)).toBe(0.5);
    expect(implied(4)).toBe(0.25);
    expect(() => implied(0)).toThrow();
  });
  it('overround only from a complete set of one bookmaker', () => {
    expect(overround({ '1': 2.42, x: 3.99, '2': 2.42 }, ['1', 'x', '2'])).toBeCloseTo(1 / 2.42 + 1 / 3.99 + 1 / 2.42 - 1, 10);
    expect(overround({ '1': 2.42, '2': 2.42 }, ['1', 'x', '2'])).toBeNull();
  });
  it('payout vs profit', () => {
    const p = payout(100, 1.85);
    expect(p.payout).toBeCloseTo(185, 9);
    expect(p.profit).toBeCloseTo(85, 9);
  });
});

describe('best odds', () => {
  const q = (book: string, odds: number, fresh = true, enabled = true) => ({ book, odds, fresh, enabled });
  it('picks the highest current offer', () => {
    expect(bestOf([q('tipsport', 1.9), q('chance', 1.95)])).toEqual({ kind: 'best', books: ['chance'], odds: 1.95, tie: false });
  });
  it('marks equal prices as a tie', () => {
    expect(bestOf([q('tipsport', 1.9), q('chance', 1.9)])).toEqual({ kind: 'best', books: ['tipsport', 'chance'], odds: 1.9, tie: true });
  });
  it('a stale offer never wins', () => {
    expect(bestOf([q('tipsport', 1.9), q('chance', 2.5, false)])).toEqual({ kind: 'single', book: 'tipsport', odds: 1.9 });
  });
  it('a suspended offer never wins', () => {
    expect(bestOf([q('tipsport', 1.9, true, false), q('chance', 1.8)])).toEqual({ kind: 'single', book: 'chance', odds: 1.8 });
  });
  it('nothing current = none (not zero)', () => {
    expect(bestOf([q('tipsport', 1.9, false)])).toEqual({ kind: 'none' });
    expect(bestOf([])).toEqual({ kind: 'none' });
  });
});

describe('market classification', () => {
  it('three-way "Výsledek zápasu" is 1x2 in regular time', () => {
    expect(classifyMarket({ name: 'Výsledek zápasu', mySelectionId: '23-WINNER_3W-1' })).toBe('1x2');
  });
  it('a winner incl. overtime or anything else is not compared', () => {
    expect(classifyMarket({ name: 'Vítěz zápasu', mySelectionId: '43-WINNER_2W-1' })).toBeNull();
    expect(classifyMarket({ name: 'Vítěz zápasu včetně prodloužení', mySelectionId: '23-WINNER_2W-1' })).toBeNull();
    expect(classifyMarket({ name: 'Výsledek 1. poločasu', mySelectionId: '16-WINNER_3W-1' })).toBeNull();
    expect(classifyMarket(undefined)).toBeNull();
  });
  it('outcomes by opp.type, not array order; duplicates reject the market', () => {
    expect(outcomesOf({ opps: [{ type: '2', odd: 3.1 }, { type: 'x', odd: 3.4 }, { type: '1', odd: 2.2, bettingEnabled: false }] }))
      .toEqual([{ outcome: '2', odds: 3100, enabled: true }, { outcome: 'x', odds: 3400, enabled: true }, { outcome: '1', odds: 2200, enabled: false }]);
    expect(outcomesOf({ opps: [{ type: '1', odd: 2 }, { type: '1', odd: 2.1 }] })).toEqual([]);
  });
});

describe('normalization of a real platform response', () => {
  const out = sample.matches.map((m) => toSource('tipsport', m));
  const names = out.filter(Boolean).map((s) => `${s!.home} - ${s!.away}`);
  it('keeps pilot head-to-head matches with a 1x2 market', () => {
    expect(names).toContain('Liverpool - Brighton');
    expect(names).toContain('Kladno - Sparta Praha');
    expect(names).toContain('Utah Mammoth - Tampa Bay Lightning');
  });
  it('drops specials, outrights, other sports and competitions outside the pilot', () => {
    expect(names.some((n) => /speciál|Norris|po 22|penalt|Staeheli|Alcione/.test(n))).toBe(false);
    expect(names).toHaveLength(3);
  });
  it('start time in UTC seconds and odds in thousandths', () => {
    const nhl = out.find((s) => s?.home === 'Utah Mammoth')!;
    expect(nhl.outcomes.find((o) => o.outcome === 'x')!.odds).toBe(3990);
    expect(nhl.startAt % 60).toBe(0);
    expect(nhl.market).toBe('1x2');
  });
});

describe('pairing', () => {
  const base: PairFacts = { sport: 'fotbal', competition: 'premier-league', home: 'Liverpool', away: 'Brighton', startAt: 1_800_000_000, market: '1x2' };
  it('pairs identical facts regardless of case and accents', () => {
    expect(canPair(base, { ...base, home: 'LIVERPOOL', away: 'Brighton ' })).toEqual({ ok: true });
    expect(canPair({ ...base, home: 'Plzeň' }, { ...base, home: 'Plzen' })).toEqual({ ok: true });
  });
  it('refuses swapped participants', () => {
    expect(canPair(base, { ...base, home: 'Brighton', away: 'Liverpool' })).toEqual({ ok: false, reason: 'swapped' });
  });
  it('refuses a different kick-off, sport, competition or market', () => {
    expect(canPair(base, { ...base, startAt: base.startAt + 900 })).toEqual({ ok: false, reason: 'start' });
    expect(canPair(base, { ...base, startAt: base.startAt + 900 }, 15)).toEqual({ ok: true });
    expect(canPair(base, { ...base, sport: 'hokej' })).toEqual({ ok: false, reason: 'sport' });
    expect(canPair(base, { ...base, competition: 'championship' })).toEqual({ ok: false, reason: 'competition' });
  });
  it("women's team is not the men's team", () => {
    expect(canPair(base, { ...base, home: 'Liverpool (ž)' })).toEqual({ ok: false, reason: 'participants' });
  });
  it('similar names are not enough', () => {
    expect(canPair(base, { ...base, home: 'Liverpool U21' })).toEqual({ ok: false, reason: 'participants' });
  });
});
