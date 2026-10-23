// Live recalculation of the calculators (the server already renders results for the submitted values).
// Built with DOM nodes (no innerHTML of user input).
import { payout, implied, type OddsFormat } from '../server/calc/odds';
import { convertText, dutchText, valueText, type Result } from '../lib/calc-text';
const kc = (n: number) => `${new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 2 }).format(Math.round(n * 100) / 100)} Kč`;
const num = (f: HTMLFormElement, k: string) => Number(String(new FormData(f).get(k) ?? '').replace(',', '.').trim());
const pctTxt = (p: number) => `${(Math.round(p * 1000) / 10).toString().replace('.', ',')} %`;
type Part = string | { b: string };
const text = (f: HTMLFormElement, k: string) => String(new FormData(f).get(k) ?? '');
const fromResult = (r: Result): Part[] | string => ('error' in r ? r.error : r);
const RENDER: Record<string, (f: HTMLFormElement) => Part[] | string> = {
  convert: (f) => fromResult(convertText(text(f, 'kf'), text(f, 'ff') as OddsFormat)),
  dutch: (f) => fromResult(dutchText(num(f, 'ds'), ['o1', 'o2', 'o3', 'o4'].map((k) => text(f, k).trim()).filter((v) => v !== '').map((v) => Number(v.replace(',', '.'))))),
  value: (f) => fromResult(valueText(num(f, 'vo'), num(f, 'vp'))),
  payout(f) {
    const s = num(f, 'vklad'), o = num(f, 'kurz');
    if (!(s >= 0 && o > 1 && o <= 1000)) return 'Zadej sázku v Kč a kurz větší než 1.';
    const r = payout(s, o);
    return ['Pokud sázka vyhraje, dostaneš ', { b: kc(r.payout) }, ' včetně vkladu. Čistý zisk je ', { b: kc(r.profit) }, '.'];
  },
  implied(f) {
    const o = num(f, 'k');
    return o > 1 && o <= 1000 ? ['Kurz odpovídá zhruba ', { b: pctTxt(implied(o)) }, '.'] : 'Zadej kurz větší než 1.';
  },
  compare(f) {
    const s = num(f, 'v2'), a = num(f, 'k1'), b = num(f, 'k2');
    if (!(s >= 0 && a > 1 && b > 1 && a <= 1000 && b <= 1000)) return 'Zadej sázku a oba kurzy větší než 1.';
    const pa = payout(s, a).payout, pb = payout(s, b).payout;
    return ['Pokud sázka vyhraje, s kurzem A dostaneš ', { b: kc(pa) }, ', s kurzem B ', { b: kc(pb) }, ' (vždy včetně vkladu). Rozdíl je ', { b: kc(Math.abs(pb - pa)) }, '.'];
  },
};
for (const f of document.querySelectorAll<HTMLFormElement>('[data-calc] form[data-form]')) {
  const out = document.querySelector<HTMLElement>(`[data-out="${f.dataset.form}"]`);
  f.addEventListener('input', () => {
    if (!out) return;
    const r = RENDER[f.dataset.form!]!(f);
    out.textContent = '';
    if (typeof r === 'string') {
      const e = document.createElement('span'); e.className = 'text-orange-ink'; e.textContent = r; out.appendChild(e);
      return;
    }
    for (const p of r) {
      if (typeof p === 'string') out.appendChild(document.createTextNode(p));
      else { const s = document.createElement('strong'); s.className = 'num'; s.textContent = p.b; out.appendChild(s); }
    }
  });
}
