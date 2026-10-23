import type { APIRoute } from 'astro';
import { upcoming, cfg, now } from '../../lib/data';
import { eventJson } from '../../lib/eventjson';

export const prerender = false;

/** Current prices for followed match ids (?ids=1,2,3): used by /oblibene/ and the homepage strip, which live in the browser. */
export const GET: APIRoute = async ({ url }) => {
  const ids = new Set((url.searchParams.get('ids') ?? '').split(',').map(Number).filter((n) => n > 0).slice(0, 200));
  const up = await upcoming();
  const t = now();
  const c = cfg();
  const events = up.events.filter((e) => ids.has(e.id)).map((e) => eventJson(e, up, t, c));
  return new Response(JSON.stringify({ at: up.at, events }), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, max-age=60', 'x-robots-tag': 'noindex' },
  });
};
