/**
 * Bookmakers and their three independent states. Never merge them into one switch:
 *  - oddsFeed:  do we import their odds?            (only Tipsport and Chance today)
 *  - affiliate: is there an approved partner link?  (Tipsport, Chance, Allwyn, MerkurXtip)
 *  - review:    'published' = full review (partners); 'info' = factual overview with sources, no partner link,
 *               no rating and no bonus figures (Fortuna, Betano, fBET, SYNOTtip, KingsBet, BETX, Betor, bet365).
 *              Sazkabet is not a separate bookmaker: it is Allwyn's betting brand (alias on Allwyn, /sazkove-kancelare/sazkabet/ → 301)
 * Link targets live in wrangler vars (TIPSPORT_URL, CHANCE_URL, ALLWYN_URL, MERKURXTIP_URL) and are read only by /go/.
 */
export type BookId = 'tipsport' | 'chance' | 'allwyn' | 'merkurxtip' | 'fortuna' | 'betano' | 'fbet' | 'synottip' | 'kingsbet' | 'betx' | 'betor' | 'bet365';
export type FeedBook = 'tipsport' | 'chance';

export interface Bookmaker {
  id: BookId;
  name: string;
  /** Other name people search for (Allwyn runs its betting as "Sazkabet"); shown in titles and on the overview. */
  alias?: string;
  /** "u Tipsportu", "Zobrazit u Chance" */
  locative: string;
  oddsFeed: 'active' | 'none';
  affiliate: 'approved' | 'none';
  review: 'published' | 'info' | 'draft' | 'none';
  /** Brand colour (accent next to the logo only). */
  color: string;
  /** Brand tile (wordmark on the brand background), 2× size; null = show the name as text. */
  logo: { src: string; w: number; h: number } | null;
  site: string;
}

export const BOOKMAKERS: Bookmaker[] = [
  { id: 'tipsport', name: 'Tipsport', locative: 'u Tipsportu', oddsFeed: 'active', affiliate: 'approved', review: 'published', color: '#177ce9',
    logo: { src: '/img/loga/tipsport.webp', w: 186, h: 64 }, site: 'https://www.tipsport.cz' },
  { id: 'chance', name: 'Chance', locative: 'u Chance', oddsFeed: 'active', affiliate: 'approved', review: 'published', color: '#007c4d',
    logo: { src: '/img/loga/chance.webp', w: 227, h: 64 }, site: 'https://www.chance.cz' },
  { id: 'allwyn', name: 'Allwyn', alias: 'Sazkabet', locative: 'u Allwynu', oddsFeed: 'none', affiliate: 'approved', review: 'published', color: '#1d4757',
    logo: { src: '/img/loga/allwyn.webp', w: 214, h: 64 }, site: 'https://www.allwyn.cz' },
  { id: 'merkurxtip', name: 'MerkurXtip', locative: 'u MerkurXtipu', oddsFeed: 'none', affiliate: 'approved', review: 'published', color: '#0b3b8f',
    logo: { src: '/img/loga/merkurxtip.webp', w: 128, h: 128 }, site: 'https://www.merkurxtip.cz' },
  { id: 'fortuna', name: 'Fortuna', locative: 'u Fortuny', oddsFeed: 'none', affiliate: 'none', review: 'info', color: '#f6c400',
    logo: { src: '/img/loga/fortuna.webp', w: 128, h: 128 }, site: 'https://www.ifortuna.cz' },
  { id: 'betano', name: 'Betano', locative: 'u Betana', oddsFeed: 'none', affiliate: 'none', review: 'info', color: '#ff6a00',
    logo: { src: '/img/loga/betano.webp', w: 128, h: 128 }, site: 'https://www.betano.cz' },
  { id: 'fbet', name: 'fBET', locative: 'u fBETu', oddsFeed: 'none', affiliate: 'none', review: 'info', color: '#0a7d3c',
    logo: { src: '/img/loga/fbet.webp', w: 128, h: 128 }, site: 'https://www.fbet.cz' },
  { id: 'synottip', name: 'SYNOTtip', locative: 'u SYNOTtipu', oddsFeed: 'none', affiliate: 'none', review: 'info', color: '#e2001a',
    logo: { src: '/img/loga/synottip.webp', w: 128, h: 128 }, site: 'https://www.synottip.cz' },
  { id: 'kingsbet', name: 'KingsBet', locative: 'u KingsBetu', oddsFeed: 'none', affiliate: 'none', review: 'info', color: '#c8a24a',
    logo: { src: '/img/loga/kingsbet.webp', w: 155, h: 64 }, site: 'https://www.kingsbet.cz' },
  // Overviews of brands people search for, written from the MF list only (see config/mf-list.ts): not partners, no feed.
  { id: 'betx', name: 'BETX', locative: 'u BETX', oddsFeed: 'none', affiliate: 'none', review: 'info', color: '#6b2cff',
    logo: { src: '/img/loga/betx.webp', w: 128, h: 128 }, site: 'https://www.bet-x.cz' },
  { id: 'betor', name: 'Betor', locative: 'u Betoru', oddsFeed: 'none', affiliate: 'none', review: 'info', color: '#c0392b',
    logo: { src: '/img/loga/betor.webp', w: 128, h: 128 }, site: 'https://www.betor.cz' },
  { id: 'bet365', name: 'bet365', locative: 'u bet365', oddsFeed: 'none', affiliate: 'none', review: 'info', color: '#027b5b',
    logo: null, site: '' },
];

export const BOOK = Object.fromEntries(BOOKMAKERS.map((b) => [b.id, b])) as Record<BookId, Bookmaker>;
/** Books whose odds we import, in display order. */
export const FEED_BOOKS: FeedBook[] = BOOKMAKERS.filter((b) => b.oddsFeed === 'active').map((b) => b.id as FeedBook);
export const isFeedBook = (s: string): s is FeedBook => (FEED_BOOKS as string[]).includes(s);
export const PARTNERS = BOOKMAKERS.filter((b) => b.affiliate === 'approved');
