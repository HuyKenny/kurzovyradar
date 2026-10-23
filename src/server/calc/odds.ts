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
