import { describe, expect, it } from 'vitest';
// @ts-expect-error plain JS module without types (edge/worker.js is uploaded as is)
import { KNOWN_PARAMS as EDGE_PARAMS, BOT as EDGE_BOT, deeplink, variantKey, pickVariant, fromOurPage } from '../edge/worker.js';
import { KNOWN_PARAMS } from '../src/lib/params';
import { BOT } from '../src/lib/go-guard';
import { CSP } from '../src/lib/security';
import { readFileSync } from 'node:fs';

describe('edge worker (production) stays in step with the SSR code', () => {
  it('same parameter whitelist and bot pattern', () => {
    expect([...EDGE_PARAMS].sort()).toEqual([...KNOWN_PARAMS].sort());
    expect(String(EDGE_BOT)).toBe(String(BOT));
  });
  it('same CSP as src/lib/security.ts', () => {
    expect(readFileSync(new URL('../edge/worker.js', import.meta.url), 'utf8')).toContain(CSP);
  });
  it('variant key: known params with a value, sorted, without zpet', () => {
    expect(variantKey(new URLSearchParams('sport=fotbal&den=&x=1&pohled=rusty&zpet=/radar/'))).toBe('pohled=rusty&sport=fotbal');
    expect(variantKey(new URLSearchParams('utm_source=x'))).toBe('');
  });
  it('picks the exact variant, else the largest subset of the asked parameters', () => {
    const known = { 'sport=fotbal': 'a', 'den=dnes': 'b', 'den=dnes&sport=fotbal': 'c', 'strana=2': 'd' };
    expect(pickVariant(known, 'den=dnes&sport=fotbal')).toBe('c');
    expect(pickVariant(known, 'den=dnes&kancelar=chance&sport=fotbal')).toBe('c');
    expect(pickVariant(known, 'kancelar=chance&sport=fotbal')).toBe('a');
    expect(pickVariant(known, 'kancelar=chance')).toBeNull();
  });
  it('match deeplink keeps the tracking parameters', () => {
    const u = deeplink('https://www.tipsport.cz/PartnerRedirectAction.do?pid=1&sid=2&bid=3&tid=4', 'tipsport', '/kurzy/zapas/a-b-123');
    expect(u).toBe('https://www.tipsport.cz/kurzy/zapas/a-b-123?pid=1&sid=2&bid=3&tid=4');
  });
  it('a click counts only from our own page', () => {
    expect(fromOurPage(new Headers({ 'sec-fetch-site': 'same-origin' }))).toBe(true);
    expect(fromOurPage(new Headers({ referer: 'https://kurzovyradar.cz/zapas/x-1/' }))).toBe(true);
    expect(fromOurPage(new Headers({ referer: 'https://example.com/' }))).toBe(false);
  });
});
