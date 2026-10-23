import type { APIRoute } from 'astro';
import { E } from '../lib/data';
import { isDemo } from '../server/demo';

export const prerender = false;

export const GET: APIRoute = () => {
  const closed = E.ENVIRONMENT !== 'production' || isDemo(E);
  const body = closed
    ? 'User-agent: *\nDisallow: /\n'
    : 'User-agent: *\nDisallow: /go/\nDisallow: /api/\nDisallow: /hledat/\nDisallow: /oblibene/\n\nSitemap: https://kurzovyradar.cz/sitemap.xml\n';
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
};
