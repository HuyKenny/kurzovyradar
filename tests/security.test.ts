import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { securityHeaders } from '../src/lib/security';
import { fromOurPage } from '../src/lib/go-guard';
import { ROBOTS, AI_TRAINING_BOTS } from '../src/lib/robots';

const staticBlock = () => {
  const text = readFileSync(new URL('../public/_headers', import.meta.url), 'utf8');
  const block = text.split(/\n(?=\/)/).find((b) => b.startsWith('/*'))!;
  return Object.fromEntries(block.split('\n').slice(1).filter((l) => l.startsWith('  ')).map((l) => { const i = l.indexOf(':'); return [l.slice(2, i).trim(), l.slice(i + 1).trim()]; }));
};

describe('security headers', () => {
  it('static files and prerendered pages get the same headers as SSR pages', () => {
    const ssr = securityHeaders();
    const stat = staticBlock();
    for (const k of Object.keys(ssr)) expect(stat[k], k).toBe(ssr[k]);
  });
  it('CSP allows only Google Analytics as third party', () => {
    const csp = securityHeaders()['Content-Security-Policy']!;
    const hosts = [...csp.matchAll(/https:\/\/[^\s;']+/g)].map((m) => m[0]);
    for (const h of hosts) expect(h, h).toMatch(/googletagmanager\.com|google-analytics\.com|analytics\.google\.com/);
  });
});

describe('/go/ accepts only clicks from our own pages', () => {
  it('browser header or our Referer', () => {
    expect(fromOurPage(new Headers({ 'sec-fetch-site': 'same-origin' }))).toBe(true);
    expect(fromOurPage(new Headers({ referer: 'https://kurzovyradar.cz/kurzy/' }))).toBe(true);
    expect(fromOurPage(new Headers({ referer: 'https://kurzovyradar.cz.evil.example/' }))).toBe(false);
    expect(fromOurPage(new Headers({ 'sec-fetch-site': 'none' }))).toBe(false);
    expect(fromOurPage(new Headers({}))).toBe(false);
  });
});

describe('robots.txt', () => {
  it('keeps /go/ and /api/ out and refuses training crawlers but not search/answer bots', () => {
    expect(ROBOTS).toContain('Disallow: /go/');
    for (const b of AI_TRAINING_BOTS) expect(ROBOTS).toContain(`User-agent: ${b}\nDisallow: /`);
    for (const ok of ['OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Claude-User', 'Googlebot', 'bingbot']) expect(ROBOTS).not.toContain(`User-agent: ${ok}`);
    expect(ROBOTS).toContain('Sitemap: https://kurzovyradar.cz/sitemap.xml');
  });
});
