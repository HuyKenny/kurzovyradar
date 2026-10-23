/**
 * Pure odds arithmetic. Odds are stored as integer thousandths (1.85 → 1850); these helpers take decimals.
 */
export const toDecimal = (milli: number) => milli / 1000;

/** Percentage change of the price: (new / old − 1) × 100. */
export function changePct(oldOdds: number, newOdds: number): number {
  if (!(oldOdds > 1) || !(newOdds > 1)) throw new RangeError('odds must be > 1');
  return (newOdds / oldOdds - 1) * 100;
}

/** Implied probability 1 / odds (includes the bookmaker margin; not the real chance of the outcome). */
export function implied(odds: number): number {
  if (!(odds > 1)) throw new RangeError('odds must be > 1');
  return 1 / odds;
}

/**
 * Overround (margin) of one bookmaker's market: Σ 1/odds − 1. Only defined for a complete set of mutually
 * exclusive outcomes from the same bookmaker; returns null otherwise.
 */
export function overround(odds: Record<string, number | undefined>, outcomes: readonly string[]): number | null {
  let s = 0;
  for (const o of outcomes) {
    const v = odds[o];
    if (!(v !== undefined && v > 1)) return null;
    s += 1 / v;
  }
  return s - 1;
}

export interface Quote {
  book: string;
  odds: number; // decimal
  enabled: boolean;
  fresh: boolean; // from the book's latest successful import, not past the stale limit, event not started
}

export type Best =
  | { kind: 'none' } // no current offer at all
  | { kind: 'single'; book: string; odds: number } // only one current offer: nothing to compare
  | { kind: 'best'; books: string[]; odds: number; tie: boolean }; // highest; tie = every current offer is equal

/**
 * Highest odds among current offers. Stale or suspended quotes never win; they are shown separately as
 * "last known". `tie` means all current offers are the same price, which the UI marks as "Shoda".
 */
export function bestOf(quotes: Quote[]): Best {
  const live = quotes.filter((q) => q.fresh && q.enabled && q.odds > 1);
  if (!live.length) return { kind: 'none' };
  if (live.length === 1) return { kind: 'single', book: live[0]!.book, odds: live[0]!.odds };
  const max = Math.max(...live.map((q) => q.odds));
  const books = live.filter((q) => q.odds === max).map((q) => q.book);
  return { kind: 'best', books, odds: max, tie: books.length === live.length };
}

/** Payout and profit for a stake (calculators). */
export function payout(stake: number, odds: number): { payout: number; profit: number } {
  if (!(stake >= 0) || !(odds > 1)) throw new RangeError('stake ≥ 0 and odds > 1 required');
  const p = stake * odds;
  return { payout: p, profit: p - stake };
}

export interface Dutching { stakes: number[]; payout: number; profit: number; /** Σ 1/odds; below 1 only when the odds leave a guaranteed profit (surebet) */ sumInv: number; surebet: boolean }

/**
 * Splits `stake` over mutually exclusive outcomes so the payout is the same whichever one wins ("holandská sázka").
 * stake_i = stake × (1/odds_i) / Σ(1/odds); payout = stake / Σ(1/odds). Σ 1/odds < 1 means the prices leave room for a
 * profit, but it is GUARANTEED only when the given outcomes cover every possible result of the event (callers say so).
 */
export function dutching(stake: number, odds: number[]): Dutching {
  if (!(stake >= 0) || odds.length < 2 || odds.some((o) => !(o > 1))) throw new RangeError('stake ≥ 0 and at least two odds > 1 required');
  const sumInv = odds.reduce((s, o) => s + 1 / o, 0);
  const total = stake / sumInv;
  return { stakes: odds.map((o) => stake / o / sumInv), payout: total, profit: total - stake, sumInv, surebet: sumInv < 1 };
}

export type OddsFormat = 'decimal' | 'fractional' | 'american';

/** Reads one odds value in the given format; returns decimal odds, or null when it is not a valid price. */
export function parseOdds(text: string, format: OddsFormat): number | null {
  const t = text.trim().replace(',', '.');
  let dec: number;
  if (format === 'decimal') dec = Number(t);
  else if (format === 'fractional') {
    const m = /^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/.exec(t);
    if (!m || !(Number(m[2]) > 0)) return null;
    dec = Number(m[1]) / Number(m[2]) + 1;
  } else {
    const m = /^([+-]?)(\d+(?:\.\d+)?)$/.exec(t.replace('−', '-'));
    if (!m || !(Number(m[2]) > 0)) return null;
    const n = Number(m[2]);
    dec = m[1] === '-' ? 1 + 100 / n : 1 + n / 100;
  }
  return Number.isFinite(dec) && dec > 1 && dec <= 1000 ? dec : null;
}

/** The same price in all three formats (fractional as the simplest fraction with denominator ≤ 100, else rounded). */
export function convertOdds(dec: number): { decimal: string; fractional: string; american: string } {
  if (!(dec > 1)) throw new RangeError('odds must be > 1');
  const x = dec - 1;
  let fractional = `${Math.round(x * 100)}/100`;
  for (let d = 1; d <= 100; d++) {
    const n = Math.round(x * d);
    if (n > 0 && Math.abs(n / d - x) < 0.0005) { fractional = `${n}/${d}`; break; }
  }
  const american = dec >= 2 ? `+${Math.round(x * 100)}` : `−${Math.round(100 / x)}`;
  return { decimal: dec.toFixed(2).replace('.', ','), fractional, american };
}

/**
 * Expected value of a one-unit stake given the VISITOR's own probability estimate (percent). This is arithmetic on
 * their number, not a prediction by the site: ev = p × odds − 1 (fraction of the stake).
 */
export function expectedValue(odds: number, probPct: number): { ev: number; breakEvenPct: number } {
  if (!(odds > 1) || !(probPct > 0 && probPct < 100)) throw new RangeError('odds > 1 and 0 < probability < 100 required');
  return { ev: (probPct / 100) * odds - 1, breakEvenPct: 100 / odds };
}
