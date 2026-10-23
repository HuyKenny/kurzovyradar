/**
 * Links that carry the chosen bet into the match detail: stable ids only (market '1x2', outcome '1' | 'x' | '2')
 * and an optional way back to the list the visitor came from (internal paths only, checked here).
 */
import type { Outcome } from '../server/types';

const BACK = /^\/(?:|radar\/|kurzy\/|oblibene\/|fotbal\/|hokej\/|hledat\/|souteze\/[a-z0-9-]+\/)(?:\?[a-z0-9=&%+._-]*)?$/i;

export function betUrl(eventUrl: string, outcome: Outcome, back?: string): string {
  const p = new URLSearchParams({ trh: '1x2', vysledek: outcome });
  if (back && BACK.test(back)) p.set('zpet', back);
  return `${eventUrl}?${p}#sazka`;
}

/** The validated back path and a human label for it, or null. */
export function backLink(raw: string | null): { href: string; label: string } | null {
  if (!raw || !BACK.test(raw)) return null;
  const path = raw.split('?')[0]!;
  const label = path === '/' ? 'Zpět na úvod' : path.startsWith('/radar/') ? 'Zpět na pohyby kurzů' : path.startsWith('/kurzy/') ? 'Zpět na kurzy'
    : path.startsWith('/oblibene/') ? 'Zpět na sledované' : path.startsWith('/souteze/') ? 'Zpět na soutěž' : path.startsWith('/hledat/') ? 'Zpět na hledání' : 'Zpět';
  return { href: raw, label };
}

export const isOutcome = (v: string | null): v is Outcome => v === '1' || v === 'x' || v === '2';
