import type { APIRoute } from 'astro';
import { BOOK, type BookId } from '../../config/bookmakers';
import { E } from '../../lib/data';
import { deeplink, generic } from '../../lib/partner';
import { BOT, fromOurPage } from '../../lib/go-guard';

export const prerender = false;

/** Tracked partner redirect: /go/<book>/?e=<event id>&p=<placement>. One Analytics Engine point per click, no cookies. */
export const GET: APIRoute = async ({ params, url, request }) => {
  const book = params.book as BookId;
  if (!(book in BOOK) || BOOK[book].affiliate !== 'approved') return new Response('Not found', { status: 404 });
  const ua = request.headers.get('user-agent') ?? '';
  const device = !ua || BOT.test(ua) ? 'bot' : /Mobi|Android|iPhone/i.test(ua) ? 'mobile' : 'desktop';
  const human = device !== 'bot' && fromOurPage(request.headers);
  const place = /^[a-z0-9-]{1,40}$/.test(url.searchParams.get('p') ?? '') ? url.searchParams.get('p')! : '';
  let page = '';
  try { page = new URL(request.headers.get('referer') ?? '').pathname; } catch { /* no referer */ }
  const id = Number(url.searchParams.get('e'));
  try {
    // Refused visits are still counted (as device "bot", so they can be filtered out), just never forwarded to the partner.
    E.CLICKS?.writeDataPoint({ indexes: [book], blobs: [book, human ? place : `x-${place}`.slice(0, 40), page.slice(0, 120), String(id || ''), human ? device : 'bot'], doubles: [1] });
  } catch { /* measuring must never block the redirect */ }
  if (!human) {
    return new Response(null, { status: 302, headers: { Location: `/sazkove-kancelare/${book}/`, 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'private, no-store' } });
  }
  let target: string | null = null;
  try {
    target = generic(E, book);
    if (id > 0 && (book === 'tipsport' || book === 'chance')) {
      const s = await E.DB.prepare('SELECT path FROM event_sources WHERE event_id = ? AND book = ?').bind(id, book).first<{ path: string }>();
      if (s?.path) target = deeplink(E, book, s.path) ?? target;
    }
  } catch (e) {
    console.error('go target failed', book, String(e));
  }
  if (!target) return new Response(null, { status: 302, headers: { Location: `/sazkove-kancelare/${book}/`, 'Cache-Control': 'private, no-store' } });
  return new Response(null, { status: 302, headers: { Location: target, 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'private, no-store' } });
};
