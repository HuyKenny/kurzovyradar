// Site-wide constants.
export const SITE = {
  name: 'KurzovýRadar',
  domain: 'kurzovyradar.cz',
  url: 'https://kurzovyradar.cz',
  locale: 'cs_CZ',
  email: 'info@kurzovyradar.cz',
  /** Operator (Kenny approved name + IČO on the site, 23. 10. 2026; public in ARES). */
  operator: { name: 'Ha Duy Huy', ico: '07876823', vat: 'neplátce DPH' },
  /** Who writes and checks the editorial pages. */
  editor: 'Redakce KurzovéhoRadaru',
  /** GA4 measurement ID; empty = no analytics and no cookie bar. */
  ga4: '',
  timeZone: 'Europe/Prague',
};

/** Help lines for problem gambling (same as the sister sites, verified 17. 10. 2026). */
export const HELP = {
  naberteKurz: { name: 'Naberte kurz', phone: '777 477 877', tel: '+420777477877', note: 'nonstop' },
  linka: { name: 'Národní linka pro odvykání', phone: '800 350 000', tel: '+420800350000', note: 'všední dny 10–18 h, zdarma' },
};

export const NAV = [
  { href: '/kurzy/', label: 'Kurzy' },
  { href: '/radar/', label: 'Radar' },
  { href: '/sazkove-kancelare/', label: 'Kde vsadit' },
  { href: '/pruvodce/', label: 'Průvodce' },
];
