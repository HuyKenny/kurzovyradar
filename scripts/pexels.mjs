#!/usr/bin/env node
// Sport photos from Pexels (Pexels License: free use, attribution appreciated — we credit in docs/ASSETS.md and on /o-nas/).
// Two steps so a human picks the shots:
//   OUT=/tmp/x node scripts/pexels.mjs search   → contact sheets per slot, ids printed
//   node scripts/pexels.mjs fetch               → downloads PICKS into public/img/foto/, writes src/data/photos.json
// Key: PEXELS_API_KEY from ~/ai/credentials/.kurzovyradar-credentials.env (never committed). Visitors never call Pexels.
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';

const KEY = readFileSync('/home/kenny/ai/credentials/.kurzovyradar-credentials.env', 'utf8').match(/^PEXELS_API_KEY="?([^"\n]+)/m)?.[1];
if (!KEY) throw new Error('PEXELS_API_KEY missing');
const OUT = process.env.OUT ?? '/tmp';

/** Generic atmosphere only: no photo is presented as a shot of a specific match. */
const QUERIES = {
  hero: 'football stadium stands floodlights',
  fotbal: 'football pitch grass stadium',
  hokej: 'ice hockey rink arena',
  pruvodce: 'stadium seats empty',
  radar: 'scoreboard stadium night',
};

/** Chosen photo id per slot (filled after looking at the contact sheets). */
const PICKS = { hero: 28827841, fotbal: 33210166, hokej: 6539276, pruvodce: 434633 };

/** Feature photo per guide (/pruvodce/<slug>/): slot `g-<slug>`, Czech alt. Kenny 15. 11. 2026: every article gets a feature photo.
 *  `node scripts/pexels.mjs guides` downloads only the missing ones and merges them into src/data/photos.json. */
const GUIDES = {
  'boxing-day-kurzy': [4036040, 'Zasněžená fotbalová branka na hřišti v noci'],
  'cashout-predcasna-vyplata': [32285225, 'Dva fotbalisté v souboji o míč během zápasu'],
  'desetinne-kurzy': [5466814, 'Ruka píše výpočty do sešitu vedle kalkulačky'],
  'handicap-v-sazeni': [11097680, 'Fotbalista padá po souboji na trávníku'],
  'jak-poznat-legalni-sazkovou-kancelar': [36740854, 'Ruka drží mosazný visací zámek'],
  'jak-zacit-sazet': [4777979, 'Ovladač v ruce před televizí s fotbalovým přenosem'],
  'jak-ziskavame-data': [265087, 'Notebook s grafy a tabulkami vedle tabletu'],
  'kde-sledovat-zapas-a-jak-cist-kurzy': [36766078, 'Skupina přátel sleduje doma fotbalový zápas s vlajkami a občerstvením'],
  'kurzy-pro-zacatecniky': [38105639, 'Fotbalový míč na trávníku večer'],
  'marze-sazkove-kancelare': [6120170, 'Kalkulačka, znak procenta a telefon s grafem na stole'],
  'pohyb-kurzu': [4604639, 'Graf vývoje hodnoty na obrazovce počítače'],
  'porovnavani-stejnych-sazek': [28971395, 'Dva lidé porovnávají své telefony'],
  'rozpocet-a-limity-pri-sazeni': [5717764, 'Muž drží peněženku s bankovkami před notebookem s grafy'],
  'sazeni-na-fotbal': [12537018, 'Zaplněný fotbalový stadion během zápasu'],
  'sazeni-na-hokej': [6468928, 'Hokejisté před brankou během zápasu'],
  'sazeni-z-mobilu': [3912977, 'Telefon se sportovní aplikací v ruce pod neonovým světlem'],
  'sazka-bez-remizy': [18026260, 'Fotbalová branka na prázdném hřišti'],
  'sazka-vice-mene': [38205687, 'Velká výsledková tabule na stadionu'],
  'surebet-a-holandska-sazka': [6077797, 'Zlaté váhy na stole vedle notebooku'],
  'vstupni-bonus-jak-funguje': [13975260, 'Dva zabalené dárky s mašlí'],
  'zakladni-hraci-doba-vs-prodlouzeni': [6847292, 'Hokejová branka uprostřed prázdného kluziště'],
  'zdaneni-vyher-ze-sazek': [7821688, 'Daňové formuláře s kalkulačkou a lupou'],
};

const api = (path) => fetch(`https://api.pexels.com/v1${path}`, { headers: { Authorization: KEY } }).then((r) => {
  if (!r.ok) throw new Error(`pexels ${r.status} ${path}`);
  return r.json();
});

async function search() {
  for (const [slug, q] of Object.entries(QUERIES)) {
    const d = await api(`/search?query=${encodeURIComponent(q)}&per_page=12&orientation=landscape`);
    const tiles = await Promise.all(d.photos.map(async (p) => sharp(Buffer.from(await (await fetch(p.src.medium)).arrayBuffer())).resize(320, 180, { fit: 'cover' }).png().toBuffer()));
    const sheet = sharp({ create: { width: 320 * 4, height: 180 * 3, channels: 3, background: '#000' } })
      .composite(tiles.map((input, i) => ({ input, left: (i % 4) * 320, top: Math.floor(i / 4) * 180 })));
    await sheet.jpeg({ quality: 70 }).toFile(`${OUT}/pexels-${slug}.jpg`);
    console.log(slug, d.photos.map((p) => p.id).join(' '));
  }
}

async function save(slug, id, w0 = [1280, 800, 480]) {
  const p = await api(`/photos/${id}`);
  const base = sharp(Buffer.from(await (await fetch(p.src.original)).arrayBuffer())).rotate();
  for (const w of w0) {
    const img = base.clone().resize(w, Math.round((w * 9) / 16), { fit: 'cover', position: sharp.strategy.attention });
    await img.clone().avif({ quality: 50 }).toFile(`public/img/foto/${slug}-${w}.avif`);
    await img.clone().webp({ quality: 72 }).toFile(`public/img/foto/${slug}-${w}.webp`);
  }
  return p;
}

async function fetchGuides() {
  const meta = JSON.parse(readFileSync('src/data/photos.json', 'utf8'));
  for (const [g, [id, altCs]] of Object.entries(GUIDES)) {
    const slug = `g-${g}`;
    if (meta[slug]?.id === id && existsSync(`public/img/foto/${slug}-1280.webp`)) continue;
    const p = await save(slug, id);
    meta[slug] = { id, author: p.photographer, authorUrl: p.photographer_url, url: p.url, alt: p.alt || '', altCs };
    console.log(slug, id, p.photographer);
  }
  writeFileSync('src/data/photos.json', JSON.stringify(meta, null, 1) + '\n');
}

async function fetchPicks() {
  mkdirSync('public/img/foto', { recursive: true });
  const meta = {};
  for (const [slug, id] of Object.entries(PICKS)) {
    const p = await api(`/photos/${id}`);
    const buf = Buffer.from(await (await fetch(p.src.original)).arrayBuffer());
    const base = sharp(buf).rotate();
    // 16:9 crops at fixed sizes; AVIF + WebP so every browser gets a modern format.
    for (const w of [1280, 800, 480]) {
      const img = base.clone().resize(w, Math.round((w * 9) / 16), { fit: 'cover', position: sharp.strategy.attention });
      await img.clone().avif({ quality: 50 }).toFile(`public/img/foto/${slug}-${w}.avif`);
      await img.clone().webp({ quality: 72 }).toFile(`public/img/foto/${slug}-${w}.webp`);
    }
    meta[slug] = { id, author: p.photographer, authorUrl: p.photographer_url, url: p.url, alt: p.alt || '' };
    console.log(slug, id, p.photographer);
  }
  mkdirSync('src/data', { recursive: true });
  writeFileSync('src/data/photos.json', JSON.stringify(meta, null, 1) + '\n');
}

const cmd = process.argv[2];
if (cmd === 'search') await search();
else if (cmd === 'fetch') await fetchPicks();
else if (cmd === 'guides') await fetchGuides();
else console.log('usage: pexels.mjs search|fetch|guides');
