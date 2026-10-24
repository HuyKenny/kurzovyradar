// Site-wide progressive enhancement: following matches/bets/competitions (localStorage), header search suggestions, auto-submitting filters,
// chart tooltips. Everything works without it; this only makes it quicker.
import { load, save, nowS, type FollowBet } from './follow';
import { evaluateTarget, parseTarget } from '../lib/target';

/* ---------- following (stored only in this browser, see follow.ts) ---------- */

function paintFollow() {
  const s = load();
  const evIds = new Set(s.events.map((f) => f.id));
  const betKeys = new Set(s.bets.map((b) => `${b.id}-${b.outcome}`));
  for (const b of document.querySelectorAll<HTMLButtonElement>('[data-fav]')) {
    const on = evIds.has(Number(b.dataset.fav));
    b.setAttribute('aria-pressed', String(on));
    const label = b.querySelector<HTMLElement>('[data-fav-label]');
    if (label) label.textContent = on ? 'Sleduješ' : 'Sledovat zápas';
    b.setAttribute('aria-label', `${on ? 'Přestat sledovat' : 'Sledovat'} zápas ${b.dataset.home} – ${b.dataset.away}`);
  }
  for (const b of document.querySelectorAll<HTMLButtonElement>('[data-follow-bet]')) {
    const d = betData(b);
    const on = !!d && betKeys.has(`${d.id}-${d.outcome}`);
    b.setAttribute('aria-pressed', String(on));
    const label = b.querySelector<HTMLElement>('[data-follow-label]');
    if (label) label.textContent = on ? 'Sleduješ změny' : 'Sledovat změny';
  }
  for (const b of document.querySelectorAll<HTMLButtonElement>('[data-follow-comp]')) {
    const on = s.comps.some((c) => c.slug === b.dataset.followComp);
    b.setAttribute('aria-pressed', String(on));
    const label = b.querySelector<HTMLElement>('[data-follow-label]');
    if (label) label.textContent = on ? 'Sleduješ soutěž' : 'Sledovat soutěž';
  }
  for (const b of document.querySelectorAll<HTMLButtonElement>('[data-follow-sport]')) {
    const on = s.sports.includes(b.dataset.followSport ?? '');
    b.setAttribute('aria-pressed', String(on));
    const label = b.querySelector<HTMLElement>('[data-follow-label]');
    if (label) label.textContent = on ? `Sleduješ ${b.dataset.name}` : `Sledovat ${b.dataset.name}`;
  }
  paintTarget(s.bets);
  const n = s.events.filter((f) => f.startAt * 1000 > Date.now() - 3 * 3600_000).length + s.bets.filter((f) => f.startAt * 1000 > Date.now() - 3 * 3600_000).length;
  for (const c of document.querySelectorAll<HTMLElement>('[data-fav-count]')) { c.hidden = n === 0; c.textContent = String(n); }
}

/** Target price box on the match page: shown for a followed bet; status against the current valid price. */
function paintTarget(bets: FollowBet[]) {
  const fmt = (m: number) => (m / 1000).toFixed(2).replace('.', ',');
  for (const box of document.querySelectorAll<HTMLElement>('[data-target-box]')) {
    const btn = box.closest('form')?.querySelector<HTMLElement>('[data-follow-bet]');
    const d = btn ? betData(btn) : null;
    const bet = d ? bets.find((b) => b.id === d.id && b.outcome === d.outcome) : undefined;
    box.hidden = !bet;
    if (!bet || !d) continue;
    const input = box.querySelector<HTMLInputElement>('[data-target-input]');
    const status = box.querySelector<HTMLElement>('[data-target-status]');
    const clear = box.querySelector<HTMLElement>('[data-target-clear]');
    if (input && document.activeElement !== input) input.value = bet.target ? fmt(bet.target) : '';
    if (clear) clear.hidden = !bet.target;
    if (status) status.textContent = bet.target
      ? evaluateTarget({ target: bet.target, current: d.odds, started: bet.startAt * 1000 <= Date.now(), setAt: bet.targetAt, fmt, when: (t) => new Date(t * 1000).toLocaleString('cs-CZ', { timeZone: 'Europe/Prague', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' }) }).text
      : '';
  }
}
document.addEventListener('click', (e) => {
  const t = e.target as Element | null;
  const save_ = t?.closest?.<HTMLButtonElement>('[data-target-save]');
  const clear = t?.closest?.<HTMLButtonElement>('[data-target-clear]');
  if (!save_ && !clear) return;
  const box = (save_ ?? clear)!.closest<HTMLElement>('[data-target-box]');
  const btn = box?.closest('form')?.querySelector<HTMLElement>('[data-follow-bet]');
  const d = btn ? betData(btn) : null;
  if (!box || !d) return;
  const s = load();
  const bet = s.bets.find((b) => b.id === d.id && b.outcome === d.outcome);
  if (!bet) return;
  const status = box.querySelector<HTMLElement>('[data-target-status]');
  if (clear) { bet.target = null; bet.targetAt = null; save(s); return; }
  const v = parseTarget(box.querySelector<HTMLInputElement>('[data-target-input]')?.value);
  if (v === null) { if (status) status.textContent = 'Zadej kurz větší než 1, například 2,10.'; return; }
  bet.target = v; bet.targetAt = nowS(); save(s);
});

/** A bet button carries its data as JSON; on the match page the outcome comes from the calculator's choice. */
function betData(b: HTMLElement): Omit<FollowBet, 'seen'> & { odds: number | null } | null {
  try {
    const d = JSON.parse(b.dataset.followBet ?? 'null');
    if (!d) return null;
    if (d.pickFrom) {
      // On the match page the chosen outcome is the shared bet state (scripts/bet.ts): the checked radio of either control.
      const root = document.querySelector<HTMLElement>(d.pickFrom);
      const o = (root?.querySelector<HTMLInputElement>('input[data-bet-outcome]:checked')?.value ?? d.outcome) as '1' | 'x' | '2';
      return { ...d, outcome: o, label: d.labels?.[o] ?? '', odds: d.oddsBy?.[o] ?? null };
    }
    return d;
  } catch { return null; }
}

document.addEventListener('click', (e) => {
  const t = e.target as Element | null;
  const fav = t?.closest?.<HTMLButtonElement>('[data-fav]');
  const bet = t?.closest?.<HTMLButtonElement>('[data-follow-bet]');
  const comp = t?.closest?.<HTMLButtonElement>('[data-follow-comp]');
  const sport = t?.closest?.<HTMLButtonElement>('[data-follow-sport]');
  if (!fav && !bet && !comp && !sport) return;
  e.preventDefault();
  const s = load();
  if (fav) {
    const id = Number(fav.dataset.fav);
    const i = s.events.findIndex((f) => f.id === id);
    if (i >= 0) s.events.splice(i, 1);
    else {
      let odds = {};
      try { odds = JSON.parse(fav.dataset.odds ?? '{}'); } catch { /* none */ }
      s.events.push({ id, url: fav.dataset.url ?? '', home: fav.dataset.home ?? '', away: fav.dataset.away ?? '', startAt: Number(fav.dataset.start), comp: fav.dataset.comp ?? '', seen: { at: nowS(), odds, via: 'ulozeni' } });
    }
  } else if (bet) {
    const d = betData(bet);
    if (!d) return;
    const i = s.bets.findIndex((b) => b.id === d.id && b.outcome === d.outcome);
    if (i >= 0) s.bets.splice(i, 1);
    else s.bets.push({ id: d.id, outcome: d.outcome, url: d.url, home: d.home, away: d.away, startAt: d.startAt, comp: d.comp, sport: d.sport, label: d.label, seen: { at: nowS(), odds: d.odds, via: 'ulozeni' } });
  } else if (comp) {
    const slug = comp.dataset.followComp ?? '';
    const i = s.comps.findIndex((c) => c.slug === slug);
    if (i >= 0) s.comps.splice(i, 1); else s.comps.push({ slug, name: comp.dataset.name ?? slug });
  } else if (sport) {
    const v = sport.dataset.followSport ?? '';
    s.sports = s.sports.includes(v) ? s.sports.filter((x) => x !== v) : [...s.sports, v];
  }
  save(s);
});
document.addEventListener('kr:follow', paintFollow);
document.addEventListener('kr:bet', paintFollow);
window.addEventListener('storage', (e) => { if (e.key === 'kr-sledovane') paintFollow(); });
for (const b of document.querySelectorAll<HTMLButtonElement>('[data-fav], [data-follow-bet], [data-follow-comp], [data-follow-sport]')) b.hidden = false; // shown only when JS can store them
paintFollow();

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

/* ---------- mini calculator ("Kurz za 30 vteřin") ---------- */
for (const box of document.querySelectorAll<HTMLElement>('[data-mini-calc]')) {
  const s = box.querySelector<HTMLInputElement>('[data-in="stake"]');
  const o = box.querySelector<HTMLInputElement>('[data-in="odds"]');
  const out = box.querySelector<HTMLElement>('[data-out]');
  const kc = (n: number) => `${new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 2 }).format(n)} Kč`;
  const upd = () => {
    if (!s || !o || !out) return;
    const st = Number(s.value.replace(',', '.')), od = Number(o.value.replace(',', '.'));
    if (!(st >= 0) || !(od > 1)) { out.textContent = 'Zadej sázku v Kč a kurz větší než 1.'; return; }
    out.textContent = '';
    out.appendChild(document.createTextNode('Pokud sázka vyhraje, dostaneš '));
    const b = document.createElement('strong'); b.className = 'num'; b.textContent = kc(st * od); out.appendChild(b);
    out.appendChild(document.createTextNode(` včetně vkladu (čistý zisk ${kc(st * od - st)}).`));
  };
  box.addEventListener('input', upd);
  for (const b of box.querySelectorAll<HTMLElement>('[data-nojs]')) b.hidden = true;
}

/* ---------- homepage strip: changes at followed bets/matches since the visitor last looked ---------- */
const strip = document.querySelector<HTMLElement>('[data-follow-strip]');
if (strip) {
  const s = load();
  const ids = [...new Set([...s.events.map((e) => e.id), ...s.bets.map((b) => b.id)])];
  if (ids.length) {
    fetch(`/api/events.json?ids=${ids.join(',')}`).then((r) => r.json() as Promise<{ events: { id: number; started: boolean; outcomes: Record<string, { odds: number | null }> }[] }>).then((d: { events: { id: number; started: boolean; outcomes: Record<string, { odds: number | null }> }[] }) => {
      const by = new Map(d.events.map((e) => [e.id, e]));
      let n = 0;
      for (const b of s.bets) { const e = by.get(b.id); const now = e?.outcomes[b.outcome]?.odds; if (e && !e.started && b.seen && now && b.seen.odds && now !== b.seen.odds) n++; }
      for (const f of s.events) {
        const e = by.get(f.id);
        if (!e || e.started || !f.seen) continue;
        if ((['1', 'x', '2'] as const).some((o) => f.seen!.odds[o] && e.outcomes[o]?.odds && e.outcomes[o]!.odds !== f.seen!.odds[o])) n++;
      }
      if (!n) return;
      const a = document.createElement('a');
      a.href = '/oblibene/';
      a.className = 'note-box flex items-center gap-2 no-underline text-ink font-bold';
      a.textContent = `U ${n} ${n === 1 ? 'tvé sledované položky' : 'tvých sledovaných položek'} se od posledního zobrazení změnil kurz → podívat se`;
      strip.appendChild(a);
      strip.hidden = false;
    }).catch(() => { /* nothing to show */ });
  }
}
