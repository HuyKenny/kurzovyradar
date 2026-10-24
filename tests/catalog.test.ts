import { describe, expect, it } from 'vitest';
import { competitionsIn, sportsIn } from '../src/lib/catalog';

const ev = (comp: string, sport: 'fotbal' | 'tenis' | 'hokej' | 'sipky', compName = comp) => ({ comp, compName, sport });

describe('catalog from the offer', () => {
  it('sports: football and hockey first, then by size, only sports that have matches', () => {
    const r = sportsIn([ev('a', 'tenis'), ev('b', 'tenis'), ev('c', 'sipky'), ev('d', 'hokej'), ev('e', 'fotbal')]);
    expect(r.map((x) => x.sport)).toEqual(['fotbal', 'hokej', 'tenis', 'sipky']);
    expect(r[2]).toMatchObject({ name: 'Tenis', path: '/tenis/', count: 2 });
  });
  it('competitions: curated top leagues first, then by size; counted per competition', () => {
    const r = competitionsIn([ev('tenis-wta-tokyo', 'tenis', 'WTA Tokyo'), ev('tenis-wta-tokyo', 'tenis', 'WTA Tokyo'), ev('premier-league', 'fotbal', 'Premier League'), ev('fotbal-3-italska-liga', 'fotbal', '3. italská liga')]);
    expect(r.map((x) => x.slug)).toEqual(['premier-league', 'tenis-wta-tokyo', 'fotbal-3-italska-liga']);
    expect(r[1]!.count).toBe(2);
  });
});

import { snapshotJson } from '../src/server/store/derive';
import type { EventView, UpcomingSnapshot } from '../src/server/view';

describe('the upcoming snapshot has to fit into one D1 value', () => {
  const offer = { odds: 2100, enabled: true, removedAt: null, changedAt: 1, firstOdds: 2000, firstAt: 1, minOdds: 1900, maxOdds: 2200 };
  const event = (i: number): EventView => ({ id: i, url: `/zapas/a-b-${i}/`, sport: 'fotbal', comp: 'x', compName: 'X', home: 'A', away: 'B', startAt: 1000 + i, market: '1x2',
    books: { tipsport: { mismatch: false, removed: false, outcomes: { '1': offer, x: offer, '2': offer } } } });
  const snap = (n: number): UpcomingSnapshot => ({ at: 1, books: {}, events: Array.from({ length: n }, (_, i) => event(i)), stats: { events: n, offers: 0, changes24h: 0, firstRecordAt: null } });
  it('detail-only fields are not stored in the snapshot', () => {
    const j = snapshotJson(snap(2));
    expect(j).not.toMatch(/firstOdds|minOdds|maxOdds|firstAt/);
    expect(j).toContain('"changedAt"');
  });
  it('when it is still too big the matches that start last are dropped, the nearest stay', () => {
    const j = JSON.parse(snapshotJson(snap(300), 40_000)) as UpcomingSnapshot;
    expect(j.events.length).toBeLessThan(300);
    expect(j.events[0]!.id).toBe(0);
    expect(JSON.stringify(j).length).toBeLessThanOrEqual(40_000);
  });
});
