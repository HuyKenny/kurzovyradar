import { describe, expect, it } from 'vitest';
import { convertText, dutchText, valueText } from '../src/lib/calc-text';

const flat = (r: ReturnType<typeof dutchText>) => ('error' in r ? r.error : r.map((p) => (typeof p === 'string' ? p : p.b)).join(''));

describe('calculator sentences', () => {
  it('converts between formats', () => {
    expect(flat(convertText('3/2', 'fractional'))).toContain('Desetinný 2,50 · zlomkový 3/2 · americký +150');
    expect(flat(convertText('x', 'decimal'))).toMatch(/Zadej kurz/);
  });
  it('dutching says when it is NOT a surebet and always conditional', () => {
    const t = flat(dutchText(100, [2, 2]));
    expect(t).toContain('není surebet');
    expect(t).toContain('Pokud vyhraje kterýkoli');
  });
  it('dutching flags a surebet with the coverage caveat', () => {
    const t = flat(dutchText(100, [2.1, 2.1]));
    expect(t).toContain('pokrývají všechny možné konce');
    expect(t).toContain('+5 Kč');
  });
  it('needs a stake and at least two odds', () => {
    expect(flat(dutchText(100, [2]))).toMatch(/aspoň dva kurzy/);
    expect(flat(dutchText(0, [2, 3]))).toMatch(/vklad/);
  });
  it('value: states it is the visitor\'s own estimate and break-even', () => {
    const t = flat(valueText(2.2, 50));
    expect(t).toContain('45,5 %');
    expect(t).toContain('+10 %');
    expect(t).toContain('žádnou šanci nepředpovídáme');
  });
});
