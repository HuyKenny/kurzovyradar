// One chosen bet for the whole page. The calculator, the chart controls and everything that describes the selection
// (name, win condition, reasons, price comparison, chart, follow button) read the same state: outcome, stake, period.
// The server renders every outcome's parts and marks the others `hidden`; this script only switches them, keeps the
// stake the visitor typed and writes the state into the URL (pushState for outcome/period, replaceState while typing),
// so a direct link, reload and back/forward all lead to the same consistent page. Without JS the forms submit by GET.
import { parseBetState, parseStake, winnings, withBetState, type BetState, type PeriodKey } from '../lib/bet-state';

type O = '1' | 'x' | '2';
interface Cfg { outcomes: Partial<Record<O, { name: string; who: string; odds: number | null }>>; defaultOutcome: O; sync?: boolean; market?: string }

const kc = (n: number) => `${new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 2 }).format(Math.round(n * 100) / 100)} Kč`;
const odd = (m: number) => (m / 1000).toFixed(2).replace('.', ',');
const strong = (t: string) => { const b = document.createElement('strong'); b.className = 'num'; b.textContent = t; return b; };

for (const root of document.querySelectorAll<HTMLElement>('[data-bet-root]')) {
  const cfg = JSON.parse(root.dataset.bet ?? '{}') as Cfg;
  const sync = cfg.sync !== false; // the match page mirrors the state into the URL; the beginner example does not
  const $$ = <T extends Element>(sel: string) => [...root.querySelectorAll<T>(sel)];
  const stakeInputs = $$<HTMLInputElement>('input[data-bet-stake]');
  const initial = parseBetState(sync ? new URLSearchParams(location.search) : new URLSearchParams(), cfg.defaultOutcome);
  const checked = (sel: string) => root.querySelector<HTMLInputElement>(`${sel}:checked`)?.value;
  // The page is a static file rendered without a query (since 23. 11. 2026): what the URL asks for wins over the rendered default.
  const asked = sync ? new URLSearchParams(location.search) : new URLSearchParams();
  const periods = $$<HTMLInputElement>('input[data-bet-period]').map((r) => r.value);
  let st: BetState = {
    outcome: (asked.has('vysledek') || asked.has('tip')) && cfg.outcomes[initial.outcome] ? initial.outcome : (checked('input[data-bet-outcome]') as O | undefined) ?? initial.outcome,
    stake: asked.has('vklad') ? initial.stake : parseStake(stakeInputs[0]?.value) ?? initial.stake,
    period: initial.period && periods.includes(initial.period) ? initial.period : (checked('input[data-bet-period]') as PeriodKey | undefined) ?? initial.period,
    finding: initial.finding,
  };
  if (asked.has('vklad')) for (const i of stakeInputs) i.value = String(st.stake);

  function paint() {
    const c = cfg.outcomes[st.outcome] ?? cfg.outcomes[cfg.defaultOutcome]!;
    for (const r of $$<HTMLInputElement>('input[data-bet-outcome]')) r.checked = r.value === st.outcome;
    for (const r of $$<HTMLInputElement>('input[data-bet-period]')) r.checked = r.value === st.period;
    for (const el of $$<HTMLElement>('[data-bet-panel]')) el.hidden = el.dataset.betPanel !== st.outcome;
    for (const el of $$<HTMLElement>('.chart-panel')) el.hidden = el.dataset.k !== `${st.outcome}-${st.period}`;
    for (const el of $$<HTMLElement>('[data-odd-for]')) {
      const on = el.dataset.oddFor === st.outcome;
      const tag = el.querySelector<HTMLElement>('[data-picked-tag]');
      if (tag) tag.hidden = !on;
      el.querySelector('a, span.odd')?.classList.toggle('odd--picked', on);
    }
    for (const el of $$<HTMLElement>('[data-bind="name"]')) el.textContent = c.name;
    for (const el of $$<HTMLElement>('[data-bind="who-wrap"]')) el.textContent = `(${c.who})`;
    for (const el of $$<HTMLElement>('[data-bind="odds"]')) el.textContent = c.odds ? odd(c.odds) : '–';
    for (const el of $$<HTMLElement>('[data-bind="chart-title"]')) {
      const label = root.querySelector<HTMLElement>(`input[data-bet-period][value="${st.period}"] + span`)?.textContent ?? '';
      el.textContent = `${c.name} (${c.who})${label ? `, období: ${label}` : ''}`;
    }
    const amount = parseStake(stakeInputs[0]?.value);
    for (const out of $$<HTMLElement>('[data-out]')) {
      out.textContent = '';
      if (amount === null) { out.textContent = 'Zadej sázku v Kč.'; continue; }
      if (!c.odds) { out.textContent = 'Na tenhle výsledek teď kurz nemáme.'; continue; }
      const w = winnings(amount, c.odds);
      for (const part of ['Pokud sázka vyhraje, dostaneš ', strong(kc(w.payout)), ' včetně vkladu. Čistý zisk je ', strong(kc(w.profit)), '. Pokud prohraje, ztratíš vklad ', strong(kc(amount)), '.']) {
        out.appendChild(typeof part === 'string' ? document.createTextNode(part) : part);
      }
    }
    document.dispatchEvent(new CustomEvent('kr:bet', { detail: { outcome: st.outcome } }));
  }

  function url(): string {
    const base = new URLSearchParams(location.search);
    return `${location.pathname}?${withBetState(base, { outcome: st.outcome, stake: st.stake, period: st.period, finding: st.finding, market: cfg.market })}${location.hash}`;
  }

  function set(next: Partial<BetState>, mode: 'push' | 'replace' | 'none') {
    st = { ...st, ...next };
    paint();
    if (!sync || mode === 'none') return;
    history[mode === 'push' ? 'pushState' : 'replaceState'](null, '', url());
  }

  root.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.matches('input[data-bet-outcome]')) set({ outcome: t.value as O }, 'push');
    else if (t.matches('input[data-bet-period]')) set({ period: t.value as PeriodKey }, 'push');
  });
  let timer: number | undefined;
  root.addEventListener('input', (e) => {
    const t = e.target as HTMLInputElement;
    if (!t.matches('input[data-bet-stake]')) return;
    for (const other of stakeInputs) if (other !== t) other.value = t.value;
    for (const h of root.querySelectorAll<HTMLInputElement>('input[type=hidden][name=vklad]')) h.value = String(parseStake(t.value) ?? st.stake);
    const n = parseStake(t.value);
    if (n !== null) { st = { ...st, stake: n }; window.clearTimeout(timer); timer = window.setTimeout(() => sync && history.replaceState(null, '', url()), 300); }
    paint();
  });
  for (const f of $$<HTMLFormElement>('form[data-bet-form]')) {
    f.addEventListener('submit', (e) => { e.preventDefault(); paint(); });
    for (const b of f.querySelectorAll<HTMLElement>('[data-nojs]')) b.hidden = true;
  }
  if (sync) {
    window.addEventListener('popstate', () => {
      const p = parseBetState(new URLSearchParams(location.search), cfg.defaultOutcome);
      const periods = $$<HTMLInputElement>('input[data-bet-period]').map((r) => r.value);
      st = { ...st, outcome: p.outcome, stake: p.stake, period: p.period && periods.includes(p.period) ? p.period : (periods.at(-1) as PeriodKey | undefined) ?? null, finding: p.finding };
      for (const i of stakeInputs) i.value = String(st.stake);
      paint();
    });
  }
  paint();
}
