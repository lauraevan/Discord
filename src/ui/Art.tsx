/**
 * Hand-drawn SVG artwork — Discord-flavoured, drawn from primitives.
 * No traced screenshots, no stand-in people.
 */

let seq = 0
const gid = () => `a${++seq}`

/** Discord's default avatar: the Clyde mark on a flat colour. */
export function DefaultAvatar({ color = '#5865f2' }: { color?: string }) {
  return (
    <svg viewBox="0 0 48 48" className="art" aria-hidden="true">
      <rect width="48" height="48" fill={color} />
      <g transform="translate(9.6 9.6) scale(1.2)">
        <path
          fill="#fff"
          d="M20.32 4.57A17.6 17.6 0 0 0 15.94 3.2a.07.07 0 0 0-.07.03c-.19.34-.4.78-.55 1.13a16.3 16.3 0 0 0-4.66 0A10.9 10.9 0 0 0 10.1 3.2a.07.07 0 0 0-.07-.03c-1.5.26-2.95.72-4.38 1.37a.06.06 0 0 0-.03.02C2.83 8.72 2.09 12.75 2.45 16.73c0 .02.02.04.04.05a17.7 17.7 0 0 0 5.36 2.7.07.07 0 0 0 .08-.02c.41-.56.78-1.16 1.1-1.78a.07.07 0 0 0-.04-.1c-.58-.22-1.14-.49-1.68-.8a.07.07 0 0 1 0-.11l.33-.26a.07.07 0 0 1 .07 0 12.6 12.6 0 0 0 10.7 0 .07.07 0 0 1 .07 0l.34.26a.07.07 0 0 1 0 .12c-.54.3-1.1.57-1.69.79a.07.07 0 0 0-.04.1c.33.62.7 1.22 1.1 1.78a.07.07 0 0 0 .08.03 17.6 17.6 0 0 0 5.37-2.71.07.07 0 0 0 .03-.05c.43-4.6-.72-8.6-3.06-12.14a.05.05 0 0 0-.03-.02ZM8.75 14.31c-1.05 0-1.92-.97-1.92-2.16 0-1.18.85-2.15 1.92-2.15 1.08 0 1.94.98 1.93 2.15 0 1.19-.86 2.16-1.93 2.16Zm7.12 0c-1.06 0-1.93-.97-1.93-2.16 0-1.18.85-2.15 1.93-2.15 1.07 0 1.94.98 1.92 2.15 0 1.19-.85 2.16-1.92 2.16Z"
        />
      </g>
    </svg>
  )
}

/**
 * Profile banner artwork: a soft 3-D scene of rounded arches and orbs, in the
 * lilac / powder-blue palette Discord uses for its own profile art.
 */
export function ProfileBanner() {
  const id = gid()
  return (
    <svg viewBox="0 0 240 100" className="art" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={id + 'sky'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8fb4dd" />
          <stop offset="0.55" stopColor="#b9cfe6" />
          <stop offset="1" stopColor="#dfe6f2" />
        </linearGradient>
        <linearGradient id={id + 'arch'} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f2eefb" />
          <stop offset="1" stopColor="#c6b8ea" />
        </linearGradient>
        <linearGradient id={id + 'orb'} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#efe9fb" />
          <stop offset="1" stopColor="#a893dd" />
        </linearGradient>
      </defs>
      <rect width="240" height="100" fill={`url(#${id}sky)`} />

      {/* rolling ground */}
      <path d="M0 74c40-12 70 6 116-2s84-18 124-6v34H0Z" fill="#eef1f8" />
      <path d="M0 84c46-10 78 4 122-2s78-12 118-4v22H0Z" fill="#dfe4f0" opacity=".9" />

      {/* arches */}
      <g fill={`url(#${id}arch)`}>
        <path d="M96 78V46a13 13 0 0 1 26 0v32h-9V47a4 4 0 0 0-8 0v31Z" />
        <path d="M132 78V52a11 11 0 0 1 22 0v26h-8V53a3 3 0 0 0-6 0v25Z" />
        <path d="M162 78V57a9 9 0 0 1 18 0v21h-7V58a2 2 0 0 0-4 0v20Z" />
      </g>
      {/* candy stripes on the arches */}
      <g stroke="#b9a6e4" strokeWidth="2" opacity=".65">
        <path d="M98 60h22M98 68h22M134 62h18M134 70h18M164 66h14M164 73h14" />
      </g>

      {/* orbs */}
      <circle cx="52" cy="58" r="19" fill={`url(#${id}orb)`} />
      <circle cx="46" cy="52" r="6" fill="#fff" opacity=".55" />
      <circle cx="200" cy="52" r="11" fill={`url(#${id}orb)`} />
      <circle cx="215" cy="66" r="6" fill="#cfc0ee" />
      <circle cx="24" cy="40" r="7" fill="#fdfcff" opacity=".8" />

      {/* sparkles */}
      <g fill="#fff">
        <path d="m78 26 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" />
        <path d="m186 22 1.4 3.6L191 27l-3.6 1.4L186 32l-1.4-3.6L181 27l3.6-1.4Z" />
      </g>
    </svg>
  )
}

/** Empty-state artwork used where a channel has no messages yet. */
/**
 * The empty-state mascot.
 *
 * Discord's Wumpus is its own artwork, so this is an original drawing in the
 * same spirit — a rounded, legless creature with a pale body — rather than a
 * copy of theirs.
 */
/**
 * The empty-state character.
 *
 * Discord's friends screens are illustrated with Wumpus and Discord's own copy
 * on those screens names him, so this is the real thing rather than a drawing
 * of one: tools/fetch-wumpus.py vendors his art from taiten312/wumpus, which
 * carries it committed to a public repo — Discord's own CDN is unreachable
 * from this page. One pose per empty state, matched to the line under it.
 */
const wumpus = import.meta.glob('../assets/wumpus/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

export type WumpusPose = 'shrug' | 'waiting' | 'idle' | 'lurking'

export function WumpusMark({ pose = 'shrug' }: { pose?: WumpusPose }) {
  const src = wumpus[`../assets/wumpus/${pose}.png`]
  if (!src) return null
  return <img className="wumpus" src={src} alt="" draggable={false} aria-hidden="true" />
}
