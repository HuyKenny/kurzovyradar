import type { APIRoute } from 'astro';
import { upcoming, listable, cfg, now } from '../../lib/data';
import { ticketView } from '../../lib/ticket';
import { dayKey } from '../../lib/format';

export const prerender = false;

/**
 * A real upcoming match for the beginner example in the guide: the soonest one (today or tomorrow if possible) that has a
 * current price for all three outcomes. `event: null` when there is none, the guide then shows a labelled teaching example.
 */
export const GET: APIRoute = async () => {
  const up = await upcoming();
  const t = now();
  const c = cfg();
  const days = new Set([dayKey(t), dayKey(t + 86400)]);
  const ok = listable(up, t, c).map((e) => ({ e, v: ticketView(e, up.books, t, c) })).filter((x) => x.v.outcomes.every((o) => o.best));
  const pick = ok.find((x) => days.has(dayKey(x.e.startAt))) ?? ok[0];
  const body = pick ? {
    event: { id: pick.e.id, url: pick.e.url, home: pick.e.home, away: pick.e.away, compName: pick.e.compName, sport: pick.e.sport, startAt: pick.e.startAt, checkedAt: pick.v.checkedAt },
    odds: Object.fromEntries(pick.v.outcomes.map((o) => [o.outcome, o.best!.odds])),
  } : { event: null };
  return new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=60', 'x-robots-tag': 'noindex' } });
};
