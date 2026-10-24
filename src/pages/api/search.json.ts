import type { APIRoute } from 'astro';
import { SPORTS } from '../../config/competitions';
import { competitionsIn, sportsIn } from '../../lib/catalog';
import { upcoming, listable, cfg, now } from '../../lib/data';
import { kickoff } from '../../lib/format';

export const prerender = false;

/** Small index for the header suggestions: upcoming matches + teams + competitions. Cached by browsers for 5 min. */
export const GET: APIRoute = async () => {
  const up = await upcoming();
  const t = now();
  const events = listable(up, t, cfg());
  const items: { label: string; sub: string; url: string; kind: string }[] = [];
  for (const s of sportsIn(events)) items.push({ label: s.name, sub: `${s.count} zápasů`, url: s.path, kind: 'sport' });
  for (const c of competitionsIn(events)) items.push({ label: c.name, sub: `${SPORTS[c.sport].name}, ${c.count} zápasů`, url: `/souteze/${c.slug}/`, kind: 'soutěž' });
  for (const e of events) items.push({ label: `${e.home} – ${e.away}`, sub: `${e.compName}, ${kickoff(e.startAt, t)}`, url: e.url, kind: 'zápas' });
  return new Response(JSON.stringify({ at: up.at, items }), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=300', 'x-robots-tag': 'noindex' },
  });
};
