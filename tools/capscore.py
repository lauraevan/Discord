"""Mean absolute grey difference against docs/refs/febf1f6c.jpg, the 1:1 capture.

The companion to tools/score.py. That one scores against docs/reference.png,
which is Discord downscaled to 80% — good for layout, but its edges are spread
by the resampling kernel, so it cannot settle a sub-pixel question. This one
compares native pixels.

    python3 tools/capscore.py shot.png [--blocks N]
"""
import sys
import numpy as np
from PIL import Image

REF = np.array(Image.open('docs/refs/febf1f6c.jpg').convert('L')).astype(int)

# the reference's own account art, which cannot agree: its avatar in the user
# card, in the message row, and the checklist's pixel art
UNMATCHABLE = [(16, 1660, 100, 1740), (390, 1160, 470, 1240), (1360, 570, 1440, 1360)]


def score(path, blocks=0):
    mine = np.array(Image.open(path).convert('L')).astype(int)
    if mine.shape != REF.shape:
        raise SystemExit(f'{path} is {mine.shape}, reference is {REF.shape}')
    d = np.abs(REF - mine)
    m = np.ones_like(d, dtype=bool)
    for x0, y0, x1, y1 in UNMATCHABLE:
        m[y0:y1, x0:x1] = False
    print(f'{path}: whole frame {d.mean():.3f}   matchable only {d[m].mean():.3f}')
    if blocks:
        H, W = d.shape
        bs = 64
        cells = [(d[y:y + bs, x:x + bs][m[y:y + bs, x:x + bs]].mean() if m[y:y + bs, x:x + bs].any() else 0, x, y)
                 for y in range(0, H - bs, bs) for x in range(0, W - bs, bs)]
        cells.sort(reverse=True)
        print('worst blocks (logical x, y, mean):')
        for v, x, y in cells[:blocks]:
            print(f'  {x // 2:5} {y // 2:5}   {v:.1f}')


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    nb = int(sys.argv[sys.argv.index('--blocks') + 1]) if '--blocks' in sys.argv else 0
    score(args[0], nb)
