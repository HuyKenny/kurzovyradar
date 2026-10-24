/** Czech formatting. Everything is stored in UTC and shown in Europe/Prague. */
const TZ = 'Europe/Prague';

/** 1850 → "1,85" (always two decimals: the platform quotes to 0.01). */
export const odds = (milli: number) => (milli / 1000).toFixed(2).replace('.', ',');
export const pct = (n: number, signed = true) => `${signed && n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(1).replace('.', ',')} %`;
export const pct0 = (n: number) => `${Math.round(n * 100)} %`;
export const int = (n: number) => new Intl.NumberFormat('cs-CZ').format(n);
export const kc = (n: number) => `${new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(Math.round(n * 100) / 100)} Kč`;

// Intl.DateTimeFormat is expensive to construct (and these run per event, thousands of times on a listing page): build each once.
const fmtTime = new Intl.DateTimeFormat('cs-CZ', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
const fmtDate = new Intl.DateTimeFormat('cs-CZ', { timeZone: TZ, day: 'numeric', month: 'numeric', year: 'numeric' });
const fmtDateShort = new Intl.DateTimeFormat('cs-CZ', { timeZone: TZ, day: 'numeric', month: 'numeric' });
const fmtWeekday = new Intl.DateTimeFormat('cs-CZ', { timeZone: TZ, weekday: 'short' });
const fmtDay = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ });
const at = (f: Intl.DateTimeFormat, s: number) => f.format(new Date(s * 1000));

export const time = (s: number) => at(fmtTime, s);
export const date = (s: number) => at(fmtDate, s);
export const dateShort = (s: number) => at(fmtDateShort, s);
export const dateTime = (s: number) => `${dateShort(s)} ${time(s)}`;
export const weekday = (s: number) => at(fmtWeekday, s);
export const isoLocal = (s: number) => new Date(s * 1000).toISOString();

/** Prague calendar day key "2026-10-24". */
const dayCache = new Map<number, string>();
/** Memoised per 15-minute bucket: Prague's UTC offset is a whole number of hours, so a bucket never straddles midnight. */
export const dayKey = (s: number) => {
  const b = Math.floor(s / 900);
  let k = dayCache.get(b);
  if (k === undefined) {
    if (dayCache.size > 4000) dayCache.clear();
    k = at(fmtDay, b * 900);
    dayCache.set(b, k);
  }
  return k;
};

/** "Dnes 20:45", "Zítra 18:00", "So 25. 10. 15:30". */
export function kickoff(s: number, now: number): string {
  const d = dayKey(s);
  if (d === dayKey(now)) return `Dnes ${time(s)}`;
  if (d === dayKey(now + 86400)) return `Zítra ${time(s)}`;
  const w = weekday(s);
  return `${w.charAt(0).toUpperCase()}${w.slice(1)} ${dateShort(s)} ${time(s)}`;
}

/** "v 21:34" today, otherwise "23. 10. v 21:34". */
export const atTime = (s: number, now: number) => (dayKey(s) === dayKey(now) ? `v ${time(s)}` : `${dateShort(s)} v ${time(s)}`);

/** "před 6 min", "před 2 h", or the date when older than a day. */
export function ago(s: number, now: number): string {
  const d = Math.max(0, now - s);
  if (d < 60) return 'před chvílí';
  if (d < 3600) return `před ${Math.floor(d / 60)} min`;
  if (d < 86400) return `před ${Math.floor(d / 3600)} h`;
  return dateTime(s);
}

export const sportName = (s: string) => (s === 'hokej' ? 'Hokej' : 'Fotbal');
