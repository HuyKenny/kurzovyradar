/** Czech formatting. Everything is stored in UTC and shown in Europe/Prague. */
const TZ = 'Europe/Prague';

/** 1850 → "1,85" (always two decimals: the platform quotes to 0.01). */
export const odds = (milli: number) => (milli / 1000).toFixed(2).replace('.', ',');
export const pct = (n: number, signed = true) => `${signed && n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(1).replace('.', ',')} %`;
export const pct0 = (n: number) => `${Math.round(n * 100)} %`;
export const int = (n: number) => new Intl.NumberFormat('cs-CZ').format(n);
export const kc = (n: number) => `${new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(n)} Kč`;

const parts = (s: number, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('cs-CZ', { timeZone: TZ, ...o }).format(new Date(s * 1000));

export const time = (s: number) => parts(s, { hour: '2-digit', minute: '2-digit' });
export const date = (s: number) => parts(s, { day: 'numeric', month: 'numeric', year: 'numeric' });
export const dateShort = (s: number) => parts(s, { day: 'numeric', month: 'numeric' });
export const dateTime = (s: number) => `${dateShort(s)} ${time(s)}`;
export const weekday = (s: number) => parts(s, { weekday: 'short' });
export const isoLocal = (s: number) => new Date(s * 1000).toISOString();

/** Prague calendar day key "2026-10-24". */
export const dayKey = (s: number) => new Intl.DateTimeFormat('sv-SE', { timeZone: TZ }).format(new Date(s * 1000));

/** "Dnes 20:45", "Zítra 18:00", "So 25. 10. 15:30". */
export function kickoff(s: number, now: number): string {
  const d = dayKey(s);
  if (d === dayKey(now)) return `Dnes ${time(s)}`;
  if (d === dayKey(now + 86400)) return `Zítra ${time(s)}`;
  const w = weekday(s);
  return `${w.charAt(0).toUpperCase()}${w.slice(1)} ${dateShort(s)} ${time(s)}`;
}

/** "před 6 min", "před 2 h", or the date when older than a day. */
export function ago(s: number, now: number): string {
  const d = Math.max(0, now - s);
  if (d < 60) return 'před chvílí';
  if (d < 3600) return `před ${Math.floor(d / 60)} min`;
  if (d < 86400) return `před ${Math.floor(d / 3600)} h`;
  return dateTime(s);
}

export const sportName = (s: string) => (s === 'hokej' ? 'Hokej' : 'Fotbal');
