"""
Vendors a real animated-GIF library for the expression picker.

Discord's GIF tab is a Tenor search. Tenor's API needs a key this build does
not have and its media host is denied here outright, so that route is closed —
but Google's Noto Animated Emoji are real animated GIFs, served from
fonts.gstatic.com, which is reachable, and licensed CC BY 4.0. They are also
exactly the kind of thing people react with, which is what the tab is for.

Each one arrives as a 512px GIF of up to fifty frames — a megabyte apiece — so
it is re-encoded to an animated WebP small enough for a single-file build: the
ladder drops resolution, frames and quality in that order until it fits the
budget, the same way tools/fetch-decorations.py does.

    python3 tools/fetch-gifs.py
"""
import io
import os
import urllib.request

from PIL import Image, ImageSequence

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'src/assets/gifs')
TS = os.path.join(ROOT, 'src/gifs.ts')

NOTO = 'https://fonts.gstatic.com/s/e/notoemoji/latest'
BUDGET = 24 * 1024
# (longest edge, most frames, quality) — tried in order until one fits
LADDER = [(96, 14, 55), (96, 12, 50), (88, 12, 48), (80, 10, 45), (72, 8, 42)]

# category -> [(codepoint, name, tags)]
LIBRARY: dict[str, list[tuple[str, str, str]]] = {
    'Reactions': [
        ('1f602', 'Tears of Joy', 'lol laugh funny cry'),
        ('1f923', 'Rolling on the Floor', 'rofl lol laugh dying'),
        ('1f44d', 'Thumbs Up', 'yes ok good agree'),
        ('1f44e', 'Thumbs Down', 'no bad disagree'),
        ('1f440', 'Eyes', 'look watching sus'),
        ('1f914', 'Thinking', 'hmm think consider'),
        ('1f644', 'Rolling Eyes', 'ugh whatever annoyed'),
        ('1f612', 'Unamused', 'meh bored done'),
        ('1f92f', 'Mind Blown', 'wow shocked exploding'),
        ('1f480', 'Skull', 'dead dying lol'),
    ],
    'Love': [
        ('1f60d', 'Heart Eyes', 'love adore crush'),
        ('2764_fe0f', 'Red Heart', 'love heart'),
        ('1f496', 'Sparkling Heart', 'love cute sparkle'),
        ('1f494', 'Broken Heart', 'sad heartbreak'),
        ('1f97a', 'Pleading', 'please cute puppy eyes'),
        ('1f63b', 'Heart Eyes Cat', 'love cat'),
    ],
    'Celebrate': [
        ('1f389', 'Party Popper', 'party celebrate congrats'),
        ('1f973', 'Partying Face', 'party celebrate birthday'),
        ('1f44f', 'Clap', 'applause well done'),
        ('1f4af', 'Hundred', '100 perfect score'),
        ('2728', 'Sparkles', 'shiny magic clean'),
        ('1f680', 'Rocket', 'launch fast ship it'),
    ],
    'Feelings': [
        ('1f62d', 'Sobbing', 'cry sad tears'),
        ('1f621', 'Rage', 'angry mad furious'),
        ('1f631', 'Screaming', 'shock horror scared'),
        ('1f634', 'Sleeping', 'tired sleep zzz'),
        ('1f971', 'Yawning', 'tired bored sleepy'),
        ('1f64f', 'Folded Hands', 'please thanks pray'),
    ],
    'Mood': [
        ('1f60e', 'Sunglasses', 'cool deal with it'),
        ('1f60f', 'Smirk', 'smug sly'),
        ('1f525', 'Fire', 'lit hot flame'),
        ('26a1', 'High Voltage', 'fast lightning zap'),
        ('1f608', 'Smiling Imp', 'evil devil mischief'),
        ('1f47b', 'Ghost', 'boo spooky'),
    ],
    'Things': [
        ('1f916', 'Robot', 'bot beep boop'),
        ('1f9e0', 'Brain', 'smart think galaxy'),
        ('1f984', 'Unicorn', 'magic rare'),
        ('1f355', 'Pizza', 'food hungry'),
        ('1f382', 'Birthday Cake', 'birthday cake party'),
        ('1f9cb', 'Bubble Tea', 'boba drink'),
    ],
}


def get(url: str) -> bytes | None:
    try:
        with urllib.request.urlopen(url, timeout=90) as r:
            return r.read()
    except Exception:
        return None


def encode(raw: bytes, path: str) -> tuple[int, int, int]:
    """Re-encodes a GIF as an animated WebP that fits the budget."""
    im = Image.open(io.BytesIO(raw))
    total = getattr(im, 'n_frames', 1)
    duration = im.info.get('duration', 60) or 60
    best = None
    for size, most, quality in LADDER:
        step = max(1, round(total / most))
        frames = [
            f.convert('RGBA').resize((size, size), Image.LANCZOS)
            for i, f in enumerate(ImageSequence.Iterator(im))
            if i % step == 0
        ]
        frames[0].save(
            path,
            save_all=True,
            append_images=frames[1:],
            duration=duration * step,
            loop=0,
            quality=quality,
            method=6,
        )
        best = (os.path.getsize(path), size, len(frames))
        if best[0] <= BUDGET:
            break
    assert best is not None
    return best


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    rows: list[tuple[str, str, str, str]] = []
    total = 0
    missing: list[str] = []
    for category, entries in LIBRARY.items():
        for code, name, tags in entries:
            raw = get(f'{NOTO}/{code}/512.gif')
            if raw is None:
                missing.append(name)
                continue
            path = os.path.join(OUT, f'{code}.webp')
            size, edge, frames = encode(raw, path)
            total += size
            rows.append((code, name, tags, category))
            print(
                f'{name:22} {category:11} {len(raw) // 1024:5}KB -> {size // 1024:3}KB'
                f'  {edge}px {frames}f'
            )

    if missing:
        print(f'\nno animation published for: {", ".join(missing)}')

    lines = [
        '/**',
        ' * The GIF library behind the picker.',
        ' *',
        " * Discord's GIF tab is a Tenor search: its API needs a key this build has no",
        ' * way to hold and its media host is denied here, so that is closed. These are',
        " * Google's Noto Animated Emoji instead — real animated GIFs, served from",
        ' * fonts.gstatic.com, licensed CC BY 4.0, and exactly the kind of thing people',
        ' * react with. Generated by tools/fetch-gifs.py — edit that, not this.',
        ' */',
        '',
        "const art = import.meta.glob('./assets/gifs/*.webp', {",
        '  eager: true,',
        "  query: '?url',",
        "  import: 'default',",
        '}) as Record<string, string>',
        '',
        'export type LibraryGif = {',
        '  id: string',
        '  name: string',
        '  /** what a search over the library matches on */',
        '  tags: string',
        '  category: string',
        '}',
        '',
        'export const GIF_CATEGORIES = [',
    ]
    for category in LIBRARY:
        if any(r[3] == category for r in rows):
            lines.append(f"  '{category}',")
    lines += [
        ']',
        '',
        'export const GIFS: LibraryGif[] = [',
    ]
    for code, name, tags, category in rows:
        lines.append(
            f"  {{ id: '{code}', name: {name!r}, tags: {tags!r}, category: '{category}' }},"
        )
    lines += [
        ']',
        '',
        '/** The animation for a library GIF, as a URL. */',
        'export const gifArt = (id: string) => art[`./assets/gifs/${id}.webp`]',
        '',
    ]
    open(TS, 'w').write('\n'.join(lines).replace("'", "'"))
    print(f'\n{len(rows)} gifs, {total // 1024}KB total -> {TS}')


if __name__ == '__main__':
    main()
