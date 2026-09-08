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

/**
 * The hero.
 *
 * Discord's redesigned Nitro surface is dark and spacey rather than a bright
 * wash: a deep blurple two-tone with a moody teal on the other side, stars
 * through it. The colours are the client's own — NITRO_BLUE, the TIER_2
 * purple and pink, and the teal ramp — and nothing here is a character or a
 * logo, only the chrome the copy sits on.
 */
export function NitroHeroArt() {
  // a fixed star field: seeded so it never reshuffles between renders
  let seed = 7
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648)
  const stars = Array.from({ length: 90 }, () => ({
    x: rand() * 900,
    y: rand() * 340,
    r: 0.5 + rand() * 1.3,
    o: 0.15 + rand() * 0.55,
  }))
  return (
    <svg
      className="nitro-hero-art"
      viewBox="0 0 900 340"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="nh-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#191748" />
          <stop offset="0.55" stopColor="#0e0d2a" />
          <stop offset="1" stopColor="#07131c" />
        </linearGradient>
        <radialGradient id="nh-blurple" cx="0.24" cy="0.18" r="0.62">
          <stop offset="0" stopColor="#3736bb" stopOpacity="0.85" />
          <stop offset="1" stopColor="#3736bb" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="nh-teal" cx="0.86" cy="0.86" r="0.6">
          <stop offset="0" stopColor="#35bcd5" stopOpacity="0.42" />
          <stop offset="1" stopColor="#35bcd5" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="nh-planet" cx="0.34" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#b473f5" />
          <stop offset="0.6" stopColor="#5b3bd6" />
          <stop offset="1" stopColor="#1414cb" />
        </radialGradient>
        <linearGradient id="nh-ring" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#47cbe2" stopOpacity="0.1" />
          <stop offset="0.5" stopColor="#e292aa" stopOpacity="0.65" />
          <stop offset="1" stopColor="#47cbe2" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      <rect width="900" height="340" fill="url(#nh-bg)" />
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={s.o} />
      ))}
      <rect width="900" height="340" fill="url(#nh-blurple)" />
      <rect width="900" height="340" fill="url(#nh-teal)" />

      {/* a ringed body, half out of frame on the right */}
      <g transform="translate(742 176)">
        <ellipse
          rx="182"
          ry="30"
          fill="none"
          stroke="url(#nh-ring)"
          strokeWidth="10"
          transform="rotate(-18)"
        />
        <circle r="104" fill="url(#nh-planet)" />
        <circle r="104" fill="none" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="1.5" />
        <ellipse
          rx="182"
          ry="30"
          fill="none"
          stroke="url(#nh-ring)"
          strokeWidth="10"
          transform="rotate(-18)"
          clipPath="url(#nh-front)"
          opacity="0.7"
        />
      </g>
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
