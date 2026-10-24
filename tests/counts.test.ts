import { describe, expect, it } from 'vitest';
import { countLine } from '../src/lib/counts';

describe('count line keeps shown, matching and whole-day numbers apart', () => {
  it('first page of a long day: "Zobrazeno 30 z 104 zápasů dnes"', () => {
    expect(countLine({ shown: 30, total: 104, dayTotal: 104, day: 'dnes', filtered: false })).toBe('Zobrazeno 30 z 104 zápasů dnes, seřazeno podle začátku');
  });
  it('everything on screen: just the total', () => {
    expect(countLine({ shown: 3, total: 3, dayTotal: 3, day: 'zitra', filtered: false })).toBe('3 zápasy zítra, seřazeno podle začátku');
    expect(countLine({ shown: 1, total: 1, dayTotal: null, day: '', filtered: false })).toBe('1 zápas, seřazeno podle začátku');
  });
  it('filters: matching count first, the whole day in brackets', () => {
    expect(countLine({ shown: 12, total: 12, dayTotal: 104, day: 'dnes', filtered: true })).toBe('12 zápasů dnes podle filtrů (celkem 104 zápasů dnes), seřazeno podle začátku');
  });
  it('nothing matches: no line (the page shows its own empty state)', () => {
    expect(countLine({ shown: 0, total: 0, dayTotal: 104, day: 'dnes', filtered: true })).toBe('');
  });
});
