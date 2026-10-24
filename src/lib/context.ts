/**
 * What a visitor is comparing when they land on a match from the radar: a period, a kind of finding, and the three
 * different times involved (when we recorded the change, when we last verified the price, which period is compared).
 * Pure. Mirrors the radar rule (server/radar/compute.ts): a movement is measured only against a value we recorded at
 * or before the period start; an offer tracked later has no movement for that period (missing history is never "0 %").
 */
import { changePct } from '../server/calc/odds';
import type { PeriodKey } from './bet-state';

export interface PeriodInfo { key: PeriodKey; label: string; since: string; seconds: number | null }
/** seconds = null → the whole time we have tracked the event. */
export const PERIODS: PeriodInfo[] = [
  { key: '1h', label: 'hodina', since: 'za poslední hodinu', seconds: 3600 },
  { key: '6h', label: '6 hodin', since: 'za posledních 6 hodin', seconds: 6 * 3600 },
  { key: '24h', label: '24 hodin', since: 'za posledních 24 hodin', seconds: 86400 },
  { key: '3d', label: '3 dny', since: 'za poslední 3 dny', seconds: 3 * 86400 },
  { key: 'vse', label: 'celé sledování', since: 'od začátku našeho sledování', seconds: null },
];
export const periodInfo = (k: PeriodKey) => PERIODS.find((p) => p.key === k)!;

export interface Rec { at: number; odds: number; enabled: boolean }

export type Change =
  | { status: 'insufficient' }
  | { status: 'unchanged'; odds: number; baseAt: number }
  | { status: 'moved'; from: { odds: number; at: number }; to: { odds: number; at: number }; pct: number; isHigh: boolean };

/**
 * `rows` = every recorded price of ONE book and outcome, ascending (history stores changes only: the last record
 * before the period start is still the valid price at its start). `trackingSince` = when we started tracking the book.
 */
export function windowChange(rows: Rec[], now: number, seconds: number | null, trackingSince: number | null, currentOdds: number | null): Change {
  const on = rows.filter((r) => r.enabled);
  if (!on.length || currentOdds === null) return { status: 'insufficient' };
  let base: Rec | undefined;
  let inside: Rec[];
  if (seconds === null) {
    base = on[0];
    inside = on.slice(1);
  } else {
    const start = now - seconds;
    if (trackingSince === null || trackingSince > start) return { status: 'insufficient' };
    base = [...on].reverse().find((r) => r.at <= start);
    inside = on.filter((r) => r.at > start);
  }
  if (!base) return { status: 'insufficient' };
  if (currentOdds === base.odds) return { status: 'unchanged', odds: base.odds, baseAt: base.at };
  const last = inside[inside.length - 1] ?? base;
  return {
    status: 'moved', from: { odds: base.odds, at: base.at }, to: { odds: currentOdds, at: last.at },
    pct: Math.round(changePct(base.odds, currentOdds) * 100) / 100,
    isHigh: currentOdds > base.odds && currentOdds >= Math.max(base.odds, ...inside.map((r) => r.odds)),
  };
}

/** Periods a chart or comparison can honestly offer for an event tracked since `firstAt` (needs the whole period covered). */
export function availablePeriods(firstAt: number | null, endAt: number): PeriodInfo[] {
  if (!firstAt) return [];
  const span = endAt - firstAt;
  return PERIODS.filter((p) => p.seconds === null || span >= p.seconds);
}
