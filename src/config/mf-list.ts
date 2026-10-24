/**
 * Operators with a licence for betting ("kursová sázka", § 3 odst. 2 písm. b zákona 186/2016 Sb.), copied from the Ministry of Finance list
 * "Seznam provozovatelů hazardních her dle ZHH – ke dni 1. 10. 2026". Only what the list states: operator, IČ, seat, web, and the date the
 * licence for that form (land-based = na pobočkách, internet) came into force ("PM" = právní moc). Re-check against the list when it changes.
 */
export const MF_LIST_DATE = '2026-10-01';
export const MF_LIST_URL = 'https://mf.gov.cz/assets/attachments/2026-10-01_Prehled-provozovatelu-ZHH.xlsx';
export const MF_PAGE_URL = 'https://mf.gov.cz/cs/kontrola-a-regulace/hazardni-hry/prehledy-a-statistiky/prehledy-legalnich-provozovatelu-whiteli';

export interface BettingOperator {
  brand: string;
  web: string;
  operator: string;
  ico: string;
  seat: string;
  /** Licence date (právní moc), ISO; null = the list shows no licence for that form. */
  internet: string | null;
  landBased: string | null;
  /** Our page about the brand, when we have one. */
  page?: string;
}

export const BETTING_OPERATORS: BettingOperator[] = [
  { brand: 'Tipsport', web: 'tipsport.cz', operator: 'Tipsport.net a.s.', ico: '28178653', seat: 'Beroun', internet: '2023-08-18', landBased: '2023-08-18', page: '/sazkove-kancelare/tipsport/' },
  { brand: 'Chance', web: 'chance.cz', operator: 'CHANCE a.s.', ico: '28178815', seat: 'Beroun', internet: '2023-08-18', landBased: '2023-08-18', page: '/sazkove-kancelare/chance/' },
  { brand: 'Fortuna', web: 'ifortuna.cz', operator: 'FORTUNA GAME a.s.', ico: '43003575', seat: 'Praha', internet: '2023-11-16', landBased: '2023-11-16', page: '/sazkove-kancelare/fortuna/' },
  { brand: 'Allwyn (Sazkabet)', web: 'allwyn.cz', operator: 'Allwyn Česko a.s.', ico: '26493993', seat: 'Praha', internet: '2024-12-27', landBased: null, page: '/sazkove-kancelare/allwyn/' },
  { brand: 'MerkurXtip', web: 'merkurxtip.cz', operator: 'MerkurXtip a.s.', ico: '27583759', seat: 'Praha', internet: '2022-11-10', landBased: null, page: '/sazkove-kancelare/merkurxtip/' },
  { brand: 'Betano', web: 'betano.cz', operator: 'KAIZEN GAMING CZ LIMITED', ico: '685782826', seat: 'Malta', internet: '2022-03-08', landBased: null, page: '/sazkove-kancelare/betano/' },
  { brand: 'SYNOTtip', web: 'synottip.cz', operator: 'SYNOT TIP, a.s.', ico: '26301091', seat: 'Uherské Hradiště', internet: '2018-12-22', landBased: null, page: '/sazkove-kancelare/synottip/' },
  { brand: 'fBET', web: 'fbet.cz', operator: 'forBET online CZ s.r.o.', ico: '09063315', seat: 'Praha', internet: '2022-06-09', landBased: null, page: '/sazkove-kancelare/fbet/' },
  { brand: 'KingsBet', web: 'kingsbet.cz', operator: 'Greentube CZ a.s.', ico: '14383012', seat: 'Praha', internet: '2024-03-20', landBased: null, page: '/sazkove-kancelare/kingsbet/' },
  { brand: 'BETX (bet-x.cz)', web: 'bet-x.cz', operator: 'EVONA ELECTRONIC, spol. s r.o.', ico: '681920591', seat: 'Bratislava', internet: '2024-09-16', landBased: '2024-09-16', page: '/sazkove-kancelare/betx/' },
  { brand: 'Allinn', web: 'allinn.cz', operator: 'ALEKS CZ a.s.', ico: '26212013', seat: 'Praha', internet: '2026-01-30', landBased: null },
];

/** Brands people search for that are NOT in the list as holders of a betting licence (checked against the same list). */
export const NOT_IN_LIST: { brand: string; note: string; page?: string }[] = [
  { brand: 'Betor (betor.cz)', note: 'V seznamu je provozovatel TRELANGEN a.s. jen s internetovou technickou hrou, kurzové sázky tam uvedené nejsou.', page: '/sazkove-kancelare/betor/' },
  { brand: 'Bonver (bonvercasino.cz)', note: 'V seznamu je BONVER WIN, a.s. s technickou a živou hrou, kurzové sázky tam uvedené nejsou.' },
  { brand: 'LuckyBet (luckybet.cz)', note: 'V seznamu je onebet a.s. s loteriemi, technickou a živou hrou, kurzové sázky tam uvedené nejsou.' },
  { brand: 'bet365', note: 'V seznamu k 1. 10. 2026 nefiguruje žádný provozovatel s touto značkou.', page: '/sazkove-kancelare/bet365/' },
];
