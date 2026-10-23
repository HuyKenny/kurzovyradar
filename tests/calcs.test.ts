import { describe, expect, it } from 'vitest';
import { convertOdds, dutching, expectedValue, parseOdds } from '../src/server/calc/odds';

describe('dutching (holandská sázka)', () => {
  it('equal payout whichever outcome wins', () => {
    const d = dutching(100, [2, 4]);
    expect(d.stakes[0]).toBeCloseTo(66.6667, 3);
    expect(d.stakes[1]).toBeCloseTo(33.3333, 3);
    expect(d.stakes[0]! * 2).toBeCloseTo(d.payout, 9);
    expect(d.stakes[1]! * 4).toBeCloseTo(d.payout, 9);
    expect(d.payout).toBeCloseTo(133.3333, 3);
    expect(d.sumInv).toBeCloseTo(0.75, 9); // < 1, but a profit is guaranteed only if these outcomes cover every possible result
  });
  it('surebet only when Σ 1/odds < 1', () => {
    expect(dutching(100, [2.1, 2.1]).surebet).toBe(true);
    expect(dutching(100, [2.1, 2.1]).profit).toBeCloseTo(5, 9);
    expect(dutching(100, [2, 2]).surebet).toBe(false);
    expect(dutching(100, [2, 2]).profit).toBeCloseTo(0, 9);
  });
  it('rejects fewer than two odds or odds ≤ 1', () => {
    expect(() => dutching(100, [2])).toThrow();
    expect(() => dutching(100, [2, 1])).toThrow();
  });
});

describe('odds formats', () => {
  it('parses decimal, fractional and american to decimal', () => {
    expect(parseOdds('2,5', 'decimal')).toBe(2.5);
    expect(parseOdds('3/2', 'fractional')).toBe(2.5);
    expect(parseOdds('+150', 'american')).toBe(2.5);
    expect(parseOdds('-200', 'american')).toBe(1.5);
    expect(parseOdds('−200', 'american')).toBe(1.5);
  });
  it('rejects nonsense', () => {
    expect(parseOdds('abc', 'decimal')).toBeNull();
    expect(parseOdds('1', 'decimal')).toBeNull();
    expect(parseOdds('5/0', 'fractional')).toBeNull();
    expect(parseOdds('0', 'american')).toBeNull();
    expect(parseOdds('2001', 'decimal')).toBeNull();
  });
  it('converts back', () => {
    expect(convertOdds(2.5)).toEqual({ decimal: '2,50', fractional: '3/2', american: '+150' });
    expect(convertOdds(1.5)).toEqual({ decimal: '1,50', fractional: '1/2', american: '−200' });
    expect(convertOdds(1.85).fractional).toBe('17/20');
    expect(convertOdds(2).american).toBe('+100');
  });
});

describe('expected value of the visitor\'s own estimate', () => {
  it('ev = p × odds − 1, break-even = 1 / odds', () => {
    const r = expectedValue(2.2, 50);
    expect(r.ev).toBeCloseTo(0.1, 9);
    expect(r.breakEvenPct).toBeCloseTo(45.4545, 3);
    expect(expectedValue(2, 40).ev).toBeCloseTo(-0.2, 9);
  });
  it('rejects probabilities outside (0, 100)', () => {
    expect(() => expectedValue(2, 0)).toThrow();
    expect(() => expectedValue(2, 100)).toThrow();
  });
});
