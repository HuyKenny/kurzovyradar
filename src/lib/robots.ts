/** AI crawlers: those that fetch a page to answer a user or to search stay allowed (they send visitors); training-only crawlers are refused
 *  (also blocked in the Cloudflare WAF, which is what actually stops the bad ones). */
export const AI_TRAINING_BOTS = ['GPTBot', 'CCBot', 'ClaudeBot', 'anthropic-ai', 'Bytespider', 'Google-Extended', 'Meta-ExternalAgent', 'FacebookBot', 'Diffbot', 'ImagesiftBot', 'Omgilibot', 'cohere-ai'];
/** Filter and pagination variants are noindex pages; Google still has to crawl them to see that, so only the parameters that
 *  produce unbounded, useless combinations are kept out of crawling. */
const PARAMS = ['strana', 'od', 'do', 'zmena', 'kancelar', 'trh', 'zpet', 'vklad', 'vo', 'vp', 'kf', 'ff'];
export const ROBOTS = [
  'User-agent: *',
  'Disallow: /go/',
  'Disallow: /api/',
  'Disallow: /hledat/',
  'Disallow: /oblibene/',
  ...PARAMS.flatMap((p) => [`Disallow: /*?${p}=`, `Disallow: /*&${p}=`]),
  '',
  ...AI_TRAINING_BOTS.flatMap((b) => [`User-agent: ${b}`, 'Disallow: /', '']),
  'Sitemap: https://kurzovyradar.cz/sitemap.xml',
  '',
].join('\n');
