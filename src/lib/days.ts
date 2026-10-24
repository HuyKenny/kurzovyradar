/**
 * "dnes", "zítra", "víkend", "7 dní" in the Czech calendar (Europe/Prague). Days are compared as calendar dates, never as
 * multiples of 86 400 s, so the 23- and 25-hour days of a daylight-saving change cannot skip or repeat a day.
 */
import { dayKey } from './format';

export type DayFilter = 'dnes' | 'zitra' | 'vikend' | '7';
export const DAY_FILTERS: DayFilter[] = ['dnes', 'zitra', 'vikend', '7'];
export const isDayFilter = (v: string | null | undefined): v is DayFilter => DAY_FILTERS.includes(v as DayFilter);

/** "2026-10-24" + n calendar days → "2026-10-25". */
export function addDays(key: string, n: number): string {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
const weekday = (key: string) => new Date(`${key}T12:00:00Z`).getUTCDay(); // 0 = Sunday … 6 = Saturday

/** The Prague calendar days a filter stands for, counted from the day of `now`. */
export function daysOf(f: DayFilter, now: number): string[] {
  const today = dayKey(now);
  if (f === 'dnes') return [today];
  if (f === 'zitra') return [addDays(today, 1)];
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  if (f === '7') return week;
  const first = week.find((k) => weekday(k) === 6 || weekday(k) === 0)!; // the current or coming weekend; on a Sunday only the rest of it
  return weekday(first) === 6 ? [first, addDays(first, 1)] : [first];
}

const dayList = new Map<string, Set<string>>();
export const inDays = (startAt: number, f: DayFilter, now: number) => {
  const k = `${f}|${dayKey(now)}`;
  let set = dayList.get(k);
  if (!set) {
    if (dayList.size > 200) dayList.clear();
    set = new Set(daysOf(f, now));
    dayList.set(k, set);
  }
  return set.has(dayKey(startAt));
};
export const DAY_LABEL: Record<DayFilter, string> = { dnes: 'Dnes', zitra: 'Zítra', vikend: 'Víkend', '7': '7 dní' };
