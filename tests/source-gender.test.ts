import { describe, expect, it } from 'vitest';
import { toSource } from '../src/server/normalize/source';
import { storeBook } from '../src/server/store/import';
import { settings } from '../src/server/types';
import { testDb } from './d1';
import sample from './fixtures/platform-sample.json';

const liverpool = sample.matches.find((m) => m.homeParticipant === 'Liverpool')!;
const cfg = settings({});

describe("men's and women's leagues share names; idSport decides", () => {
  it("men's match (idSport -1) stays in the men's league", () => {
    expect(toSource('tipsport', { ...liverpool, idSport: -1 })?.competition).toBe('premier-league');
  });
  it("women's match (idSport 295) goes to the women's league", () => {
    const s = toSource('tipsport', { ...liverpool, idSport: 295, homeParticipant: 'Liverpool Ž', visitingParticipant: 'Brighton Ž' });
    expect(s?.competition).toBe('anglicka-liga-zen');
    expect(s?.home).toBe('Liverpool (ž)');
    expect(s?.srcSportId).toBe('295');
  });
  it('an idSport outside the curated men/women ids still gets a competition, named after the platform and its variant', () => {
    const u21 = toSource('tipsport', { ...liverpool, idSport: 290, nameSport: 'Fotbal - do 21 let' });
    expect(u21).toMatchObject({ sport: 'fotbal', competition: 'fotbal-1-anglicka-liga-do-21-let', competitionName: '1. anglická liga (do 21 let)' });
    expect(toSource('tipsport', { ...liverpool, idSport: -2 })?.competition).not.toBe('premier-league'); // a hockey id on a football match never gets the curated league
  });
  it('an event filed under the wrong league moves when the source says so', async () => {
    const db = testDb();
    const t0 = Math.floor(liverpool.dateStart / 1000) - 86400; // a day before kick-off, so the import still sees it
    const wrong = toSource('tipsport', { ...liverpool, idSport: 295, homeParticipant: 'Liverpool Ž', visitingParticipant: 'Brighton Ž' })!;
    await storeBook(db, { book: 'tipsport', fetchedAt: t0, matches: [{ ...wrong, competition: 'premier-league' }], rawCount: 1 }, cfg, t0);
    await storeBook(db, { book: 'tipsport', fetchedAt: t0 + 900, matches: [wrong], rawCount: 1 }, cfg, t0 + 900);
    const row = db.raw.prepare('SELECT c.slug FROM events e JOIN competitions c ON c.id = e.competition_id').get() as { slug: string };
    expect(row.slug).toBe('anglicka-liga-zen');
    expect((db.raw.prepare('SELECT src_sport_id FROM event_sources').get() as { src_sport_id: string }).src_sport_id).toBe('295');
  });
});
