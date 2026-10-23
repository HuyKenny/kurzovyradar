// "Sledované" without an account: everything lives in this browser's localStorage (key kr-sledovane, version 2).
// Old favourites (kr-favs, a list of matches) are migrated once. Nothing is sent anywhere except the ids
// the page asks the site's own API about.
export type Odds3 = Partial<Record<'1' | 'x' | '2', number>>;
/** What the visitor saw: price(s) and when; `via` = when they saved it, or the last time /oblibene/ showed it. */
export interface Seen<T> { at: number; odds: T; via?: 'ulozeni' | 'zobrazeni' }
export interface FollowEvent { id: number; url: string; home: string; away: string; startAt: number; comp: string; seen: Seen<Odds3> | null }
export interface FollowBet { id: number; outcome: '1' | 'x' | '2'; url: string; home: string; away: string; startAt: number; comp: string; sport: string; label: string; seen: Seen<number | null> | null }
export interface FollowState { v: 2; events: FollowEvent[]; bets: FollowBet[]; comps: { slug: string; name: string }[]; sports: string[] }

const KEY = 'kr-sledovane';
const OLD = 'kr-favs';
const empty = (): FollowState => ({ v: 2, events: [], bets: [], comps: [], sports: [] });

export function load(): FollowState {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null') as FollowState | null;
    if (v && v.v === 2) return { ...empty(), ...v };
    const old = JSON.parse(localStorage.getItem(OLD) ?? '[]') as Omit<FollowEvent, 'seen'>[];
    const s = empty();
    if (Array.isArray(old)) s.events = old.map((e) => ({ ...e, seen: null }));
    save(s);
    try { localStorage.removeItem(OLD); } catch { /* ignore */ }
    return s;
  } catch {
    return empty();
  }
}

export function save(s: FollowState) {
  // Matches that started more than two days ago are dropped, so the list does not grow forever.
  const cut = Date.now() / 1000 - 2 * 86400;
  s.events = s.events.filter((e) => e.startAt > cut).slice(-200);
  s.bets = s.bets.filter((b) => b.startAt > cut).slice(-200);
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* private mode: nothing is kept */ }
  document.dispatchEvent(new CustomEvent('kr:follow'));
}

export const nowS = () => Math.floor(Date.now() / 1000);
