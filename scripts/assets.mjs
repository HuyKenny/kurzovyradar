// Icons (from public/favicon.svg) and the default Open Graph card (satori + Inter, our own symbol).
// node scripts/assets.mjs
import sharp from 'sharp';
import satori from 'satori';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const root = new URL('../', import.meta.url).pathname;
const svg = readFileSync(`${root}public/favicon.svg`);
for (const [n, s] of [['favicon-32.png', 32], ['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512]]) {
  await sharp(svg, { density: 600 }).resize(s, s).png().toFile(`${root}public/${n}`);
}
const font = (f) => readFileSync(`${root}src/fonts-og/${f}`);
const fonts = [
  { name: 'Inter', data: font('inter-800-latin.ttf'), weight: 800 }, { name: 'InterExt', data: font('inter-800-ext.ttf'), weight: 800 },
  { name: 'Inter', data: font('inter-500-latin.ttf'), weight: 500 }, { name: 'InterExt', data: font('inter-500-ext.ttf'), weight: 500 },
];
const symbol = `data:image/svg+xml;base64,${svg.toString('base64')}`;
const h = (type, style, children) => ({ type, props: { style, children } });
const card = h('div', { width: 1200, height: 630, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: '#f5f7fb', fontFamily: 'Inter, InterExt', color: '#112039' }, [
  h('div', { display: 'flex', alignItems: 'center', gap: 22 }, [
    { type: 'img', props: { src: symbol, width: 84, height: 84 } },
    h('div', { display: 'flex', fontSize: 52, fontWeight: 800, letterSpacing: -1.5 }, [h('span', {}, 'Kurzový'), h('span', { color: '#2457ff' }, 'Radar')]),
  ]),
  h('div', { display: 'flex', flexDirection: 'column', gap: 18 }, [
    h('div', { fontSize: 76, fontWeight: 800, letterSpacing: -2.5, lineHeight: 1.05 }, 'Porovnej kurzy. Sleduj jejich pohyb.'),
    h('div', { fontSize: 34, fontWeight: 500, color: '#46546d' }, 'Fotbal a hokej · Tipsport a Chance vedle sebe · historie změn kurzů'),
  ]),
  h('div', { display: 'flex', width: 1056, height: 10, borderRadius: 5, backgroundImage: 'linear-gradient(90deg, #2457ff, #3cc8bd)' }, ''),
]);
mkdirSync(`${root}public/og`, { recursive: true });
const out = await satori(card, { width: 1200, height: 630, fonts });
await sharp(Buffer.from(out)).png({ compressionLevel: 9 }).toFile(`${root}public/og/default.png`);
console.log('icons + og/default.png');
