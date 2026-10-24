/** AI crawlers: those that fetch a page to answer a user or to search stay allowed (they send visitors); training-only crawlers are refused
 *  (also blocked in the Cloudflare WAF, which is what actually stops the bad ones). */
export const AI_TRAINING_BOTS = ['GPTBot', 'CCBot', 'ClaudeBot', 'anthropic-ai', 'Bytespider', 'Google-Extended', 'Meta-ExternalAgent', 'FacebookBot', 'Diffbot', 'ImagesiftBot', 'Omgilibot', 'cohere-ai'];
// Filter and pagination variants are NOT disallowed: they carry `noindex, follow` and a canonical, and Google can only see that
// if it may crawl them. Their cost is bounded by the Worker's parameter whitelist (lib/params.ts) and edge cache.
export const ROBOTS = [
  'User-agent: *',
  'Disallow: /go/',
  'Disallow: /api/',
  'Disallow: /hledat/',
  'Disallow: /oblibene/',
  'Disallow: /tipsport-zapas/',
  '',
  ...AI_TRAINING_BOTS.flatMap((b) => [`User-agent: ${b}`, 'Disallow: /', '']),
  'Sitemap: https://kurzovyradar.cz/sitemap.xml',
  '',
].join('\n');
