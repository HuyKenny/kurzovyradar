// Live recalculation of the calculators (the server already renders results for the submitted values).
import { payout, implied } from '../server/calc/odds';
const kc = (n: number) => `${new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 2 }).format(n)} Kč`;
const num = (f: HTMLFormElement, k: string) => Number(String(new FormData(f).get(k) ?? '').replace(',', '.').trim());
const pctTxt = (p: number) => `${(Math.round(p * 1000) / 10).toString().replace('.', ',')} %`;
const box = (label: string, value: string, cls = 'bg-sunken') => `<div class="${cls} rounded-xl p-3"><p class="text-sm text-ink-2 m-0">${label}</p><p class="m-0 text-xl font-bold num">${value}</p></div>`;
const bad = (t: string) => `<p class="text-down m-0">${t}</p>`;
const RENDER: Record<string, (f: HTMLFormElement) => string> = {
  payout(f) {
    const s = num(f, 'vklad'), o = num(f, 'kurz');
    if (!(s >= 0 && o > 1 && o <= 1000)) return bad('Zadejte vklad 0 Kč a víc a kurz vyšší než 1.');
    const r = payout(s, o);
    return `<div class="grid grid-cols-2 gap-3">${box('Celková výplata', kc(r.payout))}${box('Čistý zisk', kc(r.profit))}</div>`;
  },
  implied(f) {
    const o = num(f, 'k');
    return o > 1 && o <= 1000 ? `<p class="m-0 text-2xl font-bold num">${pctTxt(implied(o))}</p>` : bad('Zadejte kurz vyšší než 1.');
  },
  compare(f) {
    const s = num(f, 'v2'), a = num(f, 'k1'), b = num(f, 'k2');
    if (!(s >= 0 && a > 1 && b > 1 && a <= 1000 && b <= 1000)) return bad('Zadejte vklad a oba kurzy vyšší než 1.');
    const pa = payout(s, a).payout, pb = payout(s, b).payout;
    return `<div class="grid gap-3 sm:grid-cols-3">${box('Výplata s kurzem A', kc(pa))}${box('Výplata s kurzem B', kc(pb))}${box('Rozdíl při výhře', kc(Math.abs(pb - pa)), 'bg-blue-soft')}</div>`;
  },
};
for (const f of document.querySelectorAll<HTMLFormElement>('[data-calc] form[data-form]')) {
  const out = document.querySelector<HTMLElement>(`[data-out="${f.dataset.form}"]`);
  f.addEventListener('input', () => { if (out) out.innerHTML = RENDER[f.dataset.form!]!(f); });
}
