/**
 * Key art for a quest.
 *
 * Discord's quest cards are posters: the game's own key art fills the card and
 * the copy sits over it. That art is served from Discord's CDN, which this page
 * cannot reach, so each quest gets a composed poster instead — built from the
 * two brand colours the quest config actually carries, plus a motif drawn for
 * that activity. It is not Discord's artwork and does not pretend to be, but it
 * gives the cards the weight the real ones have rather than leaving them as
 * flat swatches.
 */

type Motif =
  | 'watch'
  | 'sketch'
  | 'chess'
  | 'meme'
  | 'poker'
  | 'orb'

export const QUEST_MOTIF: Record<string, Motif> = {
  'q-watch-together': 'watch',
  'q-sketch-heads': 'sketch',
  'q-chess': 'chess',
  'q-know-what-i-meme': 'meme',
  'q-stream-poker': 'poker',
  'q-quests-intro': 'orb',
}

function Motifs({ motif, id }: { motif: Motif; id: string }) {
  const ink = `url(#${id}-ink)`
  switch (motif) {
    case 'watch':
      return (
        <g>
          {/* a screen throwing light, with a play head */}
          <g opacity="0.22">
            <path d="M50 92 L18 8 h124 Z" fill="#fff" />
          </g>
          <rect x="52" y="30" width="96" height="60" rx="8" fill="rgba(0,0,0,.28)" />
          <rect x="52" y="30" width="96" height="60" rx="8" fill="none" stroke={ink} strokeWidth="3" />
          <path d="M90 46 l24 14 -24 14 Z" fill={ink} />
          <rect x="86" y="96" width="28" height="4" rx="2" fill={ink} opacity=".8" />
          <rect x="70" y="104" width="60" height="4" rx="2" fill={ink} opacity=".5" />
        </g>
      )
    case 'sketch':
      return (
        <g>
          <path
            d="M24 104 C40 56 74 26 128 22 c22-2 34 10 30 26 -4 18-26 26-46 22"
            fill="none"
            stroke={ink}
            strokeWidth="12"
            strokeLinecap="round"
            opacity=".9"
          />
          <path
            d="M40 112 C56 74 84 48 124 44"
            fill="none"
            stroke="rgba(255,255,255,.35)"
            strokeWidth="5"
            strokeLinecap="round"
          />
          {[
            [150, 74, 9],
            [166, 96, 6],
            [138, 100, 5],
          ].map(([cx, cy, r], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill={ink} opacity=".75" />
          ))}
        </g>
      )
    case 'chess':
      return (
        <g>
          {/* a board falling away, and a pawn standing on it */}
          <g opacity=".35">
            {Array.from({ length: 8 }, (_, r) =>
              Array.from({ length: 8 }, (_, c) =>
                (r + c) % 2 === 0 ? (
                  <rect
                    key={`${r}-${c}`}
                    x={16 + c * 20 + r * 2}
                    y={78 + r * 7}
                    width={20 - r}
                    height={7}
                    fill="#fff"
                  />
                ) : null,
              ),
            )}
          </g>
          <path
            d="M100 26 a11 11 0 0 1 11 11 c0 5-3 8-6 10 4 4 7 11 8 21 h-26 c1-10 4-17 8-21 -3-2-6-5-6-10 A11 11 0 0 1 100 26Z"
            fill={ink}
          />
          <rect x="82" y="70" width="36" height="8" rx="4" fill={ink} />
        </g>
      )
    case 'meme':
      return (
        <g>
          <g opacity=".28">
            {Array.from({ length: 7 }, (_, r) =>
              Array.from({ length: 11 }, (_, c) => (
                <circle key={`${r}-${c}`} cx={12 + c * 16} cy={14 + r * 16} r={2.6 + (r % 3)} fill="#fff" />
              )),
            )}
          </g>
          <path
            d="M44 26 h112 a14 14 0 0 1 14 14 v40 a14 14 0 0 1-14 14 h-58 l-26 22 4-22 h-32 a14 14 0 0 1-14-14 v-40 A14 14 0 0 1 44 26Z"
            fill={ink}
          />
          <rect x="60" y="46" width="80" height="8" rx="4" fill="rgba(0,0,0,.35)" />
          <rect x="60" y="62" width="52" height="8" rx="4" fill="rgba(0,0,0,.22)" />
        </g>
      )
    case 'poker':
      return (
        <g>
          {/* two cards fanned, a spade on the front one */}
          <g transform="rotate(-14 74 70)">
            <rect x="34" y="30" width="60" height="82" rx="8" fill="rgba(255,255,255,.28)" />
          </g>
          <g transform="rotate(6 96 70)">
            <rect x="70" y="26" width="62" height="86" rx="8" fill={ink} />
            <path
              d="M101 44 c8 10 18 16 18 26 a10 10 0 0 1-18 6 c1 6 3 10 6 13 h-12 c3-3 5-7 6-13 a10 10 0 0 1-18-6 c0-10 10-16 18-26Z"
              fill="rgba(0,0,0,.45)"
            />
          </g>
          <circle cx="152" cy="96" r="18" fill="rgba(0,0,0,.3)" />
          <circle cx="152" cy="96" r="18" fill="none" stroke={ink} strokeWidth="5" strokeDasharray="7 6" />
        </g>
      )
    default:
      return (
        <g>
          <g opacity=".3">
            <circle cx="100" cy="66" r="58" fill="none" stroke="#fff" strokeWidth="2" />
            <circle cx="100" cy="66" r="44" fill="none" stroke="#fff" strokeWidth="2" />
          </g>
          {/* the Orb: a faceted diamond, as the currency mark reads */}
          <path d="M100 24 L134 66 L100 108 L66 66 Z" fill={ink} />
          <path d="M100 24 L134 66 L100 66 Z" fill="rgba(255,255,255,.35)" />
          <path d="M100 108 L66 66 L100 66 Z" fill="rgba(0,0,0,.2)" />
        </g>
      )
  }
}

export function QuestKeyArt({
  id,
  colors,
  title,
  publisher,
  className,
  wide = false,
}: {
  id: string
  colors: { primary: string; secondary: string }
  title: string
  publisher?: string
  className?: string
  /**
   * The featured card is much wider than a poster, so the motif moves to the
   * right of the frame and the scrim runs left-to-right to carry the copy —
   * stretching the poster composition across it turns the motif into a slab.
   */
  wide?: boolean
}) {
  const uid = `qa-${id}${wide ? '-w' : ''}`
  const motif = QUEST_MOTIF[id] ?? 'orb'
  if (wide)
    return (
      <svg className={className} viewBox="0 0 480 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={colors.primary} />
            <stop offset="1" stopColor={colors.secondary} />
          </linearGradient>
          <radialGradient id={`${uid}-glow`} cx="0.74" cy="0.2" r="0.62">
            <stop offset="0" stopColor="#fff" stopOpacity="0.4" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${uid}-ink`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
            <stop offset="1" stopColor="#fff" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id={`${uid}-scrim`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#000" stopOpacity="0.72" />
            <stop offset="0.52" stopColor="#000" stopOpacity="0.34" />
            <stop offset="1" stopColor="#000" stopOpacity="0.06" />
          </linearGradient>
        </defs>
        <rect width="480" height="220" fill={`url(#${uid}-bg)`} />
        <rect width="480" height="220" fill={`url(#${uid}-glow)`} />
        <g transform="translate(268 26) scale(1.18)">
          <Motifs motif={motif} id={uid} />
        </g>
        <rect width="480" height="220" fill={`url(#${uid}-scrim)`} />
      </svg>
    )
  return (
    <svg className={className} viewBox="0 0 200 132" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={colors.primary} />
          <stop offset="1" stopColor={colors.secondary} />
        </linearGradient>
        <radialGradient id={`${uid}-glow`} cx="0.24" cy="0.16" r="0.8">
          <stop offset="0" stopColor="#fff" stopOpacity="0.42" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}-ink`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id={`${uid}-scrim`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.35" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.62" />
        </linearGradient>
      </defs>
      <rect width="200" height="132" fill={`url(#${uid}-bg)`} />
      <rect width="200" height="132" fill={`url(#${uid}-glow)`} />
      <Motifs motif={motif} id={uid} />
      <rect width="200" height="132" fill={`url(#${uid}-scrim)`} />
      <text x="12" y="116" fill="#fff" fontSize="15" fontWeight="800" letterSpacing="-0.2">
        {title}
      </text>
      {publisher ? (
        <text x="12" y="127" fill="#fff" fontSize="8" fontWeight="600" opacity=".72">
          {publisher.toUpperCase()}
        </text>
      ) : null}
    </svg>
  )
}
