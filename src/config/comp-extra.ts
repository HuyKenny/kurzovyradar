/**
 * Editorial text for popular competitions that are created automatically from the feed (see config/competitions.ts: only football and
 * hockey leagues are curated there). Keyed by the stored competition slug, so nothing about existing URLs changes. Facts here are general
 * and stable on purpose (what the competition is, how its odds are read); no dates, tables or results.
 */
export interface CompExtra { intro: string[]; faq: { q: string; a: string }[] }

const NO_DRAW = { q: 'Proč tu u zápasů nejsou tři výsledky?', a: 'Kanceláře tu na zápas vypisují dva výsledky: výhru domácích, nebo hostů (sázka na vítěze zápasu). Jak se vyhodnotí případná remíza nebo prodloužení, určuje herní plán kanceláře.' };

export const COMP_EXTRA: Record<string, CompExtra> = {
  'basketbal-nba': {
    intro: [
      'NBA je nejvyšší severoamerická profesionální basketbalová soutěž. Hraje ji 30 týmů a zápasů je v základní části mnoho, takže se kurzy na jednotlivé zápasy mění často a zápisy vznikají každý hrací den.',
      'U každého zápasu porovnáváme, kolik na výhru domácích a hostů nabízí Tipsport a Chance. Basketbal nemá remízu: zápas se v případě nerozhodného stavu prodlužuje, takže se sází na vítěze celého zápasu včetně prodloužení.',
    ],
    faq: [
      NO_DRAW,
      { q: 'Platí kurz včetně prodloužení?', a: 'U vítěze zápasu v basketbalu ano, vítěz se určuje po celém zápase včetně případného prodloužení. Konkrétní pravidla trhu najdeš v herním plánu kanceláře.' },
      { q: 'Jak čtu kurz u NBA?', a: 'Nižší kurz znamená, že kancelář považuje tým za favorita. Kurz není předpověď: obsahuje i marži kanceláře. Vysvětlení v průvodci Kurzy pro začátečníky.' },
    ],
  },
  'americky-fotbal-nfl': {
    intro: [
      'NFL je nejvyšší profesionální soutěž v americkém fotbale. Hraje ji 32 týmů, zápasy se většinou konají o víkendu a jejich kurzy se hýbou hlavně podle zpráv o zranění hráčů.',
      'U každého zápasu porovnáváme kurzy Tipsportu a Chance na výhru domácích a hostů. Remíza je v americkém fotbale vzácná, proto se běžně sází na vítěze zápasu.',
    ],
    faq: [
      NO_DRAW,
      { q: 'Proč se kurzy u NFL hýbou?', a: 'Hlavní vliv mají zprávy o sestavách a zranění klíčových hráčů a také množství sázek na jednu stranu. Pohyb kurzu sledujeme na stránce Pohyby kurzů.' },
    ],
  },
  'americky-fotbal-usa-ncaaf': {
    intro: [
      'NCAAF je univerzitní americký fotbal ve Spojených státech. Hrají v něm týmy univerzit, nikoli profesionální kluby, takže mezi týmy bývají velké výkonnostní rozdíly a kurzy na favority bývají velmi nízké.',
      'U zápasů porovnáváme kurzy Tipsportu a Chance na výhru domácích a hostů.',
    ],
    faq: [
      NO_DRAW,
      { q: 'Proč jsou někdy kurzy na favorita velmi nízké?', a: 'Když je rozdíl mezi týmy velký, kancelář nabídne na favorita kurz blízko 1,00. Nízký kurz znamená vysokou pravděpodobnost podle kanceláře, ne jistotu.' },
    ],
  },
  'bojove-sporty-clash': {
    intro: [
      'Clash je organizace bojových večerů, na kterých se utkávají zápasníci. Kanceláře na jednotlivé zápasy vypisují vítěze, takže u každého zápasu porovnáváme, kolik na výhru zápasníka nabízí Tipsport a Chance.',
      'Kde večer sledovat a jak se kupuje přenos, najdeš na našem sesterském webu sportstreamy.cz.',
    ],
    faq: [
      NO_DRAW,
      { q: 'Co znamená kurz u zápasu v bojových sportech?', a: 'Je to cena sázky na vítěze zápasu. Nižší kurz má zápasník, kterého kancelář považuje za favorita. Kurz není předpověď výsledku.' },
    ],
  },
  'box-box': {
    intro: ['U boxu porovnáváme kurzy Tipsportu a Chance na vítěze zápasu. Nabídka bývá menší než u fotbalu, takže jednotlivé zápasy sledujeme zvlášť.'],
    faq: [NO_DRAW],
  },
  'hokej-ahl': {
    intro: [
      'AHL je druhá nejvyšší hokejová soutěž v Severní Americe, v níž hrají farmářské týmy klubů NHL. Zápasy jsou i při větším vytížení soutěže dobře vypsané, takže u nich porovnáváme kurzy Tipsportu a Chance.',
      'Hokej má základní hrací dobu a prodloužení: u sázky na vítěze zápasu je důležité vědět, zda trh počítá i prodloužení. Vysvětluje to průvodce o základní hrací době.',
    ],
    faq: [
      { q: 'Počítá se u hokeje prodloužení?', a: 'Záleží na trhu. Sázka 1X2 se obvykle počítá v základní hrací době, sázka na vítěze zápasu zahrnuje i prodloužení a nájezdy. Přesně to říká herní plán kanceláře.' },
    ],
  },
  'fotbal-nemecky-pohar': {
    intro: [
      'Německý pohár je vyřazovací soutěž, v níž se utkávají týmy z nejvyšších i nižších německých lig. Zápasy jsou jednorázové, takže se u nich hraje až do rozhodnutí.',
      'U každého zápasu porovnáváme kurzy Tipsportu a Chance. Sázka 1X2 se obvykle počítá v základní hrací době: rozdíl vysvětluje průvodce o prodloužení.',
    ],
    faq: [{ q: 'Platí sázka 1X2 i pro prodloužení?', a: 'Obvykle ne. Sázka 1X2 se počítá po základní hrací době (90 minut plus nastavení). Výhra postupem do dalšího kola je jiný trh.' }],
  },
  'fotbal-anglicky-ligovy-pohar': {
    intro: [
      'Anglický ligový pohár je vyřazovací soutěž klubů z nejvyšších anglických lig. Zápasy jsou jednorázové a většinou se hrají uprostřed týdne.',
      'U zápasů porovnáváme kurzy Tipsportu a Chance. Sázka 1X2 se obvykle počítá v základní hrací době.',
    ],
    faq: [{ q: 'Co když zápas skončí remízou?', a: 'V sázce 1X2 se počítá výsledek po základní hrací době, takže vyhrává remíza. O postupu pak může rozhodnout prodloužení nebo penalty, ale to je jiná sázka.' }],
  },
};
