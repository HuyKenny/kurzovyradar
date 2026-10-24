/**
 * Pre-rendered HTML of the busiest pages in Workers KV.
 *
 * The Cache API is per data centre, so the first visitor in each location after a change used to wait for a full render (0.5–1.8 s).
 * Five minutes after every import a cron renders the key pages once and stores them in KV, which every location can read in a few
 * milliseconds; the Worker copies a KV page into its local cache on first use. Everything here is best effort: no KV or an
 * empty KV just means the old behaviour (render on a miss).
 */
import { handle } from '@astrojs/cloudflare/handler';
import { COMPETITIONS } from '../config/competitions';
import type { Env } from './types';

const ORIGIN = 'https://kurzovyradar.cz';
const SPORTS = ['fotbal', 'hokej', 'tenis', 'basketbal', 'volejbal', 'esporty', 'sipky', 'stolni-tenis'];
/** KV copies expire after an hour; a page older than the Worker's stale window is ignored when read. */
export const KV_TTL_S = 3600;

export const warmPaths = (): string[] => [
  '/', '/dnes/', '/kurzy/', '/radar/', '/sporty/', '/souteze/', '/bonusy/',
  ...SPORTS.map((s) => `/${s}/`),
  ...COMPETITIONS.filter((c) => c.top).map((c) => `/souteze/${c.slug}/`),
];

/** `build` ties a stored page to the deploy that rendered it: its hashed asset URLs disappear with the next deploy. */
export interface KvMeta { at: number; ttl: number; cc: string; ct: string; build: string }

export async function warm(env: Env, ctx: ExecutionContext): Promise<{ stored: number; failed: number }> {
  if (!env.HTML || env.ENVIRONMENT !== 'production') return { stored: 0, failed: 0 };
  let stored = 0;
  let failed = 0;
  for (const path of warmPaths()) {
    try {
      const res = await handle(new Request(`${ORIGIN}${path}`, { headers: { 'user-agent': 'KurzovyRadar-warm/1.0' } }), env as never, ctx);
      const cc = res.headers.get('Cache-Control') ?? '';
      const ttl = Number(/s-maxage=(\d+)/.exec(cc)?.[1] ?? 0);
      if (res.status !== 200 || ttl <= 0 || /no-store/.test(cc)) { failed++; continue; }
      const meta: KvMeta = { build: __BUILD_ID__, at: Date.now(), ttl, cc, ct: res.headers.get('Content-Type') ?? 'text/html; charset=utf-8' };
      await env.HTML.put(`${ORIGIN}${path}`, await res.text(), { expirationTtl: KV_TTL_S, metadata: meta });
      stored++;
    } catch (e) {
      failed++;
      console.error('warm failed', path, String(e));
    }
  }
  return { stored, failed };
}
