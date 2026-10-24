/**
 * What the current offer contains, derived from the snapshot (not from a fixed list): which sports have matches and which
 * competitions, so a league the bookmakers add tomorrow shows up without a deploy. Curated competitions only add a "top" flag.
 */
import { COMPETITIONS, SPORT_LIST, SPORTS, type Sport } from '../config/competitions';

export interface CompEntry { slug: string; name: string; sport: Sport; count: number; top: boolean }
export interface SportEntry { sport: Sport; name: string; path: string; count: number }

const TOP = new Set(COMPETITIONS.filter((c) => c.top).map((c) => c.slug));
const ORDER = new Map(COMPETITIONS.map((c, i) => [c.slug, i]));

export function competitionsIn(events: { comp: string; compName: string; sport: Sport }[]): CompEntry[] {
  const m = new Map<string, CompEntry>();
  for (const e of events) {
    const x = m.get(e.comp) ?? m.set(e.comp, { slug: e.comp, name: e.compName, sport: e.sport, count: 0, top: TOP.has(e.comp) }).get(e.comp)!;
    x.count++;
  }
  return [...m.values()].sort((a, b) => Number(b.top) - Number(a.top) || (ORDER.get(a.slug) ?? 999) - (ORDER.get(b.slug) ?? 999) || b.count - a.count || a.name.localeCompare(b.name, 'cs'));
}

/** Sports with at least one match, football and hockey first, the rest by number of matches. */
export function sportsIn(events: { sport: Sport }[]): SportEntry[] {
  const n = new Map<Sport, number>();
  for (const e of events) n.set(e.sport, (n.get(e.sport) ?? 0) + 1);
  return SPORT_LIST.filter((s) => n.has(s)).map((s) => ({ sport: s, name: SPORTS[s].name, path: SPORTS[s].path, count: n.get(s)! }))
    .sort((a, b) => (a.sport === 'fotbal' ? -1 : b.sport === 'fotbal' ? 1 : a.sport === 'hokej' ? -1 : b.sport === 'hokej' ? 1 : b.count - a.count));
}
