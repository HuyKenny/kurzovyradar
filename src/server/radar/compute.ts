/**
 * Radar of recorded movements. Pure: input = current offers + their stored history, output = snapshot lists.
 * A movement is measured only against a value we actually recorded at or before the window start; an offer we
 * started tracking later has no movement for that window (missing history is never a zero change).
 */
import type { FeedBook } from '../../config/bookmakers';
import { changePct } from '../calc/odds';
import type { Outcome } from '../types';
import { WINDOWS, type DiffItem, type EventView, type MoveItem, type RadarSnapshot, type WindowKey } from '../view';

export interface TrackedOffer {
  event: Pick<EventView, 'id' | 'url' | 'home' | 'away' | 'comp' | 'compName' | 'sport' | 'startAt'>;
  book: FeedBook;
  outcome: Outcome;
  odds: number;
  changedAt: number;
  current: boolean; // fresh, enabled, paired, not removed, not started
  history: { at: number; odds: number; enabled: boolean }[]; // ascending by at
}

const LIMIT = 40;

export function computeRadar(offers: TrackedOffer[], trackingSince: Partial<Record<FeedBook, number | null>>, now: number): RadarSnapshot {
  const windows = {} as RadarSnapshot['windows'];
  for (const w of WINDOWS) {
    const start = now - w.seconds;
    const available = Object.values(trackingSince).some((t) => t !== null && t !== undefined && t <= start);
    const drops: MoveItem[] = [];
    const rises: MoveItem[] = [];
    const highs: MoveItem[] = [];
    if (available) {
      for (const o of offers) {
        if (!o.current) continue;
        const since = trackingSince[o.book];
        if (since === null || since === undefined || since > start) continue;
        const enabled = o.history.filter((h) => h.enabled);
        const base = [...enabled].reverse().find((h) => h.at <= start);
        if (!base) continue;
        const inside = enabled.filter((h) => h.at > start);
        if (o.odds === base.odds) continue;
        const item: MoveItem = {
          eventId: o.event.id, url: o.event.url, home: o.event.home, away: o.event.away, comp: o.event.comp, compName: o.event.compName,
          sport: o.event.sport, startAt: o.event.startAt, outcome: o.outcome, book: o.book,
          from: { odds: base.odds, at: base.at }, to: { odds: o.odds, at: o.changedAt },
          pct: round2(changePct(base.odds, o.odds)),
          points: [[base.at, base.odds], ...inside.map((h) => [h.at, h.odds] as [number, number])],
          reason: o.odds < base.odds ? 'drop' : 'rise',
        };
        if (item.reason === 'drop') drops.push(item);
        else {
          rises.push(item);
          if (o.odds >= Math.max(base.odds, ...inside.map((h) => h.odds))) highs.push({ ...item, reason: 'high' });
        }
      }
    }
    drops.sort((a, b) => a.pct - b.pct || a.startAt - b.startAt);
    rises.sort((a, b) => b.pct - a.pct || a.startAt - b.startAt);
    highs.sort((a, b) => b.pct - a.pct || a.startAt - b.startAt);
    windows[w.key as WindowKey] = { available, drops: drops.slice(0, LIMIT), rises: rises.slice(0, LIMIT), highs: highs.slice(0, LIMIT) };
  }
  return { at: now, windows, diffs: computeDiffs(offers) };
}

/** Same event and outcome, two current paired offers with different prices. */
export function computeDiffs(offers: TrackedOffer[]): DiffItem[] {
  const groups = new Map<string, TrackedOffer[]>();
  for (const o of offers) {
    if (!o.current) continue;
    const k = `${o.event.id}|${o.outcome}`;
    (groups.get(k) ?? groups.set(k, []).get(k)!).push(o);
  }
  const out: DiffItem[] = [];
  for (const g of groups.values()) {
    if (g.length < 2) continue;
    const hi = g.reduce((a, b) => (b.odds > a.odds ? b : a));
    const lo = g.reduce((a, b) => (b.odds < a.odds ? b : a));
    if (hi.odds === lo.odds) continue;
    out.push({
      eventId: hi.event.id, url: hi.event.url, home: hi.event.home, away: hi.event.away, compName: hi.event.compName, sport: hi.event.sport,
      startAt: hi.event.startAt, outcome: hi.outcome, high: { book: hi.book, odds: hi.odds }, low: { book: lo.book, odds: lo.odds },
      pct: round2(changePct(lo.odds, hi.odds)),
    });
  }
  return out.sort((a, b) => b.pct - a.pct || a.startAt - b.startAt).slice(0, LIMIT);
}

const round2 = (n: number) => Math.round(n * 100) / 100;
