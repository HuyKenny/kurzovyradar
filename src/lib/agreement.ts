/**
 * Do the compared bookmakers quote the same price for one bet? One answer for every page (detail, homepage, cards), so a text can never
 * say "stejný kurz" next to 3,40 and 3,43. Prices are the stored integer thousandths, compared exactly; only current, comparable offers
 * may be passed in (lib/picks.ts pricesFor). Whether a difference is big enough for the radar is a separate question (MIN_DIFF_PCT) and
 * never decides whether the numbers are called equal.
 */
import { MIN_DIFF_PCT } from './picks';

export type Agreement = 'same' | 'slight' | 'differ' | 'single' | 'none';

export function priceAgreement(prices: { odds: number }[]): Agreement {
  if (prices.length === 0) return 'none';
  if (prices.length === 1) return 'single';
  const hi = Math.max(...prices.map((p) => p.odds));
  const lo = Math.min(...prices.map((p) => p.odds));
  if (hi === lo) return 'same';
  return ((hi / lo - 1) * 100) < MIN_DIFF_PCT ? 'slight' : 'differ';
}

export const AGREEMENT_TEXT: Record<Agreement, string> = {
  same: 'U obou kanceláří je stejný kurz.',
  slight: 'Kurzy se mírně liší.',
  differ: 'Kurzy se liší.',
  single: 'Pro srovnání chybí kurz druhé kanceláře.',
  none: 'Aktuální kurz teď nemáme.',
};

/**
 * Two decimals, unless that would make two different stored prices look identical (the platform quotes to 0,01, so this is a guard,
 * not the normal case): then three decimals for both.
 */
export function oddsPair(a: number, b: number): [string, string] {
  const two = (n: number) => (n / 1000).toFixed(2).replace('.', ',');
  const three = (n: number) => (n / 1000).toFixed(3).replace('.', ',');
  return a !== b && two(a) === two(b) ? [three(a), three(b)] : [two(a), two(b)];
}
