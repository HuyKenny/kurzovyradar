/**
 * One radar finding in a single shape (a movement of one offer in time, or a difference between two current offers) and the
 * sentences that explain it: what we found, what it is compared with, what it means for the payout. Pure.
 * Nothing here predicts anything: a price moving is a recorded fact, not a probability and not a sign of value.
 */
import { BOOK, type FeedBook } from '../config/bookmakers';
import type { Sport } from '../config/competitions';
import type { Market, Outcome } from '../server/types';
import type { DiffItem, MoveItem, WindowKey } from '../server/view';
import { WINDOWS } from '../server/view';
import type { FindingKey } from './bet-state';
import { atTime, dateTime, odds as fmt, pct } from './format';
import { betTarget, selectionName } from './market';
import { payoutDelta } from './bet-state';
import { atBooks } from './ticket';

export interface Finding {
  kind: FindingKey;
  eventId: number;
  url: string;
  home: string;
  away: string;
  comp: string;
  compName: string;
  sport: Sport;
  startAt: number;
  outcome: Outcome;
  books: FeedBook[];
  /** Movements: the price at the start of the period and the latest recorded one. */
  from?: { odds: number; at: number };
  to?: { odds: number; at: number };
  /** Differences: the two current prices. */
  high?: { book: FeedBook; odds: number };
  low?: { book: FeedBook; odds: number };
  pct: number;
  points?: [number, number][];
  window?: WindowKey;
  market?: Market;
}

export const KIND_LABEL: Record<FindingKey, string> = { rozdil: 'Vyšší kurz u druhé kanceláře', rust: 'Kurz vzrostl', pokles: 'Kurz klesl', max: 'Nejvyšší zachycený kurz' };

export function fromMove(m: MoveItem & { books?: FeedBook[] }, window: WindowKey): Finding {
  return {
    kind: m.reason === 'high' ? 'max' : m.reason === 'drop' ? 'pokles' : 'rust',
    eventId: m.eventId, url: m.url, home: m.home, away: m.away, comp: m.comp, compName: m.compName, sport: m.sport, startAt: m.startAt, outcome: m.outcome,
    books: m.books ?? [m.book], from: m.from, to: m.to, pct: m.pct, points: m.points, window, market: m.market,
  };
}

export function fromDiff(d: DiffItem & { comp?: string }): Finding {
  return {
    kind: 'rozdil', eventId: d.eventId, url: d.url, home: d.home, away: d.away, comp: d.comp ?? '', compName: d.compName, sport: d.sport, startAt: d.startAt, outcome: d.outcome,
    books: [d.high.book, d.low.book], high: d.high, low: d.low, pct: d.pct, market: d.market,
  };
}

/** The price a visitor would get today at the best current offer (used for the follow button and the "kurz teď" line). */
export const currentOdds = (f: Finding): number => (f.kind === 'rozdil' ? f.high!.odds : f.to!.odds);

export interface FindingText { what: string; against: string; impact: string }

/** `checkedAt` = the oldest "last verified" time of the books the finding rests on. */
export function findingText(f: Finding, now: number, checkedAt: number | null, stake = 100): FindingText {
  const target = betTarget(f.sport, f.outcome, f.home, f.away);
  const ver = checkedAt ? ` Naposledy ověřeno ${atTime(checkedAt, now)}.` : '';
  if (f.kind === 'rozdil') {
    const high = f.high!, low = f.low!;
    const d = payoutDelta(stake, low.odds, high.odds);
    return {
      what: `Na ${target} nabízí ${BOOK[high.book].name} ${fmt(high.odds)}, ${BOOK[low.book].name} ${fmt(low.odds)}. Stejná sázka, jiná cena.`,
      against: `Porovnáváme dvě současné ceny téže sázky u ${BOOK[high.book].name} a ${BOOK[low.book].name}.${ver}`,
      impact: `Při vkladu ${stake} Kč je výplata při výhře ${BOOK[high.book].locative} o ${d} Kč vyšší než ${BOOK[low.book].locative}. Vyšší kurz nezvyšuje šanci, že sázka vyhraje.`,
    };
  }
  const { from, to } = f as Required<Pick<Finding, 'from' | 'to'>>;
  const since = WINDOWS.find((w) => w.key === f.window)?.since ?? 'za sledované období';
  const where = atBooks(f.books);
  const d = payoutDelta(stake, from.odds, to.odds);
  const what = f.kind === 'max'
    ? `Kurz na ${target} ${where} je ${fmt(to.odds)}, nejvýš ${since}, co jsme zapsali. Na začátku období byl ${fmt(from.odds)} (${pct(f.pct)}).`
    : `Kurz na ${target} ${where} ${f.kind === 'pokles' ? 'klesl' : 'stoupl'} ${since} z ${fmt(from.odds)} na ${fmt(to.odds)} (${pct(f.pct)}).`;
  return {
    what,
    against: `Porovnáváme platnou cenu z ${dateTime(from.at)} (začátek období ${since}) s poslední změnou z ${dateTime(to.at)}.${ver}`,
    impact: `Při vkladu ${stake} Kč je výplata při výhře ${Math.round((stake * to.odds) / 1000)} Kč místo ${Math.round((stake * from.odds) / 1000)} Kč, tedy o ${Math.abs(d)} Kč ${d < 0 ? 'nižší' : 'vyšší'}.${f.kind === 'pokles' ? '' : ' Vyšší výplata neznamená výhodnější sázku.'} ${impliedLine(from.odds, to.odds)}`,
  };
}

/** The implied probability in percentage points (not percent): 2,00 → 2,20 is 50,0 % → 45,5 %, −4,5 p. b., while the price moved +10 %. */
export function impliedLine(fromOdds: number, toOdds: number): string {
  const a = 100000 / fromOdds, b = 100000 / toOdds;
  const f1 = (n: number) => n.toFixed(1).replace('.', ',');
  const dpp = b - a;
  return `Kurz tak odpovídá ${f1(b)} % místo ${f1(a)} % (${dpp < 0 ? '−' : '+'}${f1(Math.abs(dpp))} procentního bodu). To je jen přepočet ceny včetně marže kanceláře, ne skutečná šance výsledku.`;
}

/** Name of the selection for headings: "Výhra domácích v základní době". */
export const selection = (f: Finding) => selectionName(f.sport, f.outcome, f.home, f.away, f.market);
