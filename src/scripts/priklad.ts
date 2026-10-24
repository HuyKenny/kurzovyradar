// Beginner example in the guide (see BeginnerExample.astro): a real upcoming match when we have one, otherwise a clearly
// labelled teaching example. Same arithmetic and wording as the match detail (lib/bet-state.ts, lib/market.ts).
import { parseStake, winnings } from '../lib/bet-state';
import { outcomeLabel, selectionName, settlement, winCondition } from '../lib/market';
import { betUrl } from '../lib/links';
import { kickoff } from '../lib/format';

type O = '1' | 'x' | '2';
interface Ex { real: boolean; id?: number; url?: string; home: string; away: string; comp: string; sport: 'fotbal' | 'hokej'; startAt?: number; odds: Record<O, number> }

const root = document.querySelector<HTMLElement>('[data-example]');
if (root) {
  const $ = <T extends HTMLElement>(s: string) => root.querySelector<T>(s)!;
  const kc = (n: number) => `${new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 2 }).format(Math.round(n * 100) / 100)} Kč`;
  const odd = (m: number) => (m / 1000).toFixed(2).replace('.', ',');
  const TEACHING: Ex = { real: false, home: 'Tým A', away: 'Tým B', comp: 'Výukový příklad', sport: 'fotbal', odds: { '1': 2100, x: 3400, '2': 3600 } };
  let ex: Ex = TEACHING;
  let outcome: O = '1';

  const li = (parts: (string | Node)[]) => { const e = document.createElement('li'); for (const p of parts) e.appendChild(typeof p === 'string' ? document.createTextNode(p) : p); return e; };
  const strong = (t: string) => { const b = document.createElement('strong'); b.className = 'num'; b.textContent = t; return b; };

  function paint() {
    const o = ex.odds[outcome];
    $('[data-ex-name]').textContent = `${selectionName(ex.sport, outcome)} (${outcomeLabel(ex.sport, outcome, ex.home, ex.away)}), kurz ${odd(o)}. ${settlement(ex.sport)}`;
    $('[data-ex-cond]').replaceChildren(...winCondition(ex.sport, outcome, ex.home, ex.away).map((x) => li([x])));
    const stake = parseStake($<HTMLInputElement>('[data-ex-stake]').value);
    const out = $('[data-ex-out]');
    if (stake === null || stake <= 0) { out.replaceChildren(li(['Zadej částku v Kč, například 100.'])); }
    else {
      const w = winnings(stake, o);
      out.replaceChildren(
        li(['Pokud sázka vyhraje, dostaneš ', strong(kc(w.payout)), ' včetně vkladu.']),
        li(['Čistý zisk je pak ', strong(kc(w.profit)), ' (výplata minus vklad).']),
        li(['Pokud sázka prohraje, ztratíš vklad ', strong(kc(stake)), '.']),
      );
    }
    for (const r of root!.querySelectorAll<HTMLInputElement>('[data-ex-outcomes] input')) r.checked = r.value === outcome;
    const actions = $('[data-ex-actions]');
    actions.hidden = !ex.real;
    if (ex.real) {
      $<HTMLAnchorElement>('[data-ex-open]').href = betUrl(ex.url!, outcome, '/pruvodce/kurzy-pro-zacatecniky/#priklad', { stake: stake && stake > 0 ? stake : undefined });
      const f = $<HTMLButtonElement>('[data-ex-follow]');
      f.dataset.followBet = JSON.stringify({ id: ex.id, outcome, url: ex.url, home: ex.home, away: ex.away, startAt: ex.startAt, comp: ex.comp, sport: ex.sport, label: outcomeLabel(ex.sport, outcome, ex.home, ex.away), odds: o });
      f.hidden = false;
      document.dispatchEvent(new CustomEvent('kr:bet'));
    }
  }

  function build() {
    $('[data-ex-source]').textContent = ex.real
      ? `Skutečný zápas: ${ex.home} vs ${ex.away} (${ex.comp}), ${kickoff(ex.startAt!, Math.floor(Date.now() / 1000))}. Kurzy jsou nejvyšší aktuální z Tipsportu a Chance.`
      : 'Výukový příklad s vymyšlenými kurzy: nejde o skutečný zápas. Až budeme mít aktuální kurzy, ukážeme tu skutečný zápas. Dnešní nabídku najdeš v přehledu dnešních zápasů.';
    $('[data-ex-outcomes]').replaceChildren(...(['1', 'x', '2'] as O[]).map((o) => {
      const l = document.createElement('label');
      const i = document.createElement('input'); i.type = 'radio'; i.name = 'priklad-vysledek'; i.value = o; i.checked = o === outcome;
      const s = document.createElement('span'); s.textContent = `${outcomeLabel(ex.sport, o, ex.home, ex.away)} ${odd(ex.odds[o])}`;
      l.appendChild(i); l.appendChild(s); return l;
    }));
    paint();
  }

  root.addEventListener('change', (e) => { const t = e.target as HTMLInputElement; if (t.name === 'priklad-vysledek') { outcome = t.value as O; paint(); } });
  root.addEventListener('input', (e) => { if ((e.target as HTMLElement).matches('[data-ex-stake]')) paint(); });
  build();
  fetch('/api/priklad.json').then((r) => r.json() as Promise<{ event: null | { id: number; url: string; home: string; away: string; compName: string; sport: 'fotbal' | 'hokej'; startAt: number }; odds?: Record<O, number> }>)
    .then((d) => { if (d.event && d.odds) { ex = { real: true, id: d.event.id, url: d.event.url, home: d.event.home, away: d.event.away, comp: d.event.compName, sport: d.event.sport, startAt: d.event.startAt, odds: d.odds }; build(); } })
    .catch(() => { /* the teaching example stays */ });
}
