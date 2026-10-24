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
  'basketbal-nba': '/basketbal-online/nba/',
  'americky-fotbal-nfl': '/americky-fotbal-online/nfl/',
  'bojove-sporty-clash': '/bojove-sporty-online/clash/',
  'hokej-ahl': '/hokej-online/ahl/',
};

/** Slovak competitions → path on ziveprenosy.sk (Slovak-language sister site). */
export const ON_ZIVEPRENOSY: Record<string, string> = {
  'nike-liga': '/futbal/nike-liga/',
  'tipos-extraliga': '/hokej/tipsport-liga/',
};

export const KRATKERECENZE = 'https://kratkerecenze.cz';

/**
 * Independent review of the same bookmaker on our sister site KrátkéRecenze.cz, linked from the bookmaker's page here (one link per page,
 * a different anchor each). The reviews link back to /bonusy/<kancelář>/ only for Tipsport, Chance and Allwyn, never to the page that links
 * to them (see seo/linkbuilding/graf.md).
 */
export const REVIEW_ON_KRATKERECENZE: Record<string, { url: string; anchor: string }> = {
  tipsport: { url: `${KRATKERECENZE}/recenze-tipsport-cz-nejvetsi-sazkova-kancelar-v-ceske-republice/`, anchor: 'nezávislá recenze Tipsportu na KrátkýchRecenzích' },
  chance: { url: `${KRATKERECENZE}/recenze-chance-cz-moderni-sazkova-kancelar-s-bohatou-nabidkou-a-komunitou-sazkaru/`, anchor: 'recenze Chance z jiného pohledu' },
  allwyn: { url: `${KRATKERECENZE}/recenze-sazka-cz-nejvetsi-ceska-loterijni-a-sazkova-platforma-ktera-prinasi-zabavu-i-sanci-na-milionove-vyhry/`, anchor: 'recenze Sazky a Allwynu na KrátkýchRecenzích' },
  merkurxtip: { url: `${KRATKERECENZE}/merkurxtip-recenze-online-kasina-od-spolecnosti-merkur/`, anchor: 'recenze MerkurXtipu z pohledu casina' },
  fortuna: { url: `${KRATKERECENZE}/recenze-fortuna/`, anchor: 'recenze Fortuny na KrátkýchRecenzích' },
  betano: { url: `${KRATKERECENZE}/betano-recenze-komplexni-predstaveni-online-kasina-a-sazkove-kancelare-v-cr/`, anchor: 'recenze Betana a jeho casina' },
};
