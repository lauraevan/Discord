"""
Scores a rendered frame against docs/reference.png.

Mean absolute grey difference over the whole frame, and again over only the
parts that can be matched: the reference's profile banner and avatars are
photographs of a real person's account and the second rail tile is a server
that does not exist here, so those regions can never agree and would otherwise
sit in the score as a fixed floor. Also prints the worst 16x16 blocks, which is
what says where to look next.

    python3 tools/score.py shot.png [--blocks N]
"""
import sys
from PIL import Image

REF = Image.open('docs/reference.png').convert('L')

# regions with no matchable content: the reference's own avatars and banner,
# and the other server's icon in the rail
UNMATCHABLE = [
    (84, 690, 224, 743),      # the user card's avatar
    (0, 100, 84, 160),        # the other server's rail tile
    (8, 326, 254, 452),       # the popout's banner and avatar, when it is open
]


def score(path, blocks=0):
    mine = Image.open(path).convert('L')
    if mine.size != REF.size:
        raise SystemExit(f'{path} is {mine.size}, reference is {REF.size}')
    a, b = REF.load(), mine.load()
    W, H = REF.size
    masked = [[False] * W for _ in range(H)]
    for x0, y0, x1, y1 in UNMATCHABLE:
        for y in range(y0, min(y1, H)):
            for x in range(x0, min(x1, W)):
                masked[y][x] = True

    total = n = 0
    mtotal = mn = 0
    cells = {}
    for y in range(H):
        for x in range(W):
            d = abs(a[x, y] - b[x, y])
            total += d
            n += 1
            if not masked[y][x]:
                mtotal += d
                mn += 1
                key = (x >> 4, y >> 4)
                cells[key] = cells.get(key, 0) + d

    print(f'{path}: whole frame {total / n:.3f}   matchable only {mtotal / mn:.3f}')
    if blocks:
        worst = sorted(cells.items(), key=lambda kv: -kv[1])[:blocks]
        print('worst blocks (x, y, mean):')
        for (cx, cy), s in worst:
            print(f'  {cx * 16:5} {cy * 16:5}   {s / 256:.1f}')


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    nb = 0
    if '--blocks' in sys.argv:
        nb = int(sys.argv[sys.argv.index('--blocks') + 1])
    score(args[0], nb)
