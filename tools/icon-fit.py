"""Reference ink box vs mine, per icon, with the size correction."""
import json, sys
from PIL import Image
REF = Image.open('docs/reference.png').convert('L')
MINE = Image.open(sys.argv[1]).convert('L')
def ink(im, box, thr, bright=True):
    px = im.load()
    hit = (lambda v: v > thr) if bright else (lambda v: v < thr)
    xs = [x for x in range(box[0], box[2]) if any(hit(px[x, y]) for y in range(box[1], box[3]))]
    ys = [y for y in range(box[1], box[3]) if any(hit(px[x, y]) for x in range(box[0], box[2]))]
    return (xs[0], ys[0], xs[-1] + 1, ys[-1] + 1) if xs else None
print(f'{"icon":18} {"reference":24} {"mine":24} {"dx":>3} {"dy":>3} {"scale":>6}')
for t in json.load(open(sys.argv[2])):
    a = ink(REF, t['box'], t.get('thr', 60), t.get('bright', True))
    b = ink(MINE, t['box'], t.get('thr', 60), t.get('bright', True))
    if not a or not b:
        print(f"{t['name']:18} {'MISSING ref' if not a else '':24} {'MISSING mine' if not b else ''}")
        continue
    aw, ah = a[2] - a[0], a[3] - a[1]
    bw, bh = b[2] - b[0], b[3] - b[1]
    fa = f'x{a[0]}-{a[2]}({aw:2d}) y{a[1]}-{a[3]}({ah:2d})'
    fb = f'x{b[0]}-{b[2]}({bw:2d}) y{b[1]}-{b[3]}({bh:2d})'
    sc = max(aw / bw, ah / bh) if bw and bh else 0
    print(f"{t['name']:18} {fa:24} {fb:24} {b[0]-a[0]:3d} {b[1]-a[1]:3d} {sc*100:5.1f}%")
