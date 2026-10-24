import type { Market, Outcome } from '../types';
import type { RawMatch } from '../providers/platform';

/**
 * Which market the platform's main event is. mySelectionId looks like "16-WINNER_3W-1" (sport-type-variant).
 *  - three-way named "Výsledek zápasu"                       → '1x2' (regular time, draw possible)
 *  - two-way named "Vítěz zápasu" / "Vítěz zápasu do rozhodnutí" → '12'  (no draw)
 * Multi-runner winners ("Vítěz" among many) and anything unknown return null and are not compared.
 */
export function classifyMarket(mainEvent: RawMatch | undefined): Market | null {
  if (!mainEvent) return null;
  const type = String(mainEvent.mySelectionId ?? '').split('-')[1] ?? '';
  const name = String(mainEvent.name ?? '').trim();
  if (type === 'WINNER_3W' && name === 'Výsledek zápasu') return '1x2';
  if (type === 'WINNER_2W' && (name === 'Vítěz zápasu' || name === 'Vítěz zápasu do rozhodnutí')) return '12';
  return null;
}

export const MARKET_LABEL: Record<Market, { short: string; long: string; note: string }> = {
  '12': {
    short: 'Vítěz zápasu',
    long: 'Vítěz zápasu (bez remízy)',
    note: 'Sázka platí na vítěze zápasu. Remíza tu není. O skreči, odstoupení a nedohraném zápase rozhodují pravidla kanceláře.',
  },
  '1x2': {
    short: 'Výsledek zápasu (1X2)',
    long: 'Výsledek zápasu v základní hrací době',
    note: 'Sázka platí na výsledek po řádné hrací době: ve fotbale 90 minut včetně nastavení, v hokeji 60 minut. Prodloužení ani nájezdy se nepočítají.',
  },
};

export const OUTCOME_LABEL: Record<Outcome, string> = { '1': 'Výhra domácích', x: 'Remíza', '2': 'Výhra hostů' };

/** Outcomes of a market, by the platform's opp.type (array order is not 1, x, 2). A two-way market has only 1 and 2. */
export function outcomesOf(mainEvent: RawMatch, market: Market = '1x2'): { outcome: Outcome; odds: number; enabled: boolean }[] {
  const out: { outcome: Outcome; odds: number; enabled: boolean }[] = [];
  const seen = new Set<string>();
  for (const o of (mainEvent.opps ?? []) as RawMatch[]) {
    const t = String(o.type ?? '').toLowerCase();
    if (t !== '1' && t !== 'x' && t !== '2') continue;
    if (market === '12' && t === 'x') return []; // a "winner" market with a draw is not what we think it is
    if (seen.has(t)) return []; // two opps of the same type: we cannot tell which is right
    const odd = Number(o.odd);
    if (!Number.isFinite(odd) || odd <= 1) continue;
    seen.add(t);
    out.push({ outcome: t, odds: Math.round(odd * 1000), enabled: o.bettingEnabled !== false });
  }
  if (market === '12' && out.length !== 2) return []; // both sides or nothing: one price alone cannot be compared
  return out;
}
