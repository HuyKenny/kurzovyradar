import { describe, expect, it } from 'vitest';
import { DEFAULT_STAKE, parseBetState, parseStake, payoutDelta, withBetState, winnings } from '../src/lib/bet-state';
import { availablePeriods, windowChange } from '../src/lib/context';

const q = (s: string) => new URLSearchParams(s);

describe('bet state in the URL', () => {
  it('reads outcome, stake, period and finding; the old ?tip still works', () => {
    expect(parseBetState(q('trh=1x2&vysledek=x&vklad=250&obdobi=1h&zjisteni=pokles'), '1')).toEqual({ outcome: 'x', stake: 250, period: '1h', finding: 'pokles' });
    expect(parseBetState(q('tip=2'), '1').outcome).toBe('2');
    expect(parseBetState(q('vysledek=2&tip=1'), '1').outcome).toBe('2');
  });
  it('falls back for nonsense', () => {
    expect(parseBetState(q('vysledek=9&vklad=abc&obdobi=9d&zjisteni=x'), 'x')).toEqual({ outcome: 'x', stake: DEFAULT_STAKE, period: null, finding: null });
  });
  it('parses Czech amounts', () => {
    expect(parseStake('1 250,50')).toBe(1250.5);
    expect(parseStake('250')).toBe(250);
    expect(parseStake('')).toBeNull();
    expect(parseStake('-5')).toBeNull();
    expect(parseStake('1e3')).toBeNull();
  });
  it('writing the state keeps the other parameters (way back) and drops the legacy tip', () => {
    const p = withBetState(q('tip=1&zpet=%2Fradar%2F%3Fobdobi%3D1h&utm=x'), { outcome: 'x', stake: 250, period: '1h', finding: 'rust' });
    expect(p.get('vysledek')).toBe('x');
    expect(p.get('tip')).toBeNull();
    expect(p.get('trh')).toBe('1x2');
    expect(p.get('zpet')).toBe('/radar/?obdobi=1h');
    expect(p.get('utm')).toBe('x');
    expect(p.get('zjisteni')).toBe('rust');
  });
  it('switching the outcome keeps the typed stake', () => {
    const a = withBetState(q(''), { outcome: '1', stake: 250 });
    const b = withBetState(a, { outcome: '2', stake: parseBetState(a, '1').stake });
    expect(b.get('vklad')).toBe('250');
    expect(b.get('vysledek')).toBe('2');
  });
});

describe('payout arithmetic', () => {
  it('250 Kč at 1,66: 415 Kč including stake, 165 Kč profit', () => {
    expect(winnings(250, 1660)).toEqual({ payout: 415, profit: 165 });
  });
  it('payout difference at the same stake (whole koruny)', () => {
    expect(payoutDelta(100, 4830, 5390)).toBe(56);
    expect(payoutDelta(100, 3330, 2960)).toBe(-37);
  });
});

describe('period comparison keeps its meaning', () => {
  const now = 100_000;
  const rows = [
    { at: 10_000, odds: 3330, enabled: true },
    { at: now - 1800, odds: 2960, enabled: true },
  ];
  it('1 h: base is the last record before the start, the change is dated by its own record', () => {
    const c = windowChange(rows, now, 3600, 10_000, 2960);
    expect(c).toMatchObject({ status: 'moved', from: { odds: 3330, at: 10_000 }, to: { odds: 2960, at: now - 1800 } });
  });
  it('unchanged price is not a movement', () => {
    expect(windowChange([{ at: 10_000, odds: 2000, enabled: true }], now, 3600, 10_000, 2000)).toMatchObject({ status: 'unchanged', odds: 2000 });
  });
  it('tracked for less than the period: no comparison instead of a fake zero', () => {
    expect(windowChange(rows, now, 3600, now - 600, 2960)).toEqual({ status: 'insufficient' });
    expect(windowChange([], now, 3600, 10_000, 2960)).toEqual({ status: 'insufficient' });
  });
  it('whole tracking compares with the first record', () => {
    expect(windowChange(rows, now, null, 10_000, 2960)).toMatchObject({ status: 'moved', from: { odds: 3330 } });
  });
  it('a rise to the highest recorded price is a high', () => {
    const r = [{ at: 1000, odds: 2000, enabled: true }, { at: now - 100, odds: 2400, enabled: true }];
    expect(windowChange(r, now, null, 1000, 2400)).toMatchObject({ isHigh: true });
  });
  it('suspended records are ignored', () => {
    expect(windowChange([{ at: 1000, odds: 2000, enabled: false }], now, null, 1000, 2000)).toEqual({ status: 'insufficient' });
  });
  it('chart periods are offered only when the whole period is covered', () => {
    const keys = (span: number) => availablePeriods(1000, 1000 + span).map((p) => p.key);
    expect(keys(1800)).toEqual(['vse']);
    expect(keys(7 * 3600)).toEqual(['1h', '6h', 'vse']);
    expect(keys(5 * 86400)).toEqual(['1h', '6h', '24h', '3d', 'vse']);
    expect(availablePeriods(null, 5000)).toEqual([]);
  });
});
