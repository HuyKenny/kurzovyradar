import { describe, expect, it } from 'vitest';
import { testDb } from './d1';
import { dynamicCompetition, variantOf } from '../src/server/normalize/competition';
import { toSource } from '../src/server/normalize/source';
import { storeBook } from '../src/server/store/import';
import { derive } from '../src/server/store/derive';
import { settings, type ProviderResult, type SourceMatch } from '../src/server/types';
import type { UpcomingSnapshot } from '../src/server/view';
import { ticketView, outcomesFor } from '../src/lib/ticket';
import { outcomeSentence, selectionName, settlement, winCondition, betTarget, ifPhrase } from '../src/lib/market';
import { betUrl } from '../src/lib/links';
import { picks } from '../src/lib/picks';
import { SPORTS, SPORT_LIST, SPORT_IDS } from '../src/config/competitions';

const cfg = settings({});
const T0 = 1_800_000_000;
const KICK = T0 + 86400;

describe('competitions from platform names', () => {
  it('variant: women, doubles, juniors, rugby code', () => {
    expect(variantOf('tenis', 'Tenis muži - dvouhra')).toEqual({ gender: 'muzi', label: '' });
    expect(variantOf('tenis', 'Tenis ženy - dvouhra')).toEqual({ gender: 'zeny', label: 'ženy' });
    expect(variantOf('tenis', 'Tenis muži - čtyřhra')).toEqual({ gender: 'muzi', label: 'čtyřhra' });
    expect(variantOf('tenis', 'Tenis ženy - čtyřhra')).toEqual({ gender: 'zeny', label: 'ženy, čtyřhra' });
    expect(variantOf('hokej', 'Lední hokej - junioři').label).toBe('junioři');
    expect(variantOf('rugby', 'Rugby union - muži').label).toBe('union');
    expect(variantOf('basketbal', 'Basketbal - ženy')).toEqual({ gender: 'zeny', label: 'ženy' });
  });
  it('men and women of the same league name get different competitions', () => {
    const m = dynamicCompetition('basketbal', 'Španělská liga', 'Basketbal - muži')!;
    const w = dynamicCompetition('basketbal', 'Španělská liga', 'Basketbal - ženy')!;
    expect(m).toMatchObject({ slug: 'basketbal-spanelska-liga', name: 'Španělská liga' });
    expect(w).toMatchObject({ slug: 'basketbal-spanelska-liga-zeny', name: 'Španělská liga (ženy)' });
    expect(dynamicCompetition('volejbal', 'Španělská liga', 'Volejbal - muži')!.slug).toBe('volejbal-spanelska-liga'); // another sport, another slug
  });
  it('esports: the game is part of the competition', () => {
    expect(dynamicCompetition('esporty', 'Dfrag', 'Counter Strike')).toMatchObject({ slug: 'esporty-counter-strike-dfrag', name: 'Counter Strike: Dfrag' });
  });
  it('every sport has a platform id and a page path; ids are unique', () => {
    expect(new Set(Object.keys(SPORT_IDS)).size).toBe(SPORT_LIST.length);
    for (const s of SPORT_LIST) expect(SPORTS[s].path).toBe(`/${s}/`);
  });
});

describe('source normalization for the new sports', () => {
  const darts = { id: 9001, idSuperSport: 42, idSport: -27, nameSport: 'Šipky', nameCompetition: 'Modus Darts Live League', idCompetition: 5, matchType: 'PREMATCH', ended: false,
    homeParticipant: 'Ulrich Ricardo', visitingParticipant: 'Usher Graham', dateStart: KICK * 1000, matchUrl: '/kurzy/zapas/sipky-ulrich-usher/9001',
    mainEvent: { name: 'Vítěz zápasu', mySelectionId: '42-WINNER_2W-1', opps: [{ type: '1', odd: 1.86 }, { type: '2', odd: 1.86 }] } };
  it('darts: two-way winner, competition from the platform name', () => {
    expect(toSource('tipsport', darts)).toMatchObject({ sport: 'sipky', market: '12', competition: 'sipky-modus-darts-live-league', home: 'Ulrich Ricardo' });
  });
  it('a multi-runner "Vítěz" (racing, politics) is skipped; so is a match against itself', () => {
    expect(toSource('tipsport', { ...darts, idSuperSport: 49, mainEvent: { name: 'Vítěz', mySelectionId: '49-WINNER_NWAY-a', opps: [] } })).toBeNull();
    expect(toSource('tipsport', { ...darts, visitingParticipant: 'Ulrich Ricardo' })).toBeNull();
  });
  it('a three-way basketball result keeps its draw outcome', () => {
    const b = toSource('tipsport', { ...darts, idSuperSport: 7, idSport: -11, nameSport: 'Basketbal - muži', nameCompetition: 'NBA',
      mainEvent: { name: 'Výsledek zápasu', mySelectionId: '7-WINNER_3W-1', opps: [{ type: '1', odd: 1.5 }, { type: 'x', odd: 12 }, { type: '2', odd: 2.4 }] } });
    expect(b).toMatchObject({ sport: 'basketbal', market: '1x2' });
    expect(b!.outcomes).toHaveLength(3);
  });
});

describe('a two-way event end to end', () => {
  const two = (book: 'tipsport' | 'chance', odds: [number, number], over: Partial<SourceMatch> = {}): SourceMatch => ({
    book, srcId: '9001', sport: 'tenis', competition: 'tenis-wta-tokyo', competitionName: 'WTA Tokyo', srcCompetition: 'WTA Tokyo', home: 'Anna Novak', away: 'Eva Svoboda',
    startAt: KICK, path: '/kurzy/zapas/tenis-novak-svoboda/9001', market: '12', marketName: 'Vítěz zápasu',
    outcomes: [{ outcome: '1', odds: odds[0], enabled: true }, { outcome: '2', odds: odds[1], enabled: true }], ...over,
  });
  const res = (book: 'tipsport' | 'chance', at: number, m: SourceMatch[]): ProviderResult => ({ book, fetchedAt: at, matches: m, rawCount: m.length });
  it('creates the competition, stores market 12, pairs both books and exposes only outcomes 1 and 2', async () => {
    const db = testDb();
    await storeBook(db, res('tipsport', T0, [two('tipsport', [1860, 1960])]), cfg, T0);
    await storeBook(db, res('chance', T0 + 5, [two('chance', [1860, 2000])]), cfg, T0 + 5);
    expect(db.raw.prepare("SELECT slug, name, sport FROM competitions WHERE slug = 'tenis-wta-tokyo'").get()).toEqual({ slug: 'tenis-wta-tokyo', name: 'WTA Tokyo', sport: 'tenis' });
    expect(db.raw.prepare('SELECT COUNT(*) n FROM events').get()).toEqual({ n: 1 });
    expect(db.raw.prepare('SELECT market FROM events').get()).toEqual({ market: '12' });
    expect(db.raw.prepare("SELECT COUNT(*) n FROM offers WHERE market = '12'").get()).toEqual({ n: 4 });
    await derive(db, cfg, T0 + 60);
    const up = JSON.parse((db.raw.prepare("SELECT json FROM derived WHERE key = 'upcoming'").get() as { json: string }).json) as UpcomingSnapshot;
    const ev = up.events[0]!;
    expect(ev).toMatchObject({ market: '12', sport: 'tenis', compName: 'WTA Tokyo' });
    expect(outcomesFor(ev)).toEqual(['1', '2']);
    const v = ticketView(ev, up.books, T0 + 60, cfg);
    expect(v.outcomes.map((o) => o.outcome)).toEqual(['1', '2']);
    expect(v.outcomes[1]!.best).toMatchObject({ odds: 2000, books: ['chance'] });
    expect(v.outcomes[0]!.same).toBe(true); // equal price for outcome 1 is not an advantage
    expect(v.allSame).toBe(false);
  });
  it('a three-way and a two-way source of the same match are not paired', async () => {
    const db = testDb();
    await storeBook(db, res('tipsport', T0, [two('tipsport', [1860, 1960])]), cfg, T0);
    const three = two('chance', [1860, 1960], { market: '1x2', marketName: 'Výsledek zápasu', outcomes: [{ outcome: '1', odds: 1860, enabled: true }, { outcome: 'x', odds: 4000, enabled: true }, { outcome: '2', odds: 1960, enabled: true }] });
    await storeBook(db, res('chance', T0 + 5, [three]), cfg, T0 + 5);
    expect(db.raw.prepare('SELECT COUNT(*) n FROM events').get()).toEqual({ n: 2 });
  });
  it('a two-way event produces picks only for outcomes 1 and 2, with a link that says market 12', async () => {
    const db = testDb();
    await storeBook(db, res('tipsport', T0, [two('tipsport', [1860, 1960])]), cfg, T0);
    await storeBook(db, res('chance', T0 + 5, [two('chance', [1860, 2100])]), cfg, T0 + 5);
    await derive(db, cfg, T0 + 60);
    const up = JSON.parse((db.raw.prepare("SELECT json FROM derived WHERE key = 'upcoming'").get() as { json: string }).json) as UpcomingSnapshot;
    const p = picks(up, null, T0 + 60, cfg);
    expect(p).toHaveLength(1);
    expect(p[0]).toMatchObject({ outcome: '2' });
    expect(betUrl(p[0]!.ev.url, p[0]!.outcome, '/', { market: p[0]!.ev.market })).toContain('trh=12');
  });
});

describe('wording for players, fighters and two-way winners', () => {
  it('tennis: a player wins the match, there is no draw', () => {
    expect(outcomeSentence('tenis', '1', 'Novak', 'Svoboda', '12')).toBe('Hráč Novak vyhraje zápas.');
    expect(selectionName('tenis', '2', 'Novak', 'Svoboda', '12')).toBe('Vítěz zápasu: Svoboda');
    expect(betTarget('tenis', '1', 'Novak', 'Svoboda')).toBe('výhru hráče Novak');
    expect(ifPhrase('tenis', '1', 'Novak', 'Svoboda')).toBe('vyhraje hráč Novak');
    expect(settlement('tenis', '12')).toContain('Remíza tu není');
    expect(winCondition('tenis', '1', 'Novak', 'Svoboda', '12').join(' ')).toContain('pravidla kanceláře');
  });
  it('football and hockey wording is unchanged; other three-way sports do not claim a period they do not know', () => {
    expect(outcomeSentence('fotbal', '1', 'Sparta', 'Slavia')).toBe('Tým Sparta vyhraje po 90 minutách a nastavení.');
    expect(settlement('hokej')).toBe('Platí stav po 60 minutách. Prodloužení ani nájezdy se nepočítají.');
    expect(settlement('basketbal')).toContain('podle pravidel sázky u kanceláře');
    expect(settlement('basketbal')).not.toMatch(/40|48|čtvrtin/);
    expect(selectionName('box', '1', 'A', 'B')).toBe('Výhra: A');
  });
});

describe('a first import of a big offer is spread over several runs', () => {
  const many = (n: number): SourceMatch[] => Array.from({ length: n }, (_, i) => ({
    book: 'tipsport', srcId: String(5000 + i), sport: 'fotbal', competition: 'fotbal-x', competitionName: 'X', srcCompetition: 'X', home: `H${i}`, away: `A${i}`, startAt: KICK + i * 60,
    path: '', market: '1x2', marketName: 'Výsledek zápasu',
    outcomes: [{ outcome: '1', odds: 2000, enabled: true }, { outcome: 'x', odds: 3000, enabled: true }, { outcome: '2', odds: 3500, enabled: true }],
  }));
  it('creates at most maxNewEvents per run, nearest kick-off first, and finishes in the following runs', async () => {
    const db = testDb();
    const c = settings({ MAX_NEW_EVENTS: '40' });
    const feed = (at: number): ProviderResult => ({ book: 'tipsport', fetchedAt: at, matches: many(100), rawCount: 100 });
    await storeBook(db, feed(T0), c, T0);
    expect(db.raw.prepare('SELECT COUNT(*) n FROM events').get()).toEqual({ n: 40 });
    expect(db.raw.prepare('SELECT MAX(start_at) m FROM events').get()).toEqual({ m: KICK + 39 * 60 });
    await storeBook(db, feed(T0 + 900), c, T0 + 900);
    await storeBook(db, feed(T0 + 1800), c, T0 + 1800);
    expect(db.raw.prepare('SELECT COUNT(*) n FROM events').get()).toEqual({ n: 100 });
    expect(db.raw.prepare('SELECT COUNT(*) n FROM offers').get()).toEqual({ n: 300 });
  });
});
