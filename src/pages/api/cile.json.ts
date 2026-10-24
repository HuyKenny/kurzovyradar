import type { APIRoute } from 'astro';
import { E } from '../../lib/data';
import { historyReach } from '../../lib/target';

export const prerender = false;

/**
 * What the recorded history proves about followed bets with a target price: ?b=<id>:<outcome>:<since>:<target in thousandths>,…
 * Only positive evidence is returned (see lib/target.ts); the browser decides what to say. Read-only, no cookies.
 */
export const GET: APIRoute = async ({ url }) => {
  const wanted = (url.searchParams.get('b') ?? '').split(',').slice(0, 30).map((x) => x.split(':'))
    .filter((p) => p.length === 4 && ['1', 'x', '2'].includes(p[1]!) && Number(p[0]) > 0 && Number(p[2]) > 0 && Number(p[3]) > 1000);
  const out: { id: number; outcome: string; atStart: boolean; firstAt: number | null }[] = [];
  if (wanted.length) {
    const res = await E.DB.batch(wanted.map((p) => E.DB.prepare(
      "SELECT h.at, h.odds, h.enabled FROM odds_history h JOIN event_sources s ON s.event_id = h.event_id AND s.book = h.book WHERE h.event_id = ? AND h.market = (SELECT market FROM events WHERE id = ?) AND h.outcome = ? AND s.mismatch = 0 ORDER BY h.at",
    ).bind(Number(p[0]), Number(p[0]), p[1])));
    wanted.forEach((p, i) => {
      const rows = (res[i]!.results as { at: number; odds: number; enabled: number }[]).map((r) => ({ at: r.at, odds: r.odds, enabled: !!r.enabled }));
      out.push({ id: Number(p[0]), outcome: p[1]!, ...historyReach(rows, Number(p[2]), Number(p[3])) });
    });
  }
  return new Response(JSON.stringify({ items: out }), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, max-age=60', 'x-robots-tag': 'noindex' },
  });
};
