/**
 * Bookmaker reviews: verified facts only, each with its source. No ratings, stars, bonuses or invented experience.
 * 'info' entries (no partner link) were fact-checked against the operator's own site and the MF list; the working
 * files with quotes are in reports/spinydnes-casina-fakta-2026-10/ (Fortuna, KingsBet, SYNOTtip, fBET).
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
  /** Overview pages only: how the partnership works when the brand is run by a partner under another name. */
  partnerNote?: string;
  /** Things we looked for and could not confirm; shown on 'info' pages so a gap is never read as a "no". */
  unverified?: string[];
  sources: Source[];
}

const MF: Source = { label: 'Ministerstvo financí ČR – seznam legálních provozovatelů hazardních her (ke dni 1. 10. 2026)', url: 'https://mf.gov.cz/cs/kontrola-a-regulace/hazardni-hry/prehledy-a-statistiky/prehledy-legalnich-provozovatelu-whiteli' };

export const REVIEWS: Review[] = [
  {
    id: 'tipsport', checked: '2026-10-24',
    operator: 'Tipsport.net a.s.', ico: '28178653', seat: 'Politických vězňů 156/21, Beroun',
    licence: 'Kurzové sázky na pobočkách i na internetu (tipsport.cz), povolení Ministerstva financí ČR',
    web: 'tipsport.cz',
    inShort: ['Velká česká kancelář s českou licencí, pobočkami i webem.', 'Její kurzy u nás vidíš u každého zápasu.', 'Kurzy má většinou stejné jako Chance (patří do stejné skupiny).'],
    summary: 'Jedna z největších českých sázkových kanceláří zaměřených na kurzové sázky. Vznikla v roce 1991 v Berouně a online sázky nabízí od ledna 2009.',
    facts: [
      { label: 'Ověření totožnosti', value: 'Při registraci. Online sázka: identifikace přes orgány veřejné správy, smluvní partnery nebo osobně se zaměstnancem, věk 18 let se ověřuje proti Registru obyvatel (herní plán § 4)' },
      { label: 'Platební prostředek', value: 'U online sázky se registruje a do 30 dnů ověří vlastní bankovní účet nebo karta. Výběr jde jen na ověřený prostředek (§ 5)' },
      { label: 'Vklad (podle herního plánu)', value: 'Pobočka do 5 000 Kč, platební karta od 100 Kč, bankovní převod, PayU, Skrill, paysafecard (poplatek 5 %)' },
      { label: 'Výběr (podle herního plánu)', value: 'Pobočka 100–5 000 Kč, bankovní převod od 1 000 Kč, Skrill 1 000–30 000 Kč' },
      { label: 'Mobil a orientace v nabídce', value: 'Neověřeno: oficiální zdroj jsme nenašli. Z KurzovéhoRadaru se otevře zápas u kanceláře, výsledek si na něm vybereš sám' },
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
      { label: 'Tipsport.net – Herní plán pro kurzové sázky (schválen MF 14. 3. 2019, účinný od 2. 4. 2019)', url: 'https://minshara.tipsport.cz/datafiles/hp-tipsportnet-as-01042019-cz-1554208441.pdf' },
      { label: 'Lupa.cz – Češi sází na síti první týden (2009)', url: 'https://www.lupa.cz/tiskove-zpravy/cesi-sazi-na-siti-prvni-tyden/' },
      { label: 'Deník.cz – Jaká byla cesta k sázení na internetu (2009)', url: 'https://www.denik.cz/moje_penize/penize_jaka_byla_cesta_k_net_sazeni20090111.html' },
      { label: 'Seznam Zprávy – skupina Tipsport', url: 'https://www.seznamzpravy.cz/clanek/314038' },
    ],
  },
  {
    id: 'chance', checked: '2026-10-24',
    operator: 'CHANCE a.s.', ico: '28178815', seat: 'Politických vězňů 156, Beroun',
    licence: 'Kurzové sázky na pobočkách i na internetu (chance.cz), povolení Ministerstva financí ČR',
    web: 'chance.cz',
    inShort: ['Česká kancelář s licencí, patří do skupiny Tipsport.', 'Její kurzy u nás porovnáváš s Tipsportem u každého zápasu.', 'Většinou nabízí stejné kurzy jako Tipsport, občas se liší.'],
    summary: 'Česká sázková kancelář, od roku 2013 součást skupiny Tipsport. Její jméno nese nejvyšší česká fotbalová soutěž Chance Liga.',
    facts: [
      { label: 'Ověření totožnosti', value: 'Při registraci. Online sázka: identifikace přes orgány veřejné správy, smluvní partnery nebo osobně se zaměstnancem, věk 18 let se ověřuje proti Registru obyvatel (herní plán § 4)' },
      { label: 'Platební prostředek', value: 'U online sázky se registruje a do 30 dnů ověří vlastní bankovní účet nebo karta. Výběr jde jen na ověřený prostředek (§ 5)' },
      { label: 'Vklad (podle herního plánu)', value: 'Pobočka do 5 000 Kč, platební karta od 100 Kč, bankovní převod, PayU, Skrill, paysafecard (poplatek 5 %)' },
      { label: 'Výběr (podle herního plánu)', value: 'Pobočka 100–5 000 Kč, bankovní převod od 1 000 Kč, Skrill 1 000–30 000 Kč' },
      { label: 'Mobil a orientace v nabídce', value: 'Neověřeno: oficiální zdroj jsme nenašli. Z KurzovéhoRadaru se otevře zápas u kanceláře, výsledek si na něm vybereš sám' },
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
      { label: 'CHANCE – Herní plán pro kurzové sázky (schválen MF 14. 3. 2019, účinný od 2. 4. 2019)', url: 'https://home.chance.cz/datafiles/hp-internet-chance.pdf' },
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
      { label: 'Sazkabet', value: 'Název Sazkabet označuje kurzové sázky na allwyn.cz. Adresa sazkabet.cz na ně přesměrovává, viz přehled Sazkabetu' },
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
  {
    id: 'fortuna', checked: '2026-10-19',
    operator: 'FORTUNA GAME a.s.', ico: '43003575', seat: 'Italská 2584/69, Praha 2 – Vinohrady',
    licence: 'Povolení Ministerstva financí ČR (rozhodnutí č. MF-24215/2023/73-34, MF-21348/2022/73-80, MF-21362/2022/73-46, MF-22244/2022/73-73)',
    web: 'ifortuna.cz',
    inShort: ['Velká česká kancelář: sázky, casino, poker, losy a loterie na jednom účtu.', 'Kurzy Fortuny zatím nesledujeme, takže je u nás neporovnáš.', 'S Fortunou nespolupracujeme. Stránka je jen přehled ověřených údajů.'],
    summary: 'Česká kancelář FORTUNA GAME a.s. s pobočkami i online. Na webu ifortuna.cz nabízí kurzové sázky, casino, poker, losy a loterie.',
    facts: [
      { label: 'Registrace', value: 'Formulářem, nebo přes bankovní identitu (BankID)' },
      { label: 'Aplikace', value: 'Fortuna Vegas (casino) pro iOS, Android a Huawei; samostatné aplikace Sport a Poker' },
      { label: 'Pobočky', value: 'Ano, i pro vklady a výběry v hotovosti' },
    ],
    features: [
      'Kurzové sázky, casino, poker, losy a loterie pod jedním účtem',
      'Kamenná síť poboček Fortuna',
      'Registrace přes bankovní identitu',
    ],
    pros: [], limits: [],
    onSite: 'Kurzy Fortuny zatím nesledujeme. Ve srovnání ani v radaru proto nejsou.',
    unverified: ['Aktuální výše a podmínky bonusů (měnily se a nepíšeme je zpaměti)', 'Doba výběru u sázkové části (ověřená data jsou jen pro casino)'],
    sources: [MF, { label: 'ifortuna.cz – registrační bonus a registrace', url: 'https://www.ifortuna.cz/bonus/registracni-bonus' }, { label: 'casino.ifortuna.cz', url: 'https://casino.ifortuna.cz/' }],
  },
  {
    id: 'betano', checked: '2026-10-23',
    operator: 'Provozovatele (právnickou osobu a IČ) jsme z veřejných stránek nepotvrdili', ico: '–', seat: '–',
    licence: 'Betano o sobě na betano.cz/o-nas uvádí, že má licence Ministerstva financí ČR pro kurzové sázení, live sázky, casino a hry s živými dealery',
    web: 'betano.cz',
    inShort: ['Značka patří do skupiny Kaizen Gaming (založena 2012).', 'Na svém webu uvádí českou licenci Ministerstva financí.', 'Kurzy Betana zatím nesledujeme. S Betanem nespolupracujeme.'],
    summary: 'Betano Česká republika je součástí skupiny Kaizen Gaming. Podle vlastního webu nabízí kurzové sázky, live sázky, casino i živé dealery.',
    facts: [
      { label: 'Skupina', value: 'Kaizen Gaming, technologická firma pro hry založená v roce 2012 (podle betano.cz/o-nas)' },
      { label: 'Věk', value: 'Web je dostupný jen osobám starším 18 let' },
    ],
    features: [
      'Kurzové sázky včetně live sázek',
      'Casino a hry s živými dealery',
      'Sázkové funkce jako Bet Builder (podle nabídky na betano.cz)',
    ],
    pros: [], limits: [],
    onSite: 'Kurzy Betana zatím nesledujeme. Ve srovnání ani v radaru proto nejsou.',
    unverified: ['Název provozovatele, IČ a sídlo (na webu jsme je nenašli; platí obchodní podmínky Betana)', 'Čísla povolení Ministerstva financí', 'Aktuální bonusy'],
    sources: [{ label: 'betano.cz – O nás (licence a regulace)', url: 'https://www.betano.cz/o-nas' }],
  },
  {
    id: 'sazkabet', checked: '2026-10-24',
    operator: 'Allwyn Česko a.s.', ico: '26493993', seat: 'Evropská 866/69, Vokovice, 160 00 Praha 6',
    licence: 'Web sazkabet.cz uvádí jako provozovatele Allwyn Česko a.s.; povolení Ministerstva financí ČR najdeš u Allwynu (viz recenze)',
    web: 'sazkabet.cz',
    inShort: ['Sazkabet je název kurzových sázek, které provozuje Allwyn Česko (dříve Sazka).', 'Adresa sazkabet.cz dnes vede na kurzové sázky na allwyn.cz.', 'Allwyn je náš partner, jeho recenzi najdeš zvlášť.'],
    summary: 'Sazkabet je název kurzových sázek, které provozuje Allwyn Česko a.s. (dříve Sazka). Adresa sazkabet.cz přesměrovává na kurzové sázky na allwyn.cz.',
    facts: [
      { label: 'Provozovatel webu', value: 'Allwyn Česko a.s., IČ 26493993 (podle patičky sazkabet.cz)' },
      { label: 'Návaznost názvů', value: 'sazkabet.cz → sazka.cz/kurzove-sazky → allwyn.cz/kurzove-sazky (přesměrování ověřeno 24. 10. 2026). Titulek stránky: „Sazkabet – kurzové sázky, live sázení | Allwyn.cz“' },
      { label: 'Nabídka', value: 'Kurzové sázky a live sázení (podle titulku stránky)' },
    ],
    features: ['Kurzové sázky', 'Live sázení'],
    pros: [], limits: [],
    onSite: 'Kurzy Sazkabetu zatím nesledujeme. Allwyn je náš partner, ale jeho kurzy nemáme připojené.',
    partnerNote: 'S provozovatelem spolupracujeme jako s Allwynem: partnerský odkaz najdeš v recenzi Allwynu, protože jde o týž provoz. Podle adresy vede na registraci na allwyn.cz v kampani označené jako kurzové sázky Sazkabet. Vstupní bonus Allwynu na sázky najdeš na stránce Bonusy.',
    unverified: ['Jestli a kdy se název Sazkabet přestane používat (Allwyn uvedl, že místní značky zatím zůstávají)', 'Aktuální bonusy'],
    sources: [{ label: 'sazkabet.cz', url: 'https://www.sazkabet.cz/' }, { label: 'Forbes.cz – Allwyn zachová místní značky', url: 'https://forbes.cz/konec-jmena-sazka-komarkuv-allwyn-zmenil-nazvy-ctyr-svych-spolecnosti/' }, MF],
  },
  {
    id: 'fbet', checked: '2026-10-22',
    operator: 'forBET online CZ s.r.o.', ico: '09063315', seat: 'Holušická 2253/1, 148 00 Praha 4',
    licence: 'Seznam MF ke dni 1. 10. 2026: internetová kurzová sázka i internetová technická hra na fbet.cz',
    web: 'fbet.cz',
    inShort: ['fBET se do 26. 11. 2024 jmenovala forBET.', 'Má povolení MF pro kurzové sázky na internetu i pro casino.', 'Kurzy fBETu zatím nesledujeme. S fBETem nespolupracujeme.'],
    summary: 'Česká online kancelář fBET (do 26. 11. 2024 forBET). Na fbet.cz nabízí kurzové sázky včetně live a casino fBET Vegas.',
    facts: [
      { label: 'Dříve', value: 'forBET (přejmenování 26. 11. 2024); iforbet.cz přesměrovává na fbet.cz' },
      { label: 'Registrace', value: 'Formulář, potvrzení telefonu a e-mailu, limity a identifikace přes BankID' },
      { label: 'Aplikace', value: 'Nativní aplikaci jsme na webu nenašli, existuje mobilní verze webu (mobile.fbet.cz)' },
      { label: 'Pozor na doménu', value: 'Doména forbet.cz s fBET nesouvisí. Oficiální web je fbet.cz' },
    ],
    features: ['Kurzové sázky (Sporty, LIVE)', 'Casino fBET Vegas', 'Jeden účet pro sázky i casino'],
    pros: [], limits: [],
    onSite: 'Kurzy fBETu zatím nesledujeme. Ve srovnání ani v radaru proto nejsou.',
    unverified: ['Platební metody a výběr na kartu (web je veřejně neuvádí)', 'Nativní mobilní aplikace', 'Aktuální bonusy'],
    sources: [MF, { label: 'fbet.cz', url: 'https://www.fbet.cz/' }, { label: 'fbet.cz – přehled bonusů a pravidla', url: 'https://www.fbet.cz/doc/bonus-prehled' }],
  },
  {
    id: 'synottip', checked: '2026-10-19',
    operator: 'SYNOT TIP, a.s.', ico: '26301091', seat: 'Jaktáře 1475, Uherské Hradiště – Mařatice',
    licence: 'Povolení Ministerstva financí ČR: kursové sázky (MF-28655/2022/73-77), technická hra (MF-28659/2022/73-159), živá hra (MF-28658/2022/73-84)',
    web: 'synottip.cz',
    inShort: ['Česká kancelář ze skupiny SYNOT, s pobočkami i online.', 'Povolení má pro kurzové sázky, technické hry i živou hru.', 'Kurzy SYNOTtipu zatím nesledujeme. S ním nespolupracujeme.'],
    summary: 'SYNOT TIP, a.s. je česká sázková kancelář ze skupiny SYNOT. Na synottip.cz nabízí kurzové sázky a casino.',
    facts: [
      { label: 'Skupina', value: 'SYNOT' },
      { label: 'Registrace', value: 'Formulář s ověřením přes bankovní identitu, nebo rovnou přes bankovní identitu' },
      { label: 'Aplikace', value: 'Společná aplikace SYNOTtip pro Android (casino, poker, sázky). Pro iOS jen webová verze' },
      { label: 'Pobočky', value: 'Ano, herny a pobočky SYNOT TIP' },
    ],
    features: ['Kurzové sázky', 'Online casino a živé casino (Synot Live)', 'Poker', 'Sítě poboček'],
    pros: [], limits: [],
    onSite: 'Kurzy SYNOTtipu zatím nesledujeme. Ve srovnání ani v radaru proto nejsou.',
    unverified: ['Doba zpracování výběru (veřejně neuvedena)', 'iOS aplikace', 'Aktuální bonusy a promokódy'],
    sources: [MF, { label: 'synottip.cz – promoakce a pravidla', url: 'https://muj.synottip.cz/promoakce' }, { label: 'casino.synottip.cz', url: 'https://casino.synottip.cz/' }],
  },
  {
    id: 'kingsbet', checked: '2026-10-19',
    operator: 'Greentube CZ a.s.', ico: '14383012', seat: 'náměstí Republiky 1081/7, Praha 1',
    licence: 'Povolení Ministerstva financí ČR: kursové sázky (MF-37496/2023/73-58), technická hra (MF-46776/2024/73-65), živá hra (MF-23675/2024/73-20)',
    web: 'kingsbet.cz',
    inShort: ['Česká kancelář, od května 2026 součást Greentube (NOVOMATIC).', 'Povolení má pro kurzové sázky, technické hry i živou hru.', 'Kurzy KingsBetu zatím nesledujeme. S ním nespolupracujeme.'],
    summary: 'KingsBet provozuje Greentube CZ a.s., od května 2026 součást skupiny Greentube / NOVOMATIC. Nabízí kurzové sázky a casino.',
    facts: [
      { label: 'Skupina', value: 'Greentube / NOVOMATIC (od května 2026)' },
      { label: 'Registrace', value: 'Po registraci do 30 dnů ověření totožnosti přes Bank iD, platební metody a telefonu a nastavení limitů' },
      { label: 'Aplikace', value: 'Android (Google Play) a iOS (App Store)' },
      { label: 'Live casino', value: 'Ano (Evolution), od října 2024' },
    ],
    features: ['Kurzové sázky', 'Online casino a live casino', 'Aplikace pro Android a iOS', 'Registrace možná i osobně v kiosku'],
    pros: [], limits: [],
    onSite: 'Kurzy KingsBetu zatím nesledujeme. Ve srovnání ani v radaru proto nejsou.',
    unverified: ['Přesný počet her (web uvádí jen „stovky“)', 'Aktuální bonusy'],
    sources: [MF, { label: 'kingsbet.cz', url: 'https://www.kingsbet.cz/' }],
  },
];

export const reviewOf = (id: string) => REVIEWS.find((r) => r.id === id);
