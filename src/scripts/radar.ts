// Radar: "Jen moje sledované soutěže". The followed competitions live only in this browser (follow.ts), so this filter is
// applied here; every other radar filter is in the URL and handled on the server. Without JS the checkbox simply stays hidden.
import { load } from './follow';

const box = document.querySelector<HTMLElement>('[data-followed-only]');
const cb = box?.querySelector<HTMLInputElement>('input[type=checkbox]');
const count = document.querySelector<HTMLElement>('[data-count]');
const empty = document.querySelector<HTMLElement>('[data-empty-followed]');
if (box && cb) {
  const followed = new Set(load().comps.map((c) => c.slug));
  box.hidden = followed.size === 0;
  const total = Number(count?.dataset.shown ?? 0);
  const apply = () => {
    const on = cb.checked && followed.size > 0;
    let findings = 0, events = 0;
    for (const g of document.querySelectorAll<HTMLElement>('[data-group]')) {
      const hide = on && !followed.has(g.dataset.comp ?? '');
      g.hidden = hide;
      if (!hide) { findings += Number(g.dataset.n ?? 1); events++; }
    }
    if (empty) empty.hidden = !(on && events === 0 && total > 0);
    if (count && on) count.textContent = events ? `${findings} u ${events} zápasů z tvých sledovaných soutěží` : '';
    if (count && !on) count.textContent = count.dataset.shown ? `${count.dataset.shown} ${Number(count.dataset.shown) === 1 ? 'zjištění' : 'zjištění'} u ${count.dataset.events} zápasů` : '';
  };
  cb.addEventListener('change', (e) => {
    e.stopPropagation(); // the other filters submit the form; this one never needs the server
    const u = new URL(location.href);
    if (cb.checked) u.searchParams.set('sledovane', '1'); else u.searchParams.delete('sledovane');
    history.replaceState(null, '', u);
    apply();
  });
  apply();
}
