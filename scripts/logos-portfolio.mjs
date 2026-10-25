// More bookmaker logos for the uniform logo slot (25. 10. 2026): the square brand tiles already used on spinydnes.cz
// (apps/spinydnes/public/wp-content/uploads), resized only (no recolouring, no cropping). KingsBet: its official dark wordmark SVG on white.
// node scripts/logos-portfolio.mjs
import sharp from 'sharp';
const SRC = '/home/kenny/ai/apps/spinydnes/public/wp-content/uploads/';
const OUT = new URL('../public/img/loga/', import.meta.url).pathname;
const tiles = { fortuna: '2025/10/fortuna-logo.jpg', betx: '2025/10/Betx-logo.png', synottip: '2025/10/Synot-Tip.png', betano: '2025/10/Betano-logo.png', fbet: '2026/10/fbet-logo.png', betor: '2026/10/betor-logo.png' };
for (const [name, f] of Object.entries(tiles)) {
  const o = await sharp(SRC + f).resize(128, 128, { fit: 'contain', background: '#ffffff' }).flatten({ background: '#ffffff' }).webp({ quality: 90 }).toBuffer({ resolveWithObject: true });
  await sharp(o.data).toFile(`${OUT}${name}.webp`);
  console.log(name, o.info.width, o.info.height, o.data.length);
}
// KingsBet: 104×40 wordmark → 64 px high band with padding on white.
const k = await sharp(SRC + '2026/06/kingsbet-logo.svg', { density: 400 }).resize({ height: 44 }).toBuffer();
const meta = await sharp(k).metadata();
const out = await sharp({ create: { width: meta.width + 40, height: 64, channels: 4, background: '#ffffff' } })
  .composite([{ input: k, left: 20, top: 10 }]).webp({ quality: 92 }).toBuffer({ resolveWithObject: true });
await sharp(out.data).toFile(`${OUT}kingsbet.webp`);
console.log('kingsbet', out.info.width, out.info.height);
