"""Reference crop next to its top candidates, upscaled, for a human check."""
import json, sys
from PIL import Image, ImageDraw

SP = '/tmp/claude-0/-home-user-Discord/d79a875f-de4b-540c-a828-cbd4c5853547/scratchpad'
CELL, COLS = 64, 20
atlas = Image.open(f'{SP}/atlas.png').convert('L')
rows = json.load(open(sys.argv[1]))
Z, W = 4, 40
out = Image.new('RGB', (W * Z * 5 + 150, len(rows) * (W * Z + 6)), (20, 20, 24))
d = ImageDraw.Draw(out)
for r, row in enumerate(rows):
    y = r * (W * Z + 6)
    d.text((4, y + 4), row['name'][:18], fill=(200, 200, 210))
    src = Image.open(row['file']).convert('L')
    b = row['box']
    cx, cy = (b[0] + b[2]) // 2, (b[1] + b[3]) // 2
    crop = src.crop((cx - W // 2, cy - W // 2, cx + W // 2, cy + W // 2))
    out.paste(crop.convert('RGB').resize((W * Z, W * Z), Image.NEAREST), (150, y))
    for k, i in enumerate(row['cands'][:4]):
        ax, ay = (i % COLS) * CELL, (i // COLS) * CELL
        c = atlas.crop((ax, ay, ax + CELL, ay + CELL)).resize((W * Z, W * Z), Image.LANCZOS)
        out.paste(c.convert('RGB'), (150 + (k + 1) * W * Z, y))
        d.text((150 + (k + 1) * W * Z + 4, y + 4), f'#{i}', fill=(120, 160, 255))
out.save(sys.argv[2])
print(out.size)
