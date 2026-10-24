/**
 * The three different numbers a list can mean, kept apart: how many items the visitor sees now (shown), how many match the
 * chosen filters (total), and how many matches the chosen day has altogether (dayTotal). Pure.
 */
import type { DayFilter } from './days';

const WHEN: Record<DayFilter, string> = { dnes: 'dnes', zitra: 'zítra', vikend: 'o víkendu', '7': 'v příštích 7 dnech' };
export const matchWord = (n: number) => (n === 1 ? 'zápas' : n >= 2 && n <= 4 ? 'zápasy' : 'zápasů');

export function countLine(c: { shown: number; total: number; dayTotal: number | null; day: DayFilter | ''; filtered: boolean }): string {
  if (c.total === 0) return '';
  const when = c.day ? ` ${WHEN[c.day]}` : '';
  const head = c.shown < c.total ? `Zobrazeno ${c.shown} z ${c.total} ${matchWord(c.total === 1 ? 1 : 5)}${when}` : `${c.total} ${matchWord(c.total)}${when}`;
  const tail = c.filtered && c.dayTotal !== null && c.dayTotal > c.total ? ` podle filtrů (celkem ${c.dayTotal} ${matchWord(c.dayTotal)}${when})` : '';
  return `${head}${tail}, seřazeno podle začátku`;
}
