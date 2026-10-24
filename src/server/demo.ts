/**
 * Demo dataset for local development (wrangler env "demo", its own database). Synthetic, deterministic and
 * clearly fictitious team names; it goes through the same import pipeline as real data, so pages, radar and
 * charts can be built without touching the feeds. Refuses to run unless DEMO=on outside production.
 */
import type { FeedBook } from '../config/bookmakers';
import { COMPETITIONS, type Sport } from '../config/competitions';
import { storeBook } from './store/import';
import { derive } from './store/derive';
import type { Db } from './store/db';
import { settings, type Env, type Market, type Outcome, type SourceMatch } from './types';

const TEAMS = ['Modří lvi', 'Rudí sokoli', 'Zelení vlci', 'Žlutí býci', 'Bílí orli', 'Černí jestřábi', 'Stříbrné lišky', 'Zlatí medvědi',
  'Oranžoví rysi', 'Fialoví draci', 'Šedí bizoni', 'Hnědí jeleni'];

/** Small deterministic PRNG (mulberry32): the demo is the same every time. */
function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function isDemo(env: Partial<Env>): boolean {
  return env.DEMO === 'on' && env.ENVIRONMENT !== 'production';
}

export async function seedDemo(env: Env, db: Db = env.DB as unknown as Db, now = Math.floor(Date.now() / 1000)) {
  if (!isDemo(env)) throw new Error('demo seeding is disabled here');
  const cfg = settings(env);
  for (const t of ['odds_history', 'offers', 'event_sources', 'events', 'import_runs', 'book_state', 'derived']) await db.prepare(`DELETE FROM ${t}`).run();
  const r = rng(42);
  const comps = COMPETITIONS.filter((c) => c.top);
  const base = Math.floor(now / 900) * 900;
  type DemoEvent = { id: string; comp: { slug: string; name: string; sport: Sport }; market: Market; outs: Outcome[]; h: string; a: string; start: number; p: number[] };
  const events: DemoEvent[] = Array.from({ length: 24 }, (_, i) => {
    const comp = comps[i % comps.length]!;
    const h = TEAMS[(i * 5) % TEAMS.length]!;
    const a = TEAMS[(i * 5 + 3 + (i % 4)) % TEAMS.length]!;
    const p = [1.6 + r() * 2, 3 + r() * 1.5, 1.8 + r() * 3];
    return { id: String(900000 + i), comp, market: '1x2', outs: ['1', 'x', '2'], h, a, start: base + (2 + i * 5) * 3600, p };
  });
  // Other sports: two-way winners (players, esports) and a three-way basketball result, all fictitious.
  const OTHER: { sport: Sport; slug: string; name: string; market: Market; h: string; a: string }[] = [
    { sport: 'tenis', slug: 'tenis-demo-open-tvrdy-povrch', name: 'Demo Open – tvrdý povrch', market: '12', h: 'Adam Novotný', a: 'Petr Svoboda' },
    { sport: 'tenis', slug: 'tenis-demo-open-tvrdy-povrch', name: 'Demo Open – tvrdý povrch', market: '12', h: 'Tomáš Král', a: 'Jakub Marek' },
    { sport: 'sipky', slug: 'sipky-demo-darts-liga', name: 'Demo Darts Liga', market: '12', h: 'Karel Dvořák', a: 'Jan Procházka' },
    { sport: 'esporty', slug: 'esporty-counter-strike-demo-cup', name: 'Counter Strike: Demo Cup', market: '12', h: 'Modří lvi', a: 'Rudí sokoli' },
    { sport: 'volejbal', slug: 'volejbal-demo-liga', name: 'Demo liga', market: '12', h: 'Bílí orli', a: 'Černí jestřábi' },
    { sport: 'basketbal', slug: 'basketbal-demo-liga', name: 'Demo liga', market: '1x2', h: 'Zelení vlci', a: 'Žlutí býci' },
  ];
  OTHER.forEach((o, i) => {
    const two = o.market === '12';
    events.push({ id: String(910000 + i), comp: { slug: o.slug, name: o.name, sport: o.sport }, market: o.market, outs: two ? ['1', '2'] : ['1', 'x', '2'], h: o.h, a: o.a,
      start: base + (3 + i * 4) * 3600, p: two ? [1.4 + r() * 1.5, 1.6 + r() * 1.8] : [1.5 + r() * 1.5, 9 + r() * 4, 1.8 + r() * 2] });
  });
  // 30 hourly snapshots: each price wanders a little; Chance occasionally differs from Tipsport.
  const steps = 30;
  const walk = events.map((e) => e.p.map((p) => [p] as number[]));
  for (let s = 1; s < steps; s++) for (const w of walk) for (const series of w) {
    const last = series[series.length - 1]!;
    series.push(r() < 0.25 ? Math.max(1.05, last * (1 + (r() - 0.5) * 0.12)) : last);
  }
  for (let s = 0; s < steps; s++) {
    const at = now - (steps - 1 - s) * 3600;
    for (const book of ['tipsport', 'chance'] as FeedBook[]) {
      const matches: SourceMatch[] = events.filter((e) => e.start > at).map((e, i) => {
        const w = walk[events.indexOf(e)]!;
        const tweak = book === 'chance' && i % 7 === 0 ? 1.03 : 1;
        return {
          book, srcId: e.id, sport: e.comp.sport, competition: e.comp.slug, competitionName: e.comp.name, srcCompetition: e.comp.name, home: e.h, away: e.a, startAt: e.start,
          path: '', market: e.market, marketName: e.market === '12' ? 'Vítěz zápasu' : 'Výsledek zápasu',
          outcomes: e.outs.map((o, k) => ({ outcome: o, odds: Math.round(w[k]![s]! * tweak * 100) * 10, enabled: true })),
        };
      });
      await storeBook(db, { book, fetchedAt: at + (book === 'chance' ? 5 : 0), matches, rawCount: matches.length }, cfg, at);
    }
  }
  return derive(db, cfg, now).then((d) => ({ demo: true, events: d.events }));
}
