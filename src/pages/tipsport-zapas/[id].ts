import type { APIRoute } from 'astro';
import { E } from '../../lib/data';
import { eventUrl } from '../../server/store/derive';

export const prerender = false;

/**
 * Stable entry for the sister site sportstreamy.cz, whose match ids are Tipsport's own match ids (verified 24. 10. 2026: 207 of 300
 * sampled sportstreamy ids exist as `event_sources.src_id` for Tipsport). 301 to the canonical match page; unknown id → the odds overview.
 * The redirect keeps the link valid when the slug changes and needs no cross-site lookup at render time.
 */
export const GET: APIRoute = async ({ params }) => {
  const id = params.id ?? '';
  const home = new Response(null, { status: 302, headers: { Location: '/kurzy/', 'Cache-Control': 'public, max-age=0, s-maxage=300' } });
  if (!/^\d{4,12}$/.test(id)) return home;
  const r = await E.DB.prepare("SELECT e.id, e.slug FROM event_sources s JOIN events e ON e.id = s.event_id WHERE s.book = 'tipsport' AND s.src_id = ?").bind(id).first<{ id: number; slug: string }>();
  if (!r) return home;
  return new Response(null, { status: 301, headers: { Location: eventUrl(r.slug, r.id), 'Cache-Control': 'public, max-age=0, s-maxage=3600' } });
};
