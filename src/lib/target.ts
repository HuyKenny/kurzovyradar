/**
 * Own target price for a followed bet ("zajímá mě kurz aspoň 2,10"). Evaluated when the visitor opens the site, against the
 * valid current price. History is used only as positive evidence: we never say a target "was reached" unless a recorded price
 * proves it, and a missing record is never read as "not reached". There is no e-mail or push: nothing happens while the
 * browser is closed. Prices are thousandths (2100 = 2,10). Pure.
 */

/** "2,10" / "2.1" → 2100, or null for anything that is not a usable decimal price (> 1, ≤ 1000). */
export function parseTarget(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const t = raw.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,3})?$/.test(t)) return null;
  const n = Math.round(Number(t) * 1000);
  return n > 1000 && n <= 1_000_000 ? n : null;
}

export interface PriceRec { at: number; odds: number; enabled: boolean }

/**
 * What the recorded prices of a bet prove about its target since it was set at `since`:
 *  - atStart: the price that was valid when the target was set already met it,
 *  - firstAt: the first recorded price at/after `since` that met it (null when none was recorded).
 * `rows` = every recorded price of the bet (all comparable books), any order; suspended prices do not count.
 */
export function historyReach(rows: PriceRec[], since: number, target: number): { atStart: boolean; firstAt: number | null } {
  const on = rows.filter((r) => r.enabled).sort((a, b) => a.at - b.at);
  // The price valid at `since` is the last record before it. Several books are mixed here, so we only claim what the very
  // last record at or before `since` proves; an earlier, possibly replaced price is not enough.
  const lastBefore = [...on].reverse().find((r) => r.at <= since);
  const atStart = !!lastBefore && lastBefore.odds >= target;
  const hit = on.find((r) => r.at > since && r.odds >= target);
  return { atStart, firstAt: hit ? hit.at : null };
}

export type TargetState = 'reached' | 'reached-earlier' | 'waiting' | 'unavailable' | 'started';
export interface TargetCheck { state: TargetState; text: string }

export interface TargetInput {
  target: number;
  /** Current valid best price, or null when no current valid offer exists (stale, suspended, not paired). */
  current: number | null;
  started: boolean;
  /** When the target was set (seconds); only needed for the history sentence. */
  setAt?: number | null;
  /** Result of historyReach for this bet, when the history was available. */
  reach?: { atStart: boolean; firstAt: number | null } | null;
  /** formatters injected so this stays pure and testable */
  fmt: (milli: number) => string;
  when: (s: number) => string;
}

export function evaluateTarget(i: TargetInput): TargetCheck {
  const { target, current, fmt } = i;
  if (i.started) return { state: 'started', text: 'Zápas už začal, cíl už nehlídáme. Předzápasové kurzy po výkopu nesledujeme.' };
  if (current === null) return { state: 'unavailable', text: `Teď nemáme platný aktuální kurz (nabídka je pozastavená, stará nebo chybí), takže cíl ${fmt(target)} nejde vyhodnotit.` };
  if (current >= target) {
    const early = i.reach?.atStart ? ' Kurz byl na této úrovni už v době, kdy sis cíl nastavil.' : i.reach?.firstAt ? ` Poprvé jsme ho na této úrovni zapsali ${i.when(i.reach.firstAt)}.` : '';
    return { state: 'reached', text: `Cíl splněn: aktuální kurz ${fmt(current)} je aspoň ${fmt(target)}.${early}` };
  }
  if (i.reach?.firstAt) {
    return { state: 'reached-earlier', text: `Cíl ${fmt(target)} jsme od nastavení zapsali ${i.when(i.reach.firstAt)}. Teď je kurz ${fmt(current)}, tedy pod cílem. Mezi kontrolami (à 15 min) výkyvy nevidíme.` };
  }
  return { state: 'waiting', text: `Zatím nedosaženo: aktuální kurz ${fmt(current)}, do cíle ${fmt(target)} chybí ${((target - current) / 1000).toFixed(2).replace('.', ',')}. Od nastavení jsme cíl při kontrolách nezapsali.` };
}
