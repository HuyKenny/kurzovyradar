/**
 * Pilot scope: football and hockey competitions we import, compare and publish.
 * `match` is tested against the platform's nameCompetition (Tipsport and Chance use the same names).
 * Everything outside this list is ignored by the import, so the database and the sitemap stay small.
 */
export type Sport = 'fotbal' | 'hokej';

export interface Competition {
  slug: string;
  name: string;
  sport: Sport;
  match: RegExp;
  country: string;
  /** Shown first in lists and in the homepage competition strip. */
  top?: boolean;
  intro: string;
}

/** idSuperSport on the Tipsport/Chance platform. */
export const SPORT_IDS: Record<number, Sport> = { 16: 'fotbal', 23: 'hokej' };

export const SPORTS: Record<Sport, { name: string; path: string; adjective: string }> = {
  fotbal: { name: 'Fotbal', path: '/fotbal/', adjective: 'fotbalové' },
  hokej: { name: 'Hokej', path: '/hokej/', adjective: 'hokejové' },
};

export const COMPETITIONS: Competition[] = [
  // Football
  { slug: 'chance-liga', name: 'Chance Liga', sport: 'fotbal', match: /^Česká Chance Liga$/, country: 'Česko', top: true,
    intro: 'Nejvyšší česká fotbalová soutěž. Kola se hrají od pátku do pondělí, zápasy Slavie, Sparty a Plzně bývají v neděli.' },
  { slug: 'chance-narodni-liga', name: 'Chance Národní liga', sport: 'fotbal', match: /^Česká Chance Národní Liga$/, country: 'Česko',
    intro: 'Druhá nejvyšší česká fotbalová soutěž. Zápasy se hrají většinou o víkendu dopoledne a odpoledne.' },
  { slug: 'liga-mistru', name: 'Liga mistrů', sport: 'fotbal', match: /^Liga mistrů$/, country: 'Evropa', top: true,
    intro: 'Nejprestižnější klubová soutěž Evropy. Ligová fáze se hraje v úterý a ve středu, výkopy jsou v 18:45 a ve 21:00.' },
  { slug: 'evropska-liga', name: 'Evropská liga', sport: 'fotbal', match: /^Evropská liga$/, country: 'Evropa', top: true,
    intro: 'Druhý evropský pohár. Hraje se ve čtvrtek ve dvou blocích, v 18:45 a ve 21:00.' },
  { slug: 'konferencni-liga', name: 'Konferenční liga', sport: 'fotbal', match: /^Konferenční liga$/, country: 'Evropa', top: true,
    intro: 'Třetí evropský pohár. Hraje se ve čtvrtek a pravidelně v něm startují české kluby.' },
  { slug: 'premier-league', name: 'Premier League', sport: 'fotbal', match: /^1\. anglická liga$/, country: 'Anglie', top: true,
    intro: 'Nejvyšší anglická liga. Většina kol se hraje v sobotu odpoledne, šlágry v neděli a vybrané zápasy v pondělí večer.' },
  { slug: 'championship', name: 'Championship', sport: 'fotbal', match: /^2\. anglická liga$/, country: 'Anglie',
    intro: 'Druhá anglická liga s 24 týmy a hustým programem včetně středečních kol.' },
  { slug: 'la-liga', name: 'La Liga', sport: 'fotbal', match: /^1\. španělská liga$/, country: 'Španělsko', top: true,
    intro: 'Nejvyšší španělská liga. Večerní zápasy začínají často až ve 21:00 našeho času.' },
  { slug: 'bundesliga', name: 'Bundesliga', sport: 'fotbal', match: /^1\. německá liga$/, country: 'Německo', top: true,
    intro: 'Nejvyšší německá liga. Hlavní blok kola je v sobotu v 15:30, šlágr kola v 18:30.' },
  { slug: 'serie-a', name: 'Serie A', sport: 'fotbal', match: /^1\. italská liga$/, country: 'Itálie', top: true,
    intro: 'Nejvyšší italská liga. Zápasy jsou rozložené od pátku do pondělí, večerní utkání začínají ve 20:45.' },
  { slug: 'ligue-1', name: 'Ligue 1', sport: 'fotbal', match: /^1\. francouzská liga$/, country: 'Francie',
    intro: 'Nejvyšší francouzská liga. Hlavní zápas kola bývá v neděli večer.' },
  { slug: 'eredivisie', name: 'Eredivisie', sport: 'fotbal', match: /^1\. nizozemská liga$/, country: 'Nizozemsko',
    intro: 'Nejvyšší nizozemská liga s Ajaxem, PSV a Feyenoordem.' },
  { slug: 'primeira-liga', name: 'Primeira Liga', sport: 'fotbal', match: /^1\. portugalská liga$/, country: 'Portugalsko',
    intro: 'Nejvyšší portugalská liga s Benfikou, Portem a Sportingem.' },
  { slug: 'super-lig', name: 'Süper Lig', sport: 'fotbal', match: /^1\. turecká liga$/, country: 'Turecko',
    intro: 'Nejvyšší turecká liga s Galatasarayem, Fenerbahçe a Beşiktaşem.' },
  { slug: 'nike-liga', name: 'Niké liga', sport: 'fotbal', match: /^1\. slovenská liga$/, country: 'Slovensko',
    intro: 'Nejvyšší slovenská fotbalová soutěž.' },
  { slug: 'ekstraklasa', name: 'Ekstraklasa', sport: 'fotbal', match: /^1\. polská liga$/, country: 'Polsko',
    intro: 'Nejvyšší polská fotbalová liga.' },
  { slug: '2-bundesliga', name: '2. Bundesliga', sport: 'fotbal', match: /^2\. německá liga$/, country: 'Německo',
    intro: 'Druhá nejvyšší německá liga. Zápasy se hrají od pátku do neděle.' },
  { slug: 'mls', name: 'MLS', sport: 'fotbal', match: /^MLS$/, country: 'USA a Kanada',
    intro: 'Zámořská Major League Soccer. Zápasy začínají našeho času většinou v noci.' },
  // Hockey
  { slug: 'tipsport-extraliga', name: 'Tipsport extraliga', sport: 'hokej', match: /^Česká Tipsport extraliga$/, country: 'Česko', top: true,
    intro: 'Nejvyšší česká hokejová soutěž. Hraje se hlavně v úterý, pátek a neděli, nejčastěji od 17:30 a 18:00.' },
  { slug: 'maxa-liga', name: 'Maxa liga', sport: 'hokej', match: /^Česká Maxa liga$/, country: 'Česko',
    intro: 'Druhá nejvyšší česká hokejová soutěž.' },
  { slug: 'nhl', name: 'NHL', sport: 'hokej', match: /^NHL$/, country: 'USA a Kanada', top: true,
    intro: 'Nejlepší hokejová liga světa. Zápasy začínají našeho času obvykle mezi půlnocí a druhou hodinou ranní.' },
  { slug: 'tipos-extraliga', name: 'Tipos extraliga', sport: 'hokej', match: /^Slovenská Tipsport liga$/, country: 'Slovensko',
    intro: 'Nejvyšší slovenská hokejová soutěž.' },
  { slug: 'svycarska-liga', name: 'Švýcarská National League', sport: 'hokej', match: /^Švýcarská liga$/, country: 'Švýcarsko',
    intro: 'Nejvyšší švýcarská hokejová liga, ve které hraje řada českých hokejistů.' },
  { slug: 'svedska-shl', name: 'Švédská SHL', sport: 'hokej', match: /^Švédská liga$/, country: 'Švédsko',
    intro: 'Nejvyšší švédská hokejová liga.' },
  { slug: 'nemecka-del', name: 'Německá DEL', sport: 'hokej', match: /^Německá liga$/, country: 'Německo',
    intro: 'Nejvyšší německá hokejová liga.' },
  { slug: 'finska-liiga', name: 'Finská Liiga', sport: 'hokej', match: /^Finská liga$/, country: 'Finsko',
    intro: 'Nejvyšší finská hokejová liga.' },
];

const BY_SLUG = new Map(COMPETITIONS.map((c) => [c.slug, c]));
export const competitionBySlug = (slug: string) => BY_SLUG.get(slug);

/** The pilot competition a platform match belongs to, or null (not imported). */
export function competitionOf(sport: Sport, name: string): Competition | null {
  for (const c of COMPETITIONS) if (c.sport === sport && c.match.test(name.trim())) return c;
  return null;
}
