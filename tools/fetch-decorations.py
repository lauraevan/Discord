"""
Vendors Discord's avatar decorations into src/assets/decorations/.

Discord serves these as 288x288 APNGs from a CDN this environment cannot
reach. Two public repos carry the same files committed to git, which
raw.githubusercontent.com does serve, so that is where they come from:

  * uhidontkno/DiscordAvatarDecorations - the shop collections, unmodified
  * Hayanaga/SillyTavern-AvatarDecorations-CSS - the collections that repo
    does not carry (Galaxy, Lofi Vibes, Lunar New Year)

They arrive as 60-132 frame animations at 288px, ~18MB for the set, which is
far too heavy to inline into a single-file build. But a decoration that does
not move is not the decoration, so they stay animated: re-encoded as animated
WebP at 80px on a frame budget, with each file walked down through quality and
frame-rate steps until it fits. That holds the set to well under a megabyte
while every one still plays.

A still is written alongside each animation — the frame that best represents
the decoration at rest, scored on the ring outside the avatar since scoring the
whole frame picks the moment the effect blankets it. Nothing uses the stills
today; they are what a reduced-motion setting would switch to.

    python3 tools/fetch-decorations.py
"""
import io
import json
import os
import urllib.parse
import urllib.request

from PIL import Image, ImageDraw

SILLY = 'https://raw.githubusercontent.com/Hayanaga/SillyTavern-AvatarDecorations-CSS/main/dc-decorations/{}.png'
MONO = 'https://raw.githubusercontent.com/uhidontkno/DiscordAvatarDecorations/main/shop/{}/{{}}.png'
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'src/assets/decorations')
SIZE = 80
# each animation is walked down this ladder until it fits BUDGET
LADDER = [(4, 70), (5, 62), (6, 55), (8, 50), (10, 44)]
BUDGET = 30 * 1024

# Complete Discord Shop collections. The collection names are Discord's own,
# from the catalogue tools/fetch-shop.py reads.
COLLECTIONS = [
    ('Anime', MONO.format('anime'), [
        'in_love', 'radiating_energy', 'shocked',
        'soul_leaving_body', 'starry_eyed', 'sweat_drops',
    ]),
    # Discord shipped the collection in two drops; the repo files them apart
    ('Anime', MONO.format('anime_2'), [
        'angry', 'cat_ears', 'dismay', 'heartbloom', 'in_tears', 'ki_energy', 'rage',
    ]),
    ('Cyberpunk', MONO.format('cyberpunk'), [
        'cybernetic', 'digital_sunrise', 'glitch', 'implant',
    ]),
    ('Elements', MONO.format('elements'), [
        'air', 'balance', 'earth', 'fire', 'lightning', 'water',
    ]),
    ('Fantasy', MONO.format('fantasy'), [
        'defensive_shield', 'fairy_sprites', 'flaming_sword', 'glowing_runes',
        'magical_potion', 'skull_medallion', 'treasure_and_key', 'wizards_staff',
    ]),
    ('Monsters', MONO.format('monsters'), [
        'beamchop', 'chewbert', 'chuck', 'doodlezard',
        'gawblehop', 'glop', 'stinkums', 'winkle',
    ]),
    ('Galaxy', SILLY, [
        '10_Astronaut-Helmet', '10_Black-Hole', '10_Constellations',
        '10_Solar-Orbit', '10_Stardust', '10_UFO',
    ]),
    ('Lofi Vibes', SILLY, [
        '7_Chromawave', '7_Cozy-Cat', '7_Cozy-Headphones',
        '7_Doodling', '7_Oasis', '7_Rainy-Mood',
    ]),
    ('Lunar New Year', SILLY, [
        "5_Dragon's Smile", '5_Fan Fluorish', '5_Firecrackers',
        '5_Koi Pond', '5_Lucky Envelopes', '5_Lunar Lanterns',
    ]),
]

# the repo's file stem -> the name Discord sells it under, where stripping the
# numbering and swapping the separators does not get there
RENAME = {
    '5_Fan Fluorish': 'Fan Flourish',
    'wizards_staff': "Wizard's Staff",
    'treasure_and_key': 'Treasure and Key',
}


def title(stem: str) -> str:
    """
    The decoration's name.

    The two repos name their files differently: one prefixes a collection
    number and hyphenates ("10_Black-Hole"), the other is plain snake case
    ("digital_sunrise").
    """
    if stem in RENAME:
        return RENAME[stem]
    if stem[:1].isdigit():
        return stem.split('_', 1)[1].replace('-', ' ')
    return stem.replace('_', ' ').title()


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


def animate(raw: bytes) -> tuple[bytes, int, int]:
    """
    The decoration as animated WebP, walked down the ladder until it fits.

    Returns the encoded bytes, the frame count and the step it settled on.
    """
    for step, quality in LADDER:
        im = Image.open(io.BytesIO(raw))
        frames = []
        for i in range(0, getattr(im, 'n_frames', 1), step):
            im.seek(i)
            frames.append(im.convert('RGBA').resize((SIZE, SIZE), Image.LANCZOS))
        buf = io.BytesIO()
        frames[0].save(
            buf,
            format='WEBP',
            save_all=True,
            append_images=frames[1:],
            # the source art runs at 30fps, so a step of n plays at 30/n
            duration=int(1000 / 30 * step),
            loop=0,
            quality=quality,
            method=6,
            allow_mixed=True,
        )
        data = buf.getvalue()
        if len(data) <= BUDGET or (step, quality) == LADDER[-1]:
            return data, len(frames), step
    raise AssertionError('unreachable')


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    index = []
    total = 0
    for collection, source, stems in COLLECTIONS:
        for stem in stems:
            url = source.format(urllib.parse.quote(stem))
            with urllib.request.urlopen(url, timeout=90) as r:
                raw = r.read()

            data, count, step = animate(raw)
            name = f'{slug(stem)}.webp'
            with open(os.path.join(OUT, name), 'wb') as f:
                f.write(data)

            still = best_frame(Image.open(io.BytesIO(raw))).resize((SIZE, SIZE), Image.LANCZOS)
            still.putalpha(still.getchannel('A').point(lambda a: 255 if a > 96 else 0))
            # RGBA input only accepts the octree quantiser
            still = still.quantize(colors=192, method=Image.FASTOCTREE)
            still_name = f'{slug(stem)}.png'
            still.save(os.path.join(OUT, still_name), optimize=True)

            size = len(data) + os.path.getsize(os.path.join(OUT, still_name))
            total += size
            index.append({
                'id': slug(stem),
                'name': title(stem),
                'collection': collection,
                'file': name,
                'still': still_name,
            })
            print(
                f'{title(stem):22} {collection:16} {len(raw) // 1024:5}KB -> '
                f'{len(data) // 1024:3}KB  {count:2} frames @ 1/{step}'
            )
    print(f'\n{len(index)} decorations, {total // 1024}KB total')
    with open(os.path.join(OUT, 'index.json'), 'w') as f:
        json.dump(index, f, indent=2)


if __name__ == '__main__':
    main()
