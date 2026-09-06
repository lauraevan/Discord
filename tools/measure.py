"""
Measures every text and icon element in the reference frame and in a rendered
frame, and prints the exact correction needed. Width ratio gives the font size
directly, which is more reliable than minimising a region's difference.
"""
import sys
from PIL import Image

REF = Image.open('/root/.claude/uploads/d79a875f-de4b-540c-a828-cbd4c5853547/2d2577ee-image.png').convert('L')
MINE = Image.open(sys.argv[1]).convert('L')

# label: (box, threshold, current css size or None)
ITEMS = {
  'titlebar name':  ((748, 2, 850, 22), 90, 11.5),
  'srv name':       ((92, 32, 215, 54), 100, 13.4),
  'nav Events':     ((92, 76, 215, 98), 60, 13.3),
  'nav Browse':     ((92, 104, 215, 126), 60, 13.3),
  'nav Members':    ((92, 132, 215, 154), 60, 13.3),
  'nav Boosts':     ((92, 160, 215, 182), 60, 13.3),
  'row ok-ui-test': ((92, 206, 215, 230), 80, 13.3),
  'cat Text Chan':  ((70, 246, 200, 264), 60, 11),
  'row general':    ((92, 268, 215, 290), 60, 13.3),
  'cat Voice Chan': ((70, 305, 200, 324), 60, 11),
  'chat title':     ((336, 32, 470, 56), 100, 15),
  'intro heading':  ((315, 568, 620, 600), 90, 26.5),
  'intro body':     ((313, 602, 580, 632), 60, 14),
  'edit btn text':  ((340, 636, 440, 662), 90, 13),
  'composer ph':    ((360, 700, 560, 728), 45, 14),
}

def ink(im, box, thr):
    c = im.crop(box); px = c.load(); W, H = c.size
    xs = [x for x in range(W) if any(px[x, y] > thr for y in range(H))]
    ys = [y for y in range(H) if any(px[x, y] > thr for x in range(W))]
    if not xs: return None
    return (xs[0]+box[0], ys[0]+box[1], xs[-1]+box[0]+1, ys[-1]+box[1]+1)

def peak(im, box, n=25):
    c = im.crop(box); px = c.load()
    ps = sorted((px[x, y] for x in range(c.width) for y in range(c.height)), reverse=True)[:n]
    return round(sum(ps)/n)

print(f'{"element":16} {"reference":26} {"mine":26} {"dx":>3} {"dy":>3} {"w%":>6} {"size→":>7} {"bright":>12}')
for label, (box, thr, size) in ITEMS.items():
    a = ink(REF, box, thr); b = ink(MINE, box, thr)
    if not a or not b:
        print(f'{label:16} {"MISSING" if not a else "":26} {"MISSING" if not b else "":26}')
        continue
    aw, ah = a[2]-a[0], a[3]-a[1]
    bw, bh = b[2]-b[0], b[3]-b[1]
    ratio = aw/bw
    new = f'{size*ratio:.2f}' if size else '-'
    fa = f'x{a[0]}-{a[2]}({aw:3d}) y{a[1]}-{a[3]}({ah:2d})'
    fb = f'x{b[0]}-{b[2]}({bw:3d}) y{b[1]}-{b[3]}({bh:2d})'
    print(f'{label:16} {fa:26} {fb:26} {b[0]-a[0]:3d} {b[1]-a[1]:3d} {ratio*100:5.1f}% {new:>7}   {peak(REF,box):3d}/{peak(MINE,box):3d}')
