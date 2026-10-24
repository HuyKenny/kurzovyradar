// /oblibene/ ("Moje sledované"): everything comes from localStorage (follow.ts) + current prices from the site's API.
// "Co se změnilo" compares today's highest price with what the visitor saw last (or when they saved it), then
// moves that point to now. DOM is built with createElement only (no innerHTML of stored or fetched data).
import { load, save, nowS, swapped, type FollowBet, type FollowState, type Odds3 } from './follow';
import { evaluateTarget, parseTarget } from '../lib/target';
import { betTarget } from '../lib/market';
import { SPORTS, type Sport } from '../config/competitions';
import type { Outcome } from '../server/types';

interface Outc { who: string; odds: number | null; books: string[]; same: boolean }
interface Ev { id: number; market?: string; url: string; home: string; away: string; comp: string; compName: string; sport: string; startAt: number; started: boolean; checkedAt: number | null; outcomes: Record<string, Outc> }

const $ = <T extends HTMLElement>(s: string) => document.querySelector<T>(s)!;
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = '') => { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; };
const add = (p: Node, ...kids: (Node | null | false)[]) => { for (const k of kids) if (k) p.appendChild(k); return p; };
const fmt = (m: number) => (m / 1000).toFixed(2).replace('.', ',');
const tz = { timeZone: 'Europe/Prague' } as const;
const when = (s: number) => new Intl.DateTimeFormat('cs-CZ', { ...tz, day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(s * 1000));
const kick = (s: number) => new Intl.DateTimeFormat('cs-CZ', { ...tz, weekday: 'short', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(s * 1000));
const target = (e: Ev, o: string) => betTarget(e.sport as Sport, o as Outcome, e.home, e.away);
const betHref = (url: string, o: string, market = '1x2') => `${url}?${new URLSearchParams({ trh: market === '12' ? '12' : '1x2', vysledek: o, zpet: '/oblibene/' })}#sazka`;

async function getJson(url: string): Promise<{ events: Ev[] }> {
  try { return (await (await fetch(url)).json()) as { events: Ev[] }; } catch { return { events: [] }; }
}

function card(...kids: Node[]) { const c = el('article', 'ticket p-4 grid gap-2'); add(c, ...kids); return c; }
function link(text: string, href: string, cls = 'font-bold') { const a = el('a', cls, text); a.href = href; return a; }
function empty(text: string) { return el('p', 'card p-5 m-0', text); }

/** The target price of a followed bet: status against the valid current price, and a small form to set, change or cancel it. */
function targetBlock(b: FollowBet, e: Ev | undefined, reach: { atStart: boolean; firstAt: number | null } | undefined): HTMLElement {
  const wrap = el('div', 'grid gap-2 mt-1');
  const started = !e || e.started || b.startAt * 1000 <= Date.now();
  const o = e?.outcomes[b.outcome];
  if (b.target) {
    const check = evaluateTarget({ target: b.target, current: started ? null : o?.odds ?? null, started, setAt: b.targetAt, reach, fmt: (m) => (m / 1000).toFixed(2).replace('.', ','), when });
    const line = el('p', 'm-0 flex flex-wrap items-center gap-2');
    const badge = el('span', `badge ${check.state === 'reached' ? 'badge--green' : check.state === 'reached-earlier' ? 'badge--orange' : 'badge--grey'}`,
      { reached: 'Splněno', 'reached-earlier': 'Dosaženo dříve', waiting: 'Zatím ne', unavailable: 'Nelze vyhodnotit', started: 'Zápas začal' }[check.state]);
    add(line, badge, el('span', 'font-bold', `Cíl ${fmt(b.target)}`), el('span', 'text-ink-2', started || !o?.odds ? '' : `· aktuální kurz ${fmt(o.odds)}`));
    add(wrap, line, el('p', 'm-0 text-[0.92rem] text-ink-2', check.text));
  }
  if (!started) {
    const f = el('form', 'flex flex-wrap items-end gap-2');
    const label = el('label', 'grid gap-1 font-bold text-[0.9rem]', b.target ? 'Změnit cílový kurz' : 'Cílový kurz (volitelné)');
    const input = el('input', 'field num !min-h-[44px] w-[8rem]');
    input.type = 'text'; input.inputMode = 'decimal'; input.placeholder = 'např. 2,10'; input.value = b.target ? fmt(b.target) : '';
    input.setAttribute('aria-label', 'Cílový kurz');
    label.appendChild(input);
    const save_ = el('button', 'btn btn--sm', b.target ? 'Uložit cíl' : 'Nastavit cíl'); save_.type = 'submit';
    const msg = el('p', 'm-0 text-[0.9rem] text-orange-ink w-full'); msg.setAttribute('role', 'status');
    add(f, label, save_);
    if (b.target) {
      const clear = el('button', 'btn btn--ghost btn--sm', 'Zrušit cíl'); clear.type = 'button';
      clear.addEventListener('click', () => { const st = load(); const x = st.bets.find((y) => y.id === b.id && y.outcome === b.outcome); if (x) { x.target = null; x.targetAt = null; save(st); } });
      f.appendChild(clear);
    }
    f.appendChild(msg);
    f.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const t = parseTarget(input.value);
      if (t === null) { msg.textContent = 'Zadej kurz větší než 1, například 2,10.'; return; }
      const st = load(); const x = st.bets.find((y) => y.id === b.id && y.outcome === b.outcome);
      if (x) { x.target = t; x.targetAt = nowS(); save(st); }
    });
    wrap.appendChild(f);
    if (!b.target) wrap.appendChild(el('p', 'm-0 text-[0.85rem] text-ink-2', 'Cíl se vyhodnotí, když otevřeš web. Neposíláme e-mail ani upozornění.'));
  }
  return wrap;
}

function followBtn(kind: 'bet' | 'event' | 'comp' | 'sport', data: Record<string, string>, label: string) {
  const b = el('button', 'btn btn--ghost btn--sm', label);
  b.type = 'button';
  b.setAttribute('aria-pressed', 'true');
  for (const [k, v] of Object.entries(data)) b.dataset[k] = v;
  return b;
}

async function render(markSeen: boolean) {
  const s: FollowState = load();
  const ids = [...new Set([...s.events.map((e) => e.id), ...s.bets.map((b) => b.id)])];
  const [cur, feed] = await Promise.all([
    ids.length ? getJson(`/api/events.json?ids=${ids.join(',')}`) : Promise.resolve({ events: [] as Ev[] }),
    s.comps.length || s.sports.length ? getJson(`/api/sledovane.json?souteze=${s.comps.map((c) => c.slug).join(',')}&sporty=${s.sports.join(',')}`) : Promise.resolve({ events: [] as Ev[] }),
  ]);
  const byId = new Map(cur.events.map((e) => [e.id, e]));
  // What the recorded history proves about targets (positive evidence only, see lib/target.ts).
  const reach = new Map<string, { atStart: boolean; firstAt: number | null }>();
  const withTarget = s.bets.filter((b) => b.target && b.targetAt && b.startAt * 1000 > Date.now());
  if (withTarget.length) {
    try {
      const r = (await (await fetch(`/api/cile.json?b=${withTarget.map((b) => `${b.id}:${b.outcome}:${b.targetAt}:${b.target}`).join(',')}`)).json()) as { items: { id: number; outcome: string; atStart: boolean; firstAt: number | null }[] };
      for (const i of r.items) reach.set(`${i.id}-${i.outcome}`, i);
    } catch { /* without history the check still works on the current price */ }
  }

  // --- what changed ---
  const changes: HTMLElement[] = [];
  let oldest: number | null = null;
  const note = (at: number) => { oldest = oldest === null ? at : Math.min(oldest, at); };
  for (const b of s.bets) {
    const e = byId.get(b.id);
    const now = e?.outcomes[b.outcome]?.odds ?? null;
    if (!b.seen) continue;
    note(b.seen.at);
    if (e && swapped(e, b)) {
      // The bookmaker swapped home and away: "1" now means the other team. Never compare it as if it were the same bet.
      changes.push(card(
        el('p', 'm-0 text-ink-2 text-[0.95rem]', `${b.home} vs ${b.away} · ${b.comp}`),
        el('p', 'm-0 text-[1.05rem]', `Kancelář u zápasu prohodila domácí a hosty (teď ${e.home} vs ${e.away}). Sledovanou sázku proto neporovnáváme. Otevři zápas a vyber ji znovu.`),
        link('Otevřít zápas →', e.url),
      ));
      continue;
    }
    if (e && !e.started && now !== null && b.seen.odds !== null && now !== b.seen.odds) {
      changes.push(card(
        el('p', 'm-0 text-ink-2 text-[0.95rem]', `${b.home} vs ${b.away} · ${b.comp}`),
        el('p', 'm-0 text-[1.05rem]', `Kurz na ${target(e, b.outcome)} ${now < b.seen.odds ? 'klesl' : 'stoupl'} z ${fmt(b.seen.odds)} na ${fmt(now)}.`),
        el('p', 'm-0 text-[0.88rem] text-ink-2', `Porovnáno s ${b.seen.via === 'zobrazeni' ? 'tvým posledním zobrazením' : 'uložením'} ${when(b.seen.at)}${e.checkedAt ? `, teď ověřeno ${when(e.checkedAt)}` : ''}.`),
        link('Prohlédnout sázku →', betHref(b.url, b.outcome, e?.market)),
      ));
    }
  }
  for (const f of s.events) {
    const e = byId.get(f.id);
    if (!f.seen || !e || e.started) continue;
    note(f.seen.at);
    for (const o of ['1', 'x', '2']) {
      const was = f.seen.odds[o as keyof Odds3];
      const now = e.outcomes[o]?.odds ?? null;
      if (was === undefined || now === null || was === now) continue;
      if (s.bets.some((b) => b.id === f.id && b.outcome === o)) continue; // already listed as a bet
      changes.push(card(
        el('p', 'm-0 text-ink-2 text-[0.95rem]', `${f.home} vs ${f.away} · ${f.comp}`),
        el('p', 'm-0 text-[1.05rem]', `Kurz na ${target(e, o)} ${now < was ? 'klesl' : 'stoupl'} z ${fmt(was)} na ${fmt(now)}.`),
        el('p', 'm-0 text-[0.88rem] text-ink-2', `Porovnáno s ${f.seen.via === 'zobrazeni' ? 'tvým posledním zobrazením' : 'uložením'} ${when(f.seen.at)}${e.checkedAt ? `, teď ověřeno ${when(e.checkedAt)}` : ''}.`),
        link('Prohlédnout sázku →', betHref(f.url, o, e.market)),
      ));
    }
  }
  const box = $('[data-changes]');
  box.replaceChildren(...(changes.length ? changes : [empty(s.bets.length || s.events.length
    ? 'Od tvého posledního zobrazení se u sledovaných zápasů kurzy nezměnily.'
    : 'Zatím nic nesleduješ. Na kartě sázky klikni na „Sledovat změny“, nebo u zápasu na hvězdičku.')]));
  $('[data-since]').textContent = oldest !== null
    ? `Porovnáváme nejvyšší dnešní kurz s tím, co jsi u každé položky viděl naposledy (nejstarší porovnání je od ${when(oldest)}). Změny mezi našimi kontrolami (à 15 min) nevidíme.`
    : 'Až něco uložíš, ukážeme tady, jak se kurz od té doby změnil.';

  // --- followed bets ---
  $('[data-bets]').replaceChildren(...(s.bets.length ? s.bets.slice().sort((a, b) => a.startAt - b.startAt).map((b) => {
    const e = byId.get(b.id);
    const o = e?.outcomes[b.outcome];
    return card(
      el('p', 'm-0 text-ink-2 text-[0.95rem]', `${kick(b.startAt)} · ${b.comp}`),
      el('h3', 'm-0 text-[1.15rem]', `${b.label} (${b.home} vs ${b.away})`),
      el('p', 'm-0', !e ? 'Zápas už v nabídce není.' : e.started ? 'Zápas začal, předzápasové kurzy už nesledujeme.' : o?.odds ? `Teď ${fmt(o.odds)}${o.books.length ? ` (${o.same && o.books.length > 1 ? 'stejně u ' + o.books.join(' i ') : 'nejvýš u ' + o.books[0]})` : ''}.` : 'Kurz teď není v nabídce.'),
      targetBlock(b, e, reach.get(`${b.id}-${b.outcome}`)),
      add(el('div', 'flex flex-wrap gap-2'), link('Prohlédnout sázku', betHref(b.url, b.outcome, e?.market), 'btn btn--sm'),
        followBtn('bet', { followBet: JSON.stringify({ id: b.id, outcome: b.outcome, url: b.url, home: b.home, away: b.away, startAt: b.startAt, comp: b.comp, sport: b.sport, label: b.label, odds: null }) }, 'Přestat sledovat')) as HTMLElement,
    );
  }) : [empty('Žádné sledované sázky.')]));

  // --- followed matches ---
  $('[data-events]').replaceChildren(...(s.events.length ? s.events.slice().sort((a, b) => a.startAt - b.startAt).map((f) => {
    const e = byId.get(f.id);
    const prices = e && !e.started ? (['1', 'x', '2'] as const).map((o) => e.outcomes[o]?.odds ? `${e.outcomes[o]!.who} ${fmt(e.outcomes[o]!.odds!)}` : null).filter(Boolean).join(' · ') : '';
    return card(
      el('p', 'm-0 text-ink-2 text-[0.95rem]', `${kick(f.startAt)} · ${f.comp}`),
      el('h3', 'm-0 text-[1.15rem]', `${f.home} vs ${f.away}`),
      el('p', 'm-0 num', !e ? 'Zápas už v nabídce není.' : e.started ? 'Zápas začal.' : prices || 'Kurzy teď nejsou v nabídce.'),
      add(el('div', 'flex flex-wrap gap-2'), link('Detail zápasu', f.url, 'btn btn--sm'),
        followBtn('event', { fav: String(f.id), home: f.home, away: f.away }, 'Přestat sledovat')) as HTMLElement,
    );
  }) : [empty('Žádné sledované zápasy.')]));

  // --- followed competitions and sports ---
  const chips = add(el('div', 'flex flex-wrap gap-2 mb-4'),
    ...s.comps.map((c) => followBtn('comp', { followComp: c.slug, name: c.name }, `${c.name} ✕`)),
    ...s.sports.map((x) => followBtn('sport', { followSport: x, name: (SPORTS[x as Sport]?.name ?? x).toLowerCase() }, `${SPORTS[x as Sport]?.name ?? x} ✕`))) as HTMLElement;
  $('[data-feed-note]').textContent = s.comps.length || s.sports.length
    ? 'Nejbližší zápasy toho, co sleduješ. Křížkem sledování zrušíš.'
    : 'Na stránce soutěže nebo sportu klikni na „Sledovat soutěž“ / „Sledovat fotbal“.';
  $('[data-feed]').replaceChildren(chips, ...feed.events.map((e) => card(
    el('p', 'm-0 text-ink-2 text-[0.95rem]', `${kick(e.startAt)} · ${e.compName}`),
    link(`${e.home} vs ${e.away}`, e.url, 'font-display font-bold text-[1.1rem] text-ink no-underline hover:underline'),
    el('p', 'm-0 num', (['1', 'x', '2'] as const).map((o) => e.outcomes[o]?.odds ? `${e.outcomes[o]!.who} ${fmt(e.outcomes[o]!.odds!)}` : null).filter(Boolean).join(' · ')),
  )));

  // The comparison point moves to now: next visit shows what changed since this one. Only once the visitor has actually seen this
  // summary (the tab is visible), and only to a price we have now: an outage or a suspended offer must not erase the old baseline.
  if (markSeen) whenVisible(() => markAllSeen(byId));
}

function whenVisible(fn: () => void) {
  if (document.visibilityState === 'visible') { setTimeout(fn, 1500); return; }
  const on = () => { if (document.visibilityState === 'visible') { document.removeEventListener('visibilitychange', on); setTimeout(fn, 1500); } };
  document.addEventListener('visibilitychange', on);
}

function markAllSeen(byId: Map<number, Ev>) {
  const s: FollowState = load(); // fresh copy: the visitor may have followed or unfollowed something meanwhile
  const t = nowS();
  for (const b of s.bets) {
    const e = byId.get(b.id);
    const odds = e?.outcomes[b.outcome]?.odds ?? null;
    if (e && !e.started && odds && !swapped(e, b)) b.seen = { at: t, odds, via: 'zobrazeni' };
  }
  for (const f of s.events) {
    const e = byId.get(f.id);
    if (!e || e.started) continue;
    const odds = Object.fromEntries((['1', 'x', '2'] as const).filter((o) => e.outcomes[o]?.odds).map((o) => [o, e.outcomes[o]!.odds!]));
    if (Object.keys(odds).length) f.seen = { at: t, odds, via: 'zobrazeni' };
  }
  save(s);
}

let first = true;
document.addEventListener('kr:follow', () => { if (!first) void render(false); });
void render(true).then(() => { first = false; });
