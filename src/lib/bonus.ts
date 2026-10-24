/**
 * Plain arithmetic and wording on the bookmakers' published bonus terms. Pure, unit-tested.
 * Nothing here says a bonus is "free", a good deal, or that it will be earned: it describes what has to be staked and when.
 */
import { BONUSES, FRESH_DAYS, type Bonus } from '../config/bonuses';
import { kc } from './format';

const odds = (o: number) => o.toFixed(1).replace('.', ',');

/** Stakes needed per 1 Kč of bonus (10 means: stake ten times the bonus). */
export const wagerMultiple = (b: Bonus) => b.tier.wager / b.tier.bonus;
/** Fewest days it can take: the daily cap limits how much of the stakes counts each day. */
export const minDays = (b: Bonus) => Math.ceil(b.tier.wager / b.tier.dailyCap);

/** Easiest terms first: fewest stakes per Kč of bonus, then the lower minimum odds, then the faster one. */
export function rank(list: Bonus[] = BONUSES): Bonus[] {
  return [...list].sort((a, b) => wagerMultiple(a) - wagerMultiple(b) || a.tier.minOdds - b.tier.minOdds || minDays(a) - minDays(b));
}

/** Figures are shown only while the check is recent; ISO date, `nowMs` in milliseconds. */
export function isFresh(b: Bonus, nowMs: number): boolean {
  const t = Date.parse(`${b.verifiedAt}T12:00:00Z`);
  return Number.isFinite(t) && nowMs - t <= FRESH_DAYS * 86400_000 && nowMs >= t - 86400_000;
}

export const czDate = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return `${d}. ${m}. ${y}`; };

/** The conditions for the published example deposit, as sentences. */
export function terms(b: Bonus): string[] {
  const t = b.tier;
  const days = minDays(b);
  return [
    `Při prvním vkladu ${kc(t.deposit)} je vstupní bonus ${kc(t.bonus)}.`,
    `Abys ho dostal, musíš prosázet ${kc(t.wager)} na tiketech s kurzem aspoň ${odds(t.minOdds)}.`,
    `Do nároku se denně počítají sázky nejvýš ${kc(t.dailyCap)}, takže to trvá nejméně ${days} ${days === 1 ? 'den' : days < 5 ? 'dny' : 'dní'}.`,
    `Bonus se vyplácí po částech: za každých ${kc(t.payEvery)} prosázených ${kc(t.pay)}.`,
    ...(t.deadlineDays ? [`Sázky musíš uzavřít do ${t.deadlineDays} dní od aktivace bonusu.${days >= t.deadlineDays ? ' Při denním stropu to vychází přesně na celou lhůtu, takže nemáš žádnou rezervu.' : ''}`] : []),
    ...(t.excludes ? [t.excludes] : []),
  ];
}

/** One line for a comparison row. */
export function short(b: Bonus): string {
  const t = b.tier;
  return `Vklad ${kc(t.deposit)} → bonus ${kc(t.bonus)}; prosázet ${kc(t.wager)} při kurzu ${odds(t.minOdds)}+`;
}

/** What the notice under every bonus block must say (checked in tests). */
export const NOTICE = {
  age: 'Hazardní hry jsou zakázané osobám mladším 18 let a mohou způsobit závislost.',
  ad: 'Reklama: odkazy jsou partnerské, za registraci můžeme dostat odměnu.',
};
