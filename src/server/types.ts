import type { FeedBook } from '../config/bookmakers';
import type { Sport } from '../config/competitions';

export type Outcome = '1' | 'x' | '2';
/** '1x2' = match result in regular time (football 90 min + stoppage, hockey 60 min). */
export type Market = '1x2';

/** One provider match after normalization: everything the pairing and the store need, nothing else. */
export interface SourceMatch {
  book: FeedBook;
  srcId: string;
  sport: Sport;
  competition: string; // our competition slug
  srcCompetition: string; // provider's name, kept for audits
  home: string;
  away: string;
  startAt: number; // unix s, UTC
  path: string; // provider deeplink path
  market: Market;
  marketName: string;
  outcomes: { outcome: Outcome; odds: number; enabled: boolean }[]; // odds in thousandths
}

/** What a provider adapter returns for one import run. */
export interface ProviderResult {
  book: FeedBook;
  fetchedAt: number; // unix s, when the response arrived (orders runs: an older response never overwrites a newer one)
  matches: SourceMatch[];
  /** Raw matches in the response before our scope filter (for the run log). */
  rawCount: number;
}

export interface Settings {
  importIntervalMin: number;
  cacheTtlS: number;
  staleAfterMin: number;
  historyDays: number;
  startToleranceMin: number;
  windowDays: number;
}

export interface Env {
  DB: D1Database;
  TIPSPORT_CLIENT_ID: string;
  TIPSPORT_CLIENT_SECRET: string;
  CHANCE_API_USER: string;
  CHANCE_API_PASS: string;
  TIPSPORT_URL: string;
  CHANCE_URL: string;
  ALLWYN_URL: string;
  ENVIRONMENT: string;
  DEMO?: string;
  IMPORT_INTERVAL_MIN?: string;
  CACHE_TTL_S?: string;
  STALE_AFTER_MIN?: string;
  HISTORY_DAYS?: string;
  START_TOLERANCE_MIN?: string;
  WINDOW_DAYS?: string;
  CLICKS?: AnalyticsEngineDataset;
}

export function settings(env: Partial<Env>): Settings {
  const n = (v: string | undefined, d: number) => (v && Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : d);
  return {
    importIntervalMin: n(env.IMPORT_INTERVAL_MIN, 15),
    cacheTtlS: n(env.CACHE_TTL_S, 300),
    staleAfterMin: n(env.STALE_AFTER_MIN, 45),
    historyDays: n(env.HISTORY_DAYS, 30),
    startToleranceMin: n(env.START_TOLERANCE_MIN, 0),
    windowDays: n(env.WINDOW_DAYS, 7),
  };
}
