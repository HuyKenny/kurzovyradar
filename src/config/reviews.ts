/**
 * Bookmaker reviews: verified facts only, each with its source. No ratings, stars, bonuses or invented experience.
 * Licences: Ministry of Finance list of legal operators under act 186/2016 Sb. (state 1. 10. 2026),
 * https://mf.gov.cz/assets/attachments/2026-10-01_Prehled-provozovatelu-ZHH.xlsx — columns "Kursová sázka" (land / internet).
 */
import type { BookId } from './bookmakers';

export interface Source { label: string; url: string }
export interface Review {
  id: BookId;
  checked: string; // ISO date of the last check of this content
  operator: string;
  ico: string;
  seat: string;
  licence: string;
  web: string;
  summary: string;
  /** Three plain-language bullets on top of the review. */
  inShort: string[];
  facts: { label: string; value: string }[];
  features: string[];
  pros: string[];
  limits: string[];
  onSite: string; // what KurzovýRadar shows for this bookmaker
  sources: Source[];
}

const MF: Source = { label: 'Ministerstvo financí ČR – seznam legálních provozovatelů hazardních her (ke dni 1. 10. 2026)', url: 'https://mf.gov.cz/cs/kontrola-a-regulace/hazardni-hry/prehledy-a-statistiky/prehledy-legalnich-provozovatelu-whiteli' };

export const REVIEWS: Review[] = [
  {
    id: 'tipsport', checked: '2026-10-23',
    operator: 'Tipsport.net a.s.', ico: '28178653', seat: 'Politických vězňů 156/21, Beroun',
    licence: 'Kurzové sázky na pobočkách i na internetu (tipsport.cz), povolení Ministerstva financí ČR',
    web: 'tipsport.cz',
    inShort: ['Velká česká kancelář s českou licencí, pobočkami i webem.', 'Její kurzy na fotbal a hokej u nás vidíš u každého zápasu.', 'Kurzy má většinou stejné jako Chance (patří do stejné skupiny).'],
    summary: 'Jedna z největších českých sázkových kanceláří zaměřených na kurzové sázky. Vznikla v roce 1991 v Berouně a online sázky nabízí od ledna 2009.',
    facts: [
      { label: 'Založení', value: '1991, Beroun' },
      { label: 'Online sázení', value: 'od 5. 1. 2009' },
      { label: 'Skupina', value: 'Od roku 2013 do skupiny patří i Chance' },
    ],
    features: [
      'Předzápasové i živé kurzové sázky na fotbal, hokej a další sporty',
      'Síť poboček (povolení i pro kurzové sázky mimo internet)',
      'Živé přenosy zápasů (Tipsport TV) pro přihlášené hráče',
      'Stejná sázková platforma jako Chance – zápasy i trhy mají stejnou strukturu',
    ],
    pros: [
      'Nabídka zápasů pokrývá všechny soutěže, které na KurzovémRadaru sledujeme',
      'U každého zápasu porovnáš kurz s Chance na stejnou sázku',
    ],
    limits: [
      'Kurzy se s Chance často shodují, takže výběrem mezi nimi si obvykle nepolepšíš',
      'Živé přenosy jsou dostupné jen po registraci a ověření účtu',
    ],
    onSite: 'Kurzy Tipsportu sledujeme každých 15 minut a jsou součástí srovnání i radaru.',
    sources: [
      MF,
      { label: 'Lupa.cz – Češi sází na síti první týden (2009)', url: 'https://www.lupa.cz/tiskove-zpravy/cesi-sazi-na-siti-prvni-tyden/' },
      { label: 'Deník.cz – Jaká byla cesta k sázení na internetu (2009)', url: 'https://www.denik.cz/moje_penize/penize_jaka_byla_cesta_k_net_sazeni20090111.html' },
      { label: 'Seznam Zprávy – skupina Tipsport', url: 'https://www.seznamzpravy.cz/clanek/314038' },
    ],
  },
  {
    id: 'chance', checked: '2026-10-23',
    operator: 'CHANCE a.s.', ico: '28178815', seat: 'Politických vězňů 156, Beroun',
    licence: 'Kurzové sázky na pobočkách i na internetu (chance.cz), povolení Ministerstva financí ČR',
    web: 'chance.cz',
    inShort: ['Česká kancelář s licencí, patří do skupiny Tipsport.', 'Její kurzy u nás porovnáváš s Tipsportem u každého zápasu.', 'Většinou nabízí stejné kurzy jako Tipsport, občas se liší.'],
    summary: 'Česká sázková kancelář, od roku 2013 součást skupiny Tipsport. Její jméno nese nejvyšší česká fotbalová soutěž Chance Liga.',
    facts: [
      { label: 'Skupina', value: 'Tipsport (od roku 2013)' },
      { label: 'Partnerství', value: 'Název nejvyšší české fotbalové ligy – Chance Liga' },
    ],
    features: [
      'Předzápasové i živé kurzové sázky',
      'Pobočky i online sázení',
      'Stejná sázková platforma jako Tipsport – stejné zápasy a trhy',
    ],
    pros: [
      'Na stejnou sázku rychle porovnáš kurz s Tipsportem',
      'Kurzy občas nabízí odlišně od Tipsportu – takové rozdíly ukazuje náš radar',
    ],
    limits: [
      'Ve většině zápasů jsme naměřili stejné kurzy jako u Tipsportu',
    ],
    onSite: 'Kurzy Chance sledujeme každých 15 minut a jsou součástí srovnání i radaru.',
    sources: [
      MF,
      { label: 'Seznam Zprávy – Chance ve skupině Tipsport', url: 'https://www.seznamzpravy.cz/clanek/314038' },
      { label: 'Finance.cz – ÚOHS: Tipsport může převzít Chance (2012)', url: 'https://www.finance.cz/clanky/361532-uohs-tipsport-muze-prevzit-sveho-konkurenta-chance' },
    ],
  },
  {
    id: 'allwyn', checked: '2026-10-23',
    operator: 'Allwyn Česko a.s.', ico: '26493993', seat: 'Evropská 866/69, Praha 6 – Vokovice',
    licence: 'Kurzové sázky na internetu (allwyn.cz), povolení Ministerstva financí ČR; dále loterie a další hry',
    web: 'allwyn.cz',
    inShort: ['Dřív Sazka. Loterie i kurzové sázky na jednom webu, česká licence.', 'Je to náš partner, ale jeho kurzy zatím nesledujeme.', 'Kurzy si u něj proto porovnej sám přímo na allwyn.cz.'],
    summary: 'Provozovatel loterií známý dříve pod jménem Sazka. Na webu allwyn.cz nabízí v sekci Sporty i kurzové sázky.',
    facts: [
      { label: 'Dříve', value: 'Sazka (přejmenování na Allwyn oznámeno v roce 2025)' },
      { label: 'Skupina', value: 'Allwyn (KKCG)' },
    ],
    features: [
      'Kurzové sázky na allwyn.cz v sekci Sporty',
      'Loterie (Sportka, Eurojackpot) a další hry na stejném webu',
    ],
    pros: [
      'Jeden web pro loterie i kurzové sázky',
    ],
    limits: [
      'Kurzy Allwynu zatím nesledujeme, takže je na KurzovémRadaru neporovnáš',
    ],
    onSite: 'Allwyn je náš partner, jeho kurzy ale zatím nemáme připojené. Ve srovnání a v radaru proto chybí.',
    sources: [
      MF,
      { label: 'Forbes.cz – Sazka se přejmenuje na Allwyn', url: 'https://forbes.cz/sazka-po-sedmdesati-letech-meni-nazev-i-logo-prejmenuje-se-na-allwyn/' },
      { label: 'allwyn.cz – kurzové sázky', url: 'https://www.allwyn.cz/kurzove-sazky' },
    ],
  },
  {
    id: 'merkurxtip', checked: '2026-10-23',
    inShort: ['Online sázková kancelář s českou licencí, kurzové sázky i casino na jednom účtu.', 'Je to náš partner, ale jeho kurzy zatím nesledujeme.', 'Kurzy si u něj porovnej sám přímo na merkurxtip.cz.'],
    operator: 'MerkurXtip a.s.', ico: '27583759', seat: 'Na okraji 335/42, Praha 6',
    licence: 'Kurzové sázky na internetu (merkurxtip.cz), povolení Ministerstva financí ČR; dále technické a živé hry online',
    web: 'merkurxtip.cz',
    summary: 'Online sázková kancelář pod značkou Merkur. Na merkurxtip.cz nabízí kurzové sázky a casino hry.',
    facts: [
      { label: 'Kde sázet', value: 'Jen online (merkurxtip.cz), povolení MF je pro internetové hry' },
    ],
    features: [
      'Kurzové sázky na internetu',
      'Casino hry na stejném účtu (povolení pro technické a živé hry online)',
    ],
    pros: [
      'Kurzové sázky i casino pod jedním účtem',
    ],
    limits: [
      'Kurzy MerkurXtipu zatím nesledujeme, takže je na KurzovémRadaru neporovnáš',
      'Podle seznamu MF nemá povolení pro sázky na pobočkách, jen online',
    ],
    onSite: 'MerkurXtip je náš partner, jeho kurzy ale zatím nemáme připojené. Ve srovnání a v pohybech kurzů proto chybí.',
    sources: [MF, { label: 'merkurxtip.cz', url: 'https://www.merkurxtip.cz/' }],
  },
];

export const reviewOf = (id: string) => REVIEWS.find((r) => r.id === id);
