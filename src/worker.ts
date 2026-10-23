import { handle } from '@astrojs/cloudflare/handler';
import type { Env } from './server/types';
import { runImport } from './server/run';
import { seedDemo } from './server/demo';
import { securityHeaders } from './lib/security';

/** Never cached: tracked redirects, APIs that depend on the query, Cloudflare internals. */
const NO_CACHE = /^\/(go|cdn-cgi)\/|^\/api\//;

function finish(res: Response, env: Env): Response {
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(securityHeaders())) if (!out.headers.has(k)) out.headers.set(k, v);
  const ct = out.headers.get('Content-Type') ?? '';
  if (ct.startsWith('text/html') && !/charset/i.test(ct)) out.headers.set('Content-Type', 'text/html; charset=utf-8');
  if (env.ENVIRONMENT !== 'production') out.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return out;
}

/** How long past its TTL a cached page may still be served while a fresh copy renders in the background. */
const STALE_FACTOR = 6;

/**
 * Edge cache with stale-while-revalidate over the Cache API (Cache Rules do not cache Worker HTML).
 * Pages set `s-maxage` (layouts/Base.astro); the key is the full URL, so filter queries get their own entries
 * and unknown tracking parameters are stripped first.
 */
async function serve(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  if (url.hostname === 'www.kurzovyradar.cz') {
    url.hostname = 'kurzovyradar.cz';
    return new Response(null, { status: 301, headers: { Location: url.toString() } });
  }
  if (/[A-Z]/.test(url.pathname) && !url.pathname.startsWith('/_astro/')) {
    url.pathname = url.pathname.toLowerCase();
    return new Response(null, { status: 301, headers: { Location: url.toString() } });
  }
  if (request.method !== 'GET' || NO_CACHE.test(url.pathname) || env.ENVIRONMENT !== 'production') return finish(await handle(request, env as never, ctx), env);
  for (const k of [...url.searchParams.keys()]) if (/^(utm_|fbclid|gclid|msclkid|_ga)/.test(k)) url.searchParams.delete(k);
  const key = new Request(url.toString(), { method: 'GET' });
  const cache = (caches as unknown as { default: Cache }).default;
  const render = async () => {
    const res = await handle(request, env as never, ctx);
    const cc = res.headers.get('Cache-Control') ?? '';
    const ttl = Number(/s-maxage=(\d+)/.exec(cc)?.[1] ?? 0);
    if (res.status === 200 && ttl > 0) {
      const stored = new Response(res.clone().body, res);
      stored.headers.set('Cache-Control', `public, s-maxage=${ttl * STALE_FACTOR}`);
      stored.headers.set('X-KR-Stored', String(Date.now()));
      stored.headers.set('X-KR-TTL', String(ttl));
      stored.headers.set('X-KR-CC', cc);
      ctx.waitUntil(cache.put(key, stored));
    }
    return res;
  };
  const hit = await cache.match(key);
  if (!hit) return finish(await render(), env);
  const age = (Date.now() - Number(hit.headers.get('X-KR-Stored') ?? 0)) / 1000;
  if (age > Number(hit.headers.get('X-KR-TTL') ?? 0)) ctx.waitUntil(render().catch(() => undefined));
  const out = new Response(hit.body, hit);
  out.headers.set('Cache-Control', hit.headers.get('X-KR-CC') ?? 'public, max-age=0');
  for (const h of ['X-KR-Stored', 'X-KR-TTL', 'X-KR-CC']) out.headers.delete(h);
  out.headers.set('Age', String(Math.round(age)));
  return finish(out, env);
}

export default {
  fetch: (request: Request, env: Env, ctx: ExecutionContext) => serve(request, env, ctx),
  async scheduled(_ev: ScheduledController, env: Env, ctx: ExecutionContext) {
    // Demo never touches the feeds and production can never seed demo data.
    const job = env.DEMO === 'on' && env.ENVIRONMENT !== 'production' ? seedDemo(env) : runImport(env);
    ctx.waitUntil(job.then((r) => console.log('import', JSON.stringify(r))).catch((e) => console.error('import failed', String(e))));
  },
};
