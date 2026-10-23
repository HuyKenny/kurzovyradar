import { describe, expect, it } from 'vitest';
import { ticketView, atBooks } from '../src/lib/ticket';
import { settings } from '../src/server/types';
import type { EventView, OfferView, UpcomingSnapshot } from '../src/server/view';

const cfg = settings({});
const NOW = 1_800_000_000;
const offer = (odds: number, extra: Partial<OfferView> = {}): OfferView => ({
  odds, enabled: true, removedAt: null, changedAt: NOW - 3600, firstOdds: odds, firstAt: NOW - 7200, minOdds: odds, maxOdds: odds, ...extra,
});
const ev = (t: [number, number, number], c: [number, number, number] | null, extra: Partial<OfferView> = {}): EventView => ({
  id: 1, url: '/zapas/a-b-1/', sport: 'fotbal', comp: 'premier-league', compName: 'Premier League', home: 'Liverpool', away: 'Brighton', startAt: NOW + 86400, market: '1x2',
  books: {
    tipsport: { mismatch: false, removed: false, outcomes: { '1': offer(t[0], extra), x: offer(t[1]), '2': offer(t[2]) } },
    ...(c ? { chance: { mismatch: false, removed: false, outcomes: { '1': offer(c[0]), x: offer(c[1]), '2': offer(c[2]) } } } : {}),
  },
});
const fresh: UpcomingSnapshot['books'] = {
  tipsport: { lastSuccessAt: NOW - 300, lastAttemptAt: NOW - 300, failing: false, trackingSince: NOW - 86400 },
  chance: { lastSuccessAt: NOW - 300, lastAttemptAt: NOW - 300, failing: false, trackingSince: NOW - 86400 },
};

describe('ticket view', () => {
  it('names outcomes after the teams', () => {
    const v = ticketView(ev([1850, 3600, 4200], [1850, 3600, 4200]), fresh, NOW, cfg);
    expect(v.outcomes.map((o) => o.who)).toEqual(['Liverpool', 'Remíza', 'Brighton']);
  });
  it('identical prices at both books collapse to one row', () => {
    const v = ticketView(ev([1850, 3600, 4200], [1850, 3600, 4200]), fresh, NOW, cfg);
    expect(v.allSame).toBe(true);
    expect(v.favourite?.who).toBe('Liverpool');
    expect(atBooks(v.books)).toBe('u Tipsportu i Chance');
  });
  it('a different price names the book that pays more', () => {
    const v = ticketView(ev([1850, 3600, 4200], [1900, 3600, 4200]), fresh, NOW, cfg);
    expect(v.allSame).toBe(false);
    expect(v.outcomes[0]!.best).toEqual({ odds: 1900, books: ['chance'] });
    expect(v.outcomes[0]!.same).toBe(false);
  });
  it('a stale book does not count, a single book is not "same"', () => {
    const stale = { ...fresh, chance: { ...fresh.chance!, lastSuccessAt: NOW - 3 * 3600 } };
    const v = ticketView(ev([1850, 3600, 4200], [2500, 3600, 4200]), stale, NOW, cfg);
    expect(v.books).toEqual(['tipsport']);
    expect(v.outcomes[0]!.best).toEqual({ odds: 1850, books: ['tipsport'] });
    expect(v.allSame).toBe(false);
    expect(v.outcomes[0]!.cells[1]!.state).toBe('stale');
  });
  it('reports the latest recorded move', () => {
    const v = ticketView(ev([1900, 3600, 4200], null, { prev: { odds: 2100, at: NOW - 5000 }, changedAt: NOW - 1000 }), fresh, NOW, cfg);
    expect(v.move).toEqual({ outcome: '1', who: 'Liverpool', from: 2100, to: 1900, at: NOW - 1000 });
  });
  it('no current price at all → nothing best, no favourite', () => {
    const v = ticketView(ev([1850, 3600, 4200], null), {}, NOW, cfg);
    expect(v.favourite).toBeNull();
    expect(v.outcomes.every((o) => o.best === null)).toBe(true);
  });
});
