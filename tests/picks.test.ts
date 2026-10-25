import { describe, expect, it } from 'vitest';
import { picks, reasons, BIG_MOVE_PCT } from '../src/lib/picks';
import { settings } from '../src/server/types';
import type { EventView, OfferView, RadarSnapshot, UpcomingSnapshot, MoveItem } from '../src/server/view';

const cfg = settings({});
const NOW = Math.floor(Date.UTC(2026, 9, 24, 10, 0) / 1000); // Sat 12:00 Prague
const o = (odds: number, extra: Partial<OfferView> = {}): OfferView => ({ odds, enabled: true, removedAt: null, changedAt: NOW - 7200, firstOdds: odds, firstAt: NOW - 86400, minOdds: odds, maxOdds: odds, ...extra });
let nextId = 1;
const ev = (t: [number, number, number], c: [number, number, number], extra: { start?: number; sport?: 'fotbal' | 'hokej'; t1?: Partial<OfferView> } = {}): EventView => ({
  id: nextId++, url: `/zapas/a-b-${nextId}/`, sport: extra.sport ?? 'fotbal', comp: 'premier-league', compName: 'Premier League', home: 'Arsenal', away: 'Everton',
  startAt: extra.start ?? NOW + 6 * 3600, market: '1x2',
  books: {
    tipsport: { mismatch: false, removed: false, outcomes: { '1': o(t[0], extra.t1), x: o(t[1]), '2': o(t[2]) } },
    chance: { mismatch: false, removed: false, outcomes: { '1': o(c[0]), x: o(c[1]), '2': o(c[2]) } },
  },
});
const books = (tipsAt = NOW - 300, chanceAt = NOW - 300): UpcomingSnapshot['books'] => ({
  tipsport: { lastSuccessAt: tipsAt, lastAttemptAt: tipsAt, failing: false, trackingSince: NOW - 3 * 86400 },
  chance: { lastSuccessAt: chanceAt, lastAttemptAt: chanceAt, failing: false, trackingSince: NOW - 3 * 86400 },
});
const up = (events: EventView[], b = books()): UpcomingSnapshot => ({ at: NOW, books: b, events, stats: { events: events.length, offers: 0, changes24h: 0, firstRecordAt: NOW - 3 * 86400 } });
const move = (e: EventView, over: Partial<MoveItem>): MoveItem => ({
  eventId: e.id, url: e.url, home: e.home, away: e.away, comp: e.comp, compName: e.compName, sport: e.sport, startAt: e.startAt, outcome: '1', book: 'tipsport',
  from: { odds: 2100, at: NOW - 30 * 3600 }, to: { odds: 1900, at: NOW - 3600 }, pct: -9.52, points: [], reason: 'drop', ...over,
});
const radar = (w24: Partial<RadarSnapshot['windows']['24h']>): RadarSnapshot => ({
  at: NOW, diffs: [],
  windows: { '1h': { available: true, drops: [], rises: [], highs: [] }, '6h': { available: true, drops: [], rises: [], highs: [] }, '24h': { available: true, drops: [], rises: [], highs: [], ...w24 } },
});

describe('picks: reasons', () => {
  it('higher price elsewhere (≥ 1 %)', () => {
    const e = ev([2000, 3400, 3600], [2100, 3400, 3600]);
    const p = picks(up([e]), null, NOW, cfg);
    expect(p).toHaveLength(1);
    expect(p[0]!.reason.type).toBe('higher-elsewhere');
    expect(p[0]!.reason.label).toBe('Vyšší kurz u druhé kanceláře');
    expect(p[0]!.reason.finding).toBe('rozdil');
    expect(p[0]!.reason.text).toContain('Na výhru týmu Arsenal nabízí Chance 2,10, Tipsport 2,00');
  });
  it('a tiny difference (< 1 %) is not a reason', () => {
    expect(picks(up([ev([2000, 3400, 3600], [2010, 3400, 3600])]), null, NOW, cfg)).toHaveLength(0);
  });
  it('one book moved and the other was checked later with the old price', () => {
    const e = ev([1900, 3400, 3600], [2100, 3400, 3600], { t1: { prev: { odds: 2100, at: NOW - 9000 }, changedAt: NOW - 3600 } });
    const p = picks(up([e]), null, NOW, cfg);
    expect(p[0]!.reason.type).toBe('one-moved');
    expect(p[0]!.reason.text).toMatch(/Tipsport .* změnil kurz na výhru týmu Arsenal z 2,10 na 1,90\. Chance měl při kontrole .* pořád 2,10/);
  });
  it('not "one-moved" when the other book was not checked after the change', () => {
    const e = ev([1900, 3400, 3600], [2100, 3400, 3600], { t1: { prev: { odds: 2100, at: NOW - 9000 }, changedAt: NOW - 600 } });
    const p = picks(up([e], books(NOW - 60, NOW - 1200)), null, NOW, cfg);
    expect(p[0]!.reason.type).toBe('higher-elsewhere');
  });
  it('a stale bookmaker never makes a difference', () => {
    const e = ev([2000, 3400, 3600], [2500, 3400, 3600]);
    expect(picks(up([e], books(NOW - 60, NOW - 3 * 3600)), null, NOW, cfg)).toHaveLength(0);
  });
  it('big recorded move, only from the threshold up', () => {
    const e = ev([1900, 3400, 3600], [1900, 3400, 3600]);
    const r = radar({ drops: [move(e, { book: 'tipsport' })] });
    expect(picks(up([e]), r, NOW, cfg)[0]!.reason).toMatchObject({ type: 'big-move', finding: 'pokles', label: 'Kurz klesl', window: '24h' });
    const small = radar({ drops: [move(e, { pct: -(BIG_MOVE_PCT - 1), from: { odds: 2040, at: NOW - 30 * 3600 } })] });
    expect(picks(up([e]), small, NOW, cfg)).toHaveLength(0);
  });
  it('new high comes only from the radar (base recorded before the window), and must match the current price', () => {
    const e = ev([2300, 3400, 3600], [2300, 3400, 3600]);
    const high = move(e, { from: { odds: 2200, at: NOW - 30 * 3600 }, to: { odds: 2300, at: NOW - 3600 }, pct: 4.55, reason: 'high' });
    expect(picks(up([e]), radar({ highs: [high] }), NOW, cfg)[0]!.reason.type).toBe('new-high');
    const outdated = { ...high, to: { odds: 2400, at: NOW - 3600 } };
    expect(picks(up([e]), radar({ highs: [outdated] }), NOW, cfg)).toHaveLength(0);
  });
  it('without any history the list is empty, not invented', () => {
    expect(picks(up([ev([2000, 3400, 3600], [2000, 3400, 3600])]), null, NOW, cfg)).toEqual([]);
  });
});

describe('picks: selection and order', () => {
  it('order: one-moved, higher-elsewhere, big-move; one per match; max 6; only today and tomorrow', () => {
    const big = ev([1900, 3400, 3600], [1900, 3400, 3600]);
    const diff = ev([2000, 3400, 3600], [2100, 3400, 3600]);
    const moved = ev([1900, 3400, 3600], [2100, 3400, 3600], { t1: { prev: { odds: 2100, at: NOW - 9000 }, changedAt: NOW - 3600 } });
    const later = ev([2000, 3400, 3600], [2200, 3400, 3600], { start: NOW + 4 * 86400 });
    const many = Array.from({ length: 8 }, () => ev([2000, 3400, 3600], [2100, 3400, 3600]));
    const p = picks(up([big, diff, moved, later, ...many]), radar({ drops: [move(big, {})] }), NOW, cfg);
    expect(p).toHaveLength(6);
    expect(p[0]!.ev.id).toBe(moved.id);
    expect(p.map((x) => x.ev.id)).not.toContain(later.id);
    expect(new Set(p.map((x) => x.ev.id)).size).toBe(p.length);
  });
  it('the detail can list every reason for a bet', () => {
    const e = ev([2000, 3400, 3600], [2100, 3400, 3600]);
    const r = reasons(up([e]), radar({ rises: [move(e, { book: 'chance', from: { odds: 1900, at: NOW - 30 * 3600 }, to: { odds: 2100, at: NOW - 3600 }, pct: 10.53, reason: 'rise' })] }), NOW, cfg);
    expect(r.get(`${e.id}|1`)!.map((x) => x.type)).toEqual(['higher-elsewhere', 'big-move']);
  });
});

describe('picks: wording', () => {
  it('the same recorded change at both bookmakers names both', () => {
    const e = ev([1900, 3400, 3600], [1900, 3400, 3600]);
    const r = radar({ drops: [move(e, { book: 'tipsport' }), move(e, { book: 'chance' })] });
    expect(picks(up([e]), r, NOW, cfg)[0]!.reason.text).toContain('u Tipsportu i Chance klesl');
  });
});

describe('homepage quick choice', () => {
  it('a sport filter really changes the picks', () => {
    const f = ev([2000, 3400, 3600], [2100, 3400, 3600]);
    const h = ev([2000, 3400, 3600], [2100, 3400, 3600], { sport: 'hokej' });
    const snap = up([f, h]);
    expect(picks(snap, null, NOW, cfg).map((p) => p.ev.sport).sort()).toEqual(['fotbal', 'hokej']);
    expect(picks(snap, null, NOW, cfg, undefined, { filter: (e) => e.sport === 'hokej' }).map((p) => p.ev.sport)).toEqual(['hokej']);
    expect(picks(snap, null, NOW, cfg, undefined, { filter: (e) => e.sport === 'fotbal' }).map((p) => p.ev.sport)).toEqual(['fotbal']);
  });
});
