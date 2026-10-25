/**
 * Plain-language rules of the markets we compare: three-way "Výsledek zápasu" ('1x2', result in regular time, a draw is possible)
 * and two-way "Vítěz zápasu" ('12', no draw). Football: 90 minutes + stoppage time; hockey: 60 minutes; for the other sports the
 * "regular time" is whatever the bookmaker's own rules say, and we say so instead of inventing details.
 * Pure, unit-tested; every sentence on the site about "what has to happen" comes from here.
 */
import type { Sport } from '../config/competitions';
import type { Market, Outcome } from '../server/types';
import { kc } from './format';

/** Who plays: a side is a team, a player (tennis, darts, …) or a fighter. Used for grammar only. */
const SIDE: Partial<Record<Sport, { of: string; cap: string }>> = {
  tenis: { of: 'hráče', cap: 'Hráč' }, 'stolni-tenis': { of: 'hráče', cap: 'Hráč' }, badminton: { of: 'hráče', cap: 'Hráč' },
  snooker: { of: 'hráče', cap: 'Hráč' }, squash: { of: 'hráče', cap: 'Hráč' }, sipky: { of: 'hráče', cap: 'Hráč' },
  box: { of: 'boxera', cap: 'Boxer' }, 'bojove-sporty': { of: 'zápasníka', cap: 'Zápasník' },
};
const side = (sport: Sport) => SIDE[sport] ?? { of: 'týmu', cap: 'Tým' };
/** Fights have no "regular time" worth naming. */
const FIGHT = new Set<Sport>(['box', 'bojove-sporty']);

export const period = (sport: Sport) => (sport === 'hokej' ? '60 minutách' : sport === 'fotbal' ? '90 minutách a nastavení' : 'základní hrací době');
const extra = (sport: Sport) => (sport === 'hokej' ? 'prodloužení ani nájezdy' : sport === 'fotbal' ? 'prodloužení ani penalty' : 'prodloužení');

/** Short label of an outcome: participant name, or the draw with its period ("Remíza po 60 minutách" in hockey). */
export function outcomeLabel(sport: Sport, o: Outcome, home: string, away: string): string {
  if (o === '1') return home;
  if (o === '2') return away;
  return sport === 'hokej' ? 'Remíza po 60 minutách' : 'Remíza';
}

/** The bet named as a description of the selection, not a prediction: "Výhra domácích v základní době", "Vítěz zápasu: Novak Djokovic". */
export function selectionName(sport: Sport, o: Outcome, home?: string, away?: string, market: Market = '1x2'): string {
  const name = o === '1' ? home : o === '2' ? away : undefined;
  if (market === '12') return name ? `Vítěz zápasu: ${name}` : `Vítěz zápasu: ${o === '1' ? 'první' : 'druhý'} jmenovaný`;
  if (o === 'x') return sport === 'hokej' ? 'Remíza po 60 minutách' : FIGHT.has(sport) ? 'Remíza' : 'Remíza v základní době';
  if (FIGHT.has(sport) && name) return `Výhra: ${name}`;
  return `${o === '1' ? 'Výhra domácích' : 'Výhra hostů'}${FIGHT.has(sport) ? '' : ' v základní době'}`;
}

/** The bet as the object of "kurz na …": "výhru týmu X" / "výhru hráče X", or the draw. */
export function betTarget(sport: Sport, o: Outcome, home: string, away: string): string {
  if (o === 'x') return sport === 'hokej' ? 'remízu po 60 minutách' : 'remízu';
  return `výhru ${side(sport).of} ${o === '1' ? home : away}`;
}

/** "Pokud …" clause for the payout example: "vyhraje tým X", "vyhraje hráč X", "zápas skončí remízou". */
export function ifPhrase(sport: Sport, o: Outcome, home: string, away: string): string {
  if (o === 'x') return `zápas skončí remízou${sport === 'hokej' ? ' po 60 min.' : ''}`;
  return `vyhraje ${side(sport).cap.toLowerCase()} ${o === '1' ? home : away}`;
}

/** The outcome as a whole sentence. */
export function outcomeSentence(sport: Sport, o: Outcome, home: string, away: string, market: Market = '1x2'): string {
  if (o === 'x') return sport === 'hokej' ? 'Remíza po 60 minutách: po třech třetinách bude stav nerozhodný.' : `Remíza: po ${period(sport)} bude stav nerozhodný.`;
  const who = `${side(sport).cap} ${o === '1' ? home : away}`;
  if (market === '12' || FIGHT.has(sport)) return `${who} vyhraje zápas.`;
  return `${who} vyhraje po ${period(sport)}.`;
}

/** When the bet is settled. */
export function settlement(sport: Sport, market: Market = '1x2'): string {
  if (market === '12') return 'Platí vítěz zápasu podle pravidel sázky u kanceláře. Remíza tu není. O skreči, odstoupení a nedohraném zápase rozhodují pravidla kanceláře.';
  if (FIGHT.has(sport)) return 'Platí výsledek zápasu podle pravidel sázky u kanceláře. Remíza je samostatný výsledek.';
  if (sport !== 'fotbal' && sport !== 'hokej') return `Platí stav po ${period(sport)} podle pravidel sázky u kanceláře. Remíza je samostatný výsledek, ${extra(sport)} se do něj zpravidla nepočítá.`;
  return `Platí stav po ${period(sport)}. ${extra(sport).charAt(0).toUpperCase()}${extra(sport).slice(1)} se nepočítají.`;
}

/** "Co musí nastat, aby sázka vyhrála?" — the condition and the case people most often get wrong. */
export function winCondition(sport: Sport, o: Outcome, home: string, away: string, market: Market = '1x2'): string[] {
  const name = o === '1' ? home : away;
  const s = side(sport);
  if (market === '12') {
    return [
      `${s.cap} ${name} musí zápas vyhrát.`,
      'Když se zápas nedohraje (skreč, odstoupení, kontumace), rozhodují pravidla kanceláře, jestli sázka platí, nebo se vklad vrací. Přečti si je před sázkou.',
    ];
  }
  if (o === 'x') {
    if (FIGHT.has(sport)) return ['Zápas musí skončit remízou.', 'Co přesně se jako remíza počítá, určují pravidla sázky u kanceláře.'];
    return [
      `Po ${period(sport)} musí být stav nerozhodný${sport === 'hokej' ? ', například 2:2' : sport === 'fotbal' ? ', například 1:1' : ''}.`,
      `Co se stane potom (${sport === 'hokej' ? 'prodloužení nebo nájezdy' : sport === 'fotbal' ? 'případné prodloužení nebo penalty' : 'případné prodloužení'}), už nehraje roli: sázka na remízu vyhrává.`,
    ];
  }
  if (FIGHT.has(sport)) return [`${s.cap} ${name} musí zápas vyhrát.`, 'Remíza je samostatný výsledek a tahle sázka na ní prohrává.'];
  return [
    `${s.cap} ${name} musí po ${period(sport)} vést.`,
    `Když je po ${period(sport)} nerozhodně a ${s.of === 'týmu' ? 'tým' : 'soupeř'} ${name} vyhraje až ${sport === 'hokej' ? 'v prodloužení nebo na nájezdy' : sport === 'fotbal' ? 'v prodloužení nebo na penalty' : 'v prodloužení'}, tahle sázka prohrává.`,
  ];
}

/** Conditional payout: always "Pokud sázka vyhraje", always payout incl. stake vs net profit. */
export function payoutSentence(stake: number, oddsMilli: number): string {
  const pay = (stake * oddsMilli) / 1000;
  return `Pokud sázka vyhraje, ze ${kc(stake)} dostaneš ${kc(pay)} včetně vkladu. Čistý zisk je ${kc(pay - stake)}.`;
}

/**
 * One sentence on what a listing's bets settle on, derived from the markets actually in it (never from the sport name alone): a two-way
 * market never mentions a draw. `sport` only adds the known regular-time rule for football and hockey three-way results.
 */
export function marketsRule(markets: Set<Market>, sport?: string): string {
  if (markets.has('1x2') && markets.has('12')) return 'U většiny zápasů sázíš na výsledek v základní hrací době (remíza je možná), u některých jen na vítěze zápasu.';
  if (markets.has('12')) return 'Sázíš na vítěze zápasu. Remíza tu není a o skreči či nedohraném zápase rozhodují pravidla kanceláře.';
  if (!markets.size) return '';
  if (sport === 'fotbal') return 'Počítá se výsledek po 90 minutách a nastavení, prodloužení ani penalty ne.';
  if (sport === 'hokej') return 'Počítá se výsledek po 60 minutách. Když je po třetí třetině remíza, vyhrává sázka na remízu, i když pak někdo vyhraje v prodloužení.';
  return 'Sázíš na výsledek v základní hrací době, remíza je možný výsledek. Přesná pravidla určuje kancelář.';
}
