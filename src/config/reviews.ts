/**
 * Bookmaker reviews: verified facts only, each with its source. No ratings, stars, bonuses or invented experience.
 * 'info' entries (no partner link) were fact-checked against the operator's own site and the MF list; the working
 * files with quotes are in reports/spinydnes-casina-fakta-2026-10/ (Fortuna, KingsBet, SYNOTtip, fBET).
 * Licences: Ministry of Finance list of legal operators under act 186/2016 Sb. (state 1. 10. 2026),
 * https://mf.gov.cz/assets/attachments/2026-10-01_Prehled-provozovatelu-ZHH.xlsx — columns "Kursová sázka" (land / internet).
 */
import type { BookId } from './bookmakers';

export interface Source { label: string; url: string }
/** One checked statement; `url` is the page it was read on (shown as "zdroj"). */
export interface Point { text: string; url?: string }
export const SECTION_TITLES = {
  registrace: 'Jak se zaregistrovat',
  aplikace: 'Mobil a aplikace',
  nabidka: 'Co se dá sázet',
  platby: 'Vklady a výběry',
  podpora: 'Podpora',
  odpovedne: 'Odpovědné hraní a limity',
} as const;
export type SectionKey = keyof typeof SECTION_TITLES;

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
  /** Checked statements by topic, each with the page it was read on; a topic without a confirmed statement is simply absent. */
  more?: Partial<Record<SectionKey, Point[]>>;
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
      { label: 'Ověření totožnosti', value: 'Při registraci: totožnost a věk (18 let), kontrola v Rejstříku vyloučených osob a u internetové sázky registrace platebního prostředku (herní plán 2026)' },
      { label: 'Platební prostředek', value: 'Vklad jde jen z vlastní metody, výběr jen na metodu, kterou jsi už použil pro vklad' },
      { label: 'Vklad (nápověda 24. 10. 2026)', value: 'Karta od 100 Kč, rychlý převod od 100 Kč, PayPal od 100 Kč, Skrill od 1 000 Kč, Aircash od 30 Kč, pobočka do 10 000 Kč za 24 hodin; PaysafeCard s poplatkem 5 %, jinak bez poplatku' },
      { label: 'Výběr (nápověda 24. 10. 2026)', value: 'Bez poplatku: karta (každých 15 minut, do 10 000 Kč za den), bankovní převod do 1 pracovního dne, e-peněženky každou hodinu, pobočka do 10 000 Kč za 24 hodin' },
      { label: 'Aplikace', value: 'iOS, Android a Huawei, plus mobilní verze webu' },
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
    more: {
      registrace: [
        { text: "Sázet smí jen osoba, která dovršila 18 let. Registrace probíhá na pobočce nebo na internetu a zahrnuje ověření totožnosti a věku, kontrolu, že nejsi v Rejstříku vyloučených osob, a u internetové sázky registraci platebního prostředku.", url: "https://minshara.tipsport.org/datafiles/hp-ks-tipsportnet-as-ucinnost-1232026-cz-1773222801.pdf" },
        { text: "Přihlašuješ se e-mailem a heslem. První heslo přijde SMS po potvrzení odkazu z e-mailu, při prvním přihlášení se mění. Může být vyžadován druhý prvek ověření přes mobil.", url: "https://minshara.tipsport.org/datafiles/hp-ks-tipsportnet-as-ucinnost-1232026-cz-1773222801.pdf" },
      ],
      aplikace: [
        { text: "Aplikace pro iOS (App Store), Android (Google Play) a Huawei (AppGallery). Herní plán ji uvádí jako mobilní aplikaci Tipsport CZ. Web má i mobilní verzi.", url: "https://www.tipsport.cz/" },
      ],
      nabidka: [
        { text: "Sporty na úvodní stránce: fotbal, lední hokej, tenis, basketbal, stolní tenis, esporty, bojové sporty, box, dostihy, florbal, futsal, golf, házená, kriket, motorsport, rugby, snooker a další.", url: "https://www.tipsport.cz/" },
        { text: "Druhy sázek podle herního plánu: sólo, AKO, Kombinátor, Maxikombi, Extratip, BetBuilder (2 a více příležitostí z jedné události), Mix tiket (live a jiná příležitost) a sázky LIVE.", url: "https://minshara.tipsport.org/datafiles/hp-ks-tipsportnet-as-ucinnost-1232026-cz-1773222801.pdf" },
        { text: "Cashout včetně částečného je v herním plánu. Sázku LIVE nelze stornovat. Maximální čistá výhra z jedné sázky nebo tiketu je 10 milionů Kč.", url: "https://minshara.tipsport.org/datafiles/hp-ks-tipsportnet-as-ucinnost-1232026-cz-1773222801.pdf" },
        { text: "Živé přenosy (Tipsport TV) jsou jen pro registrované s aktivním herním kontem. Web uvádí mimo jiné Tipsport extraligu, NHL, Bundesligu, LaLigu, NBA a tenisové grandslamy.", url: "https://www.tipsport.cz/streamy" },
      ],
      platby: [
        { text: "Vklad: platební karta, bankovní účet (rychlý i běžný převod), Pluso, PaysafeCard, PayPal, Skrill, Aircash, SMS platba a pobočka. Výběr: karta, bankovní účet, Pluso, PaysafeCard, PayPal, Skrill, Aircash a pobočka.", url: "https://www.tipsport.cz/napoveda/kategorie/1159-platebni-metody" },
        { text: "Poplatek za vklad je nulový, kromě PaysafeCard (5 %). Výběr je bez poplatku. Výběr jde jen na metodu, kterou jsi už použil pro vklad, na bankovní účet až po vkladu z bankovního účtu (vklad kartou nestačí).", url: "https://www.tipsport.cz/napoveda/kategorie/1159-platebni-metody" },
        { text: "Výběr na kartu se odesílá každých 15 minut, na ostatní e-peněženky každou hodinu, bankovní převod do 1 pracovního dne, Pluso okamžitě.", url: "https://www.tipsport.cz/napoveda/kategorie/1159-platebni-metody" },
        { text: "Výplata z konta je podle herního plánu bezúplatná a provede se nejpozději do 60 dnů od žádosti. Výhru vyplatí nejpozději do 30 dnů od vyhodnocení (zákonná lhůta, ne běžná doba).", url: "https://minshara.tipsport.org/datafiles/hp-ks-tipsportnet-as-ucinnost-1232026-cz-1773222801.pdf" },
      ],
      podpora: [
        { text: "Telefon +420 267 267 367, e-mail podpora@tipsport.cz. Provozní dobu jsme na stránce nenašli.", url: "https://www.tipsport.cz/napoveda/kategorie/541-identifikacni-a-kontaktni-udaje" },
        { text: "Na pobočce se podle herního plánu může k sázce připočíst manipulační poplatek 10 % ze sázky (provozovatel ho může snížit).", url: "https://minshara.tipsport.org/datafiles/hp-ks-tipsportnet-as-ucinnost-1232026-cz-1773222801.pdf" },
      ],
      odpovedne: [
        { text: "Nástroje: sebeomezující opatření (limity), Krátká pauza (nelze vkládat ani sázet, výběry fungují) a vyloučení do Rejstříku vyloučených osob na 48 hodin nebo natrvalo.", url: "https://www.tipsport.cz/napoveda/kategorie/367-zodpovedne-hrani" },
        { text: "Limity se nastavují pro sázky za den a měsíc, čistou prohru, počet přihlášení a délku přihlášení. Zpřísnění platí do 24 hodin, zmírnění nejdříve od 7. dne.", url: "https://minshara.tipsport.org/datafiles/hp-ks-tipsportnet-as-ucinnost-1232026-cz-1773222801.pdf" },
        { text: "Anonymní linka pomoci: +420 777 477 877, web zodpovednehrani.cz.", url: "https://www.tipsport.cz/napoveda/kategorie/367-zodpovedne-hrani" },
      ],
    },
    unverified: ["Počet poboček (seznam se nenačetl, oficiální číslo jsme nenašli)", "Provozní doba zákaznické podpory a jestli je chat", "Postup registrace krok za krokem a jestli jde ověřit totožnost přes BankID nebo nahráním dokladu", "Velikost nabídky BetBuilderu"],
    sources: [
      MF,
      { label: 'Tipsport – herní plán kurzových sázek (2026)', url: 'https://minshara.tipsport.org/datafiles/hp-ks-tipsportnet-as-ucinnost-1232026-cz-1773222801.pdf' },
      { label: 'Tipsport – nápověda: platební metody', url: 'https://www.tipsport.cz/napoveda/kategorie/1159-platebni-metody' },
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
      { label: 'Ověření totožnosti', value: 'Při registraci: totožnost a věk (18 let), kontrola v Rejstříku vyloučených osob a u internetové sázky registrace platebního prostředku (herní plán 2026)' },
      { label: 'Platební prostředek', value: 'Vklad jde jen z vlastní metody, výběr jen na metodu, kterou jsi už použil pro vklad' },
      { label: 'Vklad (nápověda 24. 10. 2026)', value: 'Karta od 100 Kč, rychlý převod od 100 Kč, PayPal od 100 Kč, Skrill od 1 000 Kč, Aircash od 30 Kč, pobočka do 10 000 Kč za 24 hodin; PaysafeCard s poplatkem 5 %, jinak bez poplatku' },
      { label: 'Výběr (nápověda 24. 10. 2026)', value: 'Bez poplatku: karta (každých 15 minut, do 10 000 Kč za den), bankovní převod do 1 pracovního dne, e-peněženky každou hodinu, pobočka do 10 000 Kč za 24 hodin' },
      { label: 'Aplikace', value: 'iOS, Android a Huawei, plus mobilní verze webu' },
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
    more: {
      registrace: [
        { text: "Sázet smí jen osoba, která dovršila 18 let. Registrace probíhá na pobočce nebo na internetu a zahrnuje ověření totožnosti a věku, kontrolu, že nejsi v Rejstříku vyloučených osob, a u internetové sázky registraci platebního prostředku.", url: "https://minshara.tipsport.org/datafiles/hp-ks-chance-ucinnost-1232026-ch-1773222809.pdf" },
        { text: "Přihlašuješ se e-mailem a heslem. První heslo přijde SMS po potvrzení odkazu z e-mailu, při prvním přihlášení se mění. Může být vyžadován druhý prvek ověření přes mobil.", url: "https://minshara.tipsport.org/datafiles/hp-ks-chance-ucinnost-1232026-ch-1773222809.pdf" },
      ],
      aplikace: [
        { text: "Aplikace Chance pro iOS (Chance mobile), Android a Huawei (AppGallery). Herní plán ji uvádí jako mobilní aplikaci Chance CZ. Web má i mobilní verzi.", url: "https://www.chance.cz/napoveda" },
      ],
      nabidka: [
        { text: "Cashout před i při zápase u všech typů sázek, na webu i v aplikacích, včetně částečného a automatického cashoutu. Není u tiketů vsazených na pobočce.", url: "https://www.chance.cz/napoveda/kategorie/451-cashout" },
        { text: "BetBuilder spojuje více tipů z jednoho zápasu (fotbal, hokej, tenis, MMA, šipky). Nejvýš 7 příležitostí, nejvyšší kurz 900, nejvýš 10 BetBuilder sázek na tiketu.", url: "https://www.chance.cz/napoveda/kategorie/1229-betbuilder" },
        { text: "Sázku LIVE nelze stornovat. Maximální čistá výhra z jedné sázky je 10 milionů Kč.", url: "https://minshara.tipsport.org/datafiles/hp-ks-chance-ucinnost-1232026-ch-1773222809.pdf" },
        { text: "Živé přenosy vyžadují registraci. Web uvádí Tipsport extraligu, NHL, Chance Národní ligu, Bundesligu, Primera División, NBA a tenisové grandslamy.", url: "https://www.chance.cz/zive-prenosy" },
      ],
      platby: [
        { text: "Vklad: platební karta, bankovní účet (rychlý i běžný převod), Pluso, PaysafeCard, PayPal, Skrill, Aircash, SMS platba a pobočka. Výběr: karta, bankovní účet, Pluso, PaysafeCard, PayPal, Skrill, Aircash a pobočka.", url: "https://www.chance.cz/napoveda/kategorie/1167-platebni-metody" },
        { text: "Poplatek za vklad je nulový, kromě PaysafeCard (5 %). Výběr je bez poplatku. Výběr jde jen na metodu, kterou jsi už použil pro vklad, na bankovní účet až po vkladu z bankovního účtu (vklad kartou nestačí).", url: "https://www.chance.cz/napoveda/kategorie/1167-platebni-metody" },
        { text: "Výběr na kartu se odesílá každých 15 minut, na ostatní e-peněženky každou hodinu, bankovní převod do 1 pracovního dne, Pluso okamžitě.", url: "https://www.chance.cz/napoveda/kategorie/1167-platebni-metody" },
        { text: "Výplata z konta je podle herního plánu bezúplatná a provede se nejpozději do 60 dnů od žádosti. Výhru vyplatí nejpozději do 30 dnů od vyhodnocení (zákonná lhůta, ne běžná doba).", url: "https://minshara.tipsport.org/datafiles/hp-ks-chance-ucinnost-1232026-ch-1773222809.pdf" },
      ],
      podpora: [
        { text: "Telefon +420 233 090 831, e-mail info@chance.cz a webový formulář. Provozní doba po–ne 8:00 až 02:00, po 22. hodině e-mail a chat.", url: "https://www.chance.cz/napoveda/kategorie/12362-uvod" },
        { text: "Seznam poboček na chance.cz obsahuje 156 adres (náš součet ze seznamu, oficiální číslo stránka neuvádí).", url: "https://www.chance.cz/pobocky" },
      ],
      odpovedne: [
        { text: "Nástroje: sebeomezující opatření (limity), Krátká pauza (nelze vkládat ani sázet, výběry fungují) a vyloučení do Rejstříku vyloučených osob na 48 hodin nebo natrvalo.", url: "https://www.chance.cz/napoveda/kategorie/419-zodpovedne-hrani" },
        { text: "Limity se nastavují pro sázky za den a měsíc, čistou prohru, počet přihlášení a délku přihlášení. Zpřísnění platí do 24 hodin, zmírnění nejdříve od 7. dne.", url: "https://minshara.tipsport.org/datafiles/hp-ks-chance-ucinnost-1232026-ch-1773222809.pdf" },
        { text: "Anonymní linka pomoci: +420 777 477 877, web zodpovednehrani.cz.", url: "https://www.chance.cz/napoveda/kategorie/419-zodpovedne-hrani" },
      ],
    },
    unverified: ["Oficiální počet poboček", "Postup registrace krok za krokem a jestli jde ověřit totožnost přes BankID", "Jestli je k dispozici vklad přes Apple Pay (zmíněn jen v textu Typy vkladů)", "Číselné maxima sebeomezujících limitů"],
    sources: [
      MF,
      { label: 'CHANCE – herní plán kurzových sázek (platný odkaz z chance.cz, 2026)', url: 'https://minshara.tipsport.org/datafiles/hp-ks-chance-ucinnost-1232026-ch-1773222809.pdf' },
      { label: 'Chance – nápověda: platební metody', url: 'https://www.chance.cz/napoveda/kategorie/1167-platebni-metody' },
      { label: 'Seznam Zprávy – Chance ve skupině Tipsport', url: 'https://www.seznamzpravy.cz/clanek/314038' },
      { label: 'Finance.cz – ÚOHS: Tipsport může převzít Chance (2012)', url: 'https://www.finance.cz/clanky/361532-uohs-tipsport-muze-prevzit-sveho-konkurenta-chance' },
    ],
  },
  {
    id: 'allwyn', checked: '2026-10-24',
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
    unverified: ["Hodiny chatu a telefonní linky (na stránkách podpory nejsou uvedené)", "Jestli jdou kurzové sázky uzavírat na prodejních místech (herní plán popisuje internetovou hru, hotovost je doložená jen u vkladů a výběrů)", "Jak dlouho trvá ověření totožnosti"],
    more: {
      registrace: [
        { text: "Registrovat se mohou osoby starší 18 let; registrace začíná vyplněním formuláře.", url: "https://www.allwyn.cz/centrum-podpory/online-hrani-na-allwyn-cz/registrace/jak-se-registrovat/jake-jsou-zakladni-kroky-registrace" },
        { text: "Po formuláři následují 4 kroky: ověření e-mailu (odkaz v e-mailu), ověření totožnosti, ověření platební metody a nastavení herních limitů. Tyto fáze ukládá hazardní zákon.", url: "https://www.allwyn.cz/centrum-podpory/online-hrani-na-allwyn-cz/registrace/jak-se-registrovat/jake-jsou-zakladni-kroky-registrace" },
        { text: "Totožnost lze ověřit online přes internetové bankovnictví (BankID při registraci), dvěma doklady online (mobil s fotoaparátem) nebo osobně na terminálu Allwyn.", url: "https://www.allwyn.cz/centrum-podpory/online-hrani-na-allwyn-cz/registrace/jak-se-registrovat/jake-jsou-zakladni-kroky-registrace" },
        { text: "Platební metoda se ověřuje prvním vkladem (karta/bankovní převod/PayPal); první vklad nelze provést hotově na prodejním místě.", url: "https://www.allwyn.cz/centrum-podpory/online-hrani-na-allwyn-cz/vklady/jak-vlozit-a-vybrat-penize-z-meho-herniho-uctu" },
      ],
      aplikace: [
        { text: "Mobilní aplikace Sazkabet pro Android (Google Play, cz.sazka.sazkabet) a iOS (App Store, id1474630249). Na allwyn.cz jsou vedle toho další aplikace: Allwyn Online, Sazka Hry, Allwyn Klub.", url: "https://www.allwyn.cz/mobilni-aplikace/sazkabet" },
        { text: "Minimální podporovaná verze systému je Android 8 a iOS 16.6; aplikace jsou optimalizované pro Android 14+ a iOS 18+.", url: "https://www.allwyn.cz/mobilni-aplikace/sazkabet" },
        { text: "Pro telefony bez Google Play (Huawei, Honor) nabízí Allwyn instalační soubor (APK, 35 MB) ke stažení na webu.", url: "https://www.allwyn.cz/mobilni-aplikace/sazkabet" },
        { text: "Aplikace nabízí podle Allwynu předzápasové i live sázky kombinovatelné na jednom tiketu, vizualizace zápasů a live stream vybraných zápasů.", url: "https://www.allwyn.cz/mobilni-aplikace/sazkabet" },
      ],
      nabidka: [
        { text: "Sporty v nabídce (menu): fotbal, hokej, tenis, basketbal, stolní tenis, bojové sporty, eSport, házená, volejbal, alpské lyžování, americký fotbal, australský fotbal, badminton, baseball, box, florbal, formule 1, futsal, kriket, motosport, politika, rugby league/union, šipky, snooker, společenské (StarDance), squash.", url: "https://www.allwyn.cz/kurzove-sazky/" },
        { text: "Typy sázek podle herního plánu: Sólo, AKO, KOMBI (systémy, max. zpravidla 10 skupin, Tutovky), BetBuilder, Sdružené sázky. Minimální sázka 10 Kč na SÓLO/AKO i celkově na KOMBI.", url: "https://static.sazka.cz/kentico-media/sazka/media/content/herni-plany/2026/2-hp-kurzove-sazky_betbuilder-zmena-nazvu_21-1-26-mkt-allwyn.pdf" },
        { text: "Live sázení: sázky lze uzavřít i v průběhu události, kurzy se průběžně mění; live a předzápasové sázky lze kombinovat na jednom tiketu.", url: "https://static.sazka.cz/kentico-media/sazka/media/content/herni-plany/2026/2-hp-kurzove-sazky_betbuilder-zmena-nazvu_21-1-26-mkt-allwyn.pdf" },
        { text: "CashOut (předčasné vyplacení) existuje: provozovatel nabídne novou výši možné výhry, nárok je jen u sázek, které ještě nejsou vyhodnoceny jako výherní.", url: "https://static.sazka.cz/kentico-media/sazka/media/content/herni-plany/2026/2-hp-kurzove-sazky_betbuilder-zmena-nazvu_21-1-26-mkt-allwyn.pdf" },
      ],
      platby: [
        { text: "Vklady: platební karta, Apple Pay (okamžitě, min. 100 Kč, max. 300 000 Kč); PayPal (okamžitě, 500–300 000 Kč); online bankovní převod (okamžitě, 100–1 000 000 Kč); převod z jiné banky (až 1 pracovní den, min. 100 Kč); hotovost na prodejním místě (okamžitě, 10 Kč, max. 10 000 Kč/24 h). Bankovní převody jen z účtu, jehož je klient majitelem.", url: "https://www.allwyn.cz/centrum-podpory/online-hrani-na-allwyn-cz/vklady/jak-vlozit-a-vybrat-penize-z-meho-herniho-uctu" },
        { text: "Výběry: bankovní převod na vlastní účet v libovolné české bance (až 1 pracovní den, min. 0,01 Kč) a hotovost na prodejním místě (okamžitě, min. 1 Kč, max. 10 000 Kč/24 h). Výběr na kartu není v tabulce uveden.", url: "https://www.allwyn.cz/centrum-podpory/online-hrani-na-allwyn-cz/vklady/jak-vlozit-a-vybrat-penize-z-meho-herniho-uctu" },
        { text: "Výběr na bankovní účet vyžaduje ověřený účet (vklad bankovním převodem min. 100 Kč); podle nápovědy jsou peníze připsány do dvou dnů.", url: "https://www.allwyn.cz/centrum-podpory/online-hrani-na-allwyn-cz/vklady/vyber-penez-online/jak-probiha-vyber-penez-z-meho-uctu-online-na-bankovni-ucet" },
        { text: "Herní plán: výplata z konta je bezúplatná; hotově na místech přijímajících vklady do 10 000 Kč/24 h, převodem na zaregistrovaný platební účet bezodkladně, nejpozději do 60 dnů od žádosti. Výhra se vyplácí nejpozději do 30 dnů od vyhodnocení.", url: "https://static.sazka.cz/kentico-media/sazka/media/content/herni-plany/2026/2-hp-kurzove-sazky_betbuilder-zmena-nazvu_21-1-26-mkt-allwyn.pdf" },
      ],
      podpora: [
        { text: "Kanály: chat (tlačítko Zahájit chat), telefon 266 12 12 12, e-mail info@allwyn.cz, reklamační formulář, Centrum podpory s nápovědou, profily na Facebooku (Messenger), Instagramu a YouTube.", url: "https://www.allwyn.cz/centrum-podpory" },
        { text: "Chat je uváděn jako varianta bez čekání v pořadí.", url: "https://www.allwyn.cz/centrum-podpory" },
      ],
      odpovedne: [
        { text: "Herní limity: 7 limitů ve 3 skupinách (finanční, délka hraní, počet přihlášení): denní a měsíční limit čisté prohry, výše sázek za den/měsíc, počet přihlášení za měsíc, délka přihlášení za den, pauza po odhlášení. Zpřísnění platí ihned, zmírnění nejdříve od 7. dne. Limity se počítají společně pro loterie, losy, kurzové sázky Sazkabet i Sazka Hry.", url: "https://www.allwyn.cz/zodpovedne-hrani" },
        { text: "Dočasné nebo trvalé vyloučení tlačítkem Zablokovat hraní; zmíněn Rejstřík vyloučených osob; nástroj Mentor (přehled hraní, samotest), anonymní test, kalkulačka.", url: "https://www.allwyn.cz/zodpovedne-hrani" },
        { text: "Linka pomoci 777 477 877 (Podané ruce o.p.s., Brno); bezplatné konzultace s terapeutem přes Hedepy. Allwyn uvádí certifikáty zodpovědného hraní EL a WLA.", url: "https://www.allwyn.cz/zodpovedne-hrani" },
        { text: "Nastavení limitů je povinný krok registrace; nástroje (rejstřík vyloučených, sebeomezující opatření, zamezení účasti) uvádí i herní plán.", url: "https://static.sazka.cz/kentico-media/sazka/media/content/herni-plany/2026/2-hp-kurzove-sazky_betbuilder-zmena-nazvu_21-1-26-mkt-allwyn.pdf" },
      ],
    },
    sources: [
      MF,
      { label: 'Forbes.cz – Sazka se přejmenuje na Allwyn', url: 'https://forbes.cz/sazka-po-sedmdesati-letech-meni-nazev-i-logo-prejmenuje-se-na-allwyn/' },
      { label: 'allwyn.cz – kurzové sázky', url: 'https://www.allwyn.cz/kurzove-sazky' },
    ],
  },
  {
    id: 'merkurxtip', checked: '2026-10-24',
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
    unverified: ["Nativní mobilní aplikace: odkaz do Google Play ani App Store jsme na webu nenašli", "Živý chat podpory a poplatky u vkladů a výběrů (stránka je neuvádí)", "Rozsah živých přenosů a seznam sportů mimo fotbal, basketbal, tenis a hokej", "Jestli je herní plán z 9. 2. 2024 stále nejnovější verze"],
    more: {
      registrace: [
        { text: "Registrace je bezplatná; hrát může jen osoba 18+ s bydlištěm v ČR, která dokončila registraci a není vyloučena (sebeomezení, Rejstřík vyloučených osob).", url: "https://www.merkurxtip.cz/faq" },
        { text: "Plná registrace: ověření e-mailu, ověření telefonu, nastavení (nebo odmítnutí) limitů, registrace a ověření platební metody, ověření identity přes BankID.", url: "https://www.merkurxtip.cz/faq" },
        { text: "Ověření platební metody kartou s 3D Secure může proběhnout okamžitě, u jiných metod podle banky; vklad je možný jen z karty/účtu na vlastní jméno.", url: "https://www.merkurxtip.cz/faq" },
        { text: "Herní plán: totožnost a věk ověřuje provozovatel dálkově přes Ministerstvo financí; v registračním formuláři se uvádí mj. rodné číslo/datum narození, adresa, státní občanství, telefon, e-mail. Registraci nelze dokončit bez nastavení nebo odmítnutí sebeomezujících opatření.", url: "https://www.merkurxtip.cz/media/2024-04/priloha-1313125853-1-hp-merkur-xtip-kursova-sazka.pdf" },
      ],
      aplikace: [
        { text: "Podporované systémy podle FAQ: Android 5.0+, iPhone OS 5+ (a vyšší), Windows 10 Mobile; prohlížeče mj. Mobile Safari, Chrome, Firefox, Edge.", url: "https://www.merkurxtip.cz/faq" },
        { text: "Merkur Klub+ je na mobilu dostupný přes tlačítko „+“ ve spodním menu webu (potvrzuje mobilní verzi webu).", url: "https://www.merkurxtip.cz/vernostni-program" },
      ],
      nabidka: [
        { text: "Sportovní sázky: fotbal, basketbal, tenis, hokej a další; sekce Sázení má odkazy na fotbal, basketbal, hokej, tenis. Web uvádí i speciály, navýšené kurzy, BetBuildery a sportovní streamy.", url: "https://www.merkurxtip.cz/sazeni" },
        { text: "Druhy sázek podle herního plánu: sólo a AKO, sdružené sázky (MultipleBet/systémové kombinace), LIVE (živé) sázky; minimální sázka na tiket 10 Kč; max. výhra na tiket 5 000 000 Kč.", url: "https://www.merkurxtip.cz/media/2024-04/priloha-1313125853-1-hp-merkur-xtip-kursova-sazka.pdf" },
        { text: "Cash Out je u předzápasových i live tiketů; nelze ho využít, pokud je událost na tiketu již vyhodnocena jako proherní. Tiket s uplatněným Free Betem Cash Out nemá.", url: "https://www.merkurxtip.cz/media/2023-06/cashout.pdf" },
        { text: "Kamenná síť: web uvádí, že platformu přináší parta provozující síť heren Merkur Casino od roku 1992. V seznamu MF (1. 10. 2026) má MerkurXtip a.s. jen internetové kurzové sázky, internetové technické hry a živé hry, žádné kamenné; síť sázkových poboček tedy není doložena.", url: "https://www.merkurxtip.cz/o-nas" },
        { text: "Casino existuje (500+ her, live casino s Evolution).", url: "https://www.merkurxtip.cz/o-nas" },
      ],
      platby: [
        { text: "Vklady: karta (Visa, Mastercard, Maestro) min. 100 Kč / max. 500 000 Kč okamžitě; bankovní převod min. 100 / max. 500 000 Kč do 3 prac. dnů; Skrill a Paysafe min. 100 / max. 50 000 Kč okamžitě.", url: "https://www.merkurxtip.cz/vklady-vybery" },
        { text: "Výběry: karta, bankovní převod, Skrill, Paysafe, vše min. 100 Kč, max. 500 000 Kč; zpracování do 1 pracovního dne (karta, Skrill, Paysafe u částek do 5 000 Kč v řádech minut, nejpozději do 2. pracovního dne).", url: "https://www.merkurxtip.cz/vklady-vybery" },
        { text: "První výběr na každou platební metodu se ověřuje a může trvat do následujícího pracovního dne; žádosti o výplatu na bankovní účet se schvalují každý pracovní den do 12:00.", url: "https://www.merkurxtip.cz/vklady-vybery" },
      ],
      podpora: [
        { text: "Zákaznická podpora telefonicky +420 221 091 800 každý den 8:00–22:00; e-mail uveden na stránce O nás (chráněn proti robotům); herní plán uvádí support@merkurxtip.cz (dotazy) a info@merkurxtip.cz (reklamace sázek).", url: "https://www.merkurxtip.cz/o-nas" },
      ],
      odpovedne: [
        { text: "Při registraci se musí nastavit nebo odmítnout sebeomezující opatření: max. sázky za den/měsíc, max. čistá prohra za den/měsíc, max. počet přihlášení za měsíc, max. doba denního přihlášení, doba blokace po odhlášení. Zpřísnění platí do 24 hodin, zmírnění nejdříve od 7. dne.", url: "https://www.merkurxtip.cz/media/2024-04/priloha-1313125853-1-hp-merkur-xtip-kursova-sazka.pdf" },
        { text: "Hráč nemůže hrát při zápisu v Rejstříku vyloučených osob (RVO); ověření probíhá při každém přihlášení (herní plán TH/kurz.).", url: "https://www.merkurxtip.cz/faq" },
      ],
    },
    sources: [MF, { label: 'merkurxtip.cz', url: 'https://www.merkurxtip.cz/' }],
  },
  {
    id: 'fortuna', checked: '2026-10-24',
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
    unverified: ['Aktuální výše a podmínky bonusů (měnily se a nepíšeme je zpaměti)', 'Doba výběru u sázkové části (ověřená data jsou jen pro casino)', "Typy limitů a postup sebevyloučení (oficiální stránku jsme neověřili)", "Jestli je herní plán z 8/2025 stále aktuální a jaké jsou dnešní minima a poplatky vkladů a výběrů", "Které zápasy mají živý přenos"],
    more: {
      registrace: [
        { text: "Registrace formulářem (jméno, rodné číslo, telefon, e-mail) nebo přes BankID.", url: "https://account.ifortuna.cz/register-step-1?clientType=casino" },
        { text: "Při registraci přes BankID Fortuna přebírá bankovní účty, které klient potvrdí k předání.", url: "https://napoveda.ifortuna.cz/search?query=bankid" },
        { text: "Herní plán: při podezření může provozovatel požadovat doklad totožnosti k ověření (na pobočce).", url: "https://www.ifortuna.cz/file/68a4646e01299051a5801d80" },
      ],
      aplikace: [
        { text: "Herní plán kursové sázky uvádí aplikace Fortuna Sport pro iOS a Fortuna Sport Android.", url: "https://www.ifortuna.cz/file/68a4646e01299051a5801d80" },
        { text: "Web nabízí Fortuna Sport (iOS, Android, APK), Fortuna Casino a Fortuna Poker; tlačítka otevírají okno ke stažení, ne přímý odkaz do obchodu.", url: "https://www.ifortuna.cz/mobile-app/sportsbook" },
      ],
      nabidka: [
        { text: "Sporty: fotbal, hokej, tenis, basketbal, MMA, plus politické a zábavní sázky; sázky na události v zápase (první střelec, karty).", url: "https://www.ifortuna.cz/" },
        { text: "Live sázky: \"Tento druh sázek ti umožňuje vsadit kdykoliv v průběhu zápasu.\" Rozcestník live.ifortuna.cz; předzápasové a live na jednom tiketu.", url: "https://www.ifortuna.cz/" },
        { text: "Betbuilder: kombinace více tipů z jednoho zápasu na jednom tiketu.", url: "https://www.ifortuna.cz/novinky-analyzy/betbuilder" },
        { text: "Denní živé přenosy z různých sportů (příklady uvedené na webu: Bundesliga, La Liga, Serie A, NHL, NBA). Konkrétní dostupnost přenosů neověřena.", url: "https://www.ifortuna.cz/" },
      ],
      platby: [
        { text: "Vklad: Visa/Mastercard/Maestro, Apple Pay, bankovní tlačítka, PayPal, hotovost na pobočce; min. 100 Kč, max. 300 000 Kč u karty (z 19. 10.).", url: "https://www.ifortuna.cz/cms/vklady-vybery" },
        { text: "Výběr: na účet, kartu (i Apple/Google Pay), PayPal nebo hotově na pobočce; Fortuna odesílá do 2 minut, banka u některých až 72 h; bez poplatků (z 19. 10.).", url: "https://napoveda.ifortuna.cz/search?query=v\u00fdb\u011br" },
        { text: "Herní plán: výplata z konta bezúplatně, nejpozději do 60 dnů od žádosti; výhra do 30 dnů od vyhodnocení (zákonné maximum, ne běžná doba).", url: "https://www.ifortuna.cz/file/68a4646e01299051a5801d80" },
      ],
      podpora: [
        { text: "Chat: robot Radim neustále, živí operátoři 8:00-20:00; kontaktní formulář; nápověda napoveda.ifortuna.cz.", url: "https://www.ifortuna.cz/kontaktni-formular" },
        { text: "Korespondenční adresa FORTUNA GAME a.s., Italská 2584/69, Praha 2.", url: "https://www.ifortuna.cz/kontaktni-formular" },
      ],
      odpovedne: [
        { text: "Web hrajmezodpovedne.cz (Fortuna) popisuje systém včasné detekce problémového hraní; konkrétní limity a sebevyloučení na něm nenalezeny.", url: "https://hrajmezodpovedne.cz" },
        { text: "Herní plán zmiňuje sebeomezující opatření nastavitelná v internetových stránkách a aplikaci.", url: "https://www.ifortuna.cz/file/68a4646e01299051a5801d80" },
        { text: "Web uvádí varování \"Účast na hazardní hře může být škodlivá.\"", url: "https://www.ifortuna.cz/" },
      ],
    },
    sources: [MF, { label: 'ifortuna.cz – registrační bonus a registrace', url: 'https://www.ifortuna.cz/bonus/registracni-bonus' }, { label: 'casino.ifortuna.cz', url: 'https://casino.ifortuna.cz/' }],
  },
  {
    id: 'betano', checked: '2026-10-24',
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
    unverified: ["Telefon a provozní doba podpory", "Minima, maxima a poplatky vkladů a výběrů (jsou jen po přihlášení)", "Herní plán kurzových sázek (PDF jsme nenašli)", "Které zápasy mají živý přenos", "Jestli je aplikace pro Android i mimo Google Play (texty na webu si odporují)"],
    more: {
      registrace: [
        { text: "Podmínky účasti: 18+, nezapsán v Rejstříku vyloučených osob, uzavřená smlouva, dokončená registrace, nebrání nastavená sebeomezující opatření.", url: "https://www.betano.cz/clanky/obchodni-podminky/344493/" },
        { text: "Totožnost a věk (a nezapsání v Rejstříku) ověřuje provozovatel dálkově přes Ministerstvo financí ČR; v registraci se uvádí rodné číslo/datum narození, adresa, občanství, e-mail, telefon.", url: "https://www.betano.cz/clanky/obchodni-podminky/344493/" },
        { text: "K dokončení registrace je nutné nastavit (nebo jednotlivě odmítnout) sebeomezující opatření a zaregistrovat a ověřit platební metodu (převod z vlastního účtu v EU/EHP nebo vlastní karta; ověření online transakcí nebo doložením dokladů). Aktivní může být jen jedna platební metoda.", url: "https://www.betano.cz/clanky/obchodni-podminky/344493/" },
        { text: "Jeden uživatelský účet na osobu; zrušení účtu přes zákaznickou podporu s 14denní výpovědní lhůtou.", url: "https://www.betano.cz/clanky/obchodni-podminky/344493/" },
      ],
      aplikace: [
        { text: "Aplikace Betano pro iOS a Android. Odkazy ze stránky /mobilni/: App Store (id1105421899) a Google Play (com.kaizengaming.betano).", url: "https://www.betano.cz/mobilni/" },
        { text: "Web uvádí plnohodnotné sázení v aplikaci včetně vkladů, výběrů a notifikací; v překladech webu: 'S Betano aplikací pro Android a iOS jste jen jeden klik od sportovního sázení, Casina a Esportů'.", url: "https://www.betano.cz/" },
      ],
      nabidka: [
        { text: "Sporty v menu /mobilni/: fotbal, lední hokej, tenis, basketbal, Formule 1, cyklistika, volejbal, esports, americký fotbal, házená, šipky, MMA, stolní tenis, zimní sporty, baseball, futsal, snooker, vodní pólo, box, golf, MotoGP, rugby, motorsport, kriket a další.", url: "https://www.betano.cz/mobilni/" },
        { text: "Typy sázek: výsledek, počet gólů/bodů, handicapy, hráčské statistiky, speciální sázky, dlouhodobé sázky, AKO; Bet Builder, SuperKombi (podle marketingových textů webu).", url: "https://www.betano.cz/" },
        { text: "Live sázení a streamy u vybraných zápasů; stream obvykle vyžaduje aktivní účet a kladný zůstatek.", url: "https://www.betano.cz/" },
        { text: "Cashout je v nabídce (předčasné vyplacení tiketu).", url: "https://www.betano.cz/" },
        { text: "Minimální sázka na tiket 5 Kč; sázky se uzavírají jen přes internet (žádná síť poboček).", url: "https://www.betano.cz/clanky/obchodni-podminky/344493/" },
      ],
      platby: [
        { text: "Metody podle webu: platební karty, bankovní převody, e-peněženky (např. Skrill), předplacené kupóny Paysafecard; výhry zpravidla do 1–2 pracovních dnů.", url: "https://www.betano.cz/" },
        { text: "Minimální a maximální limity vkladů a případné poplatky jsou v sekcích Můj účet a Vklady (nepřístupné bez přihlášení); účtují se jen Kč; banka může účtovat vlastní poplatky; výběr se podává přes web a může vyžadovat 2FA a doložení identity/karty.", url: "https://www.betano.cz/clanky/obchodni-podminky/344493/" },
        { text: "Vklad musí být vsazen před výběrem, jinak si provozovatel vyhrazuje poplatek a snížení výběru; vrácení výběrů z nesázených prostředků může být omezeno.", url: "https://www.betano.cz/clanky/obchodni-podminky/344493/" },
      ],
      podpora: [
        { text: "Podpora je v češtině. Kontakt je přes sekci Podpora na webu, e-mailem podpora@betano.cz (účet) a stiznosti@betano.cz (námitky).", url: "https://www.betano.cz/clanky/obchodni-podminky/344493/" },
      ],
      odpovedne: [
        { text: "Nástroje: limity vkladů (denní/měsíční), limity sázek a čisté prohry pro kurzové sázky, počet přihlášení, max. doba přihlášení, 48h přestávka tlačítkem 'Zablokovat hraní' (zápis do RVO), sebevyloučení, kontrola reality, sebehodnotící testy, odkazy na pomoc.", url: "https://www.betano.cz/clanky/informace-o-zodpovednem-hrani-a-ochrane-hracu/344331/" },
        { text: "Zápis do RVO lze udělat i přes web a aplikaci Betano na 48 hodin nebo trvale (výmaz nejdříve po roce).", url: "https://www.betano.cz/clanky/informace-o-zodpovednem-hrani-a-ochrane-hracu/344331/" },
        { text: "Pomoc: odkazy na anonymnigambleri.cz, drogy-info.cz, neprohraj.se, podaneruce.cz, GamCare, Gambling Therapy.", url: "https://www.betano.cz/clanky/informace-o-zodpovednem-hrani-a-ochrane-hracu/344331/" },
      ],
    },
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
    unverified: ['Jestli a kdy se název Sazkabet přestane používat (Allwyn uvedl, že místní značky zatím zůstávají)', 'Aktuální bonusy', "Jestli a kdy se název Sazkabet zruší (oficiální prohlášení jsme nenašli, název dál označuje kurzové sázky na allwyn.cz)"],
    more: {
      registrace: [
        { text: "Samostatná registrace Sazkabetu není; kurzové sázky Sazkabet se registrují stejným účtem na allwyn.cz (odkaz Vytvořit účet z /kurzove-sazky/ vede na allwyn.cz/registrace). Podmínky viz Allwyn.", url: "https://www.allwyn.cz/kurzove-sazky/" },
        { text: "Herní plán SAZKABET: registrace je podmínkou účasti, jeden účet i pro další internetové hry provozovatele.", url: "https://static.sazka.cz/kentico-media/sazka/media/content/herni-plany/2026/2-hp-kurzove-sazky_betbuilder-zmena-nazvu_21-1-26-mkt-allwyn.pdf" },
      ],
      aplikace: [
        { text: "Samostatná aplikace Sazkabet (Android cz.sazka.sazkabet; iOS App Store id1474630249), Allwyn ji uvádí v přehledu aplikací vedle Allwyn Online, Sazka Hry a Allwyn Klub.", url: "https://www.allwyn.cz/mobilni-aplikace/sazkabet" },
      ],
      nabidka: [
        { text: "Název Sazkabet stále označuje sekci kurzových sázek na allwyn.cz: „Výhody“ uvádí „Tento symbol znamená, že v ČR tyto výhody nabízí pouze Sazkabet“; soutěže se jmenují „Soutěžte se Sazkabetem“. Nabídku viz Allwyn.", url: "https://www.allwyn.cz/kurzove-sazky/vyhody" },
        { text: "Herní plán se jmenuje „Herní plán kurzových sázek SAZKABET“, platný od 6. 2. 2026; provozovatel Allwyn Česko a.s.", url: "https://static.sazka.cz/kentico-media/sazka/media/content/herni-plany/2026/2-hp-kurzove-sazky_betbuilder-zmena-nazvu_21-1-26-mkt-allwyn.pdf" },
      ],
      platby: [
        { text: "Stejný herní účet a platební metody jako Allwyn (viz allwyn.vklad_vyber).", url: "https://www.allwyn.cz/centrum-podpory/online-hrani-na-allwyn-cz/vklady/jak-vlozit-a-vybrat-penize-z-meho-herniho-uctu" },
      ],
      podpora: [
        { text: "Podpora Sazkabetu je společná s Allwyn (chat, 266 12 12 12, info@allwyn.cz); app FAQ odkazuje na chat zákaznického centra.", url: "https://www.allwyn.cz/mobilni-aplikace/sazkabet" },
      ],
      odpovedne: [
        { text: "Herní limity se výslovně počítají i pro kurzové sázky Sazkabet; sebeomezující opatření jsou společná pro kurzové sázky, loterie, technické a živé hry.", url: "https://www.allwyn.cz/zodpovedne-hrani" },
      ],
    },
    sources: [{ label: 'sazkabet.cz', url: 'https://www.sazkabet.cz/' }, { label: 'Forbes.cz – Allwyn zachová místní značky', url: 'https://forbes.cz/konec-jmena-sazka-komarkuv-allwyn-zmenil-nazvy-ctyr-svych-spolecnosti/' }, MF],
  },
  {
    id: 'fbet', checked: '2026-10-24',
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
    unverified: ["Nativní mobilní aplikace (nenašli jsme)", "Platební metody, minima, poplatky a doby vkladů a výběrů (web je veřejně neuvádí)", "Živé přenosy sportu", "Provozní doba podpory na aktuální kontaktní stránce"],
    more: {
      registrace: [
        { text: "Postup: vyplnit formulář, potvrdit telefon a e-mail, nastavit herní limity, identifikace přes BankID, přidat a ověřit platební metodu vkladem. Identifikaci umí Air Bank, ČS, ČSOB, Fio, KB, Moneta, Raiffeisenbank, Creditas, mBank, UniCredit.", url: "https://www.fbet.cz/doc/faq" },
        { text: "Herní plán (schválen MF, podepsán 27. 5. 2026): registrace zahrnuje ověření totožnosti, věku a nezapsání v Rejstříku; jedno konto na osobu; vklad na konto jen bezhotovostně aktivní platební metodou.", url: "https://www.fbet.cz/static/downloads/terms/Herni_plan_-_Kurzova_sazka_-_MF-31403-2021-73-46.pdf" },
        { text: "Problémy s registrací řeší chat a podpora@fbet.cz. Ve fBET Vegas se nemusí registrovat znovu (stejný účet).", url: "https://www.fbet.cz/doc/faq" },
      ],
      aplikace: [
        { text: "Nativní aplikace na oficiálním webu nenalezena (odkazy z úvodní stránky neobsahují Google Play/App Store). Existuje mobilní verze webu mobile.fbet.cz (cookie deklarace uvádí domény mobile.fbet.cz).", url: "https://www.fbet.cz/" },
      ],
      nabidka: [
        { text: "Sekce: Sporty (prematch), LIVE, Score (výsledky), Vegas (casino).", url: "https://www.fbet.cz/" },
        { text: "Druhy sázek v herním plánu: výsledek, počty branek, dílčí výsledky, vítěz soutěže, kombinace, živé kursové sázky (LIVE), rozpisové sázky; min. sázka 10 Kč na tiket (rozpisová 1 Kč na dílčí).", url: "https://www.fbet.cz/static/downloads/terms/Herni_plan_-_Kurzova_sazka_-_MF-31403-2021-73-46.pdf" },
        { text: "Live: lze kombinovat předzápasové a live na jednom tiketu; live tiket nelze stornovat ani měnit; min. live sázka 10 Kč.", url: "https://www.fbet.cz/doc/faq" },
        { text: "Cash Out je v herním plánu (čl. 20): nabízen za stejných podmínek všem sázejícím; nelze, pokud je sázka už proherní nebo lze stornovat.", url: "https://www.fbet.cz/static/downloads/terms/Herni_plan_-_Kurzova_sazka_-_MF-31403-2021-73-46.pdf" },
        { text: "Pobočky: seznam MF uvádí u forBET online CZ s.r.o. jen internet (kurz. sázka od 9. 6. 2022, technická hra od 5. 7. 2023), žádné kamenné; sázky jen přes internet.", url: "https://mf.gov.cz/assets/attachments/2026-10-01_Prehled-provozovatelu-ZHH.xlsx" },
      ],
      platby: [
        { text: "Výplata z konta je bezúplatná na žádost, bezodkladně, z omluvitelného důvodu nejpozději do 60 dnů od žádosti; výhra se vyplácí nejpozději do 30 dnů od vyhodnocení.", url: "https://www.fbet.cz/static/downloads/terms/Herni_plan_-_Kurzova_sazka_-_MF-31403-2021-73-46.pdf" },
      ],
      podpora: [
        { text: "Kontakt: podpora@fbet.cz, tel. +420 724 747 427, chat na webu; provozovatel forBET online CZ s.r.o., Holušická 2253/1, 148 00 Praha 4, IČO 09063315. Provozní doba (Po–Pá 8–16) převzata z dřívějšího souboru (22. 10.), tentokrát na stránce neověřena.", url: "https://www.fbet.cz/doc/contact-vegas" },
      ],
      odpovedne: [
        { text: "Web má stránku Zodpovědné hraní a návod, jak se vyloučit zápisem do RVO; hráč si nastavuje denní/měsíční limity, po jejich dosažení nelze pokračovat ve hře.", url: "https://www.fbet.cz/doc/zodpovedne-hrani-vegas" },
        { text: "Herní plán: nástroje RVO, sebeomezující opatření (společná pro internetovou technickou hru i kurzovou sázku) a prostředek pro zamezení účasti; při každém přihlášení kontrola zápisu v Rejstříku.", url: "https://www.fbet.cz/static/downloads/terms/Herni_plan_-_Kurzova_sazka_-_MF-31403-2021-73-46.pdf" },
        { text: "Odborná pomoc: Klinika adiktologie 1. LF UK a VFN, Apolinářská 4, Praha 2, tel. 224 968 208; hazardni-hrani.cz.", url: "https://www.fbet.cz/doc/zodpovedne-hrani-vegas" },
      ],
    },
    sources: [MF, { label: 'fbet.cz', url: 'https://www.fbet.cz/' }, { label: 'fbet.cz – přehled bonusů a pravidla', url: 'https://www.fbet.cz/doc/bonus-prehled' }],
  },
  {
    id: 'synottip', checked: '2026-10-24',
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
    unverified: ['Doba zpracování výběru (veřejně neuvedena)', 'iOS aplikace', 'Aktuální bonusy a promokódy', "Doba zpracování výběru a minima vkladu a výběru", "Jestli kancelář nabízí živé přenosy", "Stav v seznamu Ministerstva financí (web přehledu jsme nekontrolovali)"],
    more: {
      registrace: [
        { text: "Věk 18+. Dva způsoby: ruční formulář (ověření později přes BankID nebo na pobočce) nebo plná registrace přes BankID (ověření rodného čísla, výběr banky).", url: "https://muj.synottip.cz/registrace" },
        { text: "Podporované banky pro BankID: Air Bank, ČS, MONETA, ČSOB, KB, Raiffeisen, Fio, Creditas, mBank, UniCredit, Partners (z 19. 10.).", url: "https://muj.synottip.cz/registrace" },
      ],
      aplikace: [
        { text: "Jedna aplikace SYNOTtip pro Android (casino, poker, sázky), stažení z webu (ne Google Play). Pro iOS jen responzivní web v Safari.", url: "https://muj.synottip.cz/aplikace" },
        { text: "Herní plán: internetové sázky přes aplikaci SYNOTtip a web synottip.cz.", url: "https://ulozto.synot.cz/index.php/s/mwQQBKQ0LCKJddK" },
      ],
      nabidka: [
        { text: "Značka je v provozu: web nese © 2026 SYNOT TIP, a.s. a odkazuje na herní plán kursových sázek č. j. MF-28655/2022/73-77 ze 13. 7. 2026. Oficiální oznámení o převzetí nebo přejmenování jsme nenašli.", url: "https://www.synottip.cz/herni-plan" },
        { text: "Kurzové sázky předzápasové a live na sport.synottip.cz; statistiky Sportradar.", url: "https://www.synottip.cz/" },
        { text: "CashOut: dohoda o změně sázky podle herního plánu (nabídka je na vůli provozovatele, přijetí na sázejícím).", url: "https://ulozto.synot.cz/index.php/s/mwQQBKQ0LCKJddK" },
        { text: "Min. sázka 10 Kč.", url: "https://ulozto.synot.cz/index.php/s/mwQQBKQ0LCKJddK" },
      ],
      platby: [
        { text: "Vklad: karta, ePlatby, MojePlatba, mPeníze, bankovní tlačítka (z 19. 10.). Výběr převodem na ověřený účet.", url: "https://muj.synottip.cz/promoakce" },
        { text: "Herní plán: výplata z konta bezúplatně, nejpozději do 60 dnů od žádosti; výhra připsána do 30 dnů.", url: "https://ulozto.synot.cz/index.php/s/mwQQBKQ0LCKJddK" },
      ],
      podpora: [
        { text: "Bezplatná linka 800 888 100, e-mail synottip@synottip.cz; hodiny na hlavní stránce neuvedeny.", url: "https://www.synottip.cz/" },
      ],
      odpovedne: [
        { text: "Nastavení maximální týdenní prohry; dočasné či trvalé zablokování účtu; linka 800 888 100 pro blokaci a sebeomezení; kontakty na léčebny.", url: "https://muj.synottip.cz/info/ResponsibleGamming18" },
      ],
    },
    sources: [MF, { label: 'synottip.cz – promoakce a pravidla', url: 'https://muj.synottip.cz/promoakce' }, { label: 'casino.synottip.cz', url: 'https://casino.synottip.cz/' }],
  },
  {
    id: 'kingsbet', checked: '2026-10-24',
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
    unverified: ['Přesný počet her (web uvádí jen „stovky“)', 'Aktuální bonusy', "Seznam sportů a jestli jsou živé přenosy", "Poplatky u výběrů (stránka je neuvádí)", "Konkrétní typy limitů (vklad, ztráta, čas)"],
    more: {
      registrace: [
        { text: "Registrace (jméno, datum narození, kontakty, potvrzení e-mailu), poté do 30 dnů ověření totožnosti přes Bank iD, platební metody, telefonu a nastavení limitů.", url: "https://www.kingsbet.cz/registration" },
        { text: "Registrace možná i osobně v kiosku.", url: "https://www.kingsbet.cz/" },
      ],
      aplikace: [
        { text: "Aplikace Kingsbet: Android (cz.kingsbet.mobileapp) a iOS (id6587567158).", url: "https://www.kingsbet.cz/" },
        { text: "Herní plán: sázky přes kingsbet.cz a aplikaci Kingsbet.", url: "https://www.kingsbet.cz/media/2026-07/260717-hp-ks-greentube-final.pdf" },
      ],
      nabidka: [
        { text: "Sekce Sport a Live (/sport, /sport?page=live).", url: "https://www.kingsbet.cz/" },
        { text: "Druhy sázek: SÓLO, AKO, systémové; u živých sázek lze zapnout automatické přijetí změněného kurzu.", url: "https://www.kingsbet.cz/media/2026-07/260717-hp-ks-greentube-final.pdf" },
        { text: "CashOut existuje (web i aplikace), nabídka dobrovolná.", url: "https://www.kingsbet.cz/media/2026-07/260717-hp-ks-greentube-final.pdf" },
        { text: "Min. sázka 10 Kč, max. výhra na tiket 10 000 000 Kč.", url: "https://www.kingsbet.cz/media/2026-07/260717-hp-ks-greentube-final.pdf" },
      ],
      platby: [
        { text: "Vklad kartou (Visa, Mastercard, Maestro) min. 100 Kč, převodem min. 1 Kč, max. 1 000 000 Kč; výběr na kartu nebo účet.", url: "https://www.kingsbet.cz/vklady-a-vybery" },
        { text: "Výběr na účet 2x denně v pracovní dny (9:00, 15:00), výběr na kartu v řádu minut (z 19. 10.).", url: "https://www.kingsbet.cz/vklady-a-vybery" },
        { text: "Herní plán: výplata bezúplatně, nejpozději do 60 dnů od žádosti.", url: "https://www.kingsbet.cz/media/2026-07/260717-hp-ks-greentube-final.pdf" },
      ],
      podpora: [
        { text: "Telefon +420 910 920 555 a živý chat, denně 10:00-22:00; FAQ kingsbetcz.zendesk.com.", url: "https://www.kingsbet.cz/kontakt" },
      ],
      odpovedne: [
        { text: "Sebeomezující limity; pro živé hry nutné nastavit limity; 48hodinové sebevyloučení; zápis do RVO min. na 1 rok (ne u neověřených účtů).", url: "https://www.kingsbet.cz/zasady-zodpovedneho-hrani" },
      ],
    },
    sources: [MF, { label: 'kingsbet.cz', url: 'https://www.kingsbet.cz/' }],
  },
];

export const reviewOf = (id: string) => REVIEWS.find((r) => r.id === id);
