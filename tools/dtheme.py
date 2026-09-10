#!/usr/bin/env python3
"""
Resolve Discord's theme tokens to the colours the client actually paints.

Discord's stylesheet defines every theme colour twice over: a primitive ramp
(`--neutral-69`, `--blue-new-27`, `--primary-530`) declared as `hsl()` on
`:root`, and a semantic layer (`--background-base-lower`, `--border-subtle`)
declared per theme as

    color-mix(in oklab, var(--neutral-69) 100%, var(--custom-theme-base-color, #000) 0%)

The second colour's share defaults to 0%, so with no custom server theme applied
the semantic token *is* the primitive. This resolves that chain and prints the
hex, so src/themes.ts can carry Discord's numbers rather than eyeballed ones.

    tools/dtheme.py                     the tokens src/themes.ts needs, all themes
    tools/dtheme.py <token> [...]       resolve named tokens in all four themes

Discord's four themes are theme-dark, theme-light, theme-midnight and
theme-darker. `:root` carries decoy definitions (literal `hotpink`) ahead of the
real ramp, so the *last* definition in document order wins, as it does in the
browser.
"""
import colorsys
import gzip
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PATH = os.path.join(ROOT, 'docs', 'sources', 'discord-css.css.gz')
THEMES = ['theme-dark', 'theme-light', 'theme-midnight', 'theme-darker']

# what src/themes.ts is built out of, and the Discord token each maps to
WANTED = [
    ('app frame', 'background-base-lowest'),
    ('rail', 'background-base-lower'),
    ('sidebar', 'background-base-low'),
    ('chat', 'background-base-low'),
    ('card / menu', 'background-surface-high'),
    ('surface higher', 'background-surface-higher'),
    ('surface highest', 'background-surface-highest'),
    ('border', 'border-subtle'),
    ('border strong', 'border-strong'),
    ('text', 'text-default'),
    ('muted', 'text-muted'),
    ('interactive', 'interactive-text-default'),
    ('link', 'text-link'),
    ('accent', 'background-accent'),
]


def blocks() -> list[tuple[str, str]]:
    with gzip.open(PATH, 'rt', encoding='utf-8') as fh:
        text = fh.read()
    text = re.sub(r'/\*.*?\*/', '', text, flags=re.S)
    return [(m.group(1).strip(), m.group(2)) for m in re.finditer(r'([^{}]+)\{([^{}]*)\}', text)]


def collect() -> tuple[dict[str, str], dict[str, dict[str, str]]]:
    """`:root` primitives (last wins) and each theme's semantic tokens."""
    root: dict[str, str] = {}
    themed: dict[str, dict[str, str]] = {t: {} for t in THEMES}
    for sel, body in blocks():
        decls = re.findall(r'--([a-z0-9-]+)\s*:\s*([^;]+)', body)
        if not decls:
            continue
        if re.fullmatch(r':root', sel):
            for k, v in decls:
                root[k] = v.strip()
        for t in THEMES:
            if re.fullmatch(rf'(?::root)?\.{t}', sel):
                for k, v in decls:
                    themed[t][k] = v.strip()
    return root, themed


def hsl_hex(h: float, s: float, li: float, a: float = 1.0) -> str:
    r, g, b = colorsys.hls_to_rgb(h / 360.0, li / 100.0, s / 100.0)
    out = '#%02x%02x%02x' % (round(r * 255), round(g * 255), round(b * 255))
    return out if a >= 0.999 else out + '%02x' % round(a * 255)


def resolve(value: str, root: dict[str, str], depth: int = 0) -> str | None:
    """Reduce one token's value to a hex string, or None if it isn't a colour."""
    if depth > 8:
        return None
    v = value.strip()

    # color-mix(in oklab, A 100%, B <amount>) — the amount defaults to 0%, so A wins
    m = re.match(r'color-mix\(\s*in \w+\s*,\s*(.+)$', v)
    if m:
        return resolve(split_top(m.group(1))[0].rsplit(' ', 1)[0], root, depth + 1)

    # hsl(var(--x-hsl) / a) or hsl(H S% L% / a)
    m = re.match(r'hsla?\(\s*(.+?)\s*\)\s*$', v)
    if m:
        inner = m.group(1)
        alpha = 1.0
        if '/' in inner:
            inner, a = inner.rsplit('/', 1)
            alpha = float(a.strip().rstrip('%')) / (100 if '%' in a else 1)
        inner = inner.strip()
        ref = re.match(r'var\(\s*--([a-z0-9-]+)', inner)
        if ref:
            inner = root.get(ref.group(1), '')
            if not inner:
                return None
        # strip the saturation-factor wrapper Discord multiplies saturation by
        inner = re.sub(r'calc\(\s*var\(--saturation-factor,\s*1\)\s*\*\s*([\d.]+)%\s*\)', r'\1%', inner)
        parts = [p for p in re.split(r'[\s,]+', inner.strip()) if p]
        if len(parts) < 3:
            return None
        try:
            h, s, li = (float(p.rstrip('%')) for p in parts[:3])
        except ValueError:
            return None
        return hsl_hex(h, s, li, alpha)

    m = re.match(r'var\(\s*--([a-z0-9-]+)', v)
    if m:
        nxt = root.get(m.group(1))
        return resolve(nxt, root, depth + 1) if nxt else None

    if re.fullmatch(r'#[0-9a-f]{3,8}', v, re.I):
        if len(v) == 4:
            v = '#' + ''.join(c * 2 for c in v[1:])
        return v.lower()
    return None


def split_top(s: str) -> list[str]:
    """Split on commas that aren't inside parentheses."""
    out, depth, cur = [], 0, ''
    for ch in s:
        if ch == '(':
            depth += 1
        elif ch == ')':
            if depth == 0:
                break
            depth -= 1
        if ch == ',' and depth == 0:
            out.append(cur)
            cur = ''
        else:
            cur += ch
    out.append(cur)
    return [p.strip() for p in out]


def main() -> int:
    root, themed = collect()
    if len(sys.argv) > 1:
        rows = [(t, t) for t in sys.argv[1:]]
    else:
        rows = WANTED
    width = max(len(a) for a, _ in rows)
    print(f'{"":{width}}  {"token":34}  ' + '  '.join(f'{t.replace("theme-", ""):>9}' for t in THEMES))
    for label, token in rows:
        cells = []
        for t in THEMES:
            raw = themed[t].get(token)
            cells.append(resolve(raw, root) or '-' if raw else '-')
        print(f'{label:{width}}  --{token:32}  ' + '  '.join(f'{c:>9}' for c in cells))
    return 0


if __name__ == '__main__':
    sys.exit(main())
