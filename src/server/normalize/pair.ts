import type { Sport } from '../../config/competitions';
import type { Market } from '../types';
import { participantKey } from './participants';

/** The facts two offers must share before we put their odds side by side. */
export interface PairFacts {
  sport: Sport;
  competition: string;
  home: string;
  away: string;
  startAt: number;
  market: Market;
}

export type PairVerdict = { ok: true } | { ok: false; reason: 'sport' | 'competition' | 'participants' | 'swapped' | 'start' | 'market' };

/**
 * Same event and same bet? A shared source id is only a candidate: sport, competition, both participants in the
 * same order, kick-off (within tolerance) and the exact market must all agree. Similar names are not enough,
 * and swapped home/away is a different bet (1 and 2 would be crossed).
 */
export function canPair(a: PairFacts, b: PairFacts, toleranceMin = 0): PairVerdict {
  if (a.sport !== b.sport) return { ok: false, reason: 'sport' };
  if (a.competition !== b.competition) return { ok: false, reason: 'competition' };
  if (a.market !== b.market) return { ok: false, reason: 'market' };
  const [ah, aa, bh, ba] = [a.home, a.away, b.home, b.away].map(participantKey);
  if (ah !== bh || aa !== ba) return { ok: false, reason: ah === ba && aa === bh ? 'swapped' : 'participants' };
  if (Math.abs(a.startAt - b.startAt) > toleranceMin * 60) return { ok: false, reason: 'start' };
  return { ok: true };
}
