// /oblibene/: favourites from localStorage + their current comparison from /api/events.json (built with DOM APIs, no innerHTML of data).
import { readFavs, type Fav } from './site';
const box = document.querySelector<HTMLElement>('[data-favs]')!;
const fmt = (m: number) => (m / 1000).toFixed(2).replace('.', ',');
const when = (s: number) => new Intl.DateTimeFormat('cs-CZ', { timeZone: 'Europe/Prague', weekday: 'short', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(s * 1000));
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = '') => { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; };
/** appendChild for each node (workers-types redefine Element.append for HTMLRewriter). */
const add = (parent: Node, ...kids: Node[]) => { for (const k of kids) parent.appendChild(k); };
const NAMES: Record<string, string> = { tipsport: 'Tipsport', chance: 'Chance' };
const OUT: Record<string, string> = { '1': '1', x: 'X', '2': '2' };
interface Ev { id: number; url: string; home: string; away: string; compName: string; startAt: number; started: boolean;
  rows: { outcome: string; best: { kind: string }; cells: { book: string; odds: number | null; current: boolean; best: boolean; tie: boolean }[] }[] }

async function render() {
  const favs = readFavs().sort((a, b) => a.startAt - b.startAt);
  if (!favs.length) { box.replaceChildren(el('p', 'card p-5 m-0 text-ink-2', 'Zatím tu nic není. Hvězdičkou u zápasu si ho uložíte sem.')); return; }
  let data: Ev[] = [];
  try { data = ((await (await fetch(`/api/events.json?ids=${favs.map((f) => f.id).join(',')}`)).json()) as { events: Ev[] }).events; } catch { /* show stored names only */ }
  const byId = new Map(data.map((e) => [e.id, e]));
  box.replaceChildren(...favs.map((f: Fav) => {
    const e = byId.get(f.id);
    const card = el('article', 'card p-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center');
    const left = el('div', 'min-w-0');
    add(left, el('p', 'm-0 text-sm text-ink-2', `${when(f.startAt)} · ${f.comp}`));
    const h = el('h2', 'text-base m-0 mt-0.5'); const a = el('a', 'text-ink no-underline hover:text-blue-ink', `${f.home} – ${f.away}`); a.href = f.url; add(h, a); add(left, h);
    const right = el('div', 'flex flex-wrap items-center gap-2');
    if (!e) add(right, el('span', 'text-sm text-ink-2', f.startAt * 1000 < Date.now() ? 'Zápas už proběhl.' : 'Kurzy teď nemáme k dispozici.'));
    else if (e.started) add(right, el('span', 'text-sm text-ink-2', 'Zápas začal – předzápasové kurzy už nesledujeme.'));
    else for (const r of e.rows) {
      const best = r.cells.filter((c) => c.current && c.odds).sort((x, y) => (y.odds ?? 0) - (x.odds ?? 0))[0];
      const cell = el('span', `odd num ${best?.best ? 'odd--best' : best?.tie ? 'odd--tie' : ''}`);
      add(cell, el('span', 'text-xs text-ink-2 mr-1', OUT[r.outcome]), document.createTextNode(best ? fmt(best.odds!) : '–'));
      cell.title = best ? (best.tie ? 'Shoda kanceláří' : `Nejvyšší u ${NAMES[best.book] ?? best.book}`) : 'Žádný aktuální kurz';
      add(right, cell);
    }
    const rm = el('button', 'btn btn--quiet btn--sm', 'Odebrat'); rm.type = 'button';
    rm.dataset.fav = String(f.id); rm.dataset.home = f.home; rm.dataset.away = f.away;
    add(right, rm);
    add(card, left, right);
    return card;
  }));
}
document.addEventListener('kr:favs', () => void render());
void render();
