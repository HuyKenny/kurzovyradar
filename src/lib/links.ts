/**
 * Links that carry the chosen bet into the match detail: stable ids only (market '1x2', outcome '1' | 'x' | '2')
 * and an optional way back to the list the visitor came from (internal paths only, checked here).
 */
import type { Outcome } from '../server/types';
import { SPORT_LIST } from '../config/competitions';
import { trhOf, type FindingKey, type PeriodKey } from './bet-state';

const SPORT_PATHS = SPORT_LIST.join('|');
const BACK = new RegExp(`^/(?:|radar/|kurzy/|dnes/|oblibene/|sporty/|(?:${SPORT_PATHS})/|hledat/|souteze/[a-z0-9-]+/|pruvodce/[a-z0-9-]+/)(?:\\?[a-z0-9=&%+._-]*)?$`, 'i');

/** `ctx` carries what the visitor was looking at: the period (obdobi) and the kind of finding (zjisteni) from the radar. */
export function betUrl(eventUrl: string, outcome: Outcome, back?: string, ctx?: { period?: PeriodKey | null; finding?: FindingKey | null; stake?: number; market?: string }): string {
  const p = new URLSearchParams({ trh: trhOf(ctx?.market), vysledek: outcome });
  if (ctx?.period) p.set('obdobi', ctx.period);
  if (ctx?.finding) p.set('zjisteni', ctx.finding);
  if (ctx?.stake) p.set('vklad', String(ctx.stake));
  if (back && BACK.test(back)) p.set('zpet', back);
  return `${eventUrl}?${p}#sazka`;
}

/** The validated back path and a human label for it, or null. */
export function backLink(raw: string | null): { href: string; label: string } | null {
  if (!raw || !BACK.test(raw)) return null;
  const path = raw.split('?')[0]!;
  const label = path === '/' ? 'Zpět na úvod' : path.startsWith('/radar/') ? 'Zpět na pohyby kurzů' : path.startsWith('/kurzy/') ? 'Zpět na kurzy' : path.startsWith('/dnes/') ? 'Zpět na dnešní zápasy' : path.startsWith('/pruvodce/') ? 'Zpět na průvodce'
    : path.startsWith('/oblibene/') ? 'Zpět na sledované' : path.startsWith('/souteze/') ? 'Zpět na soutěž' : path.startsWith('/sporty/') ? 'Zpět na sporty' : SPORT_LIST.some((s) => path === `/${s}/`) ? 'Zpět na přehled sportu' : path.startsWith('/hledat/') ? 'Zpět na hledání' : 'Zpět';
  return { href: raw, label };
}

export { isOutcome } from './bet-state';
