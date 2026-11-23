/**
 * Production Worker of kurzovyradar.cz (since 23. 11. 2026). Everything else is static files built by GitHub Actions
 * (scripts/static.py); this script runs only for:
 *   - /go/<book>/            tracked partner redirect (Analytics Engine CLICKS, bot guard, match deeplink)
 *   - /tipsport-zapas/<id>/  entry for sportstreamy.cz (Tipsport match id → our match page)
 *   - listing pages that have pre-rendered query variants (the run_worker_first list comes from /_v/index.json at deploy time)
 *   - any path without a static file (old match pages → their competition, uppercase → lowercase, else the 404 page with status 404)
 * No D1, no KV, no cron. Lookups read small static JSON shards through the ASSETS binding, so every invocation stays ~1 ms of CPU.
 * Keep in step with src/pages/go/[book].ts, src/lib/partner.ts, src/lib/go-guard.ts and src/lib/params.ts (tests/edge.test.ts).
 */

export const KNOWN_PARAMS = new Set(['vyber', 'den', 'do', 'ds', 'e', 'ff', 'k', 'k1', 'k2', 'v2', 'o1', 'o2', 'o3', 'o4', 'o5', 'o6', 'kancelar', 'kf', 'kurz', 'obdobi', 'od', 'pohled', 'q', 'sledovane', 'soutez', 'sport', 'strana', 'tip', 'trh', 'vklad', 'vo', 'vp', 'vysledek', 'zjisteni', 'zmena', 'zpet']);
export const BOT = /bot|crawl|spider|slurp|preview|headless|curl|wget|python|go-http|scrapy|httpx|axios|node-fetch|okhttp|java\/|libwww|aiohttp|postman|insomnia/i;
const HOSTS = new Set(['kurzovyradar.cz', 'www.kurzovyradar.cz']);
const APPROVED = { tipsport: 'TIPSPORT_URL', chance: 'CHANCE_URL', allwyn: 'ALLWYN_URL', merkurxtip: 'MERKURXTIP_URL' };
const PUBLIC = { tipsport: 'https://www.tipsport.cz', chance: 'https://www.chance.cz' };
const SECURITY = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'inline-speculation-rules' https://www.googletagmanager.com; img-src 'self' data: https://*.google-analytics.com https://*.googletagmanager.com; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests",
};

export function fromOurPage(headers) {
  const site = headers.get('sec-fetch-site');
  if (site === 'same-origin' || site === 'same-site') return true;
  try { return HOSTS.has(new URL(headers.get('referer') ?? '').hostname); } catch { return false; }
}

export function deeplink(generic, book, path) {
  const base = PUBLIC[book];
  if (!base || !generic || !path || !path.startsWith('/')) return generic;
  const src = new URL(generic);
  const u = new URL(base + path);
  for (const k of ['pid', 'sid', 'bid', 'tid']) {
    const v = src.searchParams.get(k);
    if (v) u.searchParams.set(k, v);
  }
  return u.toString();
}

/** Known parameters with a value, sorted: the key of a pre-rendered variant. `zpet` (a back link) never selects one. */
export function variantKey(params) {
  const p = [...params].filter(([k, v]) => KNOWN_PARAMS.has(k) && k !== 'zpet' && v !== '').sort(([a, x], [b, y]) => (a < b ? -1 : a > b ? 1 : x < y ? -1 : 1));
  return p.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
}

/** The pre-rendered variant for a query: exact key first, else the variant with the most of the asked parameters (and nothing else). */
export function pickVariant(known, key) {
  if (!key || !known) return null;
  if (known[key]) return known[key];
  const asked = new Set(key.split('&'));
  let best = null;
  let size = 0;
  for (const [k, id] of Object.entries(known)) {
    const parts = k.split('&');
    if (parts.length > size && parts.every((x) => asked.has(x))) { best = id; size = parts.length; }
  }
  return best;
}

const shard = (id) => ((id % 256) + 256) % 256;

async function json(env, origin, path) {
  try {
    const r = await env.ASSETS.fetch(new Request(origin + path));
    return r.ok ? await r.json() : null;
  } catch { return null; }
}

function withSecurity(res, extra = {}) {
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries({ ...SECURITY, ...extra })) if (!out.headers.has(k)) out.headers.set(k, v);
  return out;
}

const redirect = (to, status = 302, cc = 'private, no-store') => new Response(null, { status, headers: { Location: to, 'Cache-Control': cc, 'X-Robots-Tag': 'noindex, nofollow' } });

async function go(request, env, ctx, url, book) {
  const key = APPROVED[book];
  if (!key) return new Response('Not found', { status: 404 });
  const ua = request.headers.get('user-agent') ?? '';
  const device = !ua || BOT.test(ua) ? 'bot' : /Mobi|Android|iPhone/i.test(ua) ? 'mobile' : 'desktop';
  const human = device !== 'bot' && fromOurPage(request.headers);
  const p = url.searchParams.get('p') ?? '';
  const place = /^[a-z0-9-]{1,40}$/.test(p) ? p : '';
  let page = '';
  try { page = new URL(request.headers.get('referer') ?? '').pathname; } catch { /* no referer */ }
  const id = Number(url.searchParams.get('e'));
  try {
    // Refused visits are still counted (as device "bot", so they can be filtered out), just never forwarded to the partner.
    env.CLICKS?.writeDataPoint({ indexes: [book], blobs: [book, human ? place : `x-${place}`.slice(0, 40), page.slice(0, 120), String(id || ''), human ? device : 'bot'], doubles: [1] });
  } catch { /* measuring must never block the redirect */ }
  if (!human) return redirect(`/sazkove-kancelare/${book}/`);
  let target = env[key] || null;
  if (target && Number.isInteger(id) && id > 0 && PUBLIC[book]) {
    const ev = (await json(env, url.origin, `/_data/e/${shard(id)}.json`))?.[id];
    if (ev?.p?.[book]) target = deeplink(target, book, ev.p[book]) ?? target;
  }
  return redirect(target ?? `/sazkove-kancelare/${book}/`);
}

async function tipsportMatch(env, url, id) {
  if (!/^\d{4,12}$/.test(id)) return redirect('/kurzy/', 302, 'public, max-age=300');
  const to = (await json(env, url.origin, `/_data/tz/${shard(Number(id))}.json`))?.[id];
  return to ? redirect(to, 301, 'public, max-age=3600') : redirect('/kurzy/', 302, 'public, max-age=300');
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD', 'Cache-Control': 'no-store' } });
    }
    if (url.hostname === 'www.kurzovyradar.cz') {
      url.hostname = 'kurzovyradar.cz';
      return redirect(url.toString(), 301, 'public, max-age=86400');
    }
    const path = url.pathname;
    let m = /^\/go\/([a-z0-9-]+)\/?$/.exec(path);
    if (m) return go(request, env, ctx, url, m[1]);
    m = /^\/tipsport-zapas\/([^/]+)\/?$/.exec(path);
    if (m) return tipsportMatch(env, url, m[1]);

    // A listing page with pre-rendered variants (filters, pages of a list): serve the matching one.
    const key = url.search ? variantKey(url.searchParams) : '';
    if (key) {
      const index = await json(env, url.origin, '/_v/index.json');
      const id = pickVariant(index?.[path], key);
      if (id) {
        const res = await env.ASSETS.fetch(new Request(`${url.origin}/_v/${id}/`, { headers: request.headers }));
        if (res.ok || res.status === 304) return withSecurity(res, { 'X-Robots-Tag': 'noindex, follow' });
      }
    }
    const res = await env.ASSETS.fetch(request);
    if (res.status !== 404) return withSecurity(res);

    // No static file.
    if (/[A-Z]/.test(path)) {
      url.pathname = path.toLowerCase();
      return redirect(url.toString(), 301, 'public, max-age=3600');
    }
    // A match that is no longer kept as a page (started more than PAST_DAYS ago): its competition.
    m = /^\/zapas\/[a-z0-9-]*-(\d+)\/?$/.exec(path);
    if (m) {
      const ev = (await json(env, url.origin, `/_data/e/${shard(Number(m[1]))}.json`))?.[m[1]];
      // A wrong or old slug → the match's own URL first (if that page is gone too, the next request lands here with path === ev.u).
      if (ev?.u && ev.u !== (path.endsWith('/') ? path : `${path}/`)) return redirect(ev.u, 301, 'public, max-age=3600');
      if (ev?.c) return redirect(`/souteze/${ev.c}/`, 301, 'public, max-age=86400');
    }
    // The 404 page (not_found_handling "none": with "404-page" Cloudflare would answer misses itself and the redirects above
    // would never run). /404.html is served as /404/ under html_handling "force-trailing-slash".
    const page = await env.ASSETS.fetch(new Request(`${url.origin}/404/`));
    if (page.ok) return withSecurity(new Response(request.method === 'HEAD' ? null : page.body, { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'X-Robots-Tag': 'noindex' } }));
    return withSecurity(res);
  },
};
