/**
 * Result sentences of the three newer calculators (odds formats, dutching/surebet, value from the visitor's own
 * estimate). Shared by the server render (works without JS) and src/scripts/calc.ts (live update), so both say the same.
 * Money is always conditional ("pokud …"); nothing here is a prediction.
 */
import { convertOdds, dutching, expectedValue, parseOdds, type OddsFormat } from '../server/calc/odds';
import { kc } from './format';

export type Part = string | { b: string };
export type Result = Part[] | { error: string };

const pc = (n: number) => `${(Math.round(n * 10) / 10).toString().replace('.', ',')} %`;
const dec = (n: number) => n.toFixed(2).replace('.', ',');

export function convertText(value: string, format: OddsFormat): Result {
  const d = parseOdds(value, format);
  if (d === null) return { error: format === 'fractional' ? 'Zadej zlomek, například 5/2.' : format === 'american' ? 'Zadej americký kurz, například +150 nebo −200.' : 'Zadej kurz větší než 1, například 2,50.' };
  const c = convertOdds(d);
  return ['Desetinný ', { b: c.decimal }, ' · zlomkový ', { b: c.fractional }, ' · americký ', { b: c.american }, '.'];
}

export function dutchText(stake: number, odds: number[]): Result {
  const valid = odds.filter((o) => o > 1 && o <= 1000);
  if (!(stake > 0 && stake <= 1e9) || valid.length < 2 || valid.length !== odds.length) return { error: 'Zadej vklad v Kč a aspoň dva kurzy větší než 1.' };
  const r = dutching(stake, valid);
  const parts: Part[] = ['Rozdělení: '];
  valid.forEach((o, i) => parts.push(i ? ', ' : '', { b: kc(r.stakes[i]!) }, ` na kurz ${dec(o)}`));
  parts.push('. Pokud vyhraje kterýkoli z těchto výsledků, dostaneš ', { b: kc(r.payout) }, ' včetně vkladu. Čistý výsledek je ', { b: `${r.profit >= 0 ? '+' : '−'}${kc(Math.abs(r.profit))}` }, '. ');
  parts.push(r.surebet
    ? 'Součet 1 ÷ kurz je pod 1, takže při těchto kurzech vychází zisk. Zaručený je jen tehdy, když zadané výsledky pokrývají všechny možné konce zápasu a obě kanceláře sázku vyhodnotí stejně. Taková situace se jmenuje surebet.'
    : 'Součet 1 ÷ kurz je 1 nebo víc, takže to není surebet: při těchto kurzech zisk zaručený není.');
  return parts;
}

export function valueText(odds: number, probPct: number): Result {
  if (!(odds > 1 && odds <= 1000) || !(probPct > 0 && probPct < 100)) return { error: 'Zadej kurz větší než 1 a svůj odhad v procentech mezi 0 a 100.' };
  const r = expectedValue(odds, probPct);
  const sign = r.ev >= 0 ? '+' : '−';
  return [
    'Aby se sázka s kurzem ', dec(odds), ' dlouhodobě vyplatila, musela by vyjít aspoň v ', { b: pc(r.breakEvenPct) }, ' případů. Při tvém odhadu ', { b: pc(probPct) },
    ' vychází očekávaný výsledek ', { b: `${sign}${pc(Math.abs(r.ev * 100))}` }, ' vkladu, u 100 Kč zhruba ', { b: `${sign}${kc(Math.abs(r.ev * 100))}` },
    '. Je to jen výpočet z tvého odhadu. Nevíme, jestli je správný, a žádnou šanci nepředpovídáme.',
  ];
}
