import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BOOKMAKERS } from '../src/config/bookmakers';
import { REVIEWS } from '../src/config/reviews';
import { TERMS } from '../src/config/glossary';

const GUIDE_DIR = new URL('../src/content/pruvodce/', import.meta.url);
const guides = readdirSync(GUIDE_DIR).filter((f) => f.endsWith('.md')).map((f) => ({ id: f.replace(/\.md$/, ''), text: readFileSync(new URL(f, GUIDE_DIR), 'utf8') }));

describe('bookmaker overview pages', () => {
  it('every bookmaker with a page has review data, and the other way round', () => {
    for (const b of BOOKMAKERS.filter((x) => x.review === 'published' || x.review === 'info')) expect(REVIEWS.some((r) => r.id === b.id), b.id).toBe(true);
    for (const r of REVIEWS) expect(['published', 'info'], r.id).toContain(BOOKMAKERS.find((b) => b.id === r.id)?.review);
  });
  it('checked statements: every one has a source page and none promises a bonus, a rating or a result', () => {
    for (const r of REVIEWS) for (const [k, pts] of Object.entries(r.more ?? {})) for (const p of pts) {
      expect(p.url, `${r.id}.${k}`).toMatch(/^https:\/\//);
      expect(p.text, `${r.id}.${k}`).not.toMatch(/bonus|promo|free ?spin|zdarma|hvězd|testovali jsme|nejlepší|určitě|zaručen/i);
    }
  });
  it('an overview ("info") never has a partner link, a feed, a rating or a bonus figure', () => {
    for (const b of BOOKMAKERS.filter((x) => x.review === 'info')) {
      expect(b.affiliate, b.id).toBe('none');
      const r = REVIEWS.find((x) => x.id === b.id)!;
      const shown = [r.summary, ...r.inShort, ...r.facts.map((f) => `${f.label} ${f.value}`), ...r.features, r.onSite].join(' ');
      expect(r.partnerNote === undefined || b.id === 'sazkabet', b.id).toBe(true); // only Sazkabet shares a partner campaign (Allwyn)
      expect(shown, b.id).not.toMatch(/bonus|promo|free ?spin|zdarma|\d[\d  ]*\s?Kč|hvězd|testovali jsme/i);
      expect(r.sources.length, b.id).toBeGreaterThan(0);
      expect(r.unverified?.length ?? 0, b.id).toBeGreaterThan(0); // every gap is stated, never silently dropped
    }
  });
});

describe('glossary', () => {
  it('slugs are unique and every related term exists', () => {
    const slugs = TERMS.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const t of TERMS) for (const s of t.see ?? []) expect(slugs, `${t.slug} → ${s}`).toContain(s);
  });
  it('no term promises a result or a profit', () => {
    for (const t of TERMS) expect([t.short, ...t.body].join(' '), t.slug).not.toMatch(/jistý (tip|zisk výhra)|garantuj|vyhraješ určitě/i);
  });
});

describe('guide links', () => {
  it('internal /pojem/ and /pruvodce/ links point to existing pages', () => {
    const terms = new Set(TERMS.map((t) => t.slug));
    const ids = new Set(guides.map((g) => g.id));
    for (const g of guides) {
      for (const m of g.text.matchAll(/\(\/pojem\/([a-z0-9-]+)\/\)/g)) expect(terms.has(m[1]!), `${g.id} → pojem ${m[1]}`).toBe(true);
      for (const m of g.text.matchAll(/\(\/pruvodce\/([a-z0-9-]+)\/\)/g)) expect(ids.has(m[1]!), `${g.id} → pruvodce ${m[1]}`).toBe(true);
    }
  });
  it('new guides carry a check date', () => {
    for (const g of guides) expect(g.text, g.id).toMatch(/\nchecked: 20\d\d-\d\d-\d\d/);
  });
});

describe('one source of truth for coverage claims', () => {
  it('pages take the check frequency from settings, not a typed number', async () => {
    const { readdirSync, readFileSync, statSync } = await import('node:fs');
    const walk = (d: string, out: string[] = []): string[] => { for (const f of readdirSync(d)) { const p = `${d}/${f}`; statSync(p).isDirectory() ? walk(p, out) : out.push(p); } return out; };
    const root = new URL('../src/', import.meta.url).pathname;
    for (const f of [...walk(`${root}pages`), ...walk(`${root}components`)].filter((x) => x.endsWith('.astro'))) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(/každých 15 minut|na fotbal a hokej\./);
    }
  });
  it('guides that name the compared books still match the feed (update src/content/pruvodce when FEED_BOOKS changes)', async () => {
    const { FEED_NAMES } = await import('../src/config/coverage');
    expect(FEED_NAMES).toBe('Tipsport a Chance');
  });
});
