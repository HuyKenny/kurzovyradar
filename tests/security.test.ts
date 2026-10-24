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

describe('cache key parameters', () => {
  it('every query parameter a page or form uses is in KNOWN_PARAMS (an unknown one is stripped before rendering)', async () => {
    const { readdirSync, readFileSync, statSync } = await import('node:fs');
    const { KNOWN_PARAMS } = await import('../src/lib/params');
    const walk = (d: URL, out: string[] = []): string[] => {
      for (const f of readdirSync(d)) { const u = new URL(f, new URL(`${d.href}/`.replace(/\/+$/, '/'))); statSync(u).isDirectory() ? walk(u, out) : out.push(u.pathname); }
      return out;
    };
    const files = ['pages', 'components', 'lib'].flatMap((x) => walk(new URL(`../src/${x}/`, import.meta.url))).filter((f) => /\.(astro|ts)$/.test(f) && !/\/api\//.test(f) && !/go-guard|params|robots/.test(f));
    const used = new Set<string>();
    for (const f of files) {
      const t = readFileSync(f, 'utf8');
      for (const m of t.matchAll(/\b(?:q|params)\.(?:get|has)\('([a-z0-9_]+)'\)|\bnum\('([a-z0-9_]+)'|searchParams\.get\('([a-z0-9_]+)'\)|\bname="([a-z0-9_]+)"/g)) used.add((m[1] ?? m[2] ?? m[3] ?? m[4])!);
    }
    // Form field names that are not query parameters of a cached page.
    for (const ignore of ['after', 'clock', 'fotbal', 'hero', 'kalkulacka', 'minus', 'pruvodce', 'radar', 'search', 'star', 'x', 'e', 'b', 'p', 'ids', 'souteze', 'sporty']) used.delete(ignore);
    for (const k of used) expect(KNOWN_PARAMS.has(k), `parameter "${k}" is read by a page but missing in src/lib/params.ts`).toBe(true);
  });
});
