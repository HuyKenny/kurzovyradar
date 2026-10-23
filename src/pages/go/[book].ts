import type { APIRoute } from 'astro';
import { BOOK, type BookId } from '../../config/bookmakers';
import { E } from '../../lib/data';
import { deeplink, generic } from '../../lib/partner';

export const prerender = false;

/** Tracked partner redirect: /go/<book>/?e=<event id>&p=<placement>. One Analytics Engine point per click, no cookies. */
export const GET: APIRoute = async ({ params, url, request }) => {
  const book = params.book as BookId;
  if (!(book in BOOK) || BOOK[book].affiliate !== 'approved') return new Response('Not found', { status: 404 });
  let target = generic(E, book);
  const id = Number(url.searchParams.get('e'));
  if (id > 0 && (book === 'tipsport' || book === 'chance')) {
    const s = await E.DB.prepare('SELECT path FROM event_sources WHERE event_id = ? AND book = ?').bind(id, book).first<{ path: string }>();
    if (s?.path) target = deeplink(E, book, s.path) ?? target;
  }
  if (!target) return new Response('Not found', { status: 404 });
  try {
    const ua = request.headers.get('user-agent') ?? '';
    const device = /bot|crawl|spider|slurp|preview|headless/i.test(ua) ? 'bot' : /Mobi|Android|iPhone/i.test(ua) ? 'mobile' : 'desktop';
    let page = '';
    try { page = new URL(request.headers.get('referer') ?? '').pathname; } catch { /* no referer */ }
    E.CLICKS?.writeDataPoint({ indexes: [book], blobs: [book, (url.searchParams.get('p') ?? '').slice(0, 40), page.slice(0, 120), String(id || ''), device], doubles: [1] });
  } catch { /* measuring must never block the redirect */ }
  return new Response(null, {
    status: 302,
    headers: { Location: target, 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer-when-downgrade' },
  });
};
