"""
Vendors Discord's avatar decorations into src/assets/decorations/.

Discord serves these as 288x288 APNGs from a CDN this environment cannot
reach. Hayanaga/SillyTavern-AvatarDecorations-CSS carries the same files
committed to a public repo, which raw.githubusercontent.com does serve, so
that is where they come from.

They arrive as 60-132 frame animations, far too heavy to inline into a
single-file build: the twenty-four here total ~18MB as shipped. So each one is
reduced to the single frame that carries the most of its artwork — an
animation's first frame is often nearly empty — scaled to 128px and
palette-quantised with a binary alpha, which is what the source art mostly
uses anyway.

    python3 tools/fetch-decorations.py
"""
import io
import json
import os
import urllib.parse
import urllib.request

from PIL import Image, ImageDraw

BASE = 'https://raw.githubusercontent.com/Hayanaga/SillyTavern-AvatarDecorations-CSS/main/dc-decorations'
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'src/assets/decorations')
SIZE = 128

# Four complete Discord Shop collections, keyed by the repo's own grouping.
COLLECTIONS = {
    'Elements': ['6_Air', '6_Balance', '6_Earth', '6_Fire', '6_Lightning', '6_Water'],
    'Space': [
        '10_Astronaut-Helmet', '10_Black-Hole', '10_Constellations',
        '10_Solar-Orbit', '10_Stardust', '10_UFO',
    ],
    'Lo-Fi Vibes': [
        '7_Chromawave', '7_Cozy-Cat', '7_Cozy-Headphones',
        '7_Doodling', '7_Oasis', '7_Rainy-Mood',
    ],
    'Lunar New Year': [
        "5_Dragon's Smile", '5_Fan Fluorish', '5_Firecrackers',
        '5_Koi Pond', '5_Lucky Envelopes', '5_Lunar Lanterns',
    ],
}

# the repo's file stem -> the name Discord sells it under
RENAME = {'5_Fan Fluorish': 'Fan Flourish'}


def title(stem: str) -> str:
    if stem in RENAME:
        return RENAME[stem]
    return stem.split('_', 1)[1].replace('-', ' ')


def slug(stem: str) -> str:
    return (
        title(stem).lower().replace("'", '').replace(' ', '-')
    )


def best_frame(im: Image.Image) -> Image.Image:
    """
    The frame that best represents the decoration at rest.

    Scored on alpha, so a frame that is large but faint does not win — but only
    on the ring outside the avatar. Several of these animate through a moment
    that blankets the whole disc (Fire flares over it, Dragon\'s Smile lunges
    forward), and scoring the full frame picks exactly those, which is not how
    the decoration reads when it is being worn.
    """
    frames = getattr(im, 'n_frames', 1)
    w, h = im.size
    cx, cy, r = w / 2, h / 2, w * 0.34
    ring = Image.new('L', (w, h), 255)
    ImageDraw.Draw(ring).ellipse([cx - r, cy - r, cx + r, cy + r], fill=0)
    ring_px = ring.tobytes()

    best, best_score = None, -1
    for i in range(frames):
        im.seek(i)
        rgba = im.convert('RGBA')
        alpha = rgba.getchannel('A').tobytes()
        score = sum(a for a, m in zip(alpha, ring_px) if m)
        if score > best_score:
            best, best_score = rgba.copy(), score
    return best


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    index = []
    total = 0
    for collection, stems in COLLECTIONS.items():
        for stem in stems:
            url = f'{BASE}/{urllib.parse.quote(stem + ".png")}'
            with urllib.request.urlopen(url, timeout=60) as r:
                raw = r.read()
            frame = best_frame(Image.open(io.BytesIO(raw)))
            frame = frame.resize((SIZE, SIZE), Image.LANCZOS)
            # a binary alpha keeps the palette small; the source art is already
            # hard-edged, so this costs almost nothing visually
            alpha = frame.getchannel('A').point(lambda a: 255 if a > 96 else 0)
            frame.putalpha(alpha)
            # RGBA input only accepts the octree quantiser
            frame = frame.quantize(colors=192, method=Image.FASTOCTREE)
            name = f'{slug(stem)}.png'
            path = os.path.join(OUT, name)
            frame.save(path, optimize=True)
            size = os.path.getsize(path)
            total += size
            index.append({'id': slug(stem), 'name': title(stem), 'collection': collection, 'file': name})
            print(f'{title(stem):22} {collection:16} {len(raw) // 1024:5}KB -> {size // 1024:3}KB')
    print(f'\n{len(index)} decorations, {total // 1024}KB total')
    print(json.dumps(index, indent=2)[:200] + ' …')
    with open(os.path.join(OUT, 'index.json'), 'w') as f:
        json.dump(index, f, indent=2)


if __name__ == '__main__':
    main()
