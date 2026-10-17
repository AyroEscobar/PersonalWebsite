#!/usr/bin/env python3
"""
The two preloaded faces, cut to what the site sets (frontend/CREDITS.md). Run by hand, never by the build:

  python3 scripts/fonts/subset.py <source dir with the fontsource woff2 files>

  Cinzel (the name, the wordmark, the section titles): Basic Latin, the no-break space, the middle dot and
  the curly quotes; the wght axis kept from 400 to 500 (the site sets 400 and 500).
  EB Garamond upright (every sentence): Basic Latin, Latin-1 punctuation and letters, the middle dot, the
  curly quotes and the ellipsis; the wght axis kept from 400 to 600 (the site sets 400, 500 and 600).

Both are SIL OFL 1.1 with no Reserved Font Name, so a subset keeps its name (OFL section 3 and FAQ 2.4).
Marcellus SC and the EB Garamond italic ship as fontsource cut them (not preloaded, not modified).
Needs fonttools and a brotli module (pip3 install fonttools brotli).
"""
import io
import sys
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.subset import Subsetter, Options
from fontTools.varLib import instancer

SRC = Path(sys.argv[1])
OUT = Path(__file__).resolve().parents[2] / 'src/assets/fonts'

BASIC = list(range(0x20, 0x7F))
PUNCT = [0xA0, 0xB7, 0x2018, 0x2019, 0x201C, 0x201D]
LATIN1 = list(range(0xA1, 0x100)) + [0x2026]  # no dashes: the site never sets one

JOBS = [
    ('cinzel-latin-wght-normal.woff2', BASIC + PUNCT, (400, 500)),
    ('eb-garamond-latin-wght-normal.woff2', BASIC + PUNCT + LATIN1, (400, 600)),
]

for name, codepoints, wght in JOBS:
    font = TTFont(SRC / name, lazy=False)
    before = (SRC / name).stat().st_size
    if 'fvar' in font:
        font = instancer.instantiateVariableFont(font, {'wght': wght})
        buf = io.BytesIO()
        font.flavor = None
        font.save(buf)
        buf.seek(0)
        font = TTFont(buf, lazy=False)
    opts = Options()
    opts.flavor = 'woff2'
    opts.layout_features = ['kern', 'liga', 'clig', 'calt', 'lnum', 'onum', 'pnum', 'tnum', 'case', 'cpsp', 'smcp']
    opts.name_IDs = ['*']
    opts.name_languages = ['*']
    opts.notdef_outline = True
    opts.hinting = False
    opts.desubroutinize = True
    sub = Subsetter(options=opts)
    sub.populate(unicodes=[c for c in codepoints if c])
    sub.subset(font)
    font.flavor = 'woff2'
    dest = OUT / name
    font.save(dest)
    print(f'{name}: {before / 1024:.1f} KB -> {dest.stat().st_size / 1024:.1f} KB, wght {wght[0]} to {wght[1]}')
