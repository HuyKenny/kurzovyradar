/**
 * Sister sites in the gambling cluster (own sites, disclosed on /o-nas/): where the same competition has a page there.
 * Only competitions that have a curated page on the other site are listed (checked 24. 10. 2026, every URL answered 200),
 * so a link never points at a 404. One contextual link per competition page, never in the template chrome.
 */
export const SPORTSTREAMY = 'https://sportstreamy.cz';
export const ZIVEPRENOSY = 'https://ziveprenosy.sk';

/** kurzovyradar competition slug → path on sportstreamy.cz (Czech: programme of broadcasts, results). */
export const ON_SPORTSTREAMY: Record<string, string> = {
  'chance-liga': '/fotbal-online/chance-liga/',
  'chance-narodni-liga': '/fotbal-online/chance-narodni-liga/',
  'liga-mistru': '/fotbal-online/liga-mistru/',
  'evropska-liga': '/fotbal-online/evropska-liga/',
  'konferencni-liga': '/fotbal-online/konferencni-liga/',
  'premier-league': '/fotbal-online/premier-league/',
  'championship': '/fotbal-online/championship/',
  'la-liga': '/fotbal-online/la-liga/',
  'bundesliga': '/fotbal-online/bundesliga/',
  'serie-a': '/fotbal-online/serie-a/',
  'ligue-1': '/fotbal-online/ligue-1/',
  'nike-liga': '/fotbal-online/nike-liga/',
  'tipsport-extraliga': '/hokej-online/tipsport-extraliga/',
  'maxa-liga': '/hokej-online/maxa-liga/',
  'nhl': '/hokej-online/nhl/',
  'tipos-extraliga': '/hokej-online/slovenska-extraliga/',
};

/** Slovak competitions → path on ziveprenosy.sk (Slovak-language sister site). */
export const ON_ZIVEPRENOSY: Record<string, string> = {
  'nike-liga': '/futbal/nike-liga/',
  'tipos-extraliga': '/hokej/tipsport-liga/',
};
