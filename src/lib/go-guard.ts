/** Automation that is not a browser: it must never produce a partner click (invalid traffic can cost an affiliate account). */
export const BOT = /bot|crawl|spider|slurp|preview|headless|curl|wget|python|go-http|scrapy|httpx|axios|node-fetch|okhttp|java\/|libwww|aiohttp|postman|insomnia/i;
const HOSTS = new Set(['kurzovyradar.cz', 'www.kurzovyradar.cz']);

/** A real click comes from one of our own pages: the browser says so (Sec-Fetch-Site) or the Referer is ours. */
export function fromOurPage(headers: Headers): boolean {
  const site = headers.get('sec-fetch-site');
  if (site === 'same-origin' || site === 'same-site') return true;
  try { return HOSTS.has(new URL(headers.get('referer') ?? '').hostname); } catch { return false; }
}
