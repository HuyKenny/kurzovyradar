/**
 * Tipsport and Chance run on the same partner platform: identical endpoints, auth and match ids.
 * Auth: POST /rest/external/v2/oauth/token (client_credentials) → access_token + JSESSIONID cookie; both on every call.
 * One bulk call per book and run (GET /rest/external/offer/v1/matches?fromDate&toDate, ~2.7 MB for 7 days):
 * the import never asks per match, so the call pattern stays at 2 requests per run.
 */
const UA = 'Mozilla/5.0 (compatible; KurzovyRadar/1.0; +https://kurzovyradar.cz)';

interface Session { host: string; token: string; cookie: string }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RawMatch = Record<string, any>;

async function login(host: string, id: string, secret: string): Promise<Session> {
  if (!id || !secret) throw new Error(`${host}: missing credentials`);
  const res = await fetch(`https://${host}/rest/external/v2/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': UA },
    body: JSON.stringify({ client_id: id, client_secret: secret, grant_type: 'client_credentials' }),
  });
  if (!res.ok) throw new Error(`${host} oauth ${res.status}`);
  const j = (await res.json()) as { access_token?: string };
  const cookie = /JSESSIONID=[^;]+/.exec(res.headers.get('set-cookie') ?? '')?.[0];
  if (!j.access_token || !cookie) throw new Error(`${host} oauth: no token/session`);
  return { host, token: j.access_token, cookie };
}

/** ISO without zone, as sportstreamy sends it; the window has 3 h of slack on the past side either way. */
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 19);

export async function fetchMatches(host: string, id: string, secret: string, days: number, now = Date.now()): Promise<RawMatch[]> {
  const s = await login(host, id, secret);
  const from = now - 3 * 3600_000;
  const path = `/rest/external/offer/v1/matches?fromDate=${iso(from)}&toDate=${iso(from + days * 86_400_000)}`;
  const res = await fetch(`https://${s.host}${path}`, {
    headers: { Authorization: `Bearer ${s.token}`, Cookie: s.cookie, 'User-Agent': UA, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`${host} matches ${res.status}`);
  const j = (await res.json()) as { matches?: RawMatch[] };
  if (!Array.isArray(j.matches)) throw new Error(`${host} matches: unexpected body`);
  return j.matches;
}
