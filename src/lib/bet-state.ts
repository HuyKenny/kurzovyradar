/**
 * The one chosen bet of a match page, as a state that lives in the URL. Pure (no Workers or DOM imports), so the
 * server renders the initial state from the query and src/scripts/bet.ts keeps every part of the page on the same one.
 *
 *   ?trh=1x2&vysledek=1|x|2&vklad=250&obdobi=1h|6h|24h|3d|vse&zjisteni=rust|pokles|rozdil|max&zpet=/radar/…
 *
 * `tip` (the old calculator parameter) is still read as an alias of `vysledek`, so existing links keep working.
 */
import type { Outcome } from '../server/types';

export const DEFAULT_STAKE = 100;
export const MAX_STAKE = 1e7;
export const PERIOD_KEYS = ['1h', '6h', '24h', '3d', 'vse'] as const;
export type PeriodKey = (typeof PERIOD_KEYS)[number];
export const FINDINGS = ['rust', 'pokles', 'rozdil', 'max'] as const;
export type FindingKey = (typeof FINDINGS)[number];

export interface BetState {
  outcome: Outcome;
  stake: number;
  /** Chart/finding period asked for in the URL; null = the page picks one. */
  period: PeriodKey | null;
  /** Kind of finding the visitor clicked on in the radar. */
  finding: FindingKey | null;
}

export const isOutcome = (v: string | null | undefined): v is Outcome => v === '1' || v === 'x' || v === '2';
export const isPeriod = (v: string | null | undefined): v is PeriodKey => (PERIOD_KEYS as readonly string[]).includes(v ?? '');
export const isFinding = (v: string | null | undefined): v is FindingKey => (FINDINGS as readonly string[]).includes(v ?? '');

/** "250", "1 250,50", "1e3" → a finite stake in 0…MAX_STAKE, or null when it is not a usable amount. */
export function parseStake(raw: string | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  const t = raw.replace(/\s| /g, '').replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 && n <= MAX_STAKE ? n : null;
}

export function parseBetState(q: URLSearchParams, fallback: Outcome): BetState {
  const raw = q.get('vysledek') ?? q.get('tip');
  return {
    outcome: isOutcome(raw) ? raw : fallback,
    stake: parseStake(q.get('vklad')) ?? DEFAULT_STAKE,
    period: isPeriod(q.get('obdobi')) ? (q.get('obdobi') as PeriodKey) : null,
    finding: isFinding(q.get('zjisteni')) ? (q.get('zjisteni') as FindingKey) : null,
  };
}

/** Writes the state into a copy of `base`, leaving every other parameter (zpet, utm, …) untouched. */
export function withBetState(base: URLSearchParams, s: Pick<BetState, 'outcome' | 'stake'> & Partial<Pick<BetState, 'period' | 'finding'>>): URLSearchParams {
  const p = new URLSearchParams(base);
  p.delete('tip');
  p.set('trh', '1x2');
  p.set('vysledek', s.outcome);
  p.set('vklad', String(s.stake));
  if (s.period) p.set('obdobi', s.period); else p.delete('obdobi');
  if (s.finding) p.set('zjisteni', s.finding); else if (s.finding === null) p.delete('zjisteni');
  return p;
}

/** Payout including the stake and net profit for decimal odds in thousandths (1660 = 1,66). */
export function winnings(stake: number, oddsMilli: number): { payout: number; profit: number } {
  const payout = Math.round(stake * oddsMilli) / 1000;
  return { payout, profit: Math.round((payout - stake) * 100) / 100 };
}

/** Difference of the payout at the same stake when the price goes from `fromMilli` to `toMilli` (whole koruny, signed). */
export function payoutDelta(stake: number, fromMilli: number, toMilli: number): number {
  return Math.round((stake * (toMilli - fromMilli)) / 1000);
}
