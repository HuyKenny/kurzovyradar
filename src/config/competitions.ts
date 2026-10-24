/**
 * Curated football and hockey competitions (own names, colours and intros). Every other competition of every sport is created
 * on demand from the platform's own name (see server/normalize/competition.ts), so nothing a visitor can bet on is left out.
 * The first list below:
 * `match` is tested against the platform's nameCompetition (Tipsport and Chance use the same names) together with
 * the gender taken from the source idSport: the platform names the men's and women's leagues the same way
 * ("1. španělská liga" = La Liga for idSport -1 and the women's Liga F for idSport 295).
 */
export type Sport =
  | 'fotbal' | 'hokej' | 'basketbal' | 'tenis' | 'volejbal' | 'americky-fotbal' | 'stolni-tenis' | 'hazena' | 'esporty' | 'bojove-sporty' | 'box'
  | 'florbal' | 'rugby' | 'sipky' | 'futsal' | 'badminton' | 'baseball' | 'vodni-polo' | 'kriket' | 'snooker' | 'squash';
export type Gender = 'muzi' | 'zeny';

export interface Competition {
  slug: string;
  name: string;
  sport: Sport;
  match: RegExp;
  /** Default 'muzi'. */
  gender?: Gender;
  country: string;
  /** Ticket stub colour (light tint, ink text stays readable). */
  color: string;
  /** Shown first in lists and in the homepage competition strip. */
  top?: boolean;
  intro: string;
}

export interface SportInfo {
  name: string;
  /** Page path, /fotbal/ … */
  path: string;
  /** idSuperSport on the Tipsport/Chance platform. */
  superId: number;
  /** Leading words of the platform's idSport name ("Tenis muži - dvouhra" → "Tenis"); what is left describes the variant (women, doubles, juniors). */
  prefix: string[];
  /** Light tint of the ticket stub. */
  color: string;
  /** Lower-case name for sentences ("na tenis"). */
  accusative: string;
}

/**
 * Every sport whose platform match is a plain head-to-head with a result market we can compare (three-way "Výsledek zápasu"
 * or two-way "Vítěz zápasu"). Season-long and multi-runner offers (horse racing, motorsport, politics, skiing) are not here.
 */
export const SPORTS: Record<Sport, SportInfo> = {
  fotbal: { name: 'Fotbal', path: '/fotbal/', superId: 16, prefix: ['Fotbal'], color: '#d7ecd9', accusative: 'fotbal' },
  hokej: { name: 'Hokej', path: '/hokej/', superId: 23, prefix: ['Lední hokej'], color: '#d6e5f5', accusative: 'hokej' },
  basketbal: { name: 'Basketbal', path: '/basketbal/', superId: 7, prefix: ['Basketbal'], color: '#fbe1c8', accusative: 'basketbal' },
  tenis: { name: 'Tenis', path: '/tenis/', superId: 43, prefix: ['Tenis'], color: '#eef0c2', accusative: 'tenis' },
  volejbal: { name: 'Volejbal', path: '/volejbal/', superId: 47, prefix: ['Volejbal'], color: '#f6d5d2', accusative: 'volejbal' },
  'americky-fotbal': { name: 'Americký fotbal', path: '/americky-fotbal/', superId: 2, prefix: ['Americký fotbal'], color: '#e2d9f1', accusative: 'americký fotbal' },
  'stolni-tenis': { name: 'Stolní tenis', path: '/stolni-tenis/', superId: 40, prefix: ['Stolní tenis'], color: '#d3e3f5', accusative: 'stolní tenis' },
  hazena: { name: 'Házená', path: '/hazena/', superId: 20, prefix: ['Házená'], color: '#f2dada', accusative: 'házenou' },
  esporty: { name: 'Esporty', path: '/esporty/', superId: 188, prefix: [], color: '#dfd6f3', accusative: 'esporty' },
  'bojove-sporty': { name: 'Bojové sporty', path: '/bojove-sporty/', superId: 208, prefix: ['Bojové sporty'], color: '#f3dfe0', accusative: 'bojové sporty' },
  box: { name: 'Box', path: '/box/', superId: 11, prefix: ['Box'], color: '#f7d4d6', accusative: 'box' },
  florbal: { name: 'Florbal', path: '/florbal/', superId: 14, prefix: ['Florbal'], color: '#e9dfd6', accusative: 'florbal' },
  rugby: { name: 'Rugby', path: '/rugby/', superId: 31, prefix: ['Rugby'], color: '#d8ead8', accusative: 'rugby' },
  sipky: { name: 'Šipky', path: '/sipky/', superId: 42, prefix: ['Šipky'], color: '#fbedc4', accusative: 'šipky' },
  futsal: { name: 'Futsal', path: '/futsal/', superId: 17, prefix: ['Futsal'], color: '#d5e2f4', accusative: 'futsal' },
  badminton: { name: 'Badminton', path: '/badminton/', superId: 88, prefix: ['Badminton'], color: '#dde3ee', accusative: 'badminton' },
  baseball: { name: 'Baseball', path: '/baseball/', superId: 6, prefix: ['Baseball'], color: '#e7d6f0', accusative: 'baseball' },
  'vodni-polo': { name: 'Vodní pólo', path: '/vodni-polo/', superId: 45, prefix: ['Vodní pólo'], color: '#d3e3f5', accusative: 'vodní pólo' },
  kriket: { name: 'Kriket', path: '/kriket/', superId: 169, prefix: ['Kriket'], color: '#d9deea', accusative: 'kriket' },
  snooker: { name: 'Snooker', path: '/snooker/', superId: 37, prefix: ['Snooker'], color: '#d3ead3', accusative: 'snooker' },
  squash: { name: 'Squash', path: '/squash/', superId: 39, prefix: ['Squash'], color: '#e2e4e6', accusative: 'squash' },
};
export const SPORT_LIST = Object.keys(SPORTS) as Sport[];
export const isSport = (v: string | null | undefined): v is Sport => !!v && v in SPORTS;
export const sportBySlugPath = (slug: string): Sport | null => (isSport(slug) ? slug : null);

/** idSuperSport on the platform → our sport. */
export const SPORT_IDS: Record<number, Sport> = Object.fromEntries(SPORT_LIST.map((s) => [SPORTS[s].superId, s]));
/** idSport (sport + gender) on the platform for the curated competitions: "Fotbal - muži" -1, "Fotbal - ženy" 295, "Lední hokej - muži" -2. */
export const GENDER_BY_ID_SPORT: Record<number, { sport: Sport; gender: Gender }> = {
  [-1]: { sport: 'fotbal', gender: 'muzi' },
  295: { sport: 'fotbal', gender: 'zeny' },
  [-2]: { sport: 'hokej', gender: 'muzi' },
};

export const COMPETITIONS: Competition[] = [
  // Football
  { slug: 'chance-liga', name: 'Chance Liga', sport: 'fotbal', match: /^Česká Chance Liga$/, country: 'Česko', color: '#cfe9d8', top: true,
    intro: 'Nejvyšší česká fotbalová soutěž. Kola se hrají od pátku do pondělí, zápasy Slavie, Sparty a Plzně bývají v neděli.' },
  { slug: 'chance-narodni-liga', name: 'Chance Národní liga', sport: 'fotbal', match: /^Česká Chance Národní Liga$/, country: 'Česko', color: '#dcefe2',
    intro: 'Druhá nejvyšší česká fotbalová soutěž. Zápasy se hrají většinou o víkendu dopoledne a odpoledne.' },
  { slug: 'liga-mistru', name: 'Liga mistrů', sport: 'fotbal', match: /^Liga mistrů$/, country: 'Evropa', color: '#d6dcf5', top: true,
    intro: 'Nejprestižnější klubová soutěž Evropy. Ligová fáze se hraje v úterý a ve středu, výkopy jsou v 18:45 a ve 21:00.' },
  { slug: 'evropska-liga', name: 'Evropská liga', sport: 'fotbal', match: /^Evropská liga$/, country: 'Evropa', color: '#fbe1c8', top: true,
    intro: 'Druhý evropský pohár. Hraje se ve čtvrtek ve dvou blocích, v 18:45 a ve 21:00.' },
  { slug: 'konferencni-liga', name: 'Konferenční liga', sport: 'fotbal', match: /^Konferenční liga$/, country: 'Evropa', color: '#d3efe9', top: true,
    intro: 'Třetí evropský pohár. Hraje se ve čtvrtek a pravidelně v něm startují české kluby.' },
  { slug: 'premier-league', name: 'Premier League', sport: 'fotbal', match: /^1\. anglická liga$/, country: 'Anglie', color: '#e7d6f0', top: true,
    intro: 'Nejvyšší anglická liga. Většina kol se hraje v sobotu odpoledne, šlágry v neděli a vybrané zápasy v pondělí večer.' },
  { slug: 'championship', name: 'Championship', sport: 'fotbal', match: /^2\. anglická liga$/, country: 'Anglie', color: '#dfe0f0',
    intro: 'Druhá anglická liga s 24 týmy a hustým programem včetně středečních kol.' },
  { slug: 'la-liga', name: 'La Liga', sport: 'fotbal', match: /^1\. španělská liga$/, country: 'Španělsko', color: '#f6d5d2', top: true,
    intro: 'Nejvyšší španělská liga. Večerní zápasy začínají často až ve 21:00 našeho času.' },
  { slug: 'bundesliga', name: 'Bundesliga', sport: 'fotbal', match: /^1\. německá liga$/, country: 'Německo', color: '#f7d4d6', top: true,
    intro: 'Nejvyšší německá liga. Hlavní blok kola je v sobotu v 15:30, šlágr kola v 18:30.' },
  { slug: 'serie-a', name: 'Serie A', sport: 'fotbal', match: /^1\. italská liga$/, country: 'Itálie', color: '#d3e3f5', top: true,
    intro: 'Nejvyšší italská liga. Zápasy jsou rozložené od pátku do pondělí, večerní utkání začínají ve 20:45.' },
  { slug: 'ligue-1', name: 'Ligue 1', sport: 'fotbal', match: /^1\. francouzská liga$/, country: 'Francie', color: '#d9deea',
    intro: 'Nejvyšší francouzská liga. Hlavní zápas kola bývá v neděli večer.' },
  { slug: 'eredivisie', name: 'Eredivisie', sport: 'fotbal', match: /^1\. nizozemská liga$/, country: 'Nizozemsko', color: '#fde1cc',
    intro: 'Nejvyšší nizozemská liga s Ajaxem, PSV a Feyenoordem.' },
  { slug: 'primeira-liga', name: 'Primeira Liga', sport: 'fotbal', match: /^1\. portugalská liga$/, country: 'Portugalsko', color: '#d8ecd2',
    intro: 'Nejvyšší portugalská liga s Benfikou, Portem a Sportingem.' },
  { slug: 'super-lig', name: 'Süper Lig', sport: 'fotbal', match: /^1\. turecká liga$/, country: 'Turecko', color: '#f8d6d6',
    intro: 'Nejvyšší turecká liga s Galatasarayem, Fenerbahçe a Beşiktaşem.' },
  { slug: 'nike-liga', name: 'Niké liga', sport: 'fotbal', match: /^1\. slovenská liga$/, country: 'Slovensko', color: '#d5e2f4',
    intro: 'Nejvyšší slovenská fotbalová soutěž.' },
  { slug: 'ekstraklasa', name: 'Ekstraklasa', sport: 'fotbal', match: /^1\. polská liga$/, country: 'Polsko', color: '#f2dada',
    intro: 'Nejvyšší polská fotbalová liga.' },
  { slug: '2-bundesliga', name: '2. Bundesliga', sport: 'fotbal', match: /^2\. německá liga$/, country: 'Německo', color: '#f3dfe0',
    intro: 'Druhá nejvyšší německá liga. Zápasy se hrají od pátku do neděle.' },
  { slug: 'mls', name: 'MLS', sport: 'fotbal', match: /^MLS$/, country: 'USA a Kanada', color: '#dde3ee',
    intro: 'Zámořská Major League Soccer. Zápasy začínají našeho času většinou v noci.' },
  // Women's football (same source names as the men's leagues, told apart by idSport 295)
  { slug: 'anglicka-liga-zen', name: 'Anglická liga žen', sport: 'fotbal', match: /^1\. anglická liga$/, gender: 'zeny', country: 'Anglie', color: '#efe2f5',
    intro: 'Nejvyšší anglická fotbalová soutěž žen (Women\'s Super League). Hrají v ní ženské týmy Chelsea, Arsenalu nebo Manchesteru City.' },
  { slug: 'spanelska-liga-zen', name: 'Španělská liga žen', sport: 'fotbal', match: /^1\. španělská liga$/, gender: 'zeny', country: 'Španělsko', color: '#f9e3e1',
    intro: 'Nejvyšší španělská fotbalová soutěž žen (Liga F) s týmy Barcelony nebo Realu Madrid.' },
  { slug: 'francouzska-liga-zen', name: 'Francouzská liga žen', sport: 'fotbal', match: /^1\. francouzská liga$/, gender: 'zeny', country: 'Francie', color: '#e3e7f1',
    intro: 'Nejvyšší francouzská fotbalová soutěž žen s Lyonem a PSG.' },
  { slug: 'nemecka-liga-zen', name: 'Německá liga žen', sport: 'fotbal', match: /^1\. německá liga$/, gender: 'zeny', country: 'Německo', color: '#f8e2e3',
    intro: 'Nejvyšší německá fotbalová soutěž žen (Frauen-Bundesliga).' },
  { slug: 'ceska-liga-zen', name: 'Česká liga žen', sport: 'fotbal', match: /^1\. česká liga$/, gender: 'zeny', country: 'Česko', color: '#e2f2e7',
    intro: 'Nejvyšší česká fotbalová soutěž žen se Slavií a Spartou.' },
  // Hockey
  { slug: 'tipsport-extraliga', name: 'Tipsport extraliga', sport: 'hokej', match: /^Česká Tipsport extraliga$/, country: 'Česko', color: '#d1def3', top: true,
    intro: 'Nejvyšší česká hokejová soutěž. Hraje se hlavně v úterý, pátek a neděli, nejčastěji od 17:30 a 18:00.' },
  { slug: 'maxa-liga', name: 'Maxa liga', sport: 'hokej', match: /^Česká Maxa liga$/, country: 'Česko', color: '#e2d9f1',
    intro: 'Druhá nejvyšší česká hokejová soutěž.' },
  { slug: 'nhl', name: 'NHL', sport: 'hokej', match: /^NHL$/, country: 'USA a Kanada', color: '#e2e4e6', top: true,
    intro: 'Nejlepší hokejová liga světa. Zápasy začínají našeho času obvykle mezi půlnocí a druhou hodinou ranní.' },
  { slug: 'tipos-extraliga', name: 'Tipos extraliga', sport: 'hokej', match: /^Slovenská Tipsport liga$/, country: 'Slovensko', color: '#d6e1f3',
    intro: 'Nejvyšší slovenská hokejová soutěž.' },
  { slug: 'svycarska-liga', name: 'Švýcarská National League', sport: 'hokej', match: /^Švýcarská liga$/, country: 'Švýcarsko', color: '#f5d8d8',
    intro: 'Nejvyšší švýcarská hokejová liga, ve které hraje řada českých hokejistů.' },
  { slug: 'svedska-shl', name: 'Švédská SHL', sport: 'hokej', match: /^Švédská liga$/, country: 'Švédsko', color: '#fbedc4',
    intro: 'Nejvyšší švédská hokejová liga.' },
  { slug: 'nemecka-del', name: 'Německá DEL', sport: 'hokej', match: /^Německá liga$/, country: 'Německo', color: '#e9dfd6',
    intro: 'Nejvyšší německá hokejová liga.' },
  { slug: 'finska-liiga', name: 'Finská Liiga', sport: 'hokej', match: /^Finská liga$/, country: 'Finsko', color: '#d6e5f5',
    intro: 'Nejvyšší finská hokejová liga.' },
];

const BY_SLUG = new Map(COMPETITIONS.map((c) => [c.slug, c]));
export const competitionBySlug = (slug: string) => BY_SLUG.get(slug);

/** The pilot competition a platform match belongs to, or null (not imported). */
export function competitionOf(sport: Sport, name: string, gender: Gender = 'muzi'): Competition | null {
  for (const c of COMPETITIONS) if (c.sport === sport && (c.gender ?? 'muzi') === gender && c.match.test(name.trim())) return c;
  return null;
}

/** Ticket stub colour: the curated competition's tint, otherwise the sport's. */
export const stubColor = (slug: string, sport: Sport) => BY_SLUG.get(slug)?.color ?? SPORTS[sport].color;
