#!/usr/bin/env python3
"""
Query Discord's own stylesheet.

`docs/sources/discord-css.css.gz` is every CSS chunk Discord's canary client
ships, concatenated — 8.9 MB, ~8,100 class names — mirrored from
Wumpus-Central/discrapper-canary (`css/*.css`), which splits the webpack build
back into chunks. Discord builds with CSS modules and keeps the source class
name in front of the hash, so `.messageContent__abc12` is still legible. That
makes this the ground truth for every measurement in src/styles.css: instead of
reading a pixel off a screenshot, look up what Discord actually wrote.

    tools/dcss.py rule <name>      every rule whose selector matches <name>
    tools/dcss.py grep <regex>     every rule whose text matches <regex>
    tools/dcss.py names <regex>    just the class names matching <regex>
    tools/dcss.py var <name>       every definition of a custom property

Names match case-insensitively on the part before the `__hash`, so
`rule messageContent` finds `.messageContent__1a2b3`.
"""
import gzip
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PATH = os.path.join(ROOT, 'docs', 'sources', 'discord-css.css.gz')


def rules() -> list[tuple[str, str]]:
    """Every (selector, body) pair, at-rule prelude folded into the selector."""
    with gzip.open(PATH, 'rt', encoding='utf-8') as fh:
        text = fh.read()
    text = re.sub(r'/\*.*?\*/', '', text, flags=re.S)
    out = []
    for m in re.finditer(r'([^{}]+)\{([^{}]*)\}', text):
        sel, body = m.group(1).strip(), m.group(2).strip()
        if sel and body:
            out.append((re.sub(r'\s+', ' ', sel), body))
    return out


def show(pairs) -> int:
    for sel, body in pairs:
        decls = '; '.join(d.strip() for d in body.split(';') if d.strip())
        print(f'{sel} {{ {decls} }}')
    print(f'-- {len(pairs)} rule(s)', file=sys.stderr)
    return 0 if pairs else 1


def main() -> int:
    if len(sys.argv) < 3:
        print(__doc__.strip())
        return 2
    cmd, arg = sys.argv[1], sys.argv[2]
    rs = rules()

    if cmd == 'rule':
        pat = re.compile(rf'\.{re.escape(arg)}(?:__[0-9a-f]+)?\b', re.I)
        return show([(s, b) for s, b in rs if pat.search(s)])

    if cmd == 'grep':
        pat = re.compile(arg, re.I)
        return show([(s, b) for s, b in rs if pat.search(s) or pat.search(b)])

    if cmd == 'names':
        pat = re.compile(arg, re.I)
        seen = set()
        for sel, _ in rs:
            for cls in re.findall(r'\.([A-Za-z][\w-]*?)(?:__[0-9a-f]+)?(?=[\s.,:>~\[)]|$)', sel):
                if pat.search(cls):
                    seen.add(cls)
        for n in sorted(seen):
            print(n)
        print(f'-- {len(seen)} name(s)', file=sys.stderr)
        return 0 if seen else 1

    if cmd == 'var':
        name = arg if arg.startswith('--') else '--' + arg
        pat = re.compile(rf'{re.escape(name)}\s*:', re.I)
        hits = []
        for sel, body in rs:
            for decl in body.split(';'):
                if pat.match(decl.strip()):
                    hits.append((sel, decl.strip()))
        for sel, decl in hits:
            print(f'{sel}  ->  {decl}')
        print(f'-- {len(hits)} definition(s)', file=sys.stderr)
        return 0 if hits else 1

    print(f'unknown command {cmd!r}', file=sys.stderr)
    return 2


if __name__ == '__main__':
    sys.exit(main())
