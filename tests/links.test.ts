import { describe, expect, it } from 'vitest';
import { betUrl, backLink } from '../src/lib/links';

describe('bet links', () => {
  it('carry market, outcome and an internal way back', () => {
    expect(betUrl('/zapas/a-b-1/', 'x', '/radar/?pohled=poklesy&obdobi=6h')).toBe('/zapas/a-b-1/?trh=1x2&vysledek=x&zpet=%2Fradar%2F%3Fpohled%3Dpoklesy%26obdobi%3D6h#sazka');
  });
  it('never accept an external or odd back path', () => {
    expect(backLink('https://evil.example/')).toBeNull();
    expect(backLink('//evil.example/')).toBeNull();
    expect(backLink('/radar/"><script>')).toBeNull();
    expect(betUrl('/zapas/a-b-1/', '1', 'javascript:alert(1)')).toBe('/zapas/a-b-1/?trh=1x2&vysledek=1#sazka');
    expect(backLink('/radar/?pohled=rusty')).toEqual({ href: '/radar/?pohled=rusty', label: 'Zpět na pohyby kurzů' });
    expect(backLink('/')).toEqual({ href: '/', label: 'Zpět na úvod' });
  });
});
