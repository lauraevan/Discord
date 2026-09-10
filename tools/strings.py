#!/usr/bin/env python3
"""
Query Discord's own string table.

`docs/sources/discord-strings.json` is Discord's shipped client string table,
mirrored from Wumpus-Central/discrapper-canary (`data/strings.json`), which
scrapes the canary webpack bundle. The keys are Discord's opaque hashes; the
values are the exact English text the client renders. It is the reference for
every label in this app — if Discord words something a particular way, it is
in here verbatim.

    tools/strings.py find <regex>       every string matching the pattern
    tools/strings.py has <literal> ...  whether each literal exists verbatim
    tools/strings.py near <literal>     strings sharing words with the literal

`has` is the one that matters — but read the asymmetry carefully. A hit proves
the string is Discord's, verbatim. A miss proves nothing: the table is what the
scraper found in the chunks it had, not Discord's whole en-US catalogue, and
plainly real labels ("My Account", "Password and Authentication") are simply
absent from it. So use a hit to confirm, and use `near` to see whether Discord
words the same idea differently — never treat MISSING as a defect to fix.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PATH = os.path.join(ROOT, 'docs', 'sources', 'discord-strings.json')


def load() -> dict[str, str]:
    with open(PATH, encoding='utf-8') as fh:
        raw = json.load(fh)
    return {k: v for k, v in raw.items() if isinstance(v, str)}


def main() -> int:
    if len(sys.argv) < 3:
        print(__doc__.strip())
        return 2
    cmd, args = sys.argv[1], sys.argv[2:]
    table = load()

    if cmd == 'find':
        pat = re.compile(args[0], re.I)
        seen = sorted({v for v in table.values() if pat.search(v)})
        for v in seen:
            print(v)
        print(f'-- {len(seen)} match(es) of {len(table)}', file=sys.stderr)
        return 0 if seen else 1

    if cmd == 'has':
        values = set(table.values())
        missing = 0
        for lit in args:
            ok = lit in values
            missing += not ok
            print(('  ok  ' if ok else 'MISSING') + '  ' + repr(lit))
        return 1 if missing else 0

    if cmd == 'near':
        words = [w for w in re.findall(r'[A-Za-z]{4,}', args[0])]
        if not words:
            return 1
        scored = []
        for v in set(table.values()):
            hit = sum(1 for w in words if re.search(rf'\b{re.escape(w)}\b', v, re.I))
            if hit:
                scored.append((hit / len(words), -len(v), v))
        for score, _, v in sorted(scored, reverse=True)[:25]:
            print(f'{score:.2f}  {v}')
        return 0

    print(f'unknown command {cmd!r}', file=sys.stderr)
    return 2


if __name__ == '__main__':
    sys.exit(main())
