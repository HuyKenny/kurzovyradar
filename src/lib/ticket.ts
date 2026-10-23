/**
 * What one match ticket shows, in plain terms: who the three outcomes are, the best current price, whether both
 * bookmakers offer the same, the favourite (for the "100 Kč → …" example) and the latest recorded move.
 * Pure (no Workers imports) so it is unit-tested.
 */
import { BOOK, FEED_BOOKS, type FeedBook } from '../config/bookmakers';
import { isCurrent, isFresh } from '../server/store/derive';
import type { Outcome, Settings } from '../server/types';
import type { EventView, UpcomingSnapshot } from '../server/view';

export const OUTCOMES: Outcome[] = ['1', 'x', '2'];

export type CellState = 'current' | 'stale' | 'suspended' | 'removed' | 'mismatch' | 'missing' | 'started';
export interface BookCell { book: FeedBook; odds: number | null; state: CellState; current: boolean }
export interface OutcomeView {
  outcome: Outcome;
  who: string; // "Liverpool", "Remíza", "Brighton"
  best: { odds: number; books: FeedBook[] } | null; // highest current price; null = none current
  /** Every current book has this exact price. */
  same: boolean;
  cells: BookCell[];
}
export interface TicketView {
  outcomes: OutcomeView[];
  /** Books with at least one current price. */
  books: FeedBook[];
  /** All current books quote identical prices for every outcome (show one row, say "same at both"). */
  allSame: boolean;
  /** Lowest best price = the bookmakers' favourite (used only for the payout example). */
  favourite: OutcomeView | null;
  /** Largest recorded change in the last 24 h among current prices. */
  move: { outcome: Outcome; who: string; from: number; to: number; at: number } | null;
  checkedAt: number | null;
}

export const whoOf = (ev: Pick<EventView, 'home' | 'away'>, o: Outcome) => (o === '1' ? ev.home : o === '2' ? ev.away : 'Remíza');

export function cellState(ev: EventView, book: FeedBook, o: Outcome, books: UpcomingSnapshot['books'], now: number, cfg: Settings): CellState {
  const b = ev.books[book];
  const x = b?.outcomes[o];
  if (!b || !x) return 'missing';
  if (b.mismatch) return 'mismatch';
  if (ev.startAt <= now) return 'started';
  if (b.removed || x.removedAt !== null) return 'removed';
  if (!x.enabled) return 'suspended';
  if (!isFresh(books[book], now, cfg)) return 'stale';
  return 'current';
}

export function ticketView(ev: EventView, books: UpcomingSnapshot['books'], now: number, cfg: Settings): TicketView {
  const outcomes: OutcomeView[] = OUTCOMES.map((o) => {
    const cells: BookCell[] = FEED_BOOKS.map((book) => {
      const state = cellState(ev, book, o, books, now, cfg);
      return { book, odds: ev.books[book]?.outcomes[o]?.odds ?? null, state, current: isCurrent(ev, book, o, books, now, cfg) };
    });
    const live = cells.filter((c) => c.current && c.odds);
    const max = live.length ? Math.max(...live.map((c) => c.odds!)) : 0;
    return {
      outcome: o,
      who: whoOf(ev, o),
      best: live.length ? { odds: max, books: live.filter((c) => c.odds === max).map((c) => c.book) } : null,
      same: live.length > 0 && live.every((c) => c.odds === max),
      cells,
    };
  });
  const bookSet = new Set(outcomes.flatMap((x) => x.cells.filter((c) => c.current).map((c) => c.book)));
  const current = FEED_BOOKS.filter((b) => bookSet.has(b));
  const withBest = outcomes.filter((x) => x.best);
  const favourite = withBest.length ? withBest.reduce((a, b) => (b.best!.odds < a.best!.odds ? b : a)) : null;
  let move: TicketView['move'] = null;
  for (const x of outcomes) for (const c of x.cells) {
    if (!c.current) continue;
    const p = ev.books[c.book]?.outcomes[x.outcome]?.prev;
    const cur = ev.books[c.book]?.outcomes[x.outcome];
    if (!p || !cur) continue;
    const size = Math.abs(cur.odds / p.odds - 1);
    if (!move || size > Math.abs(move.to / move.from - 1)) move = { outcome: x.outcome, who: x.who, from: p.odds, to: cur.odds, at: cur.changedAt };
  }
  const checked = current.map((b) => books[b]?.lastSuccessAt ?? 0).filter(Boolean);
  return {
    outcomes,
    books: current,
    allSame: current.length > 1 && withBest.length === OUTCOMES.length && outcomes.every((x) => x.same && x.best!.books.length === current.length),
    favourite,
    move,
    checkedAt: checked.length ? Math.min(...checked) : null,
  };
}

/** "u Tipsportu i Chance", "u Tipsportu" */
export const atBooks = (books: FeedBook[]) =>
  books.length === 0 ? '' : `u ${books.map((b) => BOOK[b].locative.replace(/^u /, '')).join(' i ')}`;

/** Plain-language state of a price that is not current. */
export const STATE_TEXT: Record<CellState, string> = {
  current: '',
  stale: 'starší údaj',
  suspended: 'teď pozastaveno',
  removed: 'není v nabídce',
  mismatch: 'nesedí údaje, nesrovnáváme',
  missing: 'nenabízí',
  started: 'zápas začal',
};
