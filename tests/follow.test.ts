import { describe, expect, it } from 'vitest';
import { parseState } from '../src/scripts/follow';

describe('followed items survive format extensions', () => {
  it('a v2 save from before the target price loads unchanged, with the target empty', () => {
    const old = JSON.stringify({ v: 2, events: [{ id: 1, url: '/zapas/a-1/', home: 'A', away: 'B', startAt: 9, comp: 'L', seen: null }],
      bets: [{ id: 1, outcome: 'x', url: '/zapas/a-1/', home: 'A', away: 'B', startAt: 9, comp: 'L', sport: 'fotbal', label: 'Remíza', seen: { at: 5, odds: 3400, via: 'ulozeni' } }], comps: [{ slug: 'l', name: 'L' }], sports: ['fotbal'] });
    const { state, migrated } = parseState(old, null);
    expect(migrated).toBe(false);
    expect(state.bets[0]).toMatchObject({ id: 1, outcome: 'x', seen: { at: 5, odds: 3400 }, target: null, targetAt: null });
    expect(state.events).toHaveLength(1);
    expect(state.comps).toEqual([{ slug: 'l', name: 'L' }]);
    expect(state.sports).toEqual(['fotbal']);
  });
  it('a target that was saved is kept; junk is dropped to null', () => {
    const s = JSON.stringify({ v: 2, events: [], bets: [{ id: 2, outcome: '1', url: '', home: '', away: '', startAt: 1, comp: '', sport: 'hokej', label: '', seen: null, target: 2100, targetAt: 77 },
      { id: 3, outcome: '2', url: '', home: '', away: '', startAt: 1, comp: '', sport: 'hokej', label: '', seen: null, target: 'abc' }], comps: [], sports: [] });
    const { state } = parseState(s, null);
    expect(state.bets[0]).toMatchObject({ target: 2100, targetAt: 77 });
    expect(state.bets[1]).toMatchObject({ target: null, targetAt: null });
  });
  it('the very old favourites list is migrated once', () => {
    const { state, migrated } = parseState(null, JSON.stringify([{ id: 4, url: '/zapas/x-4/', home: 'X', away: 'Y', startAt: 3, comp: 'C' }]));
    expect(migrated).toBe(true);
    expect(state.events[0]).toMatchObject({ id: 4, seen: null });
  });
  it('broken storage gives an empty state instead of an error', () => {
    expect(parseState('{nope', null).state).toEqual({ v: 2, events: [], bets: [], comps: [], sports: [] });
  });
});
