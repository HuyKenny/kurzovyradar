// Site-wide progressive enhancement: favourites (localStorage), header search suggestions, auto-submitting filters,
// chart tooltips. Everything works without it; this only makes it quicker.

/* ---------- favourites (stored only in this browser) ---------- */
export interface Fav { id: number; url: string; home: string; away: string; startAt: number; comp: string }
const FAV_KEY = 'kr-favs';
export function readFavs(): Fav[] {
  try { const v = JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]'); return Array.isArray(v) ? (v as Fav[]) : []; } catch { return []; }
}
function writeFavs(list: Fav[]) {
  try { localStorage.setItem(FAV_KEY, JSON.stringify(list.slice(-200))); } catch { /* private mode: nothing is kept */ }
  document.dispatchEvent(new CustomEvent('kr:favs'));
}
function paintFavs() {
  const list = readFavs();
  const ids = new Set(list.map((f) => f.id));
  for (const b of document.querySelectorAll<HTMLButtonElement>('[data-fav]')) {
    const on = ids.has(Number(b.dataset.fav));
    b.setAttribute('aria-pressed', String(on));
    const label = b.querySelector<HTMLElement>('[data-fav-label]');
    if (label) label.textContent = on ? 'V oblíbených' : 'Do oblíbených';
    b.setAttribute('aria-label', `${on ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'}: ${b.dataset.home} – ${b.dataset.away}`);
  }
  for (const c of document.querySelectorAll<HTMLElement>('[data-fav-count]')) {
    const n = list.filter((f) => f.startAt * 1000 > Date.now() - 3 * 3600_000).length;
    c.hidden = n === 0;
    c.textContent = String(n);
  }
}
document.addEventListener('click', (e) => {
  const b = (e.target as Element | null)?.closest?.<HTMLButtonElement>('[data-fav]');
  if (!b) return;
  e.preventDefault();
  const id = Number(b.dataset.fav);
  const list = readFavs();
  const i = list.findIndex((f) => f.id === id);
  if (i >= 0) list.splice(i, 1);
  else list.push({ id, url: b.dataset.url ?? '', home: b.dataset.home ?? '', away: b.dataset.away ?? '', startAt: Number(b.dataset.start), comp: b.dataset.comp ?? '' });
  writeFavs(list);
});
document.addEventListener('kr:favs', paintFavs);
window.addEventListener('storage', (e) => { if (e.key === FAV_KEY) paintFavs(); });
for (const b of document.querySelectorAll<HTMLButtonElement>('[data-fav]')) b.hidden = false; // shown only when JS can store them
paintFavs();

/* ---------- header search suggestions (combobox) ---------- */
interface Hit { label: string; sub: string; url: string; kind: 'zápas' | 'soutěž' | 'tým' }
let index: Hit[] | null = null;
async function loadIndex(): Promise<Hit[]> {
  if (index) return index;
  try { index = ((await (await fetch('/api/search.json')).json()) as { items: Hit[] }).items; } catch { index = []; }
  return index;
}
const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
for (const form of document.querySelectorAll<HTMLFormElement>('[data-search]')) {
  const input = form.querySelector<HTMLInputElement>('input[type=search]')!;
  const list = form.querySelector<HTMLUListElement>('[role=listbox]')!;
  let active = -1;
  const close = () => { list.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); active = -1; };
  const render = (hits: Hit[]) => {
    list.replaceChildren(...hits.map((h, i) => {
      const li = document.createElement('li');
      li.id = `${list.id}-${i}`;
      li.setAttribute('role', 'option');
      const a = document.createElement('a');
      a.href = h.url;
      a.className = 'flex flex-col px-3 py-2 rounded-lg no-underline text-ink hover:bg-sunken';
      const t = document.createElement('span'); t.className = 'font-semibold'; t.textContent = h.label;
      const s = document.createElement('span'); s.className = 'text-sm text-ink-2'; s.textContent = `${h.kind} · ${h.sub}`;
      a.appendChild(t); a.appendChild(s); li.appendChild(a);
      return li;
    }));
    list.hidden = hits.length === 0;
    input.setAttribute('aria-expanded', String(hits.length > 0));
  };
  input.addEventListener('focus', () => { void loadIndex(); });
  input.addEventListener('input', async () => {
    const q = fold(input.value.trim());
    if (q.length < 2) return close();
    const all = await loadIndex();
    render(all.filter((h) => fold(`${h.label} ${h.sub}`).includes(q)).slice(0, 8));
  });
  input.addEventListener('keydown', (e) => {
    const opts = [...list.querySelectorAll<HTMLLIElement>('[role=option]')];
    if (e.key === 'Escape') return close();
    if (!opts.length || list.hidden) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length;
      opts.forEach((o, i) => o.classList.toggle('bg-sunken', i === active));
      input.setAttribute('aria-activedescendant', opts[active]!.id);
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      location.href = opts[active]!.querySelector('a')!.href;
    }
  });
  document.addEventListener('click', (e) => { if (!form.contains(e.target as Node)) close(); });
}

/* ---------- filters submit on change (the button stays for no-JS) ---------- */
for (const f of document.querySelectorAll<HTMLFormElement>('form[data-autosubmit]')) {
  f.addEventListener('change', () => {
    const data = new FormData(f);
    const p = new URLSearchParams();
    for (const [k, v] of data) if (typeof v === 'string' && v !== '') p.append(k, v);
    location.href = `${f.action.replace(/\?.*$/, '')}${p.size ? `?${p}` : ''}`;
  });
  for (const b of f.querySelectorAll<HTMLElement>('[data-nojs]')) b.hidden = true;
}

/* ---------- chart tooltips: focus/hover a point, the value is also in the table below ---------- */
for (const chart of document.querySelectorAll<HTMLElement>('[data-chart]')) {
  const tip = chart.querySelector<HTMLElement>('[data-tip]');
  if (!tip) continue;
  const show = (el: Element | null) => {
    const p = el?.closest?.<SVGElement>('[data-p]');
    if (!p) { tip.hidden = true; return; }
    tip.textContent = p.dataset.p ?? '';
    tip.hidden = false;
    const r = chart.getBoundingClientRect(), b = p.getBoundingClientRect();
    tip.style.left = `${Math.min(Math.max(b.left - r.left + b.width / 2, 70), r.width - 70)}px`;
    tip.style.top = `${b.top - r.top - 8}px`;
  };
  chart.addEventListener('pointerover', (e) => show(e.target as Element));
  chart.addEventListener('pointerleave', () => { tip.hidden = true; });
  chart.addEventListener('focusin', (e) => show(e.target as Element));
  chart.addEventListener('focusout', () => { tip.hidden = true; });
}
