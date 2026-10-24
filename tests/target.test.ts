import { describe, expect, it } from 'vitest';
import { evaluateTarget, historyReach, parseTarget } from '../src/lib/target';

const fmt = (m: number) => (m / 1000).toFixed(2).replace('.', ',');
const when = (s: number) => `@${s}`;
const base = { fmt, when, started: false, setAt: 1000 };

describe('target price input', () => {
  it('accepts Czech and English decimals, rejects nonsense', () => {
    expect(parseTarget('2,10')).toBe(2100);
    expect(parseTarget('2.1')).toBe(2100);
    expect(parseTarget(' 3 ')).toBe(3000);
    expect(parseTarget('1')).toBeNull();
    expect(parseTarget('abc')).toBeNull();
    expect(parseTarget('')).toBeNull();
    expect(parseTarget('2,1234')).toBeNull();
    expect(parseTarget('5000')).toBeNull();
  });
});

describe('target evaluation on a visit', () => {
  it('reached by the current valid price', () => {
    const c = evaluateTarget({ ...base, target: 2100, current: 2150 });
    expect(c.state).toBe('reached');
    expect(c.text).toContain('aktuální kurz 2,15 je aspoň 2,10');
  });
  it('below target: waiting, says how far, and does not claim history it does not have', () => {
    const c = evaluateTarget({ ...base, target: 2100, current: 2000 });
    expect(c.state).toBe('waiting');
    expect(c.text).toContain('chybí 0,10');
    expect(c.text).not.toContain('jsme od nastavení zapsali');
  });
  it('history proves it was reached after setting, though the price is lower now', () => {
    const c = evaluateTarget({ ...base, target: 2100, current: 2000, reach: { atStart: false, firstAt: 5000 } });
    expect(c.state).toBe('reached-earlier');
    expect(c.text).toContain('@5000');
    expect(c.text).toContain('tedy pod cílem');
  });
  it('suspended, stale or unpaired offers (no valid current price) never meet a target', () => {
    const c = evaluateTarget({ ...base, target: 2100, current: null, reach: { atStart: false, firstAt: null } });
    expect(c.state).toBe('unavailable');
  });
  it('a started match is no longer an active pre-match opportunity, even if the price once met the target', () => {
    const c = evaluateTarget({ ...base, target: 2100, current: 2500, started: true });
    expect(c.state).toBe('started');
  });
  it('already met when it was set', () => {
    const c = evaluateTarget({ ...base, target: 2100, current: 2200, reach: { atStart: true, firstAt: null } });
    expect(c.text).toContain('už v době, kdy sis cíl nastavil');
  });
});

describe('what the recorded history proves', () => {
  const rows = [
    { at: 100, odds: 2000, enabled: true },
    { at: 900, odds: 2200, enabled: true }, // valid when the target was set at 1000
    { at: 1500, odds: 2050, enabled: true },
    { at: 2500, odds: 2150, enabled: true },
    { at: 3000, odds: 2300, enabled: false }, // suspended: ignored
  ];
  it('price at the time of setting, and the first later record that met the target', () => {
    expect(historyReach(rows, 1000, 2100)).toEqual({ atStart: true, firstAt: 2500 });
  });
  it('nothing recorded that met it → no claim', () => {
    expect(historyReach(rows, 1000, 2400)).toEqual({ atStart: false, firstAt: null });
  });
  it('no records before the target was set: not "at start"', () => {
    expect(historyReach([{ at: 2000, odds: 2200, enabled: true }], 1000, 2100)).toEqual({ atStart: false, firstAt: 2000 });
  });
});
