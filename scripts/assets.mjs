// Default Open Graph card (satori + Familjen Grotesk, the logo symbol). Icons/favicons come from scripts/art.mjs.
// node scripts/assets.mjs
import sharp from 'sharp';
import satori from 'satori';
import { readFileSync, mkdirSync } from 'node:fs';
const root = new URL('../', import.meta.url).pathname;
const font = (f) => readFileSync(`${root}src/fonts-og/${f}`);
const fonts = [
  { name: 'F', data: font('familjen-700-latin.ttf'), weight: 700 }, { name: 'FX', data: font('familjen-700-latin-ext.ttf'), weight: 700 },
  { name: 'F', data: font('familjen-500-latin.ttf'), weight: 500 }, { name: 'FX', data: font('familjen-500-latin-ext.ttf'), weight: 500 },
];
const sym = `data:image/svg+xml;base64,${readFileSync(`${root}public/img/art/logo-symbol.svg`).toString('base64')}`;
const h = (type, style, children) => ({ type, props: { style, children } });
const odd = (who, v, best) => h('div', { display: 'flex', flexDirection: 'column', padding: '12px 22px', border: '4px solid #16201b', borderRadius: 18, background: best ? '#dff2e7' : '#fff', width: 240, height: 120, boxShadow: '6px 6px 0 #16201b' }, [
  h('div', { display: 'flex', fontSize: 26, fontWeight: 500, color: '#4a554f' }, who), h('div', { display: 'flex', fontSize: 50, fontWeight: 700 }, v),
]);
const card = h('div', { width: 1200, height: 630, display: 'flex', flexDirection: 'column', gap: 44, padding: 64, background: '#f6f4ee', fontFamily: 'F, FX', color: '#16201b' }, [
  h('div', { display: 'flex', alignItems: 'center', gap: 20 }, [
    { type: 'img', props: { src: sym, width: 86, height: 86 } },
    h('div', { display: 'flex', fontSize: 56, fontWeight: 700, letterSpacing: -1.5 }, [h('span', {}, 'Kurzový'), h('span', { color: '#0e6b47' }, 'Radar')]),
  ]),
  h('div', { display: 'flex', fontSize: 70, fontWeight: 700, letterSpacing: -2.5, lineHeight: 1.05 }, 'Porovnej kurzy. Sleduj jejich pohyb.'),
  h('div', { display: 'flex', gap: 26, alignItems: 'center' }, [odd('Domácí', '1,85', true), odd('Remíza', '3,60', false), odd('Hosté', '4,20', false)]),
  h('div', { display: 'flex', fontSize: 30, fontWeight: 500, color: '#b8470c' }, 'Fotbal a hokej · Tipsport a Chance vedle sebe · bez registrace'),
]);
mkdirSync(`${root}public/og`, { recursive: true });
await sharp(Buffer.from(await satori(card, { width: 1200, height: 630, fonts }))).png({ compressionLevel: 9 }).toFile(`${root}public/og/default.png`);
console.log('og/default.png');
