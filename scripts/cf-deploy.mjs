#!/usr/bin/env node
// Deploy the static site + edge/worker.js as one Worker version from a MANIFEST (adapted from apps/sporteka-web/scripts/cf-assets.mjs).
// Unchanged match pages are named by the hash Cloudflare already holds, so a run uploads only what changed and needs no copy of
// the old HTML on disk.
//
//   node scripts/cf-deploy.mjs <spec.json>
//
// spec.json: { worker, compatibility_date, module: "/abs/edge/worker.js", vars: {NAME: text}, analytics_engine: {BINDING: dataset},
//   config: { html_handling, not_found_handling, run_worker_first }, headers: "<_headers text>", redirects: "<_redirects text>", workers_dev: bool,
//   files: { "/a/index.html": { file: "/abs" } | { hash, size } } }
// Prints JSON {worker, total, uploaded, bytes, hashes} (hashes = {path: [hash, size]}); exit 3 + {error:"missing", paths} when a
// referenced hash is gone. Also clears the Worker's cron triggers (this project has none on the Free plan).
// Credentials (never printed): CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID, else ~/ai/credentials/.cloudflare-credentials.env (local).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(fs.realpathSync(path.join(process.cwd(), 'node_modules', 'wrangler', 'package.json')));
const blake3 = require('blake3-wasm');

const API = 'https://api.cloudflare.com/client/v4';
const readEnv = (f) => Object.fromEntries(fs.readFileSync(f, 'utf8').split('\n')
  .filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).replace('export ', '').trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; }));
// Local runs: global key from .cloudflare-credentials.env, account id from .kurzovyradar-credentials.env (CF_ACCOUNT_ID).
const env = process.env.CLOUDFLARE_API_TOKEN ? {} : { ...readEnv('/home/kenny/ai/credentials/.kurzovyradar-credentials.env'), ...readEnv('/home/kenny/ai/credentials/.cloudflare-credentials.env') };
const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID || env.CF_ACCOUNT_ID;
if (!ACCOUNT) throw new Error('CLOUDFLARE_ACCOUNT_ID missing');
const AUTH = process.env.CLOUDFLARE_API_TOKEN ? { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}` }
  : { 'X-Auth-Email': env.CF_EMAIL, 'X-Auth-Key': env.CF_GLOBAL_API_KEY || env.CF_API_KEY };

const MIME = { html: 'text/html', css: 'text/css', js: 'application/javascript', json: 'application/json', xml: 'application/xml', txt: 'text/plain',
  svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', avif: 'image/avif', ico: 'image/x-icon', woff2: 'font/woff2',
  webmanifest: 'application/manifest+json' };

async function api(method, url, body, headers = {}) {
  for (let attempt = 1; ; attempt++) {
    const r = await fetch(API + url, { method, headers: { ...headers }, body });
    const j = await r.json().catch(() => ({}));
    if (j.success) return j.result;
    if (attempt >= 5 || (r.status < 500 && r.status !== 429)) throw new Error(`${method} ${url.split('?')[0]} → ${r.status} ${JSON.stringify(j.errors ?? '').slice(0, 300)}`);
    await new Promise((s) => setTimeout(s, 2000 * attempt));
  }
}

const m = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const manifest = {};
const local = new Map(); // hash → [path, abs file]
for (const [p, e] of Object.entries(m.files)) {
  if (e.file) {
    const buf = fs.readFileSync(e.file);
    const hash = blake3.hash(buf.toString('base64') + path.extname(p).slice(1)).toString('hex').slice(0, 32);
    manifest[p] = { hash, size: buf.length };
    local.set(hash, [p, e.file]);
  } else {
    if (!e.hash || e.size == null) throw new Error(`no file and no stored hash for ${p}`);
    manifest[p] = { hash: e.hash, size: e.size };
  }
}
if (Object.keys(manifest).length > 20000) throw new Error('more than 20 000 files in one Worker version (Workers Free)');

const newSession = () => api('POST', `/accounts/${ACCOUNT}/workers/scripts/${m.worker}/assets-upload-session`, JSON.stringify({ manifest }), { ...AUTH, 'Content-Type': 'application/json' });
let session = await newSession();
let jwt = session.jwt;
const need = (session.buckets ?? []).flat();
let bytes = 0;
const missing = need.filter((h) => !local.has(h));
if (missing.length) {
  const want = new Set(missing);
  const paths = Object.entries(manifest).filter(([, e]) => want.has(e.hash)).map(([p]) => p);
  process.stdout.write(JSON.stringify({ error: 'missing', paths }) + '\n', () => process.exit(3));
  await new Promise(() => {});
}
for (let round = 1; ; round++) {
  const queue = [...session.buckets ?? []];
  const upJwt = session.jwt;
  let refused = false;
  async function worker() {
    for (let b = queue.shift(); b && !refused; b = queue.shift()) {
      const form = new FormData();
      let size = 0;
      for (const h of b) {
        const [p, file] = local.get(h);
        const buf = fs.readFileSync(file);
        size += buf.length;
        form.append(h, new File([buf.toString('base64')], h, { type: MIME[path.extname(p).slice(1)] ?? 'application/null' }), h);
      }
      try {
        const res = await api('POST', `/accounts/${ACCOUNT}/workers/assets/upload?base64=true`, form, { Authorization: `Bearer ${upJwt}` });
        bytes += size;
        if (res?.jwt) jwt = res.jwt;
      } catch (e) {
        if (!/ → 401 /.test(String(e.message)) || round >= 4) throw e;
        refused = true;
      }
    }
  }
  await Promise.all([worker(), worker(), worker()]);
  if (!refused) break;
  console.error(`cf-deploy: ${m.worker}: upload token refused (401), new upload session (round ${round + 1})`);
  session = await newSession();
  jwt = session.jwt;
  if (!(session.buckets ?? []).length) break;
}

const bindings = [
  { type: 'assets', name: 'ASSETS' },
  ...Object.entries(m.vars ?? {}).map(([name, text]) => ({ type: 'plain_text', name, text })),
  ...Object.entries(m.analytics_engine ?? {}).map(([name, dataset]) => ({ type: 'analytics_engine', name, dataset })),
];
const meta = {
  main_module: 'worker.js',
  compatibility_date: m.compatibility_date ?? '2026-10-01',
  bindings,
  assets: { jwt, config: { ...m.config, ...(m.headers ? { _headers: m.headers } : {}), ...(m.redirects ? { _redirects: m.redirects } : {}) } },
  observability: { enabled: true, head_sampling_rate: 0.1 },
};
const form = new FormData();
form.set('metadata', new File([JSON.stringify(meta)], 'metadata.json', { type: 'application/json' }));
form.set('worker.js', new File([fs.readFileSync(m.module)], 'worker.js', { type: 'application/javascript+module' }));
await api('PUT', `/accounts/${ACCOUNT}/workers/scripts/${m.worker}`, form, AUTH);
// No cron triggers on the Free plan for this project (the import runs in GitHub Actions).
await api('PUT', `/accounts/${ACCOUNT}/workers/scripts/${m.worker}/schedules`, JSON.stringify([]), { ...AUTH, 'Content-Type': 'application/json' });
if (typeof m.workers_dev === 'boolean') {
  await api('POST', `/accounts/${ACCOUNT}/workers/scripts/${m.worker}/subdomain`, JSON.stringify({ enabled: m.workers_dev, previews_enabled: false }), { ...AUTH, 'Content-Type': 'application/json' });
}
console.log(JSON.stringify({ worker: m.worker, total: Object.keys(manifest).length, uploaded: need.length, bytes,
  hashes: Object.fromEntries(Object.entries(manifest).map(([p, e]) => [p, [e.hash, e.size]])) }));
