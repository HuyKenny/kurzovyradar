#!/usr/bin/env python3
"""Self-hosted Inter (variable, wght 400–800): latin + latin-ext woff2 cut down to the characters a Czech page uses.

Source: @fontsource-variable/inter (SIL OFL 1.1). Layout features are kept (tnum = equal-width figures for odds).
Re-run when the character set changes:  python3 scripts/fonts.py
"""
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'node_modules/@fontsource-variable/inter/files'
CHARS = ''.join(map(chr, range(0x20, 0x7f))) + ''.join(map(chr, range(0xa0, 0x100)))
CHARS += 'ČčĎďĚěŇňŘřŠšŤťŮůŽžĹĺĽľŔŕ' + '–—‘’‚“”„…•·→←↑↓↗↘×−€ ‑≈≤≥'

for name in ('inter-latin-wght-normal.woff2', 'inter-latin-ext-wght-normal.woff2'):
    f = TTFont(SRC / name)
    opts = subset.Options()
    opts.layout_features = ['*']
    opts.flavor = None
    opts.notdef_outline = True
    sub = subset.Subsetter(opts)
    sub.populate(text=CHARS)
    sub.subset(f)
    f.save(ROOT / f'.tmp-{name}.ttf')
# latin covers U+0000-00FF, latin-ext the Czech letters; app.css loads each via unicode-range
for name, out in (('inter-latin-wght-normal.woff2', 'inter-latin.woff2'), ('inter-latin-ext-wght-normal.woff2', 'inter-latin-ext.woff2')):
    f = TTFont(ROOT / f'.tmp-{name}.ttf')
    f = instancer.instantiateVariableFont(f, {'wght': (400, 800)})
    f.flavor = 'woff2'
    f.save(ROOT / 'public/fonts' / out)
    (ROOT / f'.tmp-{name}.ttf').unlink()
    print(out, (ROOT / 'public/fonts' / out).stat().st_size // 1024, 'kB')
