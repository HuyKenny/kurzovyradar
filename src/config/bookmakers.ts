/**
 * Bookmakers and their three independent states. Never merge them into one switch:
 *  - oddsFeed:  do we import their odds?            (only Tipsport and Chance today)
 *  - affiliate: is there an approved partner link?  (Tipsport, Chance, Allwyn)
 *  - review:    is a publishable review ready?      (Tipsport, Chance, Allwyn)
 * Link targets live in wrangler vars (TIPSPORT_URL, CHANCE_URL, ALLWYN_URL) and are read only by /go/.
 */
export type BookId = 'tipsport' | 'chance' | 'allwyn' | 'fortuna' | 'betano';
export type FeedBook = 'tipsport' | 'chance';

export interface Bookmaker {
  id: BookId;
  name: string;
  /** "u Tipsportu", "Zobrazit u Chance" */
  locative: string;
  oddsFeed: 'active' | 'none';
  affiliate: 'approved' | 'none';
  review: 'published' | 'draft' | 'none';
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
  { id: 'allwyn', name: 'Allwyn', locative: 'u Allwynu', oddsFeed: 'none', affiliate: 'approved', review: 'published', color: '#1d4757',
    logo: { src: '/img/loga/allwyn.webp', w: 214, h: 64 }, site: 'https://www.allwyn.cz' },
  { id: 'fortuna', name: 'Fortuna', locative: 'u Fortuny', oddsFeed: 'none', affiliate: 'none', review: 'none', color: '#f6c400',
    logo: null, site: 'https://www.ifortuna.cz' },
  { id: 'betano', name: 'Betano', locative: 'u Betana', oddsFeed: 'none', affiliate: 'none', review: 'none', color: '#ff6a00',
    logo: null, site: 'https://www.betano.cz' },
];

export const BOOK = Object.fromEntries(BOOKMAKERS.map((b) => [b.id, b])) as Record<BookId, Bookmaker>;
/** Books whose odds we import, in display order. */
export const FEED_BOOKS: FeedBook[] = BOOKMAKERS.filter((b) => b.oddsFeed === 'active').map((b) => b.id as FeedBook);
export const isFeedBook = (s: string): s is FeedBook => (FEED_BOOKS as string[]).includes(s);
export const PARTNERS = BOOKMAKERS.filter((b) => b.affiliate === 'approved');
