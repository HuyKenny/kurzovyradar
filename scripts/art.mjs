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


// One sticker per sport (same style): the ball, racket, glove or board of the sport. Keys are the sport slugs of src/config/competitions.ts.
const RED = '#d9362b', LIME = '#d6ea4e', WOOD = '#d9a35f', BROWN = '#8a4b24', PURPLE = '#6b5bd6';
const ball = (cx, cy, r, fill) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${S}/>`;
Object.assign(ICONS, {
  basketbal: {
    shadow: `<circle cx="31" cy="31" r="24"/>`,
    art: `${ball(31, 31, 24, ORANGE)}<path d="M31 7v48M7 31h48" fill="none" stroke="${INK}" stroke-width="2.2"/>
      <path d="M13 12c11 12 11 28 0 40M49 12c-11 12-11 28 0 40" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`,
  },
  tenis: {
    shadow: `<circle cx="31" cy="31" r="24"/>`,
    art: `${ball(31, 31, 24, LIME)}<path d="M9 16c14 7 14 25 0 32M53 16c-14 7-14 25 0 32" fill="none" stroke="${PAPER}" stroke-width="3.6" stroke-linecap="round"/>`,
  },
  volejbal: {
    shadow: `<circle cx="31" cy="31" r="24"/>`,
    art: `${ball(31, 31, 24, PAPER)}<path d="M31 7c9 6 13 15 12 25M8 38c11-2 19-7 23-14M50 46c-5-9-12-14-20-15" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M31 7c-2 8-1 15 1 24-8-6-14-8-23-9 3-8 11-14 22-15z" fill="${YELLOW}" opacity=".85"/>
      <path d="M31 7c9 6 13 15 12 25M8 38c11-2 19-7 23-14M50 46c-5-9-12-14-20-15" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`,
  },
  'americky-fotbal': {
    shadow: `<ellipse cx="31" cy="31" rx="26" ry="15" transform="rotate(-35 31 31)"/>`,
    art: `<g transform="rotate(-35 31 31)"><ellipse cx="31" cy="31" rx="26" ry="15" fill="${BROWN}" ${S}/>
      <path d="M21 31h20M26 27v8M31 27v8M36 27v8" stroke="${PAPER}" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M12 21c-2 6-2 14 0 20M50 21c2 6 2 14 0 20" fill="none" stroke="${PAPER}" stroke-width="2.4" stroke-linecap="round"/></g>`,
  },
  'stolni-tenis': {
    shadow: `<circle cx="25" cy="25" r="18"/><path d="M36 38l14 16" stroke="#000" stroke-width="11" stroke-linecap="round"/><circle cx="51" cy="13" r="6.5"/>`,
    art: `<path d="M36 38l14 16" stroke="${INK}" stroke-width="11" stroke-linecap="round"/><path d="M36 38l14 16" stroke="${WOOD}" stroke-width="6" stroke-linecap="round"/>
      ${ball(25, 25, 18, RED)}<path d="M14 22a13 13 0 0 1 8-8" fill="none" stroke="${PAPER}" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>${ball(51, 13, 6, PAPER)}`,
  },
  hazena: {
    shadow: `<circle cx="31" cy="31" r="24"/>`,
    art: `${ball(31, 31, 24, YELLOW)}<path d="M31 7c-9 10-9 38 0 48M31 7c9 10 9 38 0 48M8 24c14 5 34 5 47 0M8 40c14-5 34-5 47 0" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M14 14c4 3 8 4 11 4M49 14c-4 3-8 4-11 4" fill="none" stroke="${GREEN}" stroke-width="3" stroke-linecap="round"/>`,
  },
  esporty: {
    shadow: `<rect x="5" y="17" width="54" height="32" rx="16"/>`,
    art: `<rect x="5" y="17" width="54" height="32" rx="16" fill="${PURPLE}" ${S}/>
      <path d="M19 26v14M12 33h14" stroke="${PAPER}" stroke-width="4.6" stroke-linecap="round"/>
      ${ball(44, 28, 3.8, ORANGE)}${ball(51, 35, 3.8, GREEN2)}${ball(44, 40, 3.8, YELLOW)}${ball(37, 35, 3.8, PAPER)}
      <path d="M25 9l-4 8M39 9l4 8" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
  },
  'bojove-sporty': {
    shadow: `<path d="M21 6h22l15 15v22L43 58H21L6 43V21z"/>`,
    art: `<path d="M21 6h22l15 15v22L43 58H21L6 43V21z" fill="${GREEN}" ${S}/>
      <path d="M24 17h16l9 9v12l-9 9H24l-9-9V26z" fill="${PAPER}" ${S}/>
      <path d="M25 38l5-12 4 7 5-11" fill="none" stroke="${ORANGE}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  box: {
    shadow: `<path d="M14 30c0-11 8-19 21-19h8c8 0 12 6 12 14v14c0 6-3 10-9 12v6H22v-6c-5-3-8-7-8-12z"/>`,
    art: `<path d="M14 30c0-11 8-19 21-19h8c8 0 12 6 12 14v14c0 6-3 10-9 12v6H22v-6c-5-3-8-7-8-12z" fill="${RED}" ${S}/>
      <rect x="22" y="46" width="22" height="11" rx="3" fill="${PAPER}" ${S}/>
      <path d="M24 29c4-4 11-4 17 0" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round" opacity=".6"/>
      <ellipse cx="17" cy="35" rx="5.5" ry="8" fill="${RED}" ${S}/>`,
  },
  florbal: {
    shadow: `<path d="M12 6l23 40c2 3 6 5 10 5h9"/><circle cx="49" cy="45" r="9"/>`,
    art: `<path d="M12 7l23 40c2 3 6 5 10 5h8" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12 7l23 40c2 3 6 5 10 5h8" fill="none" stroke="${GREEN}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
      ${ball(49, 44, 9, PAPER)}${[[46, 41], [52, 42], [47, 47], [53, 47]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="${INK}"/>`).join('')}`,
  },
  rugby: {
    shadow: `<ellipse cx="31" cy="31" rx="26" ry="15" transform="rotate(-30 31 31)"/>`,
    art: `<g transform="rotate(-30 31 31)"><ellipse cx="31" cy="31" rx="26" ry="15" fill="#efdcae" ${S}/>
      <path d="M21 17c-3 9-3 21 0 30M41 17c3 9 3 21 0 30" fill="none" stroke="${GREEN}" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M27 31h8" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/></g>`,
  },
  sipky: {
    shadow: `<circle cx="29" cy="33" r="24"/>`,
    art: `${ball(29, 33, 24, INK)}${ball(29, 33, 19, PAPER)}${ball(29, 33, 13, GREEN)}${ball(29, 33, 7.5, PAPER)}${ball(29, 33, 3.4, RED)}
      <path d="M52 8L33 29" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/><path d="M47 8l9-3-3 10z" fill="${ORANGE}" ${S}/>`,
  },
  futsal: {
    shadow: `<circle cx="31" cy="31" r="24"/>`,
    art: `${ball(31, 31, 24, PAPER)}<path d="M31 22l8.5 6.2-3.3 10H25.8l-3.3-10z" fill="${ORANGE}" ${S}/>
      <path d="M31 22V9M39.5 28.2l12-4M36.2 38.2l7.5 10.3M25.8 38.2l-7.5 10.3M22.5 28.2l-12-4" fill="none" ${S}/>`,
  },
  badminton: {
    shadow: `<path d="M23 43L11 10q21-8 42 0L41 43z"/><circle cx="32" cy="51" r="9"/>`,
    art: `<path d="M23 43L11 10q21-8 42 0L41 43z" fill="${PAPER}" ${S}/>
      <path d="M32 40V8M22 40L20 9M42 40L44 9M15 22h34M19 33h26" fill="none" stroke="${INK}" stroke-width="1.8" opacity=".55"/>
      ${ball(32, 51, 9, ORANGE)}`,
  },
  baseball: {
    shadow: `<circle cx="31" cy="31" r="24"/>`,
    art: `${ball(31, 31, 24, PAPER)}<path d="M16 12c9 9 9 31 0 40M46 12c-9 9-9 31 0 40" fill="none" stroke="${RED}" stroke-width="2.6" stroke-linecap="round"/>
      ${[16, 24, 32, 40, 48].map((y, i) => `<path d="M${i % 2 ? 20 : 12} ${y - 6} l${i % 2 ? -5 : 5} 3M${i % 2 ? 42 : 50} ${y - 6} l${i % 2 ? 5 : -5} 3" stroke="${RED}" stroke-width="2" stroke-linecap="round"/>`).join('')}`,
  },
  'vodni-polo': {
    shadow: `<circle cx="32" cy="25" r="19"/><path d="M5 50c6-5 10-5 16 0s10 5 16 0 10-5 22 0" fill="none" stroke="#16201b" stroke-width="7" stroke-linecap="round"/>`,
    art: `${ball(32, 25, 19, YELLOW)}<path d="M18 17c8 5 20 5 28 0M16 30c9 4 23 4 32 0" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" opacity=".65"/>
      <path d="M5 50c6-5 10-5 16 0s10 5 16 0 10-5 22 0" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M5 50c6-5 10-5 16 0s10 5 16 0 10-5 22 0" fill="none" stroke="${GREEN}" stroke-width="3.4" stroke-linecap="round"/>`,
  },
  kriket: {
    shadow: `<g transform="rotate(40 32 32)"><rect x="23" y="3" width="16" height="36" rx="4"/><rect x="29" y="38" width="5" height="20"/></g><circle cx="14" cy="50" r="9"/>`,
    art: `<g transform="rotate(40 32 32)"><rect x="29" y="38" width="5" height="20" rx="2" fill="${INK}"/><rect x="23" y="3" width="16" height="36" rx="4" fill="${WOOD}" ${S}/>
      <path d="M31 8v26" stroke="${INK}" stroke-width="2" opacity=".4"/></g>
      ${ball(14, 49, 9, RED)}<path d="M8 44c4 3 8 3 12 0" fill="none" stroke="${PAPER}" stroke-width="1.8" stroke-linecap="round"/>`,
  },
  snooker: {
    shadow: `<circle cx="22" cy="40" r="15"/><circle cx="43" cy="22" r="13"/>`,
    art: `${ball(22, 40, 15, RED)}<circle cx="17" cy="35" r="3.6" fill="${PAPER}" opacity=".55"/>${ball(43, 22, 13, INK)}<circle cx="39" cy="18" r="3.2" fill="${PAPER}" opacity=".7"/>
      <path d="M52 52L58 58" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>`,
  },
  squash: {
    shadow: `<ellipse cx="27" cy="23" rx="16" ry="19" transform="rotate(-25 27 23)"/><path d="M36 40l14 14" stroke="#000" stroke-width="9" stroke-linecap="round"/><circle cx="52" cy="14" r="7"/>`,
    art: `<path d="M37 40l14 14" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M37 40l14 14" stroke="${WOOD}" stroke-width="4.4" stroke-linecap="round"/>
      <g transform="rotate(-25 27 23)"><ellipse cx="27" cy="23" rx="16" ry="19" fill="${GREEN2}" ${S}/>
      <path d="M27 4v38M15 14c8 3 16 3 24 0M13 24h28M15 33c8-3 16-3 24 0" fill="none" stroke="${INK}" stroke-width="1.4" opacity=".5"/></g>
      ${ball(52, 14, 7, INK)}<circle cx="50" cy="12" r="1.8" fill="${YELLOW}"/><circle cx="54" cy="16" r="1.8" fill="${YELLOW}"/>`,
  },
});

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
