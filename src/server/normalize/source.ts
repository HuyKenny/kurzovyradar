import type { FeedBook } from '../../config/bookmakers';
import { GENDER_BY_ID_SPORT, SPORT_IDS, competitionOf } from '../../config/competitions';
import type { RawMatch } from '../providers/platform';
import type { SourceMatch } from '../types';
import { classifyMarket, outcomesOf } from './markets';
import { displayName } from './participants';

/** Season-long markets that the platform files under a competition ("… 2026/2027 – celkově", "po 30. kole"). */
const OUTRIGHT = /celkov|dlouhodob|vítěz skupiny|vítěz soutěže|po \d+\.\s?kol|nejlepší střel|sestup|postup|speciál/i;

/**
 * Platform match → SourceMatch, or null when it is outside the pilot (sport, competition, market) or not a
 * plain head-to-head prematch event. Nothing is guessed: a missing field means the match is skipped.
 */
export function toSource(book: FeedBook, raw: RawMatch): SourceMatch | null {
  const sport = SPORT_IDS[Number(raw?.idSuperSport)];
  if (!sport || !raw?.id || raw.ended) return null;
  if (String(raw.matchType ?? '').toUpperCase() !== 'PREMATCH') return null;
  // Men's and women's leagues share names; only the source idSport tells them apart. Unknown idSport = skip.
  const g = GENDER_BY_ID_SPORT[Number(raw.idSport)];
  if (!g || g.sport !== sport) return null;
  const srcCompetition = String(raw.nameCompetition ?? '').trim();
  const comp = competitionOf(sport, srcCompetition, g.gender);
  if (!comp) return null;
  const home = displayName(String(raw.homeParticipant ?? ''));
  const away = displayName(String(raw.visitingParticipant ?? ''));
  if (!home || !away || OUTRIGHT.test(home) || OUTRIGHT.test(String(raw.name ?? ''))) return null;
  const startMs = Number(raw.dateStart);
  if (!Number.isFinite(startMs) || startMs <= 0) return null;
  const market = classifyMarket(raw.mainEvent);
  if (!market) return null;
  const outcomes = outcomesOf(raw.mainEvent);
  if (!outcomes.length) return null;
  return {
    book,
    srcId: String(raw.id),
    sport,
    competition: comp.slug,
    srcCompetition,
    srcSportId: String(raw.idSport),
    srcCompId: raw.idCompetition != null ? String(raw.idCompetition) : '',
    home,
    away,
    startAt: Math.floor(startMs / 1000),
    path: String(raw.matchUrl ?? '').startsWith('/') ? String(raw.matchUrl) : '',
    market,
    marketName: String(raw.mainEvent.name),
    outcomes,
  };
}
