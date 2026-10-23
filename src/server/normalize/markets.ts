import type { Market, Outcome } from '../types';
import type { RawMatch } from '../providers/platform';

/**
 * Which market the platform's main event is. mySelectionId looks like "16-WINNER_3W-1" (sport-type-variant).
 * Only a three-way result named "Výsledek zápasu" is '1x2' (regular time: hockey 60 min, football 90 min + stoppage).
 * A two-way winner ("Vítěz zápasu", incl. overtime) or anything unknown returns null and is not compared.
 */
export function classifyMarket(mainEvent: RawMatch | undefined): Market | null {
  if (!mainEvent) return null;
  const type = String(mainEvent.mySelectionId ?? '').split('-')[1] ?? '';
  const name = String(mainEvent.name ?? '').trim();
  if (type === 'WINNER_3W' && name === 'Výsledek zápasu') return '1x2';
  return null;
}

export const MARKET_LABEL: Record<Market, { short: string; long: string; note: string }> = {
  '1x2': {
    short: 'Výsledek zápasu (1X2)',
    long: 'Výsledek zápasu v základní hrací době',
    note: 'Sázka platí na výsledek po řádné hrací době: ve fotbale 90 minut včetně nastavení, v hokeji 60 minut. Prodloužení ani nájezdy se nepočítají.',
  },
};

export const OUTCOME_LABEL: Record<Outcome, string> = { '1': 'Výhra domácích', x: 'Remíza', '2': 'Výhra hostů' };

/** Outcomes of a market, by the platform's opp.type (array order is not 1, x, 2). */
export function outcomesOf(mainEvent: RawMatch): { outcome: Outcome; odds: number; enabled: boolean }[] {
  const out: { outcome: Outcome; odds: number; enabled: boolean }[] = [];
  const seen = new Set<string>();
  for (const o of (mainEvent.opps ?? []) as RawMatch[]) {
    const t = String(o.type ?? '').toLowerCase();
    if (t !== '1' && t !== 'x' && t !== '2') continue;
    if (seen.has(t)) return []; // two opps of the same type: we cannot tell which is right
    const odd = Number(o.odd);
    if (!Number.isFinite(odd) || odd <= 1) continue;
    seen.add(t);
    out.push({ outcome: t, odds: Math.round(odd * 1000), enabled: o.bettingEnabled !== false });
  }
  return out;
}
