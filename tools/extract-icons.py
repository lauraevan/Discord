"""
Pulls Discord's own icon geometry out of its shipped client bundle.

Every icon in the app was hand-drawn from a screenshot before this, which is
guesswork at 15px. The bundle has the real paths: each icon is a minified
component whose <svg viewBox="0 0 24 24"> is followed by its <path d="...">.
This walks those, keeps the fill rule, and writes them out as JSON for the
contact sheet to render.
"""
import json
import re
import sys

src = open(sys.argv[1], encoding='utf8', errors='replace').read()

# each icon starts at its viewBox and ends where the next component begins
starts = [m.start() for m in re.finditer(r'viewBox:"0 0 24 24"', src)]
bounds = [m.start() for m in re.finditer(r'\bfunction [A-Za-z_$][\w$]*\(', src)]

PATH = re.compile(r'\{([^{}]*?)d:"(M[^"]{20,})"([^{}]*?)\}')

icons = []
for i, s in enumerate(starts):
    # stop at the next function definition after this viewBox
    # bound only at the next icon: some components nest a helper function
    # between the viewBox and the paths, which the earlier bound cut off
    nxt = starts[i + 1] if i + 1 < len(starts) else min(s + 6000, len(src))
    chunk = src[s:nxt]
    paths = []
    for m in PATH.finditer(chunk):
        attrs = m.group(1) + m.group(3)
        paths.append({
            'd': m.group(2),
            'evenodd': 'evenodd' in attrs,
        })
    if paths:
        icons.append({'i': len(icons), 'paths': paths})

# drop exact duplicates, keeping the first
seen = set()
out = []
for ic in icons:
    key = tuple(p['d'] for p in ic['paths'])
    if key in seen:
        continue
    seen.add(key)
    ic['i'] = len(out)
    out.append(ic)

json.dump(out, open(sys.argv[2], 'w'))
print(f'{len(starts)} viewBoxes -> {len(icons)} with paths -> {len(out)} unique')
