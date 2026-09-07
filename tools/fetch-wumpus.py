"""
Vendors Discord's Wumpus into src/assets/wumpus/.

Discord's friends screens are illustrated with Wumpus and Discord's own copy on
those screens names him, so an empty state here needs the real character rather
than a drawing of one. His art is on a CDN this environment cannot reach;
taiten312/wumpus carries it committed to a public repo, which
raw.githubusercontent.com serves.

One per empty state, matched to the line Discord prints under it. Animations
are reduced to their first frame and everything is palette-quantised, since
these sit behind a single-file build.

    python3 tools/fetch-wumpus.py
"""
import io
import os
import urllib.request

from PIL import Image

BASE = 'https://raw.githubusercontent.com/taiten312/wumpus/master/wumpus'
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'src/assets/wumpus')

# empty state -> the pose that fits the line Discord prints under it
POSES = {
    # "No one's around to play with Wumpus."
    'shrug': 'WumpsShrug.png',
    # "Wumpus is waiting on friends. You don't have to though!"
    'waiting': 'WumpsSippy.png',
    # "There are no pending friend requests. Here's Wumpus for now."
    'idle': 'WumpsCool.png',
    # "You can't unblock the Wumpus."
    'lurking': 'WumpsLurking.gif',
}


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    total = 0
    for name, remote in POSES.items():
        with urllib.request.urlopen(f'{BASE}/{remote}', timeout=60) as r:
            raw = r.read()
        im = Image.open(io.BytesIO(raw))
        im.seek(0)
        rgba = im.convert('RGBA')
        # a binary alpha keeps the palette small and the edges are already hard
        rgba.putalpha(rgba.getchannel('A').point(lambda a: 255 if a > 100 else 0))
        out = rgba.quantize(colors=128, method=Image.FASTOCTREE)
        path = os.path.join(OUT, f'{name}.png')
        out.save(path, optimize=True)
        size = os.path.getsize(path)
        total += size
        print(f'{name:10} {remote:20} {len(raw) // 1024:4}KB -> {size // 1024:3}KB')
    print(f'\n{len(POSES)} poses, {total // 1024}KB total')


if __name__ == '__main__':
    main()
