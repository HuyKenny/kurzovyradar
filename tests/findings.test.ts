import { describe, expect, it } from 'vitest';
import { findingText, fromDiff, fromMove, currentOdds } from '../src/lib/findings';
import type { DiffItem, MoveItem } from '../src/server/view';

const NOW = Math.floor(Date.parse('2026-10-24T12:00:00Z') / 1000);
const move = (over: Partial<MoveItem>): MoveItem => ({
  eventId: 1, url: '/zapas/a-b-1/', home: 'Domácí', away: 'Hosté', comp: 'x', compName: 'Liga', sport: 'fotbal', startAt: NOW + 7200, outcome: '1', book: 'tipsport',
  from: { odds: 4830, at: NOW - 3 * 3600 }, to: { odds: 5390, at: NOW - 1800 }, pct: 11.59, points: [], reason: 'rise', ...over,
});

describe('radar findings say what they compare', () => {
  it('rise: +56 Kč per 100 Kč, period named, no "good bet" claim', () => {
    const t = findingText(fromMove({ ...move({}), books: ['tipsport', 'chance'] }, '1h'), NOW, NOW - 300);
    expect(t.what).toBe('Kurz na výhru týmu Domácí u Tipsportu i Chance stoupl za poslední hodinu z 4,83 na 5,39 (+11,6 %).');
    expect(t.impact).toContain('o 56 Kč vyšší');
    expect(t.impact).toContain('Vyšší výplata neznamená výhodnější sázku');
    expect(t.against).toContain('za poslední hodinu');
    expect(t.against).toContain('Naposledy ověřeno');
  });
  it('drop: −37 Kč per 100 Kč', () => {
    const f = fromMove(move({ from: { odds: 3330, at: NOW - 7200 }, to: { odds: 2960, at: NOW - 600 }, pct: -11.1, reason: 'drop' }), '6h');
    expect(f.kind).toBe('pokles');
    const t = findingText(f, NOW, null);
    expect(t.what).toContain('klesl za posledních 6 hodin z 3,33 na 2,96');
    expect(t.impact).toContain('o 37 Kč nižší');
    expect(t.against).not.toContain('Naposledy ověřeno'); // unknown check time is not invented
  });
  it('high is called "maximum zachycené našimi kontrolami", with the base before the period', () => {
    const f = fromMove(move({ reason: 'high' }), '24h');
    expect(f.kind).toBe('max');
    expect(findingText(f, NOW, NOW).what).toContain('nejvýš za posledních 24 hodin, co jsme zapsali');
  });
  it('difference: two current prices of the same bet, payout gap, probability not implied', () => {
    const d: DiffItem = { eventId: 1, url: '/zapas/a-b-1/', home: 'Domácí', away: 'Hosté', compName: 'Liga', sport: 'fotbal', startAt: NOW + 3600, outcome: 'x',
      high: { book: 'chance', odds: 3500 }, low: { book: 'tipsport', odds: 3400 }, pct: 2.94 };
    const f = fromDiff(d);
    expect(currentOdds(f)).toBe(3500);
    const t = findingText(f, NOW, NOW - 120);
    expect(t.what).toContain('Chance 3,50, Tipsport 3,40. Stejná sázka, jiná cena.');
    expect(t.impact).toContain('o 10 Kč vyšší');
    expect(t.impact).toContain('nezvyšuje šanci');
  });
});
