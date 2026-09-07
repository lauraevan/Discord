import { NITRO_COLORS } from '../nitro'

/**
 * Artwork for the Nitro tab.
 *
 * Discord's Nitro tab is art-led: a full-bleed hero across the top and large
 * illustrated cards under it. That artwork is rendered and served from
 * Discord's CDN, which this page cannot reach and should not pass off as its
 * own, so the hero and the perk cards are composed here — from the exact
 * gradient stops in the client's own colour table, with a drawn scene per
 * perk. It is not Discord's illustration; it is built so the page has the
 * weight the real one has instead of a grid of small tiles.
 */

/** The five header gradient stops, as one wash. */
export const NITRO_WASH = `linear-gradient(115deg, ${NITRO_COLORS.header.join(', ')})`

export function NitroHeroArt() {
  return (
    <svg className="nitro-hero-art" viewBox="0 0 900 340" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="nh-bg" x1="0" y1="0" x2="1" y2="1">
          {NITRO_COLORS.header.map((c, i) => (
            <stop key={c} offset={i / (NITRO_COLORS.header.length - 1)} stopColor={c} />
          ))}
        </linearGradient>
        <radialGradient id="nh-glow" cx="0.72" cy="0.3" r="0.6">
          <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="nh-scrim" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#12061e" stopOpacity="0.62" />
          <stop offset="0.55" stopColor="#12061e" stopOpacity="0.24" />
          <stop offset="1" stopColor="#12061e" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="nh-face" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <rect width="900" height="340" fill="url(#nh-bg)" />
      <rect width="900" height="340" fill="url(#nh-glow)" />

      {/* drifting orbs, largest to smallest, echoing the Nitro wash */}
      {[
        [706, 108, 96, 0.24],
        [812, 232, 58, 0.2],
        [612, 250, 40, 0.16],
        [852, 74, 28, 0.28],
        [560, 92, 22, 0.18],
      ].map(([cx, cy, r, o], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="#fff" opacity={o} />
      ))}

      {/* the Nitro wheel, oversized and half out of frame */}
      <g transform="translate(700 170) scale(6.2) translate(-12 -12)" opacity="0.9">
        <path
          fill="url(#nh-face)"
          d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 3.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13Z"
        />
        <circle cx="12" cy="12" r="3.1" fill="#fff" opacity="0.95" />
      </g>

      <rect width="900" height="340" fill="url(#nh-scrim)" />
    </svg>
  )
}

export function NitroWordmark() {
  return (
    <div className="nitro-wordmark">
      <span className="nitro-wordmark-small">World of</span>
      <span className="nitro-wordmark-big">NITRO</span>
    </div>
  )
}

/* ------------------------------------------------------------- perk scenes */

type Scene = (id: string) => React.ReactNode

const scenes: Record<string, { colors: [string, string]; label?: string; draw: Scene }> = {
  /** A file leaving the composer, far bigger than the free cap. */
  upload: {
    colors: [NITRO_COLORS.tier2Purple, NITRO_COLORS.tier2PurpleGradient],
    label: '500MB',
    draw: (id) => (
      <g>
        <rect x="46" y="86" width="188" height="58" rx="12" fill="rgba(0,0,0,.26)" />
        <rect x="60" y="104" width="120" height="8" rx="4" fill={`url(#${id}-ink)`} opacity=".5" />
        <rect x="60" y="120" width="72" height="8" rx="4" fill={`url(#${id}-ink)`} opacity=".3" />
        <g transform="translate(150 18)">
          <rect x="0" y="0" width="92" height="112" rx="10" fill={`url(#${id}-ink)`} />
          <path d="M62 0 v22 a8 8 0 0 0 8 8 h22Z" fill="rgba(0,0,0,.22)" />
          <path d="M46 78 V44 m0 0-13 13 m13-13 13 13" stroke="rgba(0,0,0,.45)" strokeWidth="7" strokeLinecap="round" fill="none" />
        </g>
      </g>
    ),
    },
  /** Emoji spilling out of one server into another. */
  emoji: {
    colors: [NITRO_COLORS.tier2Pink, NITRO_COLORS.tier2PinkGradient],
    draw: (id) => (
      <g>
        {[
          [64, 96, 30],
          [126, 62, 22],
          [128, 132, 20],
          [188, 96, 26],
          [232, 52, 16],
          [238, 140, 18],
        ].map(([cx, cy, r], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-ink)`} />
            <circle cx={cx - r * 0.32} cy={cy - r * 0.18} r={r * 0.13} fill="rgba(0,0,0,.55)" />
            <circle cx={cx + r * 0.32} cy={cy - r * 0.18} r={r * 0.13} fill="rgba(0,0,0,.55)" />
            <path
              d={`M${cx - r * 0.42} ${cy + r * 0.2} a${r * 0.45} ${r * 0.45} 0 0 0 ${r * 0.84} 0`}
              stroke="rgba(0,0,0,.55)"
              strokeWidth={r * 0.14}
              fill="none"
              strokeLinecap="round"
            />
          </g>
        ))}
      </g>
    ),
  },
  /** A stream tile at high resolution. */
  video: {
    colors: [NITRO_COLORS.tier1Blue, NITRO_COLORS.tier1DarkBlueGradient],
    label: '4K 60FPS',
    draw: (id) => (
      <g>
        <rect x="34" y="34" width="212" height="124" rx="12" fill="rgba(0,0,0,.3)" />
        <rect x="34" y="34" width="212" height="124" rx="12" fill="none" stroke={`url(#${id}-ink)`} strokeWidth="4" />
        <path d="M120 74 l46 26 -46 26Z" fill={`url(#${id}-ink)`} />
        <rect x="34" y="128" width="212" height="30" rx="0" fill="rgba(0,0,0,.28)" />
        <rect x="48" y="140" width="120" height="6" rx="3" fill={`url(#${id}-ink)`} opacity=".8" />
      </g>
    ),
  },
  /** A profile card with a banner and a decoration. */
  profile: {
    colors: [NITRO_COLORS.tier1Purple, NITRO_COLORS.tier1BlueGradient],
    draw: (id) => (
      <g>
        <rect x="70" y="26" width="140" height="140" rx="14" fill="rgba(0,0,0,.26)" />
        <path d="M70 40a14 14 0 0 1 14-14h112a14 14 0 0 1 14 14v34H70Z" fill={`url(#${id}-ink)`} opacity=".55" />
        <circle cx="108" cy="80" r="26" fill={`url(#${id}-ink)`} />
        <circle cx="108" cy="80" r="33" fill="none" stroke="#fff" strokeWidth="4" opacity=".8" />
        <rect x="84" y="120" width="80" height="9" rx="4.5" fill={`url(#${id}-ink)`} opacity=".85" />
        <rect x="84" y="136" width="52" height="7" rx="3.5" fill={`url(#${id}-ink)`} opacity=".5" />
      </g>
    ),
  },
  /** Two boosts on a server bar. */
  boost: {
    colors: [NITRO_COLORS.tier2PinkGradient2, NITRO_COLORS.tier2PurpleGradient],
    label: 'LEVEL 2',
    draw: (id) => (
      <g>
        {[92, 188].map((cx, i) => (
          <g key={i} transform={`translate(${cx} 96)`}>
            <path d="M0-46 34-14 0 46-34-14Z" fill={`url(#${id}-ink)`} />
            <path d="M0-46 34-14 0-14Z" fill="rgba(255,255,255,.4)" />
            <path d="M0 46-34-14 0-14Z" fill="rgba(0,0,0,.18)" />
          </g>
        ))}
      </g>
    ),
  },
  /** A message that keeps going past the free limit. */
  message: {
    colors: [NITRO_COLORS.tier0Purple, NITRO_COLORS.tier0BlueGradient2],
    label: '4,000',
    draw: (id) => (
      <g>
        <rect x="34" y="40" width="212" height="112" rx="12" fill="rgba(0,0,0,.26)" />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect
            key={i}
            x="50"
            y={58 + i * 19}
            width={i === 4 ? 96 : 180 - (i % 2) * 26}
            height="9"
            rx="4.5"
            fill={`url(#${id}-ink)`}
            opacity={i === 4 ? 0.4 : 0.8 - i * 0.09}
          />
        ))}
      </g>
    ),
  },
}

/**
 * A perk card's scene.
 *
 * The bento gives the first two cards a much wider frame, so `wide` draws the
 * same scene into a 480x208 box with the shapes centred in it rather than
 * cropping a 280x192 composition until its label is off the top.
 */
export function PerkArt({ kind, wide = false }: { kind: string; wide?: boolean }) {
  const scene = scenes[kind] ?? scenes.upload
  const id = `pa-${kind}${wide ? '-w' : ''}`
  const w = wide ? 480 : 280
  const h = wide ? 208 : 192
  return (
    <svg
      className="nitro-perk-art"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={scene.colors[0]} />
          <stop offset="1" stopColor={scene.colors[1]} />
        </linearGradient>
        <linearGradient id={`${id}-ink`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.72" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.3" cy="0.2" r="0.8">
          <stop offset="0" stopColor="#fff" stopOpacity="0.3" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={w} height={h} fill={`url(#${id}-bg)`} />
      <rect width={w} height={h} fill={`url(#${id}-glow)`} />
      <g transform={wide ? 'translate(100 8)' : undefined}>{scene.draw(id)}</g>
      {scene.label ? (
        <text
          x={wide ? 30 : 18}
          y={wide ? 52 : h - 16}
          fill="#fff"
          fontSize={wide ? 34 : 24}
          fontWeight="800"
          opacity="0.94"
        >
          {scene.label}
        </text>
      ) : null}
    </svg>
  )
}
