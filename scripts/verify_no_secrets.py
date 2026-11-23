#!/usr/bin/env python3
"""Fail if a secret VALUE is in the tracked files or in the static output (tmp-static/out). The repository is PUBLIC.

In CI the values come from the environment (GitHub secrets); locally from ~/ai/credentials/.kurzovyradar-credentials.env and
.cloudflare-credentials.env. Only the file and the secret's NAME are ever printed.
    python3 scripts/verify_no_secrets.py [--repo]
"""
import os
import subprocess
import sys
from pathlib import Path

APP = Path(__file__).resolve().parent.parent
NAMES = ['TIPSPORT_CLIENT_ID', 'TIPSPORT_CLIENT_SECRET', 'CHANCE_API_USER', 'CHANCE_API_PASS', 'CLOUDFLARE_API_TOKEN', 'STATE_KEY',
         'CF_GLOBAL_API_KEY', 'CF_API_KEY', 'CF_API_TOKEN_KURZOVYRADAR']


def values():
    vals = {n: os.environ[n] for n in NAMES if len(os.environ.get(n, '')) >= 8}
    if not os.environ.get('GITHUB_ACTIONS'):
        for f in ('.kurzovyradar-credentials.env', '.cloudflare-credentials.env'):
            p = Path('/home/kenny/ai/credentials') / f
            if p.exists():
                for line in p.read_text().splitlines():
                    k, _, v = line.strip().partition('=')
                    k = k.replace('export ', '').strip()
                    if k in NAMES and len(v.strip('"\' ')) >= 8:
                        vals[f'{f}:{k}'] = v.strip('"\' ')
    return vals


def main():
    vals = values()
    files = [APP / f for f in subprocess.run(['git', 'ls-files'], cwd=APP, capture_output=True, text=True, check=True).stdout.split('\n') if f]
    if '--repo' not in sys.argv and (APP / 'tmp-static' / 'out').exists():
        files += [p for p in (APP / 'tmp-static' / 'out').rglob('*') if p.is_file()]
    bad = []
    for f in files:
        try:
            data = f.read_bytes()
        except (FileNotFoundError, IsADirectoryError):
            continue
        for name, v in vals.items():
            if v.encode() in data:
                bad.append((str(f.relative_to(APP)), name))
    for f, n in bad:
        print(f'SECRET {n} in {f}')
    print(f'secret check: {len(files)} files, {len(vals)} values, {len(bad)} hits')
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
