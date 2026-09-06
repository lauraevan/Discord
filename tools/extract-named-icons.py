"""
Pulls Discord's icons out of the shipped bundle *by name*.

The bundle is a webpack chunk: a flat list of modules, each `123456(e,t,n){…}`.
An icon component lives in its own module and the module names its export up
front — `n.d(t,{A:()=>l})` — while a barrel module re-exports the whole set
under readable names — `GlobeEarthIcon:()=>AF.GlobeEarthIcon` with
`var AF=n(477900)` above it. So the name and the geometry can be joined
through the module graph instead of matched by eye against a contact sheet:

    barrel:  GlobeEarthIcon -> module 477900, export "GlobeEarthIcon"
    477900:  n.d(t,{GlobeEarthIcon:()=>l})  and  viewBox:"0 0 24 24" … d:"M23 12…"

Writes tools/discord-named-icons.json: name -> {size, paths:[[d, evenodd], …]}
"""
import json, re, sys

SRC = sys.argv[1] if len(sys.argv) > 1 else 'current.js'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'tools/discord-named-icons.json'

src = open(SRC, encoding='utf8').read()

# ---------------------------------------------------------------- modules
starts = [(int(m.group(1)), m.end()) for m in re.finditer(r'(?:^|[,{])(\d{1,7})\(e,t,n\)\{', src)]
modules = {}
for i, (mid, at) in enumerate(starts):
    end = starts[i + 1][1] if i + 1 < len(starts) else len(src)
    modules[mid] = src[at:end]
print(f'{len(modules)} modules')

decl = re.compile(r'n\.d\([A-Za-z0-9_$]+,\{(.*?)\}\)', re.S)
entry = re.compile(r'([A-Za-z0-9_$]+):\(\)=>([A-Za-z0-9_$]+)(?:\.([A-Za-z0-9_$]+))?')
require = re.compile(r'(?:var |,)([A-Za-z0-9_$]+)\s*=\s*n\((\d{1,7})\)')
viewbox = re.compile(r'viewBox:"0 0 (\d+) (\d+)"')
pathd = re.compile(r'd:"([^"]{8,})"')
fillrule = re.compile(r'fillRule:"(evenodd|nonzero)"')


def geometry(body):
    """The first 24-grid icon drawn in this module, as a list of paths."""
    vb = viewbox.search(body)
    if not vb:
        return None
    tail = body[vb.end():]
    nxt = viewbox.search(tail)
    if nxt:
        tail = tail[:nxt.start()]
    paths = []
    for pm in pathd.finditer(tail):
        before = tail[max(0, pm.start() - 140): pm.start()]
        rule = fillrule.search(before)
        paths.append([pm.group(1), 1 if rule and rule.group(1) == 'evenodd' else 0])
    if not paths:
        return None
    return {'size': [int(vb.group(1)), int(vb.group(2))], 'paths': paths}


geo = {mid: geometry(body) for mid, body in modules.items()}

icons = {}
unresolved = []

for mid, body in modules.items():
    # A minified module reuses short names across its inner scopes, so a
    # module-wide map of `X = n(id)` picks the wrong binding for a barrel with
    # hundreds of entries. Webpack emits the requires as one var chain right
    # after the n.d call, so resolve each name to its first binding past that
    # point instead.
    bindings = {}
    for m in require.finditer(body):
        bindings.setdefault(m.group(1), []).append((m.start(), int(m.group(2))))

    def resolve(local, after):
        for at, target in bindings.get(local, ()):
            if at > after:
                return target
        return bindings.get(local, [(0, None)])[-1][1]

    for d in decl.finditer(body):
        for name, local, prop in entry.findall(d.group(1)):
            if not name.endswith('Icon'):
                continue
            if prop:                       # a barrel: local is a required module
                target = resolve(local, d.end())
                g = geo.get(target) if target else None
            else:                          # defined right here
                g = geo.get(mid)
            if g:
                icons.setdefault(name, g)
            else:
                unresolved.append(name)

json.dump(icons, open(OUT, 'w'), separators=(',', ':'), sort_keys=True)
print(f'{len(icons)} named icons written to {OUT} ({len(unresolved)} names had no geometry)')
