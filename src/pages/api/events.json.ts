import type { APIRoute } from 'astro';
import { upcoming, cfg, now, compare } from '../../lib/data';

export const prerender = false;

/** Current comparison for favourite ids (?ids=1,2,3): used by /oblibene/, which lives in the browser only. */
export const GET: APIRoute = async ({ url }) => {
  const ids = new Set((url.searchParams.get('ids') ?? '').split(',').map(Number).filter((n) => n > 0).slice(0, 100));
  const up = await upcoming();
  const t = now();
  const c = cfg();
  const events = up.events.filter((e) => ids.has(e.id)).map((e) => ({
    id: e.id, url: e.url, home: e.home, away: e.away, compName: e.compName, startAt: e.startAt, started: e.startAt <= t,
    rows: compare(e, up.books, t, c).map((r) => ({ outcome: r.outcome, best: r.best, cells: r.cells.map((x) => ({ book: x.book, odds: x.odds, current: x.current, best: x.best, tie: x.tie })) })),
  }));
  return new Response(JSON.stringify({ at: up.at, events }), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, max-age=60', 'x-robots-tag': 'noindex' },
  });
};
