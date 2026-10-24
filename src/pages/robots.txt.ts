import type { APIRoute } from 'astro';
import { E } from '../lib/data';
import { isDemo } from '../server/demo';
import { ROBOTS } from '../lib/robots';

export const prerender = false;



export const GET: APIRoute = () => {
  const closed = E.ENVIRONMENT !== 'production' || isDemo(E);
  const body = closed
    ? 'User-agent: *\nDisallow: /\n'
    : ROBOTS;
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
};
