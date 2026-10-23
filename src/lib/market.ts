/**
 * Plain-language rules of the one market we compare: result after regular time (1X2).
 * Football: 90 minutes + stoppage time; hockey: 60 minutes. Extra time, penalties and shoot-outs never count.
 * Pure, unit-tested; every sentence on the site about "what has to happen" comes from here.
 */
import type { Sport } from '../config/competitions';
import type { Outcome } from '../server/types';
import { kc } from './format';

export const period = (sport: Sport) => (sport === 'hokej' ? '60 minutách' : '90 minutách a nastavení');
const extra = (sport: Sport) => (sport === 'hokej' ? 'prodloužení ani nájezdy' : 'prodloužení ani penalty');

/** Short label of an outcome: team name, or the draw with its period ("Remíza po 60 minutách" in hockey). */
export function outcomeLabel(sport: Sport, o: Outcome, home: string, away: string): string {
  if (o === '1') return home;
  if (o === '2') return away;
  return sport === 'hokej' ? 'Remíza po 60 minutách' : 'Remíza';
}

/** The bet as the object of "kurz na …": "výhru týmu X" (works for singular and plural club names), or the draw. */
export function betTarget(sport: Sport, o: Outcome, home: string, away: string): string {
  if (o === 'x') return sport === 'hokej' ? 'remízu po 60 minutách' : 'remízu';
  return `výhru týmu ${o === '1' ? home : away}`;
}

/** The outcome as a whole sentence. */
export function outcomeSentence(sport: Sport, o: Outcome, home: string, away: string): string {
  if (o === 'x') return sport === 'hokej' ? 'Remíza po 60 minutách: po třech třetinách bude stav nerozhodný.' : `Remíza: po ${period(sport)} bude stav nerozhodný.`;
  return `Tým ${o === '1' ? home : away} vyhraje po ${period(sport)}.`;
}

/** When the bet is settled. */
export const settlement = (sport: Sport) => `Platí stav po ${period(sport)}. ${extra(sport).charAt(0).toUpperCase()}${extra(sport).slice(1)} se nepočítají.`;

/** "Co musí nastat, aby sázka vyhrála?" — the condition and the case people most often get wrong. */
export function winCondition(sport: Sport, o: Outcome, home: string, away: string): string[] {
  if (o === 'x') {
    return [
      `Po ${period(sport)} musí být stav nerozhodný, například ${sport === 'hokej' ? '2:2' : '1:1'}.`,
      `Co se stane potom (${sport === 'hokej' ? 'prodloužení nebo nájezdy' : 'případné prodloužení nebo penalty'}), už nehraje roli: sázka na remízu vyhrává.`,
    ];
  }
  const team = o === '1' ? home : away;
  return [
    `Tým ${team} musí po ${period(sport)} vést.`,
    `Když je po ${period(sport)} nerozhodně a tým ${team} vyhraje až ${sport === 'hokej' ? 'v prodloužení nebo na nájezdy' : 'v prodloužení nebo na penalty'}, tahle sázka prohrává.`,
  ];
}

/** Conditional payout: always "Pokud sázka vyhraje", always payout incl. stake vs net profit. */
export function payoutSentence(stake: number, oddsMilli: number): string {
  const pay = (stake * oddsMilli) / 1000;
  return `Pokud sázka vyhraje, ze ${kc(stake)} dostaneš ${kc(pay)} včetně vkladu. Čistý zisk je ${kc(pay - stake)}.`;
}
