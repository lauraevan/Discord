/**
 * Avatar decorations.
 *
 * Discord's collectibles are PNG and APNG frames served from its CDN, which
 * this page cannot reach — and the GitHub mirror that carried them was taken
 * down by Discord, so copying that set is not on the table either. These are
 * drawn here, sized the way Discord's are: the decoration is 1.2x the avatar's
 * box, centred on it, and never intercepts a click.
 *
 * They are built with the depth the real ones have — a gradient body, a lit
 * edge, a dropped shadow for separation on a light avatar, and per-element
 * variation around the ring so nothing reads as a repeated stamp.
 */

export type DecorationDef = {
  id: string
  name: string
  collection: string
  orbs: number
  /** body gradient: light, mid, deep */
  colors: [string, string, string]
  kind: 'halo' | 'sparks' | 'flames' | 'ivy' | 'crown' | 'circuit'
}

export const DECORATIONS: DecorationDef[] = [
  { id: 'halo', name: 'Halo', collection: 'Classics', orbs: 900, colors: ['#fff2c4', '#ffd76a', '#e08a2c'], kind: 'halo' },
  { id: 'sparks', name: 'Sparks', collection: 'Classics', orbs: 1200, colors: ['#f6e6ff', '#c9a0ff', '#7b46c9'], kind: 'sparks' },
  { id: 'crown', name: 'Crown', collection: 'Classics', orbs: 1800, colors: ['#fff0c0', '#ffcf5e', '#c98a1c'], kind: 'crown' },
  { id: 'ember', name: 'Ember', collection: 'Elements', orbs: 1500, colors: ['#ffe9a8', '#ff9d3d', '#d1402a'], kind: 'flames' },
  { id: 'ivy', name: 'Ivy', collection: 'Elements', orbs: 1200, colors: ['#c7f0b4', '#5cb85c', '#245f36'], kind: 'ivy' },
  { id: 'circuit', name: 'Circuit', collection: 'Neon', orbs: 1500, colors: ['#c9fff4', '#22d3c5', '#0b7fa8'], kind: 'circuit' },
]

const byId = Object.fromEntries(DECORATIONS.map((d) => [d.id, d]))

/** Evenly spaced angles, in degrees, starting from the top. */
const ring = (n: number, from = -90, sweep = 360) =>
  Array.from({ length: n }, (_, i) => from + (sweep * i) / n)

const at = (deg: number, r: number, cx = 50, cy = 50) => {
  const a = (deg * Math.PI) / 180
  return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as const
}

export function Decoration({ id, size = 40 }: { id: string; size?: number }) {
  const d = byId[id]
  if (!d) return null
  const g = `dec-${d.id}`
  const [light, mid, deep] = d.colors

  return (
    <svg
      className="decoration"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${g}-body`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor={light} />
          <stop offset="0.45" stopColor={mid} />
          <stop offset="1" stopColor={deep} />
        </linearGradient>
        <linearGradient id={`${g}-edge`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.15" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <filter id={`${g}-drop`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1.4" stdDeviation="1.6" floodColor="#000" floodOpacity="0.35" />
        </filter>
      </defs>

      <g filter={`url(#${g}-drop)`}>
        {d.kind === 'halo' ? (
          <>
            {/* a ring around the avatar, and a tilted halo floating above it */}
            <circle cx="50" cy="50" r="43" fill="none" stroke={`url(#${g}-body)`} strokeWidth="5.5" />
            <circle cx="50" cy="50" r="45.6" fill="none" stroke={`url(#${g}-edge)`} strokeWidth="1.1" />
            <ellipse cx="50" cy="11" rx="21" ry="6.4" fill="none" stroke={`url(#${g}-body)`} strokeWidth="4.6" />
            <path d="M33 9a21 6.4 0 0 1 34 0" fill="none" stroke="#fff" strokeOpacity="0.75" strokeWidth="1.6" strokeLinecap="round" />
          </>
        ) : d.kind === 'sparks' ? (
          <>
            <circle cx="50" cy="50" r="43.5" fill="none" stroke={`url(#${g}-body)`} strokeWidth="2.6" opacity="0.9" />
            {ring(9).map((deg, i) => {
              const [x, y] = at(deg, 44)
              const s = [1, 0.62, 0.86, 0.5, 1.05, 0.7, 0.92, 0.56, 0.78][i]
              return (
                <g key={deg} transform={`translate(${x} ${y}) rotate(${deg + 90}) scale(${s})`}>
                  {/* a four-point star with a long axis, not a diamond */}
                  <path
                    d="M0-8.5C1 -3 3 -1 8.5 0 3 1 1 3 0 8.5 -1 3 -3 1 -8.5 0 -3-1 -1-3 0-8.5Z"
                    fill={`url(#${g}-body)`}
                  />
                  <path d="M0-8.5C1-3 3-1 8.5 0 3 0 1-2 0-6Z" fill="#fff" fillOpacity="0.6" />
                </g>
              )
            })}
          </>
        ) : d.kind === 'flames' ? (
          <>
            {ring(11).map((deg, i) => {
              const [x, y] = at(deg, 45)
              const s = [1.15, 0.8, 1, 0.68, 1.1, 0.85, 1.2, 0.72, 1.02, 0.9, 1.08][i]
              return (
                <g key={deg} transform={`translate(${x} ${y}) rotate(${deg + 90}) scale(${s})`}>
                  <path
                    d="M0-11C4.6-5.4 6-2.4 6 1.2A6 6 0 0 1 0 7.6 6 6 0 0 1-6 1.2C-6-2.4-4.6-5.4 0-11Z"
                    fill={`url(#${g}-body)`}
                  />
                  <path d="M0-5.6c2.2 2.8 2.8 4.4 2.8 6A2.9 2.9 0 0 1 0 4.8 2.9 2.9 0 0 1-2.8 0.4C-2.8-1.2-2.2-2.8 0-5.6Z" fill="#fff" fillOpacity="0.55" />
                </g>
              )
            })}
          </>
        ) : d.kind === 'ivy' ? (
          <>
            <circle cx="50" cy="50" r="44" fill="none" stroke={deep} strokeWidth="3.4" opacity="0.9" />
            {ring(14).map((deg, i) => {
              const [x, y] = at(deg, 44.5)
              const s = [1, 0.76, 0.94, 0.68, 1.06, 0.82, 0.9, 1.02, 0.72, 0.96, 0.84, 1.08, 0.78, 0.92][i]
              return (
                <g key={deg} transform={`translate(${x} ${y}) rotate(${deg + 24}) scale(${s})`}>
                  {/* a leaf with a midrib, not an ellipse */}
                  <path d="M0 0C4.4-5.2 10-6.4 12.4-4 14.8-1.6 13.2 4 8 8.4 4 11.6 0.8 8.4 0 0Z" fill={`url(#${g}-body)`} />
                  <path d="M0.6 0.6C4.4-2.2 8-3.6 11-3.4" stroke="#fff" strokeOpacity="0.5" strokeWidth="0.9" fill="none" />
                </g>
              )
            })}
          </>
        ) : d.kind === 'crown' ? (
          <>
            <circle cx="50" cy="50" r="43" fill="none" stroke={`url(#${g}-body)`} strokeWidth="3.2" opacity="0.85" />
            <path
              d="M20 24 L31 7 L41.5 18.5 L50 1 L58.5 18.5 L69 7 L80 24 L75.5 32 L24.5 32 Z"
              fill={`url(#${g}-body)`}
            />
            <path d="M20 24 L31 7 L41.5 18.5 L50 1 L58.5 18.5 L69 7 L80 24Z" fill={`url(#${g}-edge)`} />
            <rect x="22" y="32.5" width="56" height="6.4" rx="3.2" fill={`url(#${g}-body)`} />
            {[31, 50, 69].map((cx, i) => (
              <circle key={cx} cx={cx} cy={i === 1 ? 4 : 9} r={i === 1 ? 3.2 : 2.4} fill="#fff" fillOpacity="0.85" />
            ))}
          </>
        ) : (
          <>
            <circle cx="50" cy="50" r="44" fill="none" stroke={deep} strokeWidth="4.6" opacity="0.55" />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke={`url(#${g}-body)`}
              strokeWidth="3"
              strokeDasharray="17 9"
              strokeLinecap="round"
            />
            {ring(4, -45).map((deg) => {
              const [x, y] = at(deg, 44)
              return (
                <g key={deg} transform={`translate(${x} ${y}) rotate(${deg + 90})`}>
                  <circle r="6.4" fill={deep} />
                  <circle r="6.4" fill="none" stroke={`url(#${g}-body)`} strokeWidth="1.6" />
                  <path d="M-2.4-4.4 L2.6-0.6 H0.2 L2.4 4.4 L-2.6 0.4 H-0.2Z" fill="#fff" fillOpacity="0.9" />
                </g>
              )
            })}
          </>
        )}
      </g>
    </svg>
  )
}
