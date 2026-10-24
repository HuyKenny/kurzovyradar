/** Query parameters the pages actually read. Everything else is dropped before rendering and caching, so `/?x=<random>` cannot
 *  create cold renders and an unknown parameter can never turn the cached base page into its noindex variant. */
export const KNOWN_PARAMS = new Set(['den', 'do', 'ds', 'e', 'ff', 'k', 'k1', 'k2', 'v2', 'o1', 'o2', 'o3', 'o4', 'o5', 'o6', 'kancelar', 'kf', 'kurz', 'obdobi', 'od', 'pohled', 'q', 'sledovane', 'soutez', 'sport', 'strana', 'tip', 'trh', 'vklad', 'vo', 'vp', 'vysledek', 'zjisteni', 'zmena', 'zpet']);

