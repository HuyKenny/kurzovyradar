// /hledat/ is a static page since 23. 11. 2026: without a server render for "?q=", the results come from the same small index the
// header suggestions use (/api/search.json, rebuilt with every import). DOM via createElement only (the query is visitor input).
interface Hit { label: string; sub: string; url: string; kind: string }

const box = document.querySelector<HTMLElement>('[data-hledat]');
const q = (new URLSearchParams(location.search).get('q') ?? '').trim().slice(0, 60);
const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = '') => { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; };

if (box && q && !box.dataset.rendered) {
  const input = document.querySelector<HTMLInputElement>('#q-page');
  if (input) input.value = q;
  document.title = `Hledání: ${q} | KurzovýRadar`;
  const f = fold(q);
  if (f.length < 2) box.appendChild(el('p', 'mt-6 text-ink-2', 'Napiš aspoň 2 znaky.'));
  else {
    fetch('/api/search.json').then((r) => r.json() as Promise<{ items: Hit[] }>).then(({ items }) => {
      const hit = (h: Hit) => fold(`${h.label} ${h.sub}`).includes(f);
      const groups = items.filter((h) => h.kind !== 'zápas' && hit(h)).slice(0, 40);
      const matches = items.filter((h) => h.kind === 'zápas' && fold(h.label).includes(f)).slice(0, 30);
      if (groups.length) {
        const s = el('section', 'mt-8');
        s.appendChild(el('h2', 'text-lg', 'Sporty a soutěže'));
        const ul = el('ul', 'flex flex-wrap gap-2 list-none p-0 m-0 mt-3');
        for (const g of groups) { const li = el('li'); const a = el('a', 'chip', g.label); a.href = g.url; li.appendChild(a); ul.appendChild(li); }
        s.appendChild(ul);
        box.appendChild(s);
      }
      const s = el('section', 'mt-8');
      s.appendChild(el('h2', 'text-lg', 'Zápasy'));
      if (matches.length) {
        const ul = el('ul', 'grid gap-3 list-none p-0 m-0 mt-4');
        for (const m of matches) {
          const li = el('li', 'card p-4');
          const a = el('a', 'font-bold', m.label); a.href = m.url;
          li.append(a, el('div', 'text-ink-2 text-[0.95rem] mt-1', m.sub));
          ul.appendChild(li);
        }
        s.appendChild(ul);
      } else s.appendChild(el('p', 'text-ink-2 mt-2', `Na „${q}“ teď nemáme žádný zápas s kurzy. Zkus jen část názvu, třeba „Slavi“.`));
      box.appendChild(s);
    }).catch(() => box.appendChild(el('p', 'mt-6 text-ink-2', 'Hledání se teď nepodařilo načíst. Zkus to prosím znovu.')));
  }
}
