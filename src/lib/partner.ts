/**
 * Partner links, managed in one place. Targets come from wrangler vars (never invented here):
 * TIPSPORT_URL / CHANCE_URL are the registered PartnerRedirectAction links; match deeplinks reuse their
 * tracking parameters (pid/sid/bid/tid) on the bookmaker's own match path. ALLWYN_URL is the record.sazka.cz link,
 * MERKURXTIP_URL the affilmaster link (data1 = sub-ID kurzovyradar).
 */
import type { BookId } from '../config/bookmakers';
import type { Env } from '../server/types';

const PUBLIC: Partial<Record<BookId, string>> = { tipsport: 'https://www.tipsport.cz', chance: 'https://www.chance.cz' };
const URL_KEY: Partial<Record<BookId, keyof Env>> = { tipsport: 'TIPSPORT_URL', chance: 'CHANCE_URL', allwyn: 'ALLWYN_URL', merkurxtip: 'MERKURXTIP_URL' };

export const hasPartnerLink = (env: Env, book: BookId) => !!URL_KEY[book] && !!env[URL_KEY[book]!];

export function generic(env: Env, book: BookId): string | null {
  const k = URL_KEY[book];
  return k ? (env[k] as string) || null : null;
}

/** Bookmaker's match page with our tracking parameters (the method the old site and sportstreamy use). */
export function deeplink(env: Env, book: BookId, path: string): string | null {
  const base = PUBLIC[book];
  const g = generic(env, book);
  if (!base || !g || !path.startsWith('/')) return g;
  const src = new URL(g);
  const u = new URL(base + path);
  for (const k of ['pid', 'sid', 'bid', 'tid']) {
    const v = src.searchParams.get(k);
    if (v) u.searchParams.set(k, v);
  }
  return u.toString();
}
