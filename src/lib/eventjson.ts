/** Compact JSON of one event for the browser-side "Sledované" page: highest current price per outcome + check time. */
import { BOOK } from '../config/bookmakers';
import { ticketView } from './ticket';
import type { Settings } from '../server/types';
import type { EventView, UpcomingSnapshot } from '../server/view';

export function eventJson(e: EventView, up: UpcomingSnapshot, t: number, c: Settings) {
  const v = ticketView(e, up.books, t, c);
  return {
    id: e.id, url: e.url, home: e.home, away: e.away, comp: e.comp, compName: e.compName, sport: e.sport, startAt: e.startAt, started: e.startAt <= t, market: e.market,
    checkedAt: v.checkedAt,
    outcomes: Object.fromEntries(v.outcomes.map((o) => [o.outcome, {
      who: o.who,
      odds: o.best?.odds ?? null,
      books: o.best?.books.map((b) => BOOK[b].name) ?? [],
      same: o.same,
    }])),
  };
}
