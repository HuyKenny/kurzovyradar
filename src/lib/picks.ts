/**
 * "Dnes stojí za pozornost": a small, explained selection from recorded data. Pure and unit-tested.
 *
 * Every pick has one stated reason, and only these four exist:
 *  - one-moved        one bookmaker changed the price, the other was checked afterwards and still has the old one
 *  - higher-elsewhere the two bookmakers quote different prices for the same bet right now (≥ MIN_DIFF_PCT)
 *  - big-move         a recorded change of at least BIG_MOVE_PCT within the longest window we can measure
 *  - new-high         the price rose and is now the highest we recorded in the window (the base is a record made
 *                     before the window, so a first recording is never a "new high")
 * Order: reason type in that order, then size of the difference/change, then earlier kick-off. Affiliate status
 * plays no part. Nothing here predicts results: no win probabilities, no "value" scores. A separately validated
 * prediction model could later add its own reason type ('model'); none exists today.
 */
import { BOOK, FEED_BOOKS, type FeedBook } from '../config/bookmakers';
import { atBooks, outcomesFor } from './ticket';
import { isCurrent } from '../server/store/derive';
import type { Outcome, Settings } from '../server/types';
import { WINDOWS, type EventView, type RadarSnapshot, type UpcomingSnapshot, type WindowKey } from '../server/view';
import type { FindingKey } from './bet-state';
import { atTime, dayKey, odds as fmt, pct } from './format';
import { betTarget } from './market';

export const MIN_DIFF_PCT = 1;
export const BIG_MOVE_PCT = 8;
/** A new high needs at least this rise over the base, so tiny wobbles do not fill the list. */
export const MIN_HIGH_PCT = 2;
export const MAX_PICKS = 6;

export type ReasonType = 'one-moved' | 'higher-elsewhere' | 'big-move' | 'new-high';
/** What the card says in one phrase. Direction matters: a fall and a rise are different findings, not one "interesting move". */
export const FINDING_LABEL: Record<FindingKey, string> = { rozdil: 'Vyšší kurz u druhé kanceláře', rust: 'Kurz vzrostl', pokles: 'Kurz klesl', max: 'Nejvyšší zachycený kurz' };
const PRIORITY: ReasonType[] = ['one-moved', 'higher-elsewhere', 'big-move', 'new-high'];

export interface Reason {
  type: ReasonType;
  /** Kind of finding for links into the detail (?zjisteni=) and the period it was measured in (?obdobi=), when it has one. */
  finding: FindingKey;
  window?: WindowKey;
  label: string;
  /** A factual sentence with the real numbers and record times. */
  text: string;
  /** Size used for ordering inside a type (percent). */
  size: number;
}
export interface Pick { ev: EventView; outcome: Outcome; reason: Reason; all: Reason[] }

const key = (id: number, o: Outcome) => `${id}|${o}`;

/** All reasons for every (event, outcome) that is still current. */
export function reasons(up: UpcomingSnapshot, radar: RadarSnapshot | null, now: number, cfg: Settings): Map<string, Reason[]> {
  const out = new Map<string, Reason[]>();
  const add = (id: number, o: Outcome, r: Reason) => (out.get(key(id, o)) ?? out.set(key(id, o), []).get(key(id, o))!).push(r);
  const byId = new Map(up.events.map((e) => [e.id, e]));

  for (const ev of up.events) {
    if (ev.startAt <= now) continue;
    for (const o of outcomesFor(ev)) {
      const target = betTarget(ev.sport, o, ev.home, ev.away);
      const cur = FEED_BOOKS.filter((b) => isCurrent(ev, b, o, up.books, now, cfg)).map((b) => ({ b, x: ev.books[b]!.outcomes[o]! }));
      if (cur.length < 2) continue;
      // one-moved: A changed (prev → now); B still has A's previous price and was checked after A's change.
      let moved = false;
      for (const a of cur) for (const b of cur) {
        if (a === b || !a.x.prev) continue;
        const checkedB = up.books[b.b]?.lastSuccessAt ?? 0;
        if (b.x.odds === a.x.prev.odds && b.x.changedAt < a.x.changedAt && checkedB > a.x.changedAt && a.x.odds !== b.x.odds) {
          moved = true;
          add(ev.id, o, {
            type: 'one-moved', finding: 'rozdil', label: FINDING_LABEL.rozdil, size: Math.abs(a.x.odds / a.x.prev.odds - 1) * 100,
            text: `${BOOK[a.b].name} ${atTime(a.x.changedAt, now)} změnil kurz na ${target} z ${fmt(a.x.prev.odds)} na ${fmt(a.x.odds)}. ${BOOK[b.b].name} měl při kontrole ${atTime(checkedB, now)} pořád ${fmt(b.x.odds)}.`,
          });
        }
      }
      // higher-elsewhere: different current prices for the same bet.
      const hi = cur.reduce((p, c) => (c.x.odds > p.x.odds ? c : p));
      const lo = cur.reduce((p, c) => (c.x.odds < p.x.odds ? c : p));
      const diff = (hi.x.odds / lo.x.odds - 1) * 100;
      if (!moved && diff >= MIN_DIFF_PCT) {
        const checked = Math.min(...cur.map((c) => up.books[c.b]?.lastSuccessAt ?? 0));
        add(ev.id, o, {
          type: 'higher-elsewhere', finding: 'rozdil', label: FINDING_LABEL.rozdil, size: diff,
          text: `Na ${target} nabízí ${BOOK[hi.b].name} ${fmt(hi.x.odds)}, ${BOOK[lo.b].name} ${fmt(lo.x.odds)} (ověřeno ${atTime(checked, now)}). Na stejnou sázku je kurz u ${BOOK[hi.b].locative.replace(/^u /, '')} o ${pct(diff, false)} vyšší.`,
        });
      }
    }
  }

  if (radar) {
    // Longest window we can measure first; one reason of each kind per (event, outcome).
    for (const w of [...WINDOWS].reverse()) {
      const win = radar.windows[w.key];
      if (!win?.available) continue;
      for (const m of [...win.drops, ...win.rises, ...win.highs]) {
        const ev = byId.get(m.eventId);
        if (!ev || ev.startAt <= now || !isCurrent(ev, m.book, m.outcome, up.books, now, cfg)) continue;
        if (ev.books[m.book]!.outcomes[m.outcome]!.odds !== m.to.odds) continue; // snapshot moved on since
        const type: ReasonType = m.reason === 'high' ? 'new-high' : 'big-move';
        if (type === 'big-move' && Math.abs(m.pct) < BIG_MOVE_PCT) continue;
        if (type === 'new-high' && m.pct < MIN_HIGH_PCT) continue;
        const list = out.get(key(m.eventId, m.outcome)) ?? [];
        if (list.some((r) => r.type === type)) continue;
        const target = betTarget(ev.sport, m.outcome, ev.home, ev.away);
        // The same recorded change at both bookmakers is one finding: name every book that has it.
        const same = (type === 'new-high' ? win.highs : [...win.drops, ...win.rises]).filter((x) => x.eventId === m.eventId && x.outcome === m.outcome
          && x.from.odds === m.from.odds && x.to.odds === m.to.odds && isCurrent(ev, x.book, x.outcome, up.books, now, cfg));
        const where = atBooks(FEED_BOOKS.filter((b) => same.some((x) => x.book === b)));
        const finding: FindingKey = type === 'new-high' ? 'max' : m.to.odds < m.from.odds ? 'pokles' : 'rust';
        add(m.eventId, m.outcome, type === 'new-high'
          ? { type, finding, window: w.key, label: FINDING_LABEL[finding], size: Math.abs(m.pct),
              text: `Kurz na ${target} ${where} je ${fmt(m.to.odds)}, nejvýš ${w.since}. Před tím obdobím jsme zapsali ${fmt(m.from.odds)}.` }
          : { type, finding, window: w.key, label: FINDING_LABEL[finding], size: Math.abs(m.pct),
              text: `Kurz na ${target} ${where} ${m.to.odds < m.from.odds ? 'klesl' : 'stoupl'} ${w.since} z ${fmt(m.from.odds)} na ${fmt(m.to.odds)} (${pct(m.pct)}), zapsáno ${atTime(m.to.at, now)}.` });
      }
    }
  }
  for (const list of out.values()) list.sort(order);
  return out;
}

function order(a: Reason, b: Reason): number {
  return PRIORITY.indexOf(a.type) - PRIORITY.indexOf(b.type) || b.size - a.size;
}

/** Up to MAX_PICKS picks, one per match, kick-off today or tomorrow (Prague). */
export interface PickOptions {
  /** Narrow to a page's context (a sport, a competition). */
  filter?: (ev: EventView) => boolean;
  /** Only today's matches (the "Zápasy dnes" page); default is today and tomorrow. */
  todayOnly?: boolean;
}

export function picks(up: UpcomingSnapshot, radar: RadarSnapshot | null, now: number, cfg: Settings, limit = MAX_PICKS, opts: PickOptions = {}): Pick[] {
  const all = reasons(up, radar, now, cfg);
  const days = new Set(opts.todayOnly ? [dayKey(now)] : [dayKey(now), dayKey(now + 86400)]);
  const best = new Map<number, Pick>();
  for (const ev of up.events) {
    if (ev.startAt <= now || !days.has(dayKey(ev.startAt)) || (opts.filter && !opts.filter(ev))) continue;
    for (const o of outcomesFor(ev)) {
      const list = all.get(key(ev.id, o));
      if (!list?.length) continue;
      const cand: Pick = { ev, outcome: o, reason: list[0]!, all: list };
      const prev = best.get(ev.id);
      if (!prev || order(cand.reason, prev.reason) < 0) best.set(ev.id, cand);
    }
  }
  return [...best.values()].sort((a, b) => order(a.reason, b.reason) || a.ev.startAt - b.ev.startAt).slice(0, limit);
}

/** Books with a current price for one outcome, highest first (for the bet card and the detail). */
export function pricesFor(ev: EventView, o: Outcome, up: UpcomingSnapshot, now: number, cfg: Settings): { book: FeedBook; odds: number; checkedAt: number }[] {
  return FEED_BOOKS.filter((b) => isCurrent(ev, b, o, up.books, now, cfg))
    .map((b) => ({ book: b, odds: ev.books[b]!.outcomes[o]!.odds, checkedAt: up.books[b]?.lastSuccessAt ?? 0 }))
    .sort((a, b) => b.odds - a.odds);
}
