#!/usr/bin/env node
// Screenshots for visual review (Malina: system Chromium + puppeteer-core from ~/ai).
// node scripts/shot.mjs <url> <out.png> [width=1440] [full]
import { createRequire } from 'node:module';
const require = createRequire('/home/kenny/ai/package.json');
const puppeteer = require('puppeteer-core');
const [url, out, width = '1440', full = ''] = process.argv.slice(2);
const w = Number(width);
const mobile = w < 700;
const browser = await puppeteer.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--hide-scrollbars'] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: mobile ? 812 : 900, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  page.on('pageerror', (e) => console.error('PAGEERROR', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  // html/body use overflow-x: clip, so also look for any element sticking out past the viewport.
  const over = await page.evaluate(() => Math.max(document.documentElement.scrollWidth - window.innerWidth,
    ...[...document.querySelectorAll('body *')].map((e) => { const r = e.getBoundingClientRect(); // inside a horizontal scroller (overflow-x: auto) is fine: only the box scrolls, not the page
      let p = e.parentElement; while (p && !['auto', 'scroll'].includes(getComputedStyle(p).overflowX)) p = p.parentElement;
      return r.width && !p && getComputedStyle(e).position !== 'fixed' ? Math.round(r.right - window.innerWidth) : 0; })));
  if (over > 0) console.error('HORIZONTAL OVERFLOW', over, 'px');
  if (full === 'full') await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } window.scrollTo(0, 0); });
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: out, fullPage: full === 'full' });
  console.log(out);
} finally {
  await browser.close();
}
