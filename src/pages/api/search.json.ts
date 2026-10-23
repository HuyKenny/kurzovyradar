import type { APIRoute } from 'astro';
import { COMPETITIONS } from '../../config/competitions';
import { upcoming, listable, cfg, now } from '../../lib/data';
import { kickoff } from '../../lib/format';

export const prerender = false;

/** Small index for the header suggestions: upcoming matches + teams + competitions. Cached by browsers for 5 min. */
export const GET: APIRoute = async () => {
  const up = await upcoming();
  const t = now();
  const events = listable(up, t, cfg());
  const items: { label: string; sub: string; url: string; kind: string }[] = [];
  for (const c of COMPETITIONS) items.push({ label: c.name, sub: c.country, url: `/souteze/${c.slug}/`, kind: 'soutěž' });
  for (const e of events) items.push({ label: `${e.home} – ${e.away}`, sub: `${e.compName}, ${kickoff(e.startAt, t)}`, url: e.url, kind: 'zápas' });
  return new Response(JSON.stringify({ at: up.at, items }), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=300', 'x-robots-tag': 'noindex' },
  });
};
