#!/usr/bin/env python3
"""kurzovyradar.cz as static files (since 23. 11. 2026, Cloudflare Workers Free: no cron, no D1/KV on the request path).

One run (GitHub Actions every 15 min, .github/workflows/build.yml):
  1. the Astro SSR app (dist/, `pnpm build`) runs locally under `wrangler dev --local` over the SQLite state (data/state.db),
  2. its scheduled handler imports the odds (Tipsport + Chance partner API, credentials from the environment → .dev.vars),
  3. every page is fetched from the local server and written to tmp-static/out/ (match pages only when their data changed),
     plus pre-rendered query variants of listing pages (/_v/), lookup shards for the edge Worker (/_data/) and history shards (/api/historie/),
  4. scripts/cf-deploy.mjs uploads the changed files and edge/worker.js as the production Worker "kurzovyradar".
The state (data/state.db + data/static-manifest.json) is kept encrypted in the GitHub release "state" (scripts/state.sh).

  static.py run [--no-import] [--all] [--worker NAME] [--no-deploy]
      --no-import  quick fix run: render from the restored data, no feed request
      --all        re-render every match page (default: only changed ones and those older than MAX_AGE)
      --worker     deploy target (default kurzovyradar = production; e.g. kurzovyradar-static-test on workers.dev for checks)
Prints counts only (public Actions logs): never credentials, never response bodies.
"""
import argparse
import concurrent.futures as cf
import hashlib
import html
import json
import os
import re
import shutil
import signal
import sqlite3
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

APP = Path(__file__).resolve().parent.parent
DIST = APP / 'dist'
WORK = APP / 'tmp-static'
OUT = WORK / 'out'
PERSIST = WORK / 'wrangler-state'
DATA = APP / 'data'
STATE_DB = DATA / 'state.db'
MANIFEST = DATA / 'static-manifest.json'
PORT = int(os.environ.get('KR_RENDER_PORT', '8840'))
ORIGIN = f'http://127.0.0.1:{PORT}'
UA = 'KurzovyRadar-static/1.0'
SITE = 'https://kurzovyradar.cz'

PAST_DAYS = int(os.environ.get('KR_PAST_DAYS', '7'))  # match pages are kept this long after kick-off; older ones → 301 to the competition (edge Worker)
MAX_AGE_S = 2 * 3600     # an unchanged upcoming match page is re-rendered at least this often (relative texts, radar reasons)
THREADS = int(os.environ.get('KR_RENDER_THREADS', '3'))   # workerd renders one page at a time (~0.27 s on the Pi); more threads only queue
SHARDS = 256
SECRETS = ('TIPSPORT_CLIENT_ID', 'TIPSPORT_CLIENT_SECRET', 'CHANCE_API_USER', 'CHANCE_API_PASS')
# Listing pages whose query variants are pre-rendered (filters, pages of a list); the edge Worker serves them for `?…`.
VARIANT_CAP = {'/': 6, '/kurzy/': 60, '/radar/': 60, '/dnes/': 30}
SPORT_VARIANT_CAP = 20
FILE_LIMIT = 19_000       # Workers Free: 20 000 asset files per version


def log(*a):
    print(*a, flush=True)


def jsonc(path):
    """wrangler.jsonc without comments (only // line comments are used there)."""
    text = re.sub(r'^\s*//.*$', '', path.read_text(), flags=re.M)
    return json.loads(text)


def wrangler(*args, **kw):
    return subprocess.run(['pnpm', 'exec', 'wrangler', *args], cwd=APP, **kw)


# ---------- local SSR ----------

def dev_vars():
    """Secrets for the local import: from the environment (CI), else the existing .dev.vars (local runs). Never printed."""
    have = {k: os.environ.get(k, '') for k in SECRETS}
    p = APP / '.dev.vars'
    if all(have.values()):
        p.write_text(''.join(f'{k}={json.dumps(v)}\n' for k, v in have.items()) + 'ENVIRONMENT="production"\n')
        p.chmod(0o600)
    elif not p.exists():
        sys.exit('no credentials: set TIPSPORT_CLIENT_ID/SECRET + CHANCE_API_USER/PASS or create .dev.vars')
    else:
        # a local .dev.vars says "development"; the static build must render production pages (indexable, real robots.txt)
        txt = re.sub(r'^ENVIRONMENT=.*$', 'ENVIRONMENT="production"', p.read_text(), flags=re.M)
        if 'ENVIRONMENT=' not in txt:
            txt += 'ENVIRONMENT="production"\n'
        p.write_text(txt)
    # wrangler dev reads .dev.vars from the directory of the config it runs (dist/server/), and the build is cached in CI:
    # the copy the Astro build made (if any) is stale or missing, so write it there as well.
    q = DIST / 'server' / '.dev.vars'
    q.write_text(p.read_text())
    q.chmod(0o600)


def prepare_db():
    """Put data/state.db where miniflare keeps the local D1 of dist/server/wrangler.json, then apply pending migrations."""
    if PERSIST.exists():
        shutil.rmtree(PERSIST)
    cfg = str(DIST / 'server' / 'wrangler.json')
    r = wrangler('d1', 'migrations', 'apply', 'DB', '--local', '-c', cfg, '--persist-to', str(PERSIST), capture_output=True, text=True,
                 env={**os.environ, 'CI': '1'})
    files = [f for f in (PERSIST / 'v3' / 'd1').rglob('*.sqlite') if f.name != 'metadata.sqlite']
    if r.returncode or len(files) != 1:
        log(r.stdout[-1500:], r.stderr[-1500:])
        sys.exit('could not create the local D1 file')
    target = files[0]
    if STATE_DB.exists():
        for f in target.parent.glob(target.name + '*'):
            f.unlink()
        shutil.copyfile(STATE_DB, target)
        r = wrangler('d1', 'migrations', 'apply', 'DB', '--local', '-c', cfg, '--persist-to', str(PERSIST), capture_output=True, text=True,
                     env={**os.environ, 'CI': '1'})
        if r.returncode:
            log(r.stdout[-1500:], r.stderr[-1500:])
            sys.exit('migrations failed on the restored state')
        log(f'state: restored {STATE_DB.stat().st_size // 1_000_000} MB')
    else:
        log('state: none, starting empty')
    return target


class Server:
    def __init__(self):
        self.proc = None
        self.logf = None

    def __enter__(self):
        self.logf = open(WORK / 'wrangler-dev.log', 'w')
        self.proc = subprocess.Popen(['pnpm', 'exec', 'wrangler', 'dev', '-c', str(DIST / 'server' / 'wrangler.json'), '--local',
                                      '--persist-to', str(PERSIST), '--port', str(PORT), '--ip', '127.0.0.1', '--inspector-port', str(PORT + 1),
                                      '--test-scheduled', '--show-interactive-dev-session=false', '--log-level', 'info'],
                                     cwd=APP, stdout=self.logf, stderr=subprocess.STDOUT, start_new_session=True,
                                     env={**os.environ, 'CI': '1', 'WRANGLER_SEND_METRICS': 'false'})
        for _ in range(120):
            time.sleep(1)
            if self.proc.poll() is not None:
                break
            try:
                if get('/robots.txt', timeout=10)[0] == 200:
                    return self
            except Exception:
                pass
        self.stop()
        log((WORK / 'wrangler-dev.log').read_text()[-3000:])
        sys.exit('local SSR did not start')

    def stop(self):
        if self.proc and self.proc.poll() is None:
            os.killpg(self.proc.pid, signal.SIGTERM)
            try:
                self.proc.wait(30)
            except subprocess.TimeoutExpired:
                os.killpg(self.proc.pid, signal.SIGKILL)
        if self.logf:
            self.logf.close()

    def __exit__(self, *a):
        self.stop()


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k):
        return None


OPENER = urllib.request.build_opener(NoRedirect)
REDIRECTS = {}   # path → (target, status): server-side redirects of the SSR app (renamed pages), deployed as `_redirects`


def get(path, timeout=120):
    req = urllib.request.Request(ORIGIN + path, headers={'User-Agent': UA})
    try:
        with OPENER.open(req, timeout=timeout) as r:
            return r.status, r.read(), r.headers.get('Content-Type', '')
    except urllib.error.HTTPError as e:
        loc = e.headers.get('Location', '')
        if e.code in (301, 308) and '?' not in path:
            to = loc.removeprefix(ORIGIN).removeprefix(SITE)
            if to.startswith('/') and to != path:
                REDIRECTS[path] = (to, e.code)
        return e.code, e.read(), e.headers.get('Content-Type', '')


def run_import():
    t = time.time()
    st, body, _ = get('/cdn-cgi/handler/scheduled?cron=4,19,34,49+*+*+*+*', timeout=900)
    text = (WORK / 'wrangler-dev.log').read_text(errors='replace')
    rep = [l for l in text.splitlines() if l.lstrip().startswith('import ') or 'import failed' in l]
    log(f'import: HTTP {st} in {time.time() - t:.0f} s')
    for l in rep[-2:]:
        # the report holds counts and error texts of the feeds (status codes), no credentials
        log('  ' + l.strip()[:600])
    return st == 200


# ---------- what to render ----------

def out_file(path):
    """URL path → file under OUT (pages as <dir>/index.html, files as they are)."""
    if path.endswith('/'):
        return OUT / path.lstrip('/') / 'index.html'
    return OUT / path.lstrip('/')


HREF = re.compile(r'href="(/[^"#]*)')


def links(body):
    for m in HREF.finditer(body.decode('utf-8', 'replace')):
        yield html.unescape(m.group(1))


KNOWN = None


def known_params():
    global KNOWN
    if KNOWN is None:
        src = (APP / 'src' / 'lib' / 'params.ts').read_text()
        KNOWN = set(re.findall(r"'([a-z0-9]+)'", src.split('new Set(')[1]))
    return KNOWN


def variant_key(query):
    """Same as variantKey() in edge/worker.js: known parameters with a value, sorted, `zpet` never part of it."""
    pairs = [(k, v) for k, v in urllib.parse.parse_qsl(query, keep_blank_values=True) if k in known_params() and k != 'zpet' and v != '']
    pairs.sort()
    return '&'.join(f'{urllib.parse.quote(k, safe="")}={urllib.parse.quote(v, safe="")}' for k, v in pairs)


def fingerprint(db, build):
    """Per match: a hash of everything its page shows from the database (event, sources, offers, number of recorded changes)."""
    fp = {}
    rows = db.execute('''SELECT e.id, e.slug, e.home, e.away, e.start_at, e.market, c.slug, c.name FROM events e JOIN competitions c ON c.id = e.competition_id''')
    for r in rows:
        fp[r[0]] = hashlib.sha1(repr((build,) + tuple(r)).encode())
    for r in db.execute('SELECT event_id, book, mismatch, removed_at, path FROM event_sources ORDER BY event_id, book'):
        if r[0] in fp:
            fp[r[0]].update(repr(r).encode())
    for r in db.execute('SELECT event_id, book, market, outcome, odds, enabled, removed_at, changed_at FROM offers ORDER BY event_id, book, market, outcome'):
        if r[0] in fp:
            fp[r[0]].update(repr(r).encode())
    for r in db.execute('SELECT event_id, COUNT(*), MAX(at) FROM odds_history GROUP BY event_id'):
        if r[0] in fp:
            fp[r[0]].update(repr(r).encode())
    return {k: v.hexdigest()[:16] for k, v in fp.items()}


def shards(db, now):
    """Static lookup files: /_data/e/<n>.json (edge: /go/ deeplinks, old match → competition), /_data/tz/<n>.json (sportstreamy ids),
    /api/historie/<n>.json (recorded prices of upcoming matches for target prices on /oblibene/)."""
    ev = [dict() for _ in range(SHARDS)]
    tz = [dict() for _ in range(SHARDS)]
    hist = [dict() for _ in range(SHARDS)]
    for eid, slug, comp in db.execute('SELECT e.id, e.slug, c.slug FROM events e JOIN competitions c ON c.id = e.competition_id'):
        ev[eid % SHARDS][str(eid)] = {'c': comp, 'u': f'/zapas/{slug}-{eid}/'}
    for eid, book, path, src in db.execute("SELECT event_id, book, path, src_id FROM event_sources WHERE book IN ('tipsport', 'chance')"):
        e = ev[eid % SHARDS].get(str(eid))
        if e is None:
            continue
        if path:
            e.setdefault('p', {})[book] = path
        if book == 'tipsport' and str(src).isdigit():
            tz[int(src) % SHARDS][str(src)] = e['u']
    q = '''SELECT h.event_id, h.outcome, h.at, h.odds, h.enabled FROM odds_history h
           JOIN events e ON e.id = h.event_id AND h.market = e.market
           JOIN event_sources s ON s.event_id = h.event_id AND s.book = h.book AND s.mismatch = 0
           WHERE e.start_at > ? ORDER BY h.event_id, h.outcome, h.at'''
    for eid, outcome, at, odds, enabled in db.execute(q, (now - 2 * 3600,)):
        hist[eid % SHARDS].setdefault(str(eid), {}).setdefault(outcome, []).append([at, odds, enabled])
    files = {}
    for i in range(SHARDS):
        for name, data in (('_data/e', ev[i]), ('_data/tz', tz[i]), ('api/historie', hist[i])):
            files[f'/{name}/{i}.json'] = json.dumps(data, separators=(',', ':'), sort_keys=True).encode()
    return files


# ---------- render ----------

def write(path, body):
    f = out_file(path)
    f.parent.mkdir(parents=True, exist_ok=True)
    f.write_bytes(body)


def render(args):
    # Match pages are re-rendered for everything when the client bundles change (old pages would point at deleted /_astro/ files).
    # A text-only commit (a new guide) keeps them: upcoming ones refresh within MAX_AGE_S anyway, `--all` forces a full render.
    build = hashlib.sha1('\n'.join(sorted(p.name for p in (DIST / 'client' / '_astro').iterdir())).encode()).hexdigest()[:12]
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    manifest = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}
    prev = manifest.get('files', {})
    dev_vars()
    db_file = prepare_db()
    with Server():
        imported = True
        if not args.no_import:
            t_import = int(time.time()) - 5
            imported = run_import()
        now = int(time.time())
        # the server keeps writing WAL; read a consistent copy
        snap = WORK / 'read.db'
        src = sqlite3.connect(f'file:{db_file}?mode=ro', uri=True)
        dst = sqlite3.connect(snap)
        src.backup(dst)
        src.close()
        dst.close()
        db = sqlite3.connect(snap)
        if not args.no_import:
            ok = db.execute("SELECT COUNT(*) FROM import_runs WHERE started_at >= ? AND status = 'ok'", (t_import,)).fetchone()[0]
            errs = [r[0][:200] for r in db.execute("SELECT book || ': ' || COALESCE(error, '') FROM import_runs WHERE started_at >= ? AND status != 'ok'", (t_import,))]
            log(f'import: {ok} book(s) ok' + (f', errors: {errs}' if errs else ''))
            if not ok:
                # Nothing fresh: deploying would only turn every price stale on the site. Keep the last deploy and the last state.
                sys.exit('import failed for every bookmaker: not deploying')

        static = {str(p.relative_to(DIST / 'client')).replace(os.sep, '/') for p in (DIST / 'client').rglob('*') if p.is_file()}
        prerendered = {'/' + s[:-len('index.html')] for s in static if s.endswith('index.html')}

        # match pages: kept PAST_DAYS after kick-off; re-rendered when their data changed, at kick-off and at least every MAX_AGE_S
        fps = fingerprint(db, build)
        matches = {}
        for eid, slug, start in db.execute('SELECT id, slug, start_at FROM events WHERE start_at >= ?', (now - PAST_DAYS * 86400,)):
            matches[f'/zapas/{slug}-{eid}/'] = (eid, start)
        todo_m, keep_m = [], {}
        for path, (eid, start) in matches.items():
            fp = f'{fps.get(eid)}|{int(start <= now)}'
            old = prev.get(path)
            fresh_enough = old and (start <= now or now - old.get('at', 0) < MAX_AGE_S + (eid % 12) * 600)
            if not args.all and old and old.get('fp') == fp and fresh_enough and old.get('hash'):
                keep_m[path] = old
            else:
                todo_m.append((path, fp))

        # every other page: the sitemap + whatever those pages link to (without a query), files the browser fetches
        pages = {}
        st, body, _ = get('/sitemap.xml')
        if st != 200:
            sys.exit(f'sitemap.xml → {st}')
        seeds = [urllib.parse.urlparse(u).path for u in re.findall(r'<loc>([^<]+)</loc>', body.decode())]
        seeds += ['/robots.txt', '/sitemap.xml', '/api/search.json', '/api/priklad.json', '/api/events.json', '/hledat/', '/oblibene/', '/sporty/', '/souteze/']
        queue = [p for p in seeds if not p.startswith('/zapas/')]
        seen = set(queue) | set(matches)
        variants = {}       # listing path → {key: query}
        listing = set(VARIANT_CAP)
        failed = []

        def fetch(path):
            return path, get(path)

        def take(path, res):
            st, body, ct = res
            if st in (301, 308) and path in REDIRECTS:
                return
            if st != 200:
                failed.append((path, st))
                return
            write(path, body)
            pages[path] = True
            if 'text/html' in ct:
                for href in links(body):
                    p, _, qs = href.partition('?')
                    if qs:
                        if p in listing or p in sport_paths:
                            k = variant_key(qs)
                            if k:
                                variants.setdefault(p, {}).setdefault(k, qs)
                        continue
                    if (p.endswith('/') and p not in seen and not p.startswith(('/go/', '/zapas/', '/_astro/', '/api/', '/tipsport-zapas/', '/cdn-cgi/'))
                            and p not in prerendered):
                        seen.add(p)
                        queue.append(p)

        sport_paths = set(re.findall(r"path: '(/[a-z-]+/)'", (APP / 'src' / 'config' / 'competitions.ts').read_text()))
        for p in sport_paths:
            if p not in seen:
                seen.add(p)
                queue.append(p)
        t = time.time()
        with cf.ThreadPoolExecutor(THREADS) as ex:
            while queue:
                batch, queue[:] = list(queue), []
                for path, res in ex.map(fetch, [p for p in batch if p not in prerendered]):
                    take(path, res)
            log(f'pages: {len(pages)} in {time.time() - t:.0f} s')

            # query variants of listing pages: what the pages link to (tabs, filters, "next page"), followed for a few rounds
            t = time.time()
            for p in sport_paths:
                variants.setdefault(p, {})
            for p in ('/kurzy/', '/radar/'):
                for s in sorted(sport_paths):
                    variants.setdefault(p, {}).setdefault(f'sport={s.strip("/")}', f'sport={s.strip("/")}')
                for d in ('dnes', 'zitra', 'vikend', '7'):
                    variants.setdefault(p, {}).setdefault(f'den={d}', f'den={d}')
            for v in ('vyber=fotbal', 'vyber=hokej', 'sport=hokej'):
                variants.setdefault('/', {}).setdefault(v, v)
            done = {}
            for _ in range(30):
                jobs = []
                for p, ks in variants.items():
                    cap = VARIANT_CAP.get(p, SPORT_VARIANT_CAP)
                    for k, qs in list(ks.items()):
                        if (p, k) not in done and len([1 for (pp, _) in done if pp == p]) + len([1 for (pp, _) in jobs if pp == p]) < cap:
                            jobs.append((p, k))
                if not jobs:
                    break
                for (p, k), (st, body, ct) in zip(jobs, ex.map(lambda j: get(f'{j[0]}?{variants[j[0]][j[1]]}'), jobs)):
                    done[(p, k)] = None
                    if st != 200 or 'text/html' not in ct:
                        continue
                    vid = hashlib.sha1(f'{p}?{k}'.encode()).hexdigest()[:12]
                    write(f'/_v/{vid}/', body)
                    done[(p, k)] = vid
                    for href in links(body):
                        pp, _, qs = href.partition('?')
                        if qs and pp == p:
                            kk = variant_key(qs)
                            if kk:
                                variants[p].setdefault(kk, qs)
            index = {}
            for (p, k), vid in done.items():
                if vid:
                    index.setdefault(p, {})[k] = vid
            write('/_v/index.json', json.dumps(index, separators=(',', ':'), sort_keys=True).encode())
            log(f'variants: {sum(len(v) for v in index.values())} on {len(index)} pages in {time.time() - t:.0f} s')

            # match pages
            t = time.time()
            rendered_m = {}
            for (path, fp), (st, body, ct) in zip(todo_m, ex.map(lambda j: get(j[0]), todo_m)):
                if st == 200:
                    write(path, body)
                    rendered_m[path] = fp
                elif path in prev and prev[path].get('hash'):
                    keep_m[path] = prev[path]       # a render error keeps the last good page
                else:
                    failed.append((path, st))
            log(f'match pages: {len(rendered_m)} rendered, {len(keep_m)} unchanged, in {time.time() - t:.0f} s')

        # 404 page (any unknown path renders it)
        st, body, _ = get('/404-kurzovyradar-static/')
        if st == 404:
            (OUT / '404.html').write_bytes(body)
        for path, body in shards(db, now).items():
            write(path, body)
        db.close()
        snap.unlink(missing_ok=True)

    # static files of the build (assets, prerendered guides, …) on top
    for rel in static:
        f = OUT / rel
        if rel == '_headers' or f.exists():
            continue
        f.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(DIST / 'client' / rel, f)
    leak = [str(p) for p in OUT.rglob('*.html') if ORIGIN.encode() in p.read_bytes()]
    if leak:
        sys.exit(f'{len(leak)} pages contain the local origin, e.g. {leak[0]}')
    if failed:
        log(f'failed: {len(failed)}', failed[:10])
    # the state for the next run (WAL folded in) — only when the import did not fail outright
    if imported:
        con = sqlite3.connect(db_file)
        con.execute('PRAGMA wal_checkpoint(TRUNCATE)')
        con.close()
        DATA.mkdir(exist_ok=True)
        shutil.copyfile(db_file, STATE_DB)
    return {'matches': {'rendered': rendered_m, 'kept': keep_m}, 'failed': failed, 'imported': imported}


# ---------- deploy ----------

def deploy(worker, result, now):
    cfg = jsonc(APP / 'wrangler.jsonc')
    files = {}
    for f in OUT.rglob('*'):
        if f.is_file():
            files['/' + str(f.relative_to(OUT)).replace(os.sep, '/')] = {'file': str(f)}
    for path, old in result['matches']['kept'].items():
        files['/' + str(out_file(path).relative_to(OUT)).replace(os.sep, '/')] = {'hash': old['hash'], 'size': old['size']}
    if len(files) > FILE_LIMIT:
        sys.exit(f'{len(files)} files > {FILE_LIMIT}: lower PAST_DAYS')
    index = json.loads((OUT / '_v' / 'index.json').read_text())
    headers = (DIST / 'client' / '_headers').read_text() + '\n/_v/*\n  X-Robots-Tag: noindex, follow\n/_data/*\n  X-Robots-Tag: noindex\n/api/*\n  X-Robots-Tag: noindex\n'
    spec = {
        'worker': worker,
        'compatibility_date': cfg['compatibility_date'],
        'module': str(APP / 'edge' / 'worker.js'),
        'vars': {k: cfg['vars'][k] for k in ('TIPSPORT_URL', 'CHANCE_URL', 'ALLWYN_URL', 'MERKURXTIP_URL')},
        'analytics_engine': {'CLICKS': 'kurzovyradar_clicks'},
        'config': {'html_handling': 'force-trailing-slash', 'not_found_handling': 'none',
                   'run_worker_first': ['/go/*', '/tipsport-zapas/*', *sorted(index)]},
        'headers': headers,
        'redirects': ''.join(f'{a} {b} {c}\n' for a, (b, c) in sorted(REDIRECTS.items())),
        'workers_dev': worker != 'kurzovyradar',
        'files': files,
    }
    spec_file = WORK / 'deploy.json'
    spec_file.write_text(json.dumps(spec))
    r = subprocess.run(['node', str(APP / 'scripts' / 'cf-deploy.mjs'), str(spec_file)], cwd=APP, capture_output=True, text=True)
    if r.returncode == 3:
        return json.loads(r.stdout.strip().splitlines()[-1])
    if r.returncode:
        log(r.stderr[-3000:])
        sys.exit('deploy failed')
    out = json.loads(r.stdout.strip().splitlines()[-1])
    log(f"deploy {worker}: {out['total']} files, {out['uploaded']} uploaded ({out['bytes'] // 1_000_000} MB)")
    # remember hash + fingerprint of every match page, so the next run can skip the unchanged ones
    hashes = out['hashes']
    keep = {}
    for path, fp in result['matches']['rendered'].items():
        h = hashes.get('/' + str(out_file(path).relative_to(OUT)).replace(os.sep, '/'))
        if h:
            keep[path] = {'hash': h[0], 'size': h[1], 'fp': fp, 'at': now}
    for path, old in result['matches']['kept'].items():
        keep[path] = old
    MANIFEST.write_text(json.dumps({'worker': worker, 'at': now, 'files': keep}, separators=(',', ':')))
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('cmd', choices=['run'])
    ap.add_argument('--no-import', action='store_true')
    ap.add_argument('--all', action='store_true')
    ap.add_argument('--worker', default='kurzovyradar')
    ap.add_argument('--no-deploy', action='store_true')
    args = ap.parse_args()
    WORK.mkdir(exist_ok=True)
    if not (DIST / 'server' / 'wrangler.json').exists():
        sys.exit('dist/ missing: run pnpm build first')
    now = int(time.time())
    result = render(args)
    if args.no_deploy:
        return
    if args.worker != 'kurzovyradar' and MANIFEST.exists() and json.loads(MANIFEST.read_text()).get('worker') != args.worker:
        # hashes of the production Worker are not guaranteed to exist for another Worker: render everything
        result['matches']['kept'] = {}
    missing = deploy(args.worker, result, now)
    if missing:
        # Cloudflare lost blobs we referenced by hash: render those match pages again (no new import) and deploy once more
        paths = sorted({'/' + p.lstrip('/').removesuffix('index.html') for p in missing.get('paths', [])})
        log(f'deploy: {len(paths)} referenced files missing at Cloudflare, rendering them again')
        with Server():
            for p in paths:
                st, body, _ = get(p)
                old = result['matches']['kept'].pop(p, None)
                if st == 200:
                    write(p, body)
                    result['matches']['rendered'][p] = (old or {}).get('fp', '')
        if deploy(args.worker, result, now):
            sys.exit('deploy failed twice on missing files')

if __name__ == '__main__':
    main()
