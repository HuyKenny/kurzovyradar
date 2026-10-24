// "Sledované" without an account: everything lives in this browser's localStorage (key kr-sledovane, version 2).
// Old favourites (kr-favs, a list of matches) are migrated once. Nothing is sent anywhere except the ids
// the page asks the site's own API about.
export type Odds3 = Partial<Record<'1' | 'x' | '2', number>>;
/** What the visitor saw: price(s) and when; `via` = when they saved it, or the last time /oblibene/ showed it. */
export interface Seen<T> { at: number; odds: T; via?: 'ulozeni' | 'zobrazeni' }
export interface FollowEvent { id: number; url: string; home: string; away: string; startAt: number; comp: string; seen: Seen<Odds3> | null }
/** `target` = the visitor's own wanted price in thousandths (2100 = 2,10) and `targetAt` when they set it; both optional and absent in older saves. */
export interface FollowBet { id: number; outcome: '1' | 'x' | '2'; url: string; home: string; away: string; startAt: number; comp: string; sport: string; label: string; seen: Seen<number | null> | null; target?: number | null; targetAt?: number | null }
export interface FollowState { v: 2; events: FollowEvent[]; bets: FollowBet[]; comps: { slug: string; name: string }[]; sports: string[] }

const KEY = 'kr-sledovane';
const OLD = 'kr-favs';
const empty = (): FollowState => ({ v: 2, events: [], bets: [], comps: [], sports: [] });

/** Reads the stored state: current format, the v1 favourites list, or nothing. Saves from before the target price still load as they are. */
export function parseState(current: string | null, legacy: string | null): { state: FollowState; migrated: boolean } {
  try {
    const v = JSON.parse(current ?? 'null') as FollowState | null;
    if (v && v.v === 2) {
      const s = { ...empty(), ...v };
      s.bets = (s.bets ?? []).map((b) => ({ ...b, target: typeof b.target === 'number' ? b.target : null, targetAt: typeof b.targetAt === 'number' ? b.targetAt : null }));
      return { state: s, migrated: false };
    }
    const old = JSON.parse(legacy ?? '[]') as Omit<FollowEvent, 'seen'>[];
    const s = empty();
    if (Array.isArray(old)) s.events = old.map((e) => ({ ...e, seen: null }));
    return { state: s, migrated: true };
  } catch {
    return { state: empty(), migrated: false };
  }
}

export function load(): FollowState {
  try {
    const { state, migrated } = parseState(localStorage.getItem(KEY), localStorage.getItem(OLD));
    if (migrated) {
      save(state);
      try { localStorage.removeItem(OLD); } catch { /* ignore */ }
    }
    return state;
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

/** Home and away of the event are the other way round than when the bet was followed. */
export const swapped = (e: { home: string; away: string }, b: { home: string; away: string }) => e.home === b.away && e.away === b.home && e.home !== e.away;
