"""
Reports the exact font-size correction for every text element in the frame.

Font metrics are linear in size, so ref_width / mine_width times the current
size lands on the reference in one step. Two passes converge to the pixel.
Run: node tools/ref.mjs <out> popout && python3 tools/fit.py <out>
"""
import sys
from PIL import Image

REF = Image.open('docs/reference.png').convert('L')
MINE = Image.open(sys.argv[1]).convert('L')

# label: (box, threshold, bright-on-dark?, current css px)
ITEMS = {
  'titlebar name':  ((744, 2, 856, 22), 90, True, 11.5),
  'srv name':       ((92, 32, 215, 54), 100, True, 13.4),
  'nav Events':     ((92, 76, 215, 98), 60, True, 13.3),
  'nav Browse':     ((92, 104, 215, 126), 55, True, 13.3),
  'nav Members':    ((92, 132, 215, 154), 60, True, 13.3),
  'nav Boosts':     ((92, 160, 215, 182), 60, True, 13.3),
  'row ok-ui-test': ((92, 206, 215, 230), 80, True, 13.3),
  'cat Text Chan':  ((70, 246, 205, 264), 60, True, 11.0),
  'row general':    ((92, 268, 215, 292), 60, True, 13.3),
  'chat title':     ((334, 32, 470, 56), 95, True, 15.0),
  'search box':     ((1360, 32, 1530, 56), 55, True, 13.0),
  'intro heading':  ((315, 566, 620, 602), 90, True, 26.8),
  'intro body':     ((313, 602, 600, 632), 60, True, 13.8),
  'edit btn text':  ((340, 636, 440, 662), 90, True, 11.7),
  'composer ph':    ((360, 700, 560, 728), 45, True, 14.0),
  'user name':      ((88, 696, 200, 714), 90, True, 13.5),
  'user handle':    ((88, 714, 200, 732), 45, True, 10.5),
  'p name':         ((14, 452, 240, 472), 150, False, 16.4),
  'p handle':       ((14, 472, 250, 489), 185, False, 12.5),
  'p bio':          ((14, 508, 250, 534), 175, False, 11.0),
  'p row label':    ((52, 540, 200, 578), 150, False, 12.05),
  'chip wow':       ((96, 415, 140, 435), 150, False, 11.5),
}


def ink(im, box, thr, bright):
    px = im.load()
    hit = (lambda v: v > thr) if bright else (lambda v: v < thr)
    xs = [x for x in range(box[0], box[2]) if any(hit(px[x, y]) for y in range(box[1], box[3]))]
    ys = [y for y in range(box[1], box[3]) if any(hit(px[x, y]) for x in range(box[0], box[2]))]
    return (xs[0], ys[0], xs[-1] + 1, ys[-1] + 1) if xs else None


print(f'{"element":16} {"reference":22} {"mine":22} {"dx":>3} {"dy":>3} {"w%":>6} {"size":>6} {"→":>6}')
for label, (box, thr, bright, size) in ITEMS.items():
    a, b = ink(REF, box, thr, bright), ink(MINE, box, thr, bright)
    if not a or not b:
        print(f'{label:16} {"MISSING ref" if not a else "":22} {"MISSING mine" if not b else "":22}')
        continue
    aw, bw = a[2] - a[0], b[2] - b[0]
    fa = f'x{a[0]}-{a[2]}({aw:3d}) y{a[1]}({a[3]-a[1]:2d})'
    fb = f'x{b[0]}-{b[2]}({bw:3d}) y{b[1]}({b[3]-b[1]:2d})'
    print(f'{label:16} {fa:22} {fb:22} {b[0]-a[0]:3d} {b[1]-a[1]:3d} '
          f'{aw/bw*100:5.1f}% {size:6.2f} {size*aw/bw:6.2f}')
