import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BONUSES, FRESH_DAYS } from '../src/config/bonuses';
import { isFresh, minDays, NOTICE, rank, short, terms, wagerMultiple } from '../src/lib/bonus';

const day = 86400_000;
const n = (s: string) => s.replace(/[\u00a0\u202f]/g, ' '); // Intl groups thousands with a no-break space
const at = (iso: string) => Date.parse(`${iso}T12:00:00Z`);

describe('bonus data', () => {
  it('every bonus has a source, a check date and consistent figures', () => {
    for (const b of BONUSES) {
      expect(b.sources.length, b.book).toBeGreaterThan(0);
      for (const s of b.sources) expect(s.url).toMatch(/^https:\/\/(www\.(tipsport|chance|allwyn)\.cz|sazkacdn\.imagelance\.com)\//);
      expect(b.verifiedAt, b.book).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(b.tier.wager).toBeGreaterThan(b.tier.bonus);
      expect(b.tier.minOdds).toBeGreaterThan(1);
      expect(b.tier.bonus).toBeLessThanOrEqual(b.maxBonus);
    }
  });
  it('the published terms: Tipsport 10× at odds 1,5 (500 Kč a day), Chance 14× at odds 2,0 (2 000 Kč a day)', () => {
    const [ts, ch] = [BONUSES.find((b) => b.book === 'tipsport')!, BONUSES.find((b) => b.book === 'chance')!];
    expect(wagerMultiple(ts)).toBe(10);
    expect(wagerMultiple(ch)).toBe(14);
    expect(minDays(ts)).toBe(20);
    expect(minDays(ch)).toBe(7);
  });
});

describe('ranking and wording', () => {
  it('easiest terms first: Tipsport (10× at 1,5), Allwyn (10× at 2,5), Chance (14× at 2,0); by stakes per Kč of bonus, then minimum odds', () => {
    expect(rank().map((b) => b.book)).toEqual(['tipsport', 'allwyn', 'chance']);
    const a = { ...BONUSES[0]!, book: 'chance' as const, tier: { ...BONUSES[0]!.tier, wager: 10_000, minOdds: 2 } };
    expect(rank([a, BONUSES[0]!]).map((b) => b.tier.minOdds)).toEqual([1.5, 2]);
  });
  it('sentences give the real numbers, including how long the daily cap makes it', () => {
    const t = terms(BONUSES[0]!).map(n);
    expect(t[0]).toBe('Při prvním vkladu 1 000 Kč je vstupní bonus 1 000 Kč.');
    expect(t[1]).toBe('Abys ho dostal, musíš prosázet 10 000 Kč na tiketech s kurzem aspoň 1,5.');
    expect(t[2]).toBe('Do nároku se denně počítají sázky nejvýš 500 Kč, takže to trvá nejméně 20 dní.');
    expect(t[3]).toBe('Bonus se vyplácí po částech: za každých 1 000 Kč prosázených 100 Kč.');
    expect(n(terms(BONUSES[1]!)[2]!)).toContain('nejméně 7 dní');
    expect(n(short(BONUSES[1]!))).toBe('Vklad 1 000 Kč → bonus 1 000 Kč; prosázet 14 000 Kč při kurzu 2,0+');
  });
  it('no promise words in anything we write about a bonus', () => {
    const all = BONUSES.flatMap((b) => [b.headline, b.registration, b.registrationNote ?? '', ...terms(b), short(b)]).join(' ');
    expect(all).not.toMatch(/zdarma|jistý|jistá|garant|bez rizika|vyděl|zaručen/i);
  });
  it('the notice says it is for adults only, can be addictive, and that links are partner links', () => {
    expect(NOTICE.age).toMatch(/18/);
    expect(NOTICE.age).toMatch(/závislost/);
    expect(NOTICE.ad).toMatch(/partnerské/);
  });
});

describe('Allwyn (Sazkabet) terms from its PDF rules of 30. 1. 2026', () => {
  const a = BONUSES.find((b) => b.book === 'allwyn')!;
  it('10× the bonus at odds 2,5, 5 % of the turnover counted a day, 20 days to do it: no slack', () => {
    expect(wagerMultiple(a)).toBe(10);
    expect(a.tier.minOdds).toBe(2.5);
    expect(a.tier.dailyCap).toBe(a.tier.wager * 0.05);
    expect(minDays(a)).toBe(20);
    const t = terms(a).map(n);
    expect(t.some((x) => x.includes('do 20 dní od aktivace') && x.includes('žádnou rezervu'))).toBe(true);
    expect(t.some((x) => x.includes('kombinované sázky'))).toBe(true);
    expect(a.tier.pay / a.tier.payEvery).toBeCloseTo(a.tier.bonus * 0.05 / (a.tier.wager / 20), 10); // 5 % of the bonus per twentieth of the turnover
  });
});

describe('freshness', () => {
  const b = BONUSES[0]!;
  it('shown for 21 days after the check, hidden after that', () => {
    expect(isFresh(b, at(b.verifiedAt) + 1 * day)).toBe(true);
    expect(isFresh(b, at(b.verifiedAt) + FRESH_DAYS * day)).toBe(true);
    expect(isFresh(b, at(b.verifiedAt) + (FRESH_DAYS + 1) * day)).toBe(false);
  });
  it('a check dated in the future is not trusted', () => {
    expect(isFresh({ ...b, verifiedAt: '2099-01-01' }, at('2026-10-24'))).toBe(false);
  });
});

describe('the guide on welcome bonuses', () => {
  const guide = readFileSync(new URL('../src/content/pruvodce/vstupni-bonus-jak-funguje.md', import.meta.url), 'utf8');
  it('uses made-up numbers (it is prerendered, so real figures would go stale) and no promise words', () => {
    expect(guide).toMatch(/vymyšlen/);
    expect(guide).not.toMatch(/Tipsport|Chance|50 000|14 000/);
    expect(guide).not.toMatch(/zdarma|jistý zisk|garantovan|bez rizika/i);
  });
});
