#!/usr/bin/env python3
"""Self-hosted fonts (Google Fonts, SIL OFL 1.1), cut down to the characters a Czech page uses.

- Familjen Grotesk (variable 400–700): headings and odds (tnum kept → equal-width figures)
- Atkinson Hyperlegible Next (variable 400–700): body text, built for legibility
- Caveat 600: short hand-written notes only

The full latin + latin-ext files are downloaded (Google's `text=` subsetting drops OpenType alternates such as tnum),
merged per family and subset here with every layout feature kept. Re-run when the character set changes:
    python3 scripts/fonts.py
"""
import io
import re
import urllib.request
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public' / 'fonts'
UA = 'Mozilla/5.0 (X11; Linux aarch64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149 Safari/537.36'
CHARS = ''.join(map(chr, range(0x20, 0x7f))) + ''.join(map(chr, range(0xa0, 0x100)))
CHARS += 'ČčĎďĚěŇňŘřŠšŤťŮůŽžĹĺĽľŔŕ' + '–—‘’‚“”„…•·→←↑↓↗↘×−€ ‑≈≤≥✓'
FAMILIES = [
    ('Familjen Grotesk', 'wght@400..700', 'familjen'),
    ('Atkinson Hyperlegible Next', 'wght@400..700', 'atkinson'),
    ('Caveat', 'wght@600', 'caveat'),
]


def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=60).read()


for family, axis, name in FAMILIES:
    css = get('https://fonts.googleapis.com/css2?family=' + family.replace(' ', '+') + ':' + axis + '&display=swap').decode()
    # blocks: /* latin-ext */ @font-face {...}  /* latin */ @font-face {...}
    for subset_name in ('latin', 'latin-ext'):
        m = re.search(r'/\* ' + re.escape(subset_name) + r' \*/\s*@font-face\s*{[^}]*?url\((https://[^)]+)\)', css)
        if not m:
            raise SystemExit(f'{family}: no {subset_name} block')
        font = TTFont(io.BytesIO(get(m.group(1))))
        opts = subset.Options()
        opts.layout_features = ['*']
        opts.flavor = 'woff2'
        s = subset.Subsetter(opts)
        s.populate(text=CHARS)
        s.subset(font)
        dest = OUT / f'{name}-{subset_name}.woff2'
        font.flavor = 'woff2'
        font.save(dest)
        print(dest.name, dest.stat().st_size // 1024, 'kB')
