/** Shapes of the precomputed snapshots (table `derived`) that pages read. Shared by server and pages. */
import type { FeedBook } from '../config/bookmakers';
import type { Sport } from '../config/competitions';
import type { Market, Outcome } from './types';

export interface OfferView {
  odds: number; // thousandths
  enabled: boolean;
  removedAt: number | null;
  changedAt: number;
  firstOdds: number;
  firstAt: number;
  minOdds: number;
  maxOdds: number;
  /** Previous recorded price, only when the price changed in the last 24 h (for the ticket's hand note). */
  prev?: { odds: number; at: number };
}

export interface BookOffers {
  mismatch: boolean; // fails the pairing checks against the event: shown apart, never compared
  removed: boolean; // match no longer in this book's feed
  outcomes: Partial<Record<Outcome, OfferView>>;
}

export interface EventView {
  id: number;
  url: string;
  sport: Sport;
  comp: string;
  compName: string;
  home: string;
  away: string;
  startAt: number;
  market: Market;
  books: Partial<Record<FeedBook, BookOffers>>;
}

export interface BookStateView {
  lastSuccessAt: number | null;
  lastAttemptAt: number | null;
  failing: boolean;
  trackingSince: number | null;
}

export interface UpcomingSnapshot {
  at: number;
  books: Partial<Record<FeedBook, BookStateView>>;
  events: EventView[];
  stats: { events: number; offers: number; changes24h: number; firstRecordAt: number | null };
}

export type WindowKey = '1h' | '6h' | '24h';
/** label = chip text ("za hodinu"), since = "za poslední hodinu" phrase in sentences. */
export const WINDOWS: { key: WindowKey; label: string; since: string; seconds: number }[] = [
  { key: '1h', label: 'hodinu', since: 'za poslední hodinu', seconds: 3600 },
  { key: '6h', label: '6 hodin', since: 'za posledních 6 hodin', seconds: 6 * 3600 },
  { key: '24h', label: '24 hodin', since: 'za posledních 24 hodin', seconds: 86400 },
];

export interface MoveItem {
  eventId: number;
  url: string;
  home: string;
  away: string;
  comp: string;
  compName: string;
  sport: Sport;
  startAt: number;
  outcome: Outcome;
  book: FeedBook;
  from: { odds: number; at: number };
  to: { odds: number; at: number };
  pct: number;
  /** [unix s, odds] — every recorded value inside the window plus the base before it. */
  points: [number, number][];
  /** Machine reason; the page turns it into a sentence. */
  reason: 'drop' | 'rise' | 'high';
  /** Market of the event; absent in snapshots written before two-way markets existed (= '1x2'). */
  market?: Market;
}

export interface DiffItem {
  eventId: number;
  url: string;
  home: string;
  away: string;
  comp?: string;
  compName: string;
  sport: Sport;
  startAt: number;
  outcome: Outcome;
  high: { book: FeedBook; odds: number };
  low: { book: FeedBook; odds: number };
  pct: number;
  market?: Market;
}

export interface RadarSnapshot {
  at: number;
  windows: Record<WindowKey, { available: boolean; drops: MoveItem[]; rises: MoveItem[]; highs: MoveItem[] }>;
  diffs: DiffItem[];
}
