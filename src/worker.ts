import { handle } from '@astrojs/cloudflare/handler';
import type { Env } from './server/types';
import { runImport } from './server/run';
import { seedDemo } from './server/demo';
import { securityHeaders } from './lib/security';
import { warm, type KvMeta } from './server/warm';
import { KNOWN_PARAMS } from './lib/params';

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
const STALE_FACTOR = 3;


/** Renders in flight in this isolate: concurrent misses for one URL share a single render. */
const inflight = new Map<string, Promise<Response>>();

/** A path without a trailing slash (and not a file or an internal route) gets a 301 to the canonical form. */
const needsSlash = (path: string) => !path.endsWith('/') && !path.includes('.') && !/^\/(api|go|cdn-cgi|_astro)(\/|$)/.test(path);

/** A page the warm-up cron stored in KV: the response for the visitor and the copy for this location's cache. */
async function fromKv(env: Env, url: string): Promise<{ response: Response; stored: Response; stale: boolean } | null> {
  if (!env.HTML) return null;
  try {
    const { value, metadata } = await env.HTML.getWithMetadata<KvMeta>(url, 'text');
    if (value === null || !metadata || metadata.build !== __BUILD_ID__) return null;
    const age = (Date.now() - metadata.at) / 1000;
    if (age > metadata.ttl * STALE_FACTOR) return null;
    const headers = { 'Content-Type': metadata.ct };
    const stored = new Response(value, { headers: { ...headers, 'Cache-Control': `public, s-maxage=${metadata.ttl * STALE_FACTOR}`, 'X-KR-Build': __BUILD_ID__, 'X-KR-Stored': String(metadata.at), 'X-KR-TTL': String(metadata.ttl), 'X-KR-CC': metadata.cc } });
    return { response: new Response(value, { headers: { ...headers, 'Cache-Control': metadata.cc, Age: String(Math.round(age)) } }), stored, stale: age > metadata.ttl };
  } catch {
    return null;
  }
}

/**
 * Edge cache with stale-while-revalidate over the Cache API (Cache Rules do not cache Worker HTML).
 * Pages set `s-maxage` (layouts/Base.astro); the key is the full URL with only known parameters, sorted.
 */
async function serve(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD', 'Cache-Control': 'no-store' } });
  }
  if (url.hostname === 'www.kurzovyradar.cz') {
    url.hostname = 'kurzovyradar.cz';
    return new Response(null, { status: 301, headers: { Location: url.toString() } });
  }
  if (/[A-Z]/.test(url.pathname) && !url.pathname.startsWith('/_astro/')) {
    url.pathname = url.pathname.toLowerCase();
    return new Response(null, { status: 301, headers: { Location: url.toString() } });
  }
  if (needsSlash(url.pathname)) {
    url.pathname += '/';
    return new Response(null, { status: 301, headers: { Location: url.toString(), 'Cache-Control': 'public, max-age=3600' } });
  }
  const head = request.method === 'HEAD';
  const asGet = head ? new Request(request.url, { method: 'GET', headers: request.headers }) : request;
  const done = (res: Response) => (head ? new Response(null, { status: res.status, headers: res.headers }) : res);
  if (NO_CACHE.test(url.pathname) || env.ENVIRONMENT !== 'production') return done(finish(await handle(asGet, env as never, ctx), env));
  for (const k of [...url.searchParams.keys()]) if (!KNOWN_PARAMS.has(k)) url.searchParams.delete(k);
  url.searchParams.sort();
  const key = new Request(url.toString(), { method: 'GET' });
  // Render from the cleaned URL: what is cached must be exactly what that key means.
  const clean = new Request(url.toString(), { method: 'GET', headers: request.headers });
  const cache = (caches as unknown as { default: Cache }).default;
  const render = () => {
    const k = key.url;
    let p = inflight.get(k);
    if (!p) {
      p = (async () => {
        const res = await handle(clean, env as never, ctx);
        const cc = res.headers.get('Cache-Control') ?? '';
        const ttl = Number(/s-maxage=(\d+)/.exec(cc)?.[1] ?? 0);
        if (res.status === 200 && ttl > 0 && !/no-store/.test(cc)) {
          const stored = new Response(res.clone().body, res);
          stored.headers.set('Cache-Control', `public, s-maxage=${ttl * STALE_FACTOR}`);
          stored.headers.set('X-KR-Build', __BUILD_ID__);
          stored.headers.set('X-KR-Stored', String(Date.now()));
          stored.headers.set('X-KR-TTL', String(ttl));
          stored.headers.set('X-KR-CC', cc);
          ctx.waitUntil(cache.put(key, stored));
        }
        return res;
      })().finally(() => inflight.delete(k));
      inflight.set(k, p);
    }
    // Every caller needs its own readable body.
    return p.then((r) => r.clone());
  };
  // A page stored by an earlier deploy points at asset files that no longer exist: it counts as a miss.
  const found = await cache.match(key);
  const hit = found && found.headers.get('X-KR-Build') === __BUILD_ID__ ? found : undefined;
  if (!hit) {
    // Another location (or the warm-up cron) may already have this page: KV answers from anywhere in a few milliseconds.
    const kv = await fromKv(env, key.url);
    if (kv) {
      ctx.waitUntil(cache.put(key, kv.stored));
      if (kv.stale) ctx.waitUntil(render().catch(() => undefined));
      return done(finish(kv.response, env));
    }
    return done(finish(await render(), env));
  }
  const age = (Date.now() - Number(hit.headers.get('X-KR-Stored') ?? 0)) / 1000;
  if (age > Number(hit.headers.get('X-KR-TTL') ?? 0)) ctx.waitUntil(render().catch(() => undefined));
  const out = new Response(hit.body, hit);
  out.headers.set('Cache-Control', hit.headers.get('X-KR-CC') ?? 'public, max-age=0');
  for (const h of ['X-KR-Stored', 'X-KR-TTL', 'X-KR-CC', 'X-KR-Build']) out.headers.delete(h);
  out.headers.set('Age', String(Math.round(age)));
  return done(finish(out, env));
}

export default {
  fetch: (request: Request, env: Env, ctx: ExecutionContext) => serve(request, env, ctx),
  async scheduled(ev: ScheduledController, env: Env, ctx: ExecutionContext) {
    // The second cron (minutes 9, 24, 39, 54) only pre-renders pages into KV; the first imports the odds.
    if (ev.cron.startsWith('9,')) {
      ctx.waitUntil(warm(env, ctx).then((r) => console.log('warm', JSON.stringify(r))).catch((e) => console.error('warm failed', String(e))));
      return;
    }
    // Demo never touches the feeds and production can never seed demo data.
    const job = env.DEMO === 'on' && env.ENVIRONMENT !== 'production' ? seedDemo(env) : runImport(env);
    ctx.waitUntil(job.then((r) => console.log('import', JSON.stringify(r))).catch((e) => console.error('import failed', String(e))));
  },
};
