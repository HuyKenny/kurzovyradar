// Re-check the welcome bonuses against the bookmakers' own pages and print what differs from src/config/bonuses.ts.
//   node scripts/kurzovyradar-bonusy-over.mjs
// Chance is read with the workspace Chromium. tipsport.cz is a JS app that blocks this machine: read it with the Apify
// "web-fetch" tool (url https://www.tipsport.cz/bonusy/vstupni-bonus, wait 9000) and compare by hand with the same fields.
// After a check update `verifiedAt` in bonuses.ts; figures disappear from the site 21 days after the last check.
import { createRequire } from 'node:module';
import { BONUSES } from '../src/config/bonuses.ts';
const puppeteer = createRequire('/home/kenny/ai/package.json')('puppeteer-core');
const num = (s) => Number(String(s).replace(/[\s ]/g, '').replace(',', '.'));
const b = await puppeteer.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] });
const p = await b.newPage();
await p.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36');
await p.setViewport({ width: 1366, height: 900 });
await p.goto('https://www.chance.cz/bonusy/vstupni-bonus', { waitUntil: 'networkidle2', timeout: 60000 });
await p.waitForFunction(() => /prosázet/.test(document.body.innerText), { timeout: 30000 }).catch(() => {});
const text = await p.evaluate(() => `${document.title}\n${document.body.innerText}`);
await b.close();
const m = {
  registration: /získejte\s+([\d\s]+)\s*Kč jen za registraci/i.exec(text)?.[1],
  maxBonus: /vstupní bonus až\s+([\d\s]+)\s*Kč/i.exec(text)?.[1],
  wager: /prosázet\s+([\d\s]+)\s*Kč na tiketech s minimálním kurzem\s+(\d+(?:[.,]\d+)?)/i.exec(text),
  daily: /maximální výši\s+([\d\s]+)\s*Kč/i.exec(text)?.[1],
  pay: /po prosázení\s+([\d\s]+)\s*Kč vám na herní konto vyplatíme\s+([\d\s]+)\s*Kč/i.exec(text),
};
const c = BONUSES.find((x) => x.book === 'chance');
const rows = [
  ['maxBonus', c.maxBonus, m.maxBonus && num(m.maxBonus)],
  ['wager', c.tier.wager, m.wager && num(m.wager[1])],
  ['minOdds', c.tier.minOdds, m.wager && num(m.wager[2])],
  ['dailyCap', c.tier.dailyCap, m.daily && num(m.daily)],
  ['payEvery', c.tier.payEvery, m.pay && num(m.pay[1])],
  ['pay', c.tier.pay, m.pay && num(m.pay[2])],
];
let diff = 0;
for (const [k, mine, theirs] of rows) { const ok = mine === theirs; if (!ok) diff++; console.log(ok ? 'ok  ' : 'DIFF', 'chance', k, 'config', mine, 'page', theirs ?? '(not found)'); }
console.log(diff ? `${diff} difference(s): update src/config/bonuses.ts` : 'Chance matches the page; set verifiedAt to today.');
