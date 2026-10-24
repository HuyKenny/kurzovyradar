/**
 * Welcome bonuses of the partner bookmakers, sports betting only (casino and free spins are not covered).
 * Every figure is copied from the bookmaker's own page with the date we checked it; nothing is inferred. When the check is older
 * than FRESH_DAYS the site stops showing the figures (lib/bonus.ts) and sends the visitor to the bookmaker instead.
 * Re-check weekly: scripts/kurzovyradar/bonusy-over.mjs (Chance) and the Apify fetch of tipsport.cz/bonusy (JS page).
 */
import type { BookId } from './bookmakers';

export const FRESH_DAYS = 21;

/** What the bookmaker publishes for one first-deposit amount (the amount shown by its own calculator). */
export interface BonusTier {
  /** First deposit, Kč. */
  deposit: number;
  /** Entry bonus for that deposit, Kč. */
  bonus: number;
  /** Stakes to place before the bonus is paid, Kč. */
  wager: number;
  /** Minimum odds of a ticket that counts. */
  minOdds: number;
  /** The most stakes that count towards the bonus per day, Kč. */
  dailyCap: number;
  /** The bonus is paid in parts: `pay` Kč for every `payEvery` Kč of stakes. */
  payEvery: number;
  pay: number;
  /** Days from activation to place the stakes, when the bookmaker states a deadline. */
  deadlineDays?: number;
  /** What does not count towards the stakes, when the bookmaker lists it. */
  excludes?: string;
}

export interface Bonus {
  book: Extract<BookId, 'tipsport' | 'chance' | 'allwyn'>;
  /** Name when it differs from the bookmaker's (Allwyn runs the betting as Sazkabet). */
  label?: string;
  /** What the bookmaker advertises, in our words (no quotation marks: a paraphrase of its banner). */
  headline: string;
  /** What the bookmaker says about the registration bonus, and any difference between its own pages. */
  registration: string;
  registrationNote?: string;
  /** Highest entry bonus the bookmaker advertises, Kč. */
  maxBonus: number;
  tier: BonusTier;
  sources: { label: string; url: string }[];
  /** ISO date of the check. */
  verifiedAt: string;
}

export const BONUSES: Bonus[] = [
  {
    book: 'tipsport',
    headline: 'Tipsport uvádí 1 000 Kč za registraci a k tomu vstupní bonus až 50 000 Kč.',
    registration: '1 000 Kč za registraci (podle banneru Tipsportu)',
    registrationNote: 'Na stránce Bonusy Tipsport u karty „Registrační bonus“ uvádí 500 Kč za dokončení registrace. Z čeho se 1 000 Kč skládá, z oficiálních stránek nevyčteme, ověř si to při registraci.',
    maxBonus: 50_000,
    tier: { deposit: 1000, bonus: 1000, wager: 10_000, minOdds: 1.5, dailyCap: 500, payEvery: 1000, pay: 100 },
    sources: [
      { label: 'Tipsport – Bonusy', url: 'https://www.tipsport.cz/bonusy' },
      { label: 'Tipsport – Vstupní bonus', url: 'https://www.tipsport.cz/bonusy/vstupni-bonus' },
    ],
    verifiedAt: '2026-10-24',
  },
  {
    book: 'chance',
    headline: 'Chance uvádí 200 Kč jen za registraci a k tomu vstupní bonus až 2 000 Kč.',
    registration: '200 Kč za registraci (podle Chance)',
    maxBonus: 2000,
    tier: { deposit: 1000, bonus: 1000, wager: 14_000, minOdds: 2.0, dailyCap: 2000, payEvery: 1400, pay: 100 },
    sources: [{ label: 'Chance – Vstupní bonus', url: 'https://www.chance.cz/bonusy/vstupni-bonus' }],
    verifiedAt: '2026-10-24',
  },
];

export const ALLWYN: Bonus = {
  book: 'allwyn',
  label: 'Allwyn (Sazkabet)',
  headline: 'Allwyn uvádí 500 Kč za dokončení registrace a k prvnímu vkladu 100 % až do 3 000 Kč.',
  registration: '500 Kč na Můj účet za dokončení plné registrace (podle Allwynu)',
  registrationNote: 'Allwyn bonus podmiňuje registrací přes stránku allwyn.cz/kurzove-sazky, ověřením totožnosti a vkladem do 5 dní od zaslání nabídky (aspoň 100 Kč). Nárok má jen nově registrovaný zákazník.',
  maxBonus: 3000,
  tier: { deposit: 1000, bonus: 1000, wager: 10_000, minOdds: 2.5, dailyCap: 500, payEvery: 500, pay: 50, deadlineDays: 20, excludes: 'Nezapočítávají se kombinované sázky, sázky na výkony hráčů a dlouhodobé sázky.' },
  sources: [
    { label: 'Allwyn – Vstupní bonus Sazkabet', url: 'https://www.allwyn.cz/kurzove-sazky/vyhody/bonusy' },
    { label: 'Allwyn – pravidla akce (PDF, 30. 1. 2026)', url: 'https://sazkacdn.imagelance.com/vyhody/d_sb_bonusy-podminky_26_allwyn-3500.pdf' },
  ],
  verifiedAt: '2026-10-24',
};
BONUSES.push(ALLWYN);

export const bonusOf = (book: string) => BONUSES.find((b) => b.book === book);
