"""Renders a labelled grid of chosen atlas indices, to confirm a mapping."""
import sys
from PIL import Image, ImageDraw
SP='/tmp/claude-0/-home-user-Discord/d79a875f-de4b-540c-a828-cbd4c5853547/scratchpad'
CELL, COLS = 64, 20
atlas = Image.open(f'{SP}/atlas.png').convert('L')
pairs = [p.split('=') for p in sys.argv[1].split(',')]
PER, Z = 8, 56
rows = (len(pairs) + PER - 1) // PER
out = Image.new('RGB', (PER * (Z + 8), rows * (Z + 22)), (20, 20, 24))
d = ImageDraw.Draw(out)
for k, (name, idxs) in enumerate(pairs):
    x, y = (k % PER) * (Z + 8), (k // PER) * (Z + 22)
    i = int(idxs)
    ax, ay = (i % COLS) * CELL, (i // COLS) * CELL
    out.paste(atlas.crop((ax, ay, ax + CELL, ay + CELL)).resize((Z, Z), Image.LANCZOS).convert('RGB'), (x, y))
    d.text((x + 2, y + Z + 2), f'{name}', fill=(190, 195, 205))
    d.text((x + 2, y + Z + 11), f'#{i}', fill=(110, 150, 250))
out.save(sys.argv[2]); print(out.size)
