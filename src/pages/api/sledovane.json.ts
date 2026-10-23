import type { APIRoute } from 'astro';
import { competitionBySlug } from '../../config/competitions';
import { upcoming, listable, cfg, now } from '../../lib/data';
import { eventJson } from '../../lib/eventjson';

export const prerender = false;

/** Next matches of followed competitions and sports (?souteze=a,b&sporty=fotbal), at most 20. */
export const GET: APIRoute = async ({ url }) => {
  const comps = new Set((url.searchParams.get('souteze') ?? '').split(',').filter((s) => competitionBySlug(s)).slice(0, 40));
  const sports = new Set((url.searchParams.get('sporty') ?? '').split(',').filter((s) => s === 'fotbal' || s === 'hokej'));
  const up = await upcoming();
  const t = now();
  const c = cfg();
  const events = listable(up, t, c).filter((e) => comps.has(e.comp) || sports.has(e.sport)).slice(0, 20).map((e) => eventJson(e, up, t, c));
  return new Response(JSON.stringify({ at: up.at, events }), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, max-age=60', 'x-robots-tag': 'noindex' },
  });
};
