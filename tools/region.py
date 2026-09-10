#!/usr/bin/env python3
"""
Score one region of a render against the 1:1 capture.

The whole-frame number in tools/capscore.py cannot resolve anything small: the
server rail is 5% of the frame, a caret is five parts in a hundred thousand.
Changing one of those and watching the aggregate tells you nothing, and worse,
it tells you nothing *quietly* — the number moves by less than its own noise
and you read it as confirmation.

    tools/region.py shot.png [region]      one region, or every region

Regions are logical-pixel boxes over docs/refs/febf1f6c.jpg's frame.

Two rules, both learned the hard way:

  Measure one change at a time, from the baseline. Sweeping A with B already
  applied and then B with A already applied measures neither: both of my rail
  sweeps came back "best" on settings that were jointly worse than where they
  started.

  Prefer a region score to a direct pixel reading when the two disagree. The
  rail separator reads as one bright row in the capture and three in ours,
  which says "make it thinner" — and thinner scores 4.830 against 4.056. The
  reading was of a JPEG-softened edge; the region score is of everything.
"""
import sys
import numpy as np
from PIL import Image

REF = np.array(Image.open('docs/refs/febf1f6c.jpg').convert('L')).astype(int)

REGIONS = {
    'rail': (0, 76, 20, 280),
    'sidebar': (76, 375, 20, 882),
    'chat': (375, 1366, 78, 720),
    'composer': (375, 1366, 720, 800),
    'headers': (0, 1366, 0, 78),
    'usercard': (0, 375, 800, 882),
}


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__.strip())
        return 2
    mine = np.array(Image.open(sys.argv[1]).convert('L')).astype(int)
    if mine.shape != REF.shape:
        raise SystemExit(f'{sys.argv[1]} is {mine.shape}, the capture is {REF.shape}')
    want = sys.argv[2:] or list(REGIONS)
    for name in want:
        if name not in REGIONS:
            raise SystemExit(f'unknown region {name!r}; have {", ".join(REGIONS)}')
        x0, x1, y0, y1 = REGIONS[name]
        d = np.abs(REF[y0 * 2:y1 * 2, x0 * 2:x1 * 2] - mine[y0 * 2:y1 * 2, x0 * 2:x1 * 2])
        print(f'{name:10} {d.mean():7.4f}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
