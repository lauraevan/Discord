/**
 * The illustrations on the new-server checklist.
 *
 * Discord draws these as small pixel-art sprites, so these are drawn the same
 * way — a character grid and a palette, one <rect> per lit cell — rather than
 * as smooth vector shapes that would read as the wrong idiom at 17px. They are
 * hand-drawn from the reference, not copied out of it.
 */
import type { SVGProps } from 'react'

type Art = { rows: string[]; palette: Record<string, string> }

function draw({ rows, palette }: Art, p: SVGProps<SVGSVGElement> & { size?: number }) {
  const { size = 17, ...rest } = p
  const cells: React.ReactElement[] = []
  let x0 = Infinity
  let y0 = Infinity
  let x1 = 0
  let y1 = 0
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      const fill = palette[ch]
      if (!fill) return
      cells.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />)
      x0 = Math.min(x0, x)
      y0 = Math.min(y0, y)
      x1 = Math.max(x1, x + 1)
      y1 = Math.max(y1, y + 1)
    }),
  )
  // fit the box to the art's own bounds, so a grid with slack around it still
  // renders at the size asked for rather than shrinking inside its padding
  const w = x1 - x0
  const h = y1 - y0
  const span = Math.max(w, h)
  return (
    <svg
      width={(size * w) / span}
      height={(size * h) / span}
      viewBox={`${x0} ${y0} ${w} ${h}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      {...rest}
    >
      {cells}
    </svg>
  )
}

const sprite = (art: Art) =>
  function Sprite(p: SVGProps<SVGSVGElement> & { size?: number }) {
    return draw(art, p)
  }

/** Invite your friends: a mailbox with the flag up and post behind. */
export const MailboxArt = sprite({
  rows: [
    '.........rr.....',
    '.........rr.....',
    '...pppp..rr.....',
    '..pPPPPp.rr.....',
    '.pPPPPPPpppp....',
    '.pPwwwwwwwwp....',
    '.pPwWWWWWWwp....',
    '.pPwWWWWWWwp....',
    '.pPwwwwwwwwp....',
    '.pppppppppp.....',
    '.....dd.........',
    '.....dd.........',
    '.....dd.........',
    '....dddd........',
  ],
  palette: { p: '#5b3fd0', P: '#a78bfa', r: '#e5484d', w: '#98a2b3', W: '#f4f6fb', d: '#7a6a58' },
})

/** Personalize your server: a paint bucket under a roller. */
export const PaintArt = sprite({
  rows: [
    '..gggggggggg....',
    '.gwwwwwwwwwwg...',
    '.gwwwwwwwwwwg...',
    '..gggggggggg....',
    '......nn........',
    '......nn........',
    '..oooooooooo....',
    '..oOOOOOOOOo....',
    '...oOOOOOOo.....',
    '....oOOOOo......',
    '.....oOOo.......',
    '.....oOOo.......',
    '.....oooo.......',
  ],
  palette: { g: '#3f9e56', w: '#e9edf3', n: '#9aa4b2', o: '#b8480f', O: '#f6893b' },
})

/** Send your first message: a paper dart. */
export const DartArt = sprite({
  rows: [
    '..............LL',
    '...........LLLLL',
    '.........LLLLLLL',
    '.......LLLLLLLL.',
    '.....LLLLLLLLL..',
    '...lLLLLLLLLL...',
    '..llLLLLLLLL....',
    '.lllLLLLLLL.....',
    '.llllLLLLL......',
    '..lllLLLL.......',
    '...llLLL........',
    '....lLL.........',
    '.....L..........',
  ],
  palette: { l: '#c2cad6', L: '#6b7382' },
})

/** Download the Discord App: a green arrow. */
export const ArrowDownArt = sprite({
  rows: [
    '.....gggggg.....',
    '.....gGGGGg.....',
    '.....gGGGGg.....',
    '.....gGGGGg.....',
    '..ggggGGGGgggg..',
    '..gGGGGGGGGGGg..',
    '...gGGGGGGGGg...',
    '....gGGGGGGg....',
    '.....gGGGGg.....',
    '......gGGg......',
    '.......gg.......',
  ],
  palette: { g: '#2f8b4c', G: '#6ee08a' },
})

/** Add your first app: a game controller. */
export const ControllerArt = sprite({
  rows: [
    '..cccccccccccc..',
    '.cCCCCCCCCCCCCc.',
    'cCCdCCCCCCCCyCCc',
    'cCddddCCCCyCyCCc',
    'cCCdCCCCCCCCyCCc',
    'cCCCCCCCCCCCCCCc',
    'cCCCcccccccCCCCc',
    '.ccc.......cccc.',
  ],
  palette: { c: '#3a41b8', C: '#98a0f5', d: '#23276b', y: '#f2c14e' },
})

/** Unlock perks with Boosts: the boost gem. */
export const GemArt = sprite({
  rows: [
    '.....mmmm.......',
    '....mMMMMm......',
    '...mMwwMMMm.....',
    '..mMMwwMMMMm....',
    '..mMMMMMMMMm....',
    '..mMMMMMMMMm....',
    '..mMMMMMMMMm....',
    '...mMMMMMMm.....',
    '...mMMMMMMm.....',
    '....mMMMMm......',
    '....mMMMMm......',
    '.....mMMm.......',
    '......mm........',
  ],
  palette: { m: '#a8248f', M: '#f47fe0', w: '#ffd6f5' },
})
