import type { FeedBook } from '../../config/bookmakers';
import { GENDER_BY_ID_SPORT, SPORT_IDS, competitionOf } from '../../config/competitions';
import { dynamicCompetition } from './competition';
import type { RawMatch } from '../providers/platform';
import type { SourceMatch } from '../types';
import { classifyMarket, outcomesOf } from './markets';
import { displayName } from './participants';

/** Season-long markets that the platform files under a competition ("… 2026/2027 – celkově", "po 30. kole"). */
const OUTRIGHT = /celkov|dlouhodob|vítěz skupiny|vítěz soutěže|po \d+\.\s?kol|nejlepší střel|sestup|postup|speciál/i;

/**
 * Platform match → SourceMatch, or null when it is not a plain head-to-head prematch event with a result market we compare
 * (season-long and multi-runner offers are skipped). Nothing is guessed: a missing field means the match is skipped.
 */
export function toSource(book: FeedBook, raw: RawMatch): SourceMatch | null {
  const sport = SPORT_IDS[Number(raw?.idSuperSport)];
  if (!sport || !raw?.id || raw.ended) return null;
  if (String(raw.matchType ?? '').toUpperCase() !== 'PREMATCH') return null;
  const srcCompetition = String(raw.nameCompetition ?? '').trim();
  // Curated football and hockey leagues: men's and women's leagues share names, only the source idSport tells them apart.
  // Everything else (other leagues, other sports) becomes a competition named after the platform's own name.
  const g = GENDER_BY_ID_SPORT[Number(raw.idSport)];
  const curated = g && g.sport === sport ? competitionOf(sport, srcCompetition, g.gender) : null;
  const comp = curated ? { slug: curated.slug, name: curated.name } : dynamicCompetition(sport, srcCompetition, String(raw.nameSport ?? ''));
  if (!comp) return null;
  const home = displayName(String(raw.homeParticipant ?? ''));
  const away = displayName(String(raw.visitingParticipant ?? ''));
  if (!home || !away || home === away || OUTRIGHT.test(home) || OUTRIGHT.test(String(raw.name ?? ''))) return null;
  const startMs = Number(raw.dateStart);
  if (!Number.isFinite(startMs) || startMs <= 0) return null;
  const market = classifyMarket(raw.mainEvent);
  if (!market) return null;
  const outcomes = outcomesOf(raw.mainEvent, market);
  if (!outcomes.length) return null;
  return {
    book,
    srcId: String(raw.id),
    sport,
    competition: comp.slug,
    competitionName: comp.name,
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
