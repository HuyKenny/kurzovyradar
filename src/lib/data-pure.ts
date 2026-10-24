/** Comparison logic without platform bindings (unit-tested; lib/data.ts re-exports it for pages). */
import type { FeedBook } from '../config/bookmakers';
import { FEED_BOOKS } from '../config/bookmakers';
import { isCurrent, isFresh, inSync } from '../server/store/derive';
import { bestOf } from '../server/calc/odds';
import type { Outcome, Settings } from '../server/types';
import type { EventView, UpcomingSnapshot } from '../server/view';
import { outcomesFor } from './ticket';

export interface Cell {
  book: FeedBook;
  odds: number | null; // thousandths; null = no offer from this book
  current: boolean;
  state: 'current' | 'stale' | 'suspended' | 'removed' | 'mismatch' | 'missing' | 'started';
  best: boolean;
  tie: boolean;
}
export interface Row { outcome: Outcome; cells: Cell[]; best: ReturnType<typeof bestOf> }

/** Comparison rows of one event, evaluated at render time (freshness depends on "now"). */
export function compare(ev: EventView, books: UpcomingSnapshot['books'], t: number, c: Settings): Row[] {
  return outcomesFor(ev).map((outcome) => {
    const cells: Cell[] = FEED_BOOKS.map((book) => {
      const b = ev.books[book];
      const o = b?.outcomes[outcome];
      const current = isCurrent(ev, book, outcome, books, t, c);
      const state: Cell['state'] = !b || !o ? 'missing' : b.mismatch ? 'mismatch' : ev.startAt <= t ? 'started' : b.removed || o.removedAt !== null ? 'removed'
        : !o.enabled ? 'suspended' : !isFresh(books[book], t, c) || !inSync(books, book, t, c) ? 'stale' : 'current';
      return { book, odds: o ? o.odds : null, current, state, best: false, tie: false };
    });
    const best = bestOf(cells.map((x) => ({ book: x.book, odds: (x.odds ?? 0) / 1000, enabled: true, fresh: x.current })));
    if (best.kind === 'best') for (const x of cells) if (best.books.includes(x.book)) { x.best = !best.tie; x.tie = best.tie; }
    return { outcome, cells, best };
  });
}

/** Events with at least one current offer, not started, soonest first. */
export function listable(up: UpcomingSnapshot, t: number, c: Settings): EventView[] {
  return up.events.filter((e) => e.startAt > t && FEED_BOOKS.some((b) => outcomesFor(e).some((o) => isCurrent(e, b, o, up.books, t, c))));
}

