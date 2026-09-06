"""
Scores tuning trials against the reference frame.

Three signals per region, because no single one is trustworthy on its own:
  ink   - the bbox of everything above the threshold, which fixes size/position
  hist  - how many pixels sit above 200/225/250, which catches stroke weight
          and colour even when the bbox already matches
  mad   - mean absolute difference over the whole region, the overall verdict
"""
import sys, glob, os
from PIL import Image

REF = Image.open('/root/.claude/uploads/d79a875f-de4b-540c-a828-cbd4c5853547/2d2577ee-image.png').convert('L')

REGIONS = {
  'heading':   ((315, 566, 620, 600), 90),
  'body':      ((313, 602, 580, 632), 60),
  'editbtn':   ((336, 634, 470, 664), 60),
  'glyph':     ((313, 496, 370, 552), 40),
  'chattitle': ((336, 32, 470, 56), 100),
  'srvname':   ((92, 32, 215, 54), 100),
  'titlebar':  ((744, 0, 860, 24), 60),
  'navrows':   ((88, 72, 220, 186), 60),
  'chanrows':  ((88, 200, 220, 330), 60),
  'composer':  ((356, 696, 700, 730), 40),
  'userarea':  ((84, 690, 224, 736), 40),
}

def ink(im, box, thr):
    c = im.crop(box); px = c.load(); W, H = c.size
    xs = [x for x in range(W) if any(px[x, y] > thr for y in range(H))]
    ys = [y for y in range(H) if any(px[x, y] > thr for x in range(W))]
    if not xs: return (0, 0, 0, 0)
    return (xs[0]+box[0], ys[0]+box[1], xs[-1]+box[0]+1, ys[-1]+box[1]+1)

def hist(im, box):
    px = list(im.crop(box).getdata())
    return tuple(sum(1 for v in px if v >= t) for t in (200, 225, 250))

def profile(im, box):
    """Column ink profile, normalised. Letter advances show up as the gaps
    between the humps; unlike a luminance histogram this survives the
    reference having been captured with subpixel antialiasing."""
    c = im.crop(box); px = c.load(); W, H = c.size
    bg = min(px[x, y] for x in range(W) for y in range(H))
    cols = [sum(max(0, px[x, y] - bg) for y in range(H)) for x in range(W)]
    top = max(cols) or 1
    return [v / top for v in cols]

def profdiff(a, b, box):
    pa, pb = profile(a, box), profile(b, box)
    return sum(abs(x - y) for x, y in zip(pa, pb)) / len(pa) * 100

def mad(a, b, box):
    ca, cb = a.crop(box).load(), b.crop(box).load()
    W, H = box[2]-box[0], box[3]-box[1]
    return sum(abs(ca[x, y]-cb[x, y]) for x in range(W) for y in range(H)) / (W*H)

def line(name, im, box, thr):
    i = ink(im, box, thr)
    return f'x{i[0]}-{i[2]}({i[2]-i[0]:3d}) y{i[1]}-{i[3]}({i[3]-i[1]:2d})'

region = sys.argv[1]
box, thr = REGIONS[region]
files = sorted(glob.glob('/tmp/tune/*.png'), key=lambda f: int(os.path.basename(f)[:-4]))
labels = open(sys.argv[2]).read().splitlines() if len(sys.argv) > 2 else []

print(f'{"#":>3} {"label":28} {"ink":30} {"prof":>6} {"mad":>6}')
print(f'{"ref":>3} {"":28} {line(region, REF, box, thr):30}')
for f in files:
    i = int(os.path.basename(f)[:-4])
    im = Image.open(f).convert('L')
    lab = labels[i] if i < len(labels) else ''
    print(f'{i:3d} {lab:28} {line(region, im, box, thr):30} {profdiff(REF, im, box):6.2f} {mad(REF, im, box):6.2f}')
