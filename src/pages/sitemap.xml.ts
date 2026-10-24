import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '../config/site';
import { competitionsIn, sportsIn } from '../lib/catalog';
import { BOOKMAKERS } from '../config/bookmakers';
import { TERMS } from '../config/glossary';
import { upcoming, listable, cfg, now } from '../lib/data';

export const prerender = false;

/** Only published, indexable pages: no filters, favourites, search, demo, or competitions without matches. */
export const GET: APIRoute = async () => {
  const up = await upcoming();
  const t = now();
  const events = listable(up, t, cfg());
  const lastmod = up.at ? new Date(up.at * 1000).toISOString() : undefined;
  const guides = await getCollection('pruvodce');
  const urls: { loc: string; lastmod?: string }[] = [
    ...['/', '/kurzy/', '/dnes/', '/radar/', '/sporty/'].map((p) => ({ loc: p, lastmod })),
    ...sportsIn(events).map((s) => ({ loc: s.path, lastmod })),
    ...competitionsIn(events).map((c) => ({ loc: `/souteze/${c.slug}/`, lastmod })),
    ...events.map((e) => ({ loc: e.url, lastmod })),
    { loc: '/sazkove-kancelare/' },
    { loc: '/sazkove-kancelare/srovnani/' },
    ...BOOKMAKERS.filter((b) => b.review === 'published' || b.review === 'info').map((b) => ({ loc: `/sazkove-kancelare/${b.id}/` })),
    { loc: '/pojem/' },
    ...TERMS.map((t) => ({ loc: `/pojem/${t.slug}/` })),
    { loc: '/pruvodce/' },
    ...guides.map((g) => ({ loc: `/pruvodce/${g.id}/`, lastmod: g.data.updated.toISOString().slice(0, 10) })),
    ...['/kalkulacky/', '/metodika/', '/o-nas/', '/financovani/', '/odpovedne-hrani/', '/soukromi/', '/cookies/'].map((p) => ({ loc: p })),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${SITE.url}${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=0, s-maxage=900' } });
};
