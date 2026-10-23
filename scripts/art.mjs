// Sticker-style illustrations, logo symbol and favicon: one hand-tuned set in the site palette (ink outline,
// hard offset shadow, paper / green / orange). Writes public/img/art/*.svg + src/data/art.json, and the favicons.
// node scripts/art.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import sharp from 'sharp';
const ROOT = new URL('../', import.meta.url).pathname;
const INK = '#16201b', PAPER = '#fffdf8', GREEN = '#0e6b47', GREEN2 = '#dff2e7', ORANGE = '#ff6b1a', ORANGE2 = '#ffe7d6', YELLOW = '#ffd24a';
const S = `stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"`;

/** Each icon: `shadow` = silhouette drawn in ink 3 px down-right, `art` = the drawing. 64×64 canvas. */
const ICONS = {
  fotbal: {
    shadow: `<circle cx="31" cy="31" r="24"/>`,
    art: `<circle cx="31" cy="31" r="24" fill="${PAPER}" ${S}/>
      <path d="M31 22l8.5 6.2-3.3 10H25.8l-3.3-10z" fill="${INK}"/>
      <path d="M31 22V9M39.5 28.2l12-4M36.2 38.2l7.5 10.3M25.8 38.2l-7.5 10.3M22.5 28.2l-12-4" fill="none" ${S}/>
      <path d="M24 8.2l7 3.8 7-3.8M53 22l-1.5 8 4.5 6M45 52l-7-2-5 6M17 52l7-2 5 6M9 22l1.5 8-4.5 6" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>`,
  },
  hokej: {
    shadow: `<path d="M14 6l20 40h16v8H30L8 9z"/><ellipse cx="46" cy="48" rx="12" ry="6"/>`,
    art: `<path d="M13 7l19 39h17v7H29L7 10z" fill="${ORANGE}" ${S}/>
      <path d="M18 17l4.5 9" stroke="${INK}" stroke-width="2" stroke-linecap="round" opacity=".5"/>
      <ellipse cx="45" cy="49" rx="11" ry="5.2" fill="${INK}"/>
      <ellipse cx="45" cy="45.5" rx="11" ry="5.2" fill="#3a4a42" ${S}/>`,
  },
  radar: {
    shadow: `<rect x="7" y="7" width="50" height="50" rx="12"/>`,
    art: `<rect x="7" y="7" width="50" height="50" rx="12" fill="${GREEN}" ${S}/>
      <path d="M16 18a30 30 0 0 1 30 30" fill="none" stroke="${PAPER}" stroke-opacity=".45" stroke-width="2.6"/>
      <path d="M16 30a18 18 0 0 1 18 18" fill="none" stroke="${PAPER}" stroke-opacity=".45" stroke-width="2.6"/>
      <path d="M16 48L41 30A30 30 0 0 0 33 22Z" fill="${PAPER}" fill-opacity=".28"/>
      <path d="M16 48L35 22" stroke="${PAPER}" stroke-width="3" stroke-linecap="round"/>
      <circle cx="44" cy="19" r="5" fill="${ORANGE}" ${S}/>
      <circle cx="16" cy="48" r="3.2" fill="${PAPER}" ${S}/>`,
  },
  kalkulacka: {
    shadow: `<rect x="13" y="6" width="38" height="52" rx="7"/>`,
    art: `<rect x="13" y="6" width="38" height="52" rx="7" fill="${PAPER}" ${S}/>
      <rect x="19" y="12" width="26" height="12" rx="3" fill="${GREEN2}" ${S}/>
      <path d="M33 18h7" stroke="${GREEN}" stroke-width="3" stroke-linecap="round"/>
      ${[0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => `<rect x="${19 + c * 9.5}" y="${30 + r * 8.5}" width="7" height="6" rx="1.8" fill="${r === 2 && c === 2 ? ORANGE : INK}"/>`)).join('')}`,
  },
  kancelar: {
    shadow: `<path d="M8 14h48v10a6 6 0 0 0 0 12v10H8V36a6 6 0 0 0 0-12z"/>`,
    art: `<path d="M8 14h48v10a6 6 0 0 0 0 12v10H8V36a6 6 0 0 0 0-12z" fill="${YELLOW}" ${S}/>
      <path d="M24 16v28" stroke="${INK}" stroke-width="2" stroke-dasharray="3 3"/>
      <path d="M31 30l5 5 10-11" fill="none" stroke="${GREEN}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="16" cy="22" r="2.4" fill="${INK}"/><circle cx="16" cy="38" r="2.4" fill="${INK}"/>`,
  },
  'krok-kontrola': {
    shadow: `<circle cx="32" cy="32" r="23"/>`,
    art: `<circle cx="32" cy="32" r="23" fill="${PAPER}" ${S}/>
      <path d="M32 18v14l9 6" fill="none" stroke="${INK}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M13 22a21 21 0 0 1 33-8" fill="none" stroke="${GREEN}" stroke-width="4" stroke-linecap="round"/>
      <path d="M47 7l-1 8-8-1" fill="none" stroke="${GREEN}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="32" cy="32" r="2.6" fill="${ORANGE}" stroke="${INK}" stroke-width="1.6"/>`,
  },
  'krok-porovnani': {
    shadow: `<rect x="5" y="16" width="27" height="36" rx="5" transform="rotate(-8 18 34)"/><rect x="32" y="12" width="27" height="36" rx="5" transform="rotate(7 45 30)"/>`,
    art: `<rect x="5" y="16" width="27" height="36" rx="5" fill="${PAPER}" ${S} transform="rotate(-8 18 34)"/>
      <rect x="32" y="12" width="27" height="36" rx="5" fill="${GREEN2}" ${S} transform="rotate(7 45 30)"/>
      <path d="M11 29h13M11 35h9" stroke="${INK}" stroke-width="2.4" stroke-linecap="round" transform="rotate(-8 18 34)"/>
      <path d="M38 25h13M38 31h9" stroke="${INK}" stroke-width="2.4" stroke-linecap="round" transform="rotate(7 45 30)"/>
      <path d="M41 39l3.5 3.5 7-7.5" fill="none" stroke="${GREEN}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" transform="rotate(7 45 30)"/>`,
  },
  'krok-historie': {
    shadow: `<rect x="6" y="9" width="52" height="46" rx="8"/>`,
    art: `<rect x="6" y="9" width="52" height="46" rx="8" fill="${PAPER}" ${S}/>
      <path d="M12 46h40" stroke="${INK}" stroke-width="1.6" opacity=".35"/>
      <path d="M13 22h9v9h9v-5h8v12h11" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
      <circle cx="50" cy="38" r="4.4" fill="${ORANGE}" ${S}/>
      <path d="M41 15l6 0" stroke="${GREEN}" stroke-width="3" stroke-linecap="round"/>`,
  },
  pruvodce: {
    shadow: `<path d="M6 14c9-4 18-4 26 2 8-6 17-6 26-2v36c-9-4-18-4-26 2-8-6-17-6-26-2z"/>`,
    art: `<path d="M6 14c9-4 18-4 26 2v36c-8-6-17-6-26-2z" fill="${PAPER}" ${S}/>
      <path d="M58 14c-9-4-18-4-26 2v36c8-6 17-6 26-2z" fill="${GREEN2}" ${S}/>
      <path d="M12 23c5-1.5 10-1.5 14 .5M12 30c5-1.5 10-1.5 14 .5M12 37c5-1.5 10-1.5 14 .5" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" opacity=".55"/>
      <path d="M39 31l4.5 4.5 9-9" fill="none" stroke="${GREEN}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  'pruvodce-kurzy-pro-zacatecniky': {
    shadow: `<circle cx="32" cy="27" r="17"/><rect x="24" y="42" width="16" height="13" rx="3"/>`,
    art: `<circle cx="32" cy="27" r="17" fill="${YELLOW}" ${S}/>
      <path d="M26 31c2-5 2-9 6-9s4 4 6 9" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
      <rect x="24" y="42" width="16" height="13" rx="3" fill="${PAPER}" ${S}/>
      <path d="M26 47h12" stroke="${INK}" stroke-width="2"/>
      <path d="M32 3v3M12 11l2.5 2.2M52 11l-2.5 2.2M7 27h3M57 27h-3" stroke="${ORANGE}" stroke-width="3" stroke-linecap="round"/>`,
  },
  'pruvodce-desetinne-kurzy': {
    shadow: `<ellipse cx="24" cy="46" rx="15" ry="7"/><rect x="9" y="26" width="30" height="20"/><ellipse cx="44" cy="36" rx="13" ry="6"/>`,
    art: `${[0, 1, 2].map((i) => `<ellipse cx="24" cy="${46 - i * 8}" rx="15" ry="6.5" fill="${i === 2 ? YELLOW : '#f2b928'}" ${S}/>`).join('')}
      <path d="M44 34V12" stroke="${GREEN}" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M36 19l8-8 8 8" fill="none" stroke="${GREEN}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
      <ellipse cx="44" cy="44" rx="11" ry="5" fill="${ORANGE}" ${S}/>`,
  },
  'pruvodce-pohyb-kurzu': {
    shadow: `<rect x="6" y="8" width="52" height="48" rx="9"/>`,
    art: `<rect x="6" y="8" width="52" height="48" rx="9" fill="${PAPER}" ${S}/>
      <path d="M13 18l11 10 8-7 12 14 7-3" fill="none" stroke="${ORANGE}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M44 41l7-6-1 9" fill="none" stroke="${ORANGE}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M13 48h38" stroke="${INK}" stroke-width="1.8" opacity=".35"/>`,
  },
  'pruvodce-porovnavani-stejnych-sazek': {
    shadow: `<path d="M8 32h20l-10 14zM36 32h20l-10 14z"/><rect x="29" y="10" width="6" height="44"/>`,
    art: `<path d="M32 9v44M20 54h24" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M12 16h40" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M8 34a10 6 0 0 0 20 0z" fill="${GREEN2}" ${S}/><path d="M36 34a10 6 0 0 0 20 0z" fill="${ORANGE2}" ${S}/>
      <path d="M12 16l-4 18M12 16l16 18M52 16l-16 18M52 16l4 18" stroke="${INK}" stroke-width="1.8" opacity=".6"/>
      <circle cx="32" cy="9" r="3.6" fill="${ORANGE}" ${S}/>`,
  },
  'pruvodce-zakladni-hraci-doba-vs-prodlouzeni': {
    shadow: `<circle cx="32" cy="36" r="22"/>`,
    art: `<circle cx="32" cy="36" r="22" fill="${PAPER}" ${S}/>
      <path d="M32 36V18A18 18 0 0 1 50 36z" fill="${GREEN2}"/>
      <path d="M32 36V20" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M32 36l9 6" stroke="${ORANGE}" stroke-width="3.4" stroke-linecap="round"/>
      <rect x="27" y="5" width="10" height="6" rx="2" fill="${INK}"/>
      <path d="M48 13l4-4" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>
      <circle cx="32" cy="36" r="2.6" fill="${INK}"/>`,
  },
  'pruvodce-jak-ziskavame-data': {
    shadow: `<ellipse cx="28" cy="15" rx="18" ry="7"/><rect x="10" y="15" width="36" height="34"/><ellipse cx="28" cy="49" rx="18" ry="7"/>`,
    art: `<path d="M10 15v34c0 4 8 7 18 7s18-3 18-7V15" fill="${GREEN}" ${S}/>
      <path d="M10 26c0 4 8 7 18 7s18-3 18-7M10 37c0 4 8 7 18 7s18-3 18-7" fill="none" stroke="${PAPER}" stroke-width="2.4" opacity=".6"/>
      <ellipse cx="28" cy="15" rx="18" ry="7" fill="${GREEN2}" ${S}/>
      <circle cx="47" cy="44" r="9" fill="${PAPER}" ${S}/><path d="M53.5 50.5l5 5" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
      <circle cx="47" cy="44" r="3" fill="${ORANGE}"/>`,
  },
};

// Logo symbol = a betting ticket (punched notches) with a radar sweep and an orange blip. Also the favicon.
const LOGO = `<path d="M5 6h54v19a7 7 0 0 0 0 14v19H5V39a7 7 0 0 0 0-14z" fill="${INK}" transform="translate(3 3)"/>
  <path d="M5 6h54v19a7 7 0 0 0 0 14v19H5V39a7 7 0 0 0 0-14z" fill="${GREEN}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M17 18a30 30 0 0 1 30 30" fill="none" stroke="${PAPER}" stroke-opacity=".5" stroke-width="3"/>
  <path d="M17 31a17 17 0 0 1 17 17" fill="none" stroke="${PAPER}" stroke-opacity=".5" stroke-width="3"/>
  <path d="M17 48L37 21" stroke="${PAPER}" stroke-width="3.6" stroke-linecap="round"/>
  <circle cx="45" cy="19" r="6" fill="${ORANGE}" stroke="${INK}" stroke-width="2.6"/>
  <circle cx="17" cy="48" r="3.6" fill="${PAPER}" stroke="${INK}" stroke-width="2"/>`;
const svg = (body, vb = 64) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vb} ${vb}" width="${vb}" height="${vb}">${body}</svg>`;

mkdirSync(`${ROOT}public/img/art`, { recursive: true });
const manifest = {};
for (const [name, ic] of Object.entries(ICONS)) {
  const body = `<g fill="${INK}" transform="translate(3 3)">${ic.shadow}</g>${ic.art}`;
  writeFileSync(`${ROOT}public/img/art/${name}.svg`, svg(body, 67).replace('viewBox="0 0 67 67"', 'viewBox="0 0 67 67"'));
  manifest[name] = { file: `${name}.svg`, w: 67, h: 67 };
}
writeFileSync(`${ROOT}public/img/art/logo-symbol.svg`, svg(LOGO, 66));
manifest['logo-symbol'] = { file: 'logo-symbol.svg', w: 66, h: 66 };
writeFileSync(`${ROOT}src/data/art.json`, JSON.stringify(manifest, null, 1) + '\n');

// Favicons from the logo symbol (on the page colour, so the notches read in a tab).
const fav = svg(`<rect width="66" height="66" fill="#f6f4ee"/>${LOGO}`, 66);
writeFileSync(`${ROOT}public/favicon.svg`, svg(LOGO, 66));
for (const [n, s] of [['favicon-32.png', 32], ['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512]]) {
  await sharp(Buffer.from(n === 'favicon-32.png' ? svg(LOGO, 66) : fav), { density: 900 }).resize(s, s).png().toFile(`${ROOT}public/${n}`);
}
console.log(Object.keys(manifest).length, 'artworks + favicons');
