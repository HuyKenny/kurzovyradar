#!/usr/bin/env node
// Sport photos from Pexels (Pexels License: free use, attribution appreciated — we credit in docs/ASSETS.md and on /o-nas/).
// Two steps so a human picks the shots:
//   OUT=/tmp/x node scripts/pexels.mjs search   → contact sheets per slot, ids printed
//   node scripts/pexels.mjs fetch               → downloads PICKS into public/img/foto/, writes src/data/photos.json
// Key: PEXELS_API_KEY from ~/ai/credentials/.kurzovyradar-credentials.env (never committed). Visitors never call Pexels.
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

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
else console.log('usage: pexels.mjs search|fetch');
