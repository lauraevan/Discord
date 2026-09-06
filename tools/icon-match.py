"""
Matches each icon the app draws against Discord's own set.

Both sides are reduced to a silhouette: threshold to ink, crop to the ink
bbox, scale into a fixed square. That throws away size and position, which
differ between the frames, and compares the shape alone — the thing that was
actually wrong about the hand-drawn glyphs.
"""
import json
import sys
from PIL import Image

SP = '/tmp/claude-0/-home-user-Discord/d79a875f-de4b-540c-a828-cbd4c5853547/scratchpad'
CELL, COLS, N = 64, 20, 32

import os
atlas = Image.open(os.environ.get('ATLAS', f'{SP}/atlas.png')).convert('L')


def norm(im, thr, bright=True):
    """Ink silhouette scaled into an NxN box, aspect preserved."""
    px = im.load()
    W, H = im.size
    hit = (lambda v: v > thr) if bright else (lambda v: v < thr)
    xs = [x for x in range(W) if any(hit(px[x, y]) for y in range(H))]
    ys = [y for y in range(H) if any(hit(px[x, y]) for x in range(W))]
    if not xs:
        return None
    c = im.crop((xs[0], ys[0], xs[-1] + 1, ys[-1] + 1))
    if not bright:
        c = c.point(lambda v: 255 - v)
    w, h = c.size
    s = N / max(w, h)
    c = c.resize((max(1, round(w * s)), max(1, round(h * s))), Image.LANCZOS)
    out = Image.new('L', (N, N), 0)
    out.paste(c, ((N - c.width) // 2, (N - c.height) // 2))
    # normalise contrast so a dim glyph still matches a bright one
    lo, hi = out.getextrema()
    if hi > lo:
        out = out.point(lambda v: int((v - lo) * 255 / (hi - lo)))
    return out


CAND = []
import json as _j
N_IC = len(_j.load(open(os.environ.get('ICONS', f'{SP}/dicons.json')))) 
for i in range(N_IC):
    cx, cy = (i % COLS) * CELL, (i // COLS) * CELL
    n = norm(atlas.crop((cx, cy, cx + CELL, cy + CELL)), 40)
    CAND.append(n.load() if n else None)


def best(im, thr, bright, k=12):
    t = norm(im, thr, bright)
    if t is None:
        return []
    tp = t.load()
    out = []
    for i, cp in enumerate(CAND):
        if cp is None:
            continue
        d = sum(abs(tp[x, y] - cp[x, y]) for x in range(N) for y in range(N)) / (N * N)
        out.append((d, i))
    out.sort()
    return out[:k]


TARGETS = json.load(open(sys.argv[1]))
for t in TARGETS:
    src = Image.open(t['file']).convert('L')
    crop = src.crop(tuple(t['box']))
    hits = best(crop, t.get('thr', 60), t.get('bright', True))
    print(f"{t['name']:22} " + '  '.join(f'#{i}({d:.1f})' for d, i in hits))
