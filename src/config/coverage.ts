/**
 * One source of truth for what the site says about its own coverage. Pages read these instead of typing "Tipsport a Chance" or "každých
 * 15 minut", so adding a feed book or changing the cron cannot leave contradicting copy behind. Independent states stay apart:
 *  - FEED_BOOKS (config/bookmakers.ts): whose odds we import;
 *  - PARTNERS: who we have a partner link with (not the same list, and a partner link is no proof of an odds feed);
 *  - BONUSES (config/bonuses.ts): verified welcome-bonus terms with their check date;
 *  - SPORT_LIST (config/competitions.ts): sports we can show; what is on offer today comes from the snapshot.
 * The check frequency comes from settings (IMPORT_INTERVAL_MIN), not from here.
 */
import { BOOK, FEED_BOOKS, PARTNERS } from './bookmakers';

const join = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} a ${xs.at(-1)}`);
/** "Tipsport a Chance" */
export const FEED_NAMES = join(FEED_BOOKS.map((b) => BOOK[b].name));
/** "Tipsportu a Chance" (genitive, from the locative "u Tipsportu") */
export const FEED_GENITIVE = join(FEED_BOOKS.map((b) => BOOK[b].locative.replace(/^u /, '')));
/** Partners that have a partner link, whether or not we import their odds. */
export const PARTNER_NAMES = join(PARTNERS.map((b) => BOOK[b.id].name));
/** Partners without an odds feed (shown so nobody reads "partner" as "compared"). */
export const PARTNERS_WITHOUT_FEED = PARTNERS.filter((b) => b.oddsFeed !== 'active').map((b) => b.name);
