// Bookmaker logos for the uniform logo slot. Sources and colours are documented in docs/ASSETS.md.
//  - Tipsport, Chance: the brand tiles already used across the portfolio (apps/spinydnes uploads), cropped to the
//    wordmark band with the brand background kept (no recolouring, proportions preserved).
//  - Allwyn: official SVG paths from the allwyn.cz header (fetched 23. 10. 2026), colours from their CSS.
// node scripts/logos.mjs
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
const OUT = new URL('../public/img/loga/', import.meta.url).pathname;
const H = 64; // 2× the 32 px display height

async function band(src, name) {
  const img = sharp(src).removeAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const bg = [data[0], data[1], data[2]];
  let x0 = info.width, y0 = info.height, x1 = 0, y1 = 0;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    const i = (y * info.width + x) * 3;
    if (Math.abs(data[i] - bg[0]) + Math.abs(data[i + 1] - bg[1]) + Math.abs(data[i + 2] - bg[2]) > 60) {
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
  }
  const padY = Math.round((y1 - y0) * 0.45), padX = Math.round((y1 - y0) * 0.6);
  const left = Math.max(0, x0 - padX), top = Math.max(0, y0 - padY);
  const width = Math.min(info.width - left, x1 - x0 + 2 * padX), height = Math.min(info.height - top, y1 - y0 + 2 * padY);
  const out = await sharp(src).extract({ left, top, width, height }).resize({ height: H }).webp({ quality: 92 }).toBuffer({ resolveWithObject: true });
  writeFileSync(`${OUT}${name}.webp`, out.data);
  console.log(name, out.info.width, 'x', out.info.height, 'bg', bg.join(','));
}

await band('/home/kenny/ai/apps/spinydnes/public/wp-content/uploads/2025/09/tipsport.webp', 'tipsport');
await band('/home/kenny/ai/apps/spinydnes/public/wp-content/uploads/2025/09/chance-logo-1.png', 'chance');

// Allwyn: icon + wordmark from allwyn.cz, on their dark brand teal (#1d4757) as in their own header colours.
const allwyn = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 -4 134 40" width="134" height="40">
<rect x="-8" y="-4" width="134" height="40" fill="#1d4757"/>
<path fill="#5de9d9" d="M16 32a16 16 0 1 0 0-32 16 16 0 0 0 0 32"/>
<path fill="#1d4757" d="M15.47 19.74a3.74 3.74 0 1 1 0-7.48 3.74 3.74 0 0 1 0 7.48m3.37-10.63a5.4 5.4 0 0 0-4.72-2.34c-4.2 0-8.06 3.51-8.06 9.23s3.9 9.23 7.95 9.23c2.17 0 3.8-.88 4.83-2.45v2.1h6.04V7.12h-6.04z"/>
<g fill="#27e2cc"><svg x="36" y="1" width="83" height="30" viewBox="35 1 88 30">
<path d="M62.62 2.38H57.5v22.5h5.12zM69.78 2.38h-5.12v22.5h5.12zM116.78 9.16c-1.67 0-3.06.77-3.98 2.03V9.47h-5.21v15.4h5.24V16.4c0-1.85.86-2.71 2.07-2.71 1.35 0 2 .9 2 2.5v8.69h5.33v-9.84c0-3.73-2.16-5.88-5.45-5.88"/>
<path d="m102.44 9.47-2.9 8.3-2.75-8.3h-5.15l-2.74 8.32-2.75-8.32h-4.53l-2.93 8.32-2.59-8.32h-5.24l2.46 7.4 2.66 8h4.87l2.93-8.04 2.8 8.05h4.88l2.81-8.05 2.65 7.4-3 7.77h5.3l8.58-22.53zM47.3 20.42a3.25 3.25 0 1 1 0-6.5 3.25 3.25 0 0 1 0 6.5m2.92-9.23a4.7 4.7 0 0 0-4.1-2.03c-3.64 0-7 3.05-7 8.01s3.4 8.02 6.9 8.02c1.89 0 3.3-.77 4.2-2.13v1.82h5.24V9.47h-5.24z"/></svg></g></svg>`;
const a = await sharp(Buffer.from(allwyn), { density: 300 }).resize({ height: H }).webp({ quality: 92 }).toBuffer({ resolveWithObject: true });
writeFileSync(`${OUT}allwyn.webp`, a.data);
console.log('allwyn', a.info.width, 'x', a.info.height);
