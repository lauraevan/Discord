/**
 * Avatar decorations.
 *
 * Discord's collectibles are PNG and APNG frames served from its CDN, which
 * this page cannot reach — and passing off a copy of Discord's artwork as part
 * of a recreation would be worse than drawing something honest. So these are
 * drawn here, as SVG rings sized to sit exactly on the avatar the way
 * Discord's do: the decoration is 1.2x the avatar's box, centred, and never
 * intercepts a click.
 */

export type DecorationDef = {
  id: string
  name: string
  collection: string
  orbs: number
  /** the two colours the ring is drawn from */
  colors: [string, string]
  kind: 'ring' | 'sparks' | 'flames' | 'leaves' | 'crown' | 'bolts'
}

export const DECORATIONS: DecorationDef[] = [
  { id: 'halo', name: 'Halo', collection: 'Classics', orbs: 900, colors: ['#ffd76a', '#ff9d3d'], kind: 'ring' },
  { id: 'sparks', name: 'Sparks', collection: 'Classics', orbs: 1200, colors: ['#b473f5', '#e292aa'], kind: 'sparks' },
  { id: 'crown', name: 'Crown', collection: 'Classics', orbs: 1800, colors: ['#ffd76a', '#e0a33a'], kind: 'crown' },
  { id: 'ember', name: 'Ember', collection: 'Elements', orbs: 1500, colors: ['#ff7043', '#ffca28'], kind: 'flames' },
  { id: 'ivy', name: 'Ivy', collection: 'Elements', orbs: 1200, colors: ['#5cb85c', '#2f8f4e'], kind: 'leaves' },
  { id: 'circuit', name: 'Circuit', collection: 'Neon', orbs: 1500, colors: ['#00d3a7', '#00a8fc'], kind: 'bolts' },
]

const byId = Object.fromEntries(DECORATIONS.map((d) => [d.id, d]))

/** Points evenly around a circle, for the repeating ornaments. */
const around = (n: number, r: number, cx = 50, cy = 50) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as const
  })

export function Decoration({ id, size = 40 }: { id: string; size?: number }) {
  const d = byId[id]
  if (!d) return null
  const gid = `dec-${d.id}`
  const [a, b] = d.colors
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
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      {d.kind === 'ring' ? (
        <>
          <circle cx="50" cy="50" r="44" fill="none" stroke={`url(#${gid})`} strokeWidth="5" />
          <ellipse cx="50" cy="14" rx="20" ry="6" fill="none" stroke={`url(#${gid})`} strokeWidth="4" />
        </>
      ) : d.kind === 'sparks' ? (
        <>
          <circle cx="50" cy="50" r="44" fill="none" stroke={`url(#${gid})`} strokeWidth="3" opacity=".8" />
          {around(8, 44).map(([x, y], i) => (
            <path
              key={i}
              d={`M${x} ${y - 6} L${x + 2.4} ${y - 2.4} L${x + 6} ${y} L${x + 2.4} ${y + 2.4} L${x} ${y + 6} L${x - 2.4} ${y + 2.4} L${x - 6} ${y} L${x - 2.4} ${y - 2.4} Z`}
              fill={`url(#${gid})`}
            />
          ))}
        </>
      ) : d.kind === 'flames' ? (
        <>
          {around(10, 45).map(([x, y], i) => (
            <path
              key={i}
              d={`M${x} ${y - 8} C${x + 5} ${y - 2} ${x + 4} ${y + 3} ${x} ${y + 7} C${x - 4} ${y + 3} ${x - 5} ${y - 2} ${x} ${y - 8} Z`}
              fill={`url(#${gid})`}
              opacity={i % 2 ? 0.65 : 1}
            />
          ))}
        </>
      ) : d.kind === 'leaves' ? (
        <>
          <circle cx="50" cy="50" r="44" fill="none" stroke={`url(#${gid})`} strokeWidth="3" />
          {around(12, 45).map(([x, y], i) => (
            <ellipse
              key={i}
              cx={x}
              cy={y}
              rx="7"
              ry="3.4"
              fill={`url(#${gid})`}
              transform={`rotate(${(i / 12) * 360} ${x} ${y})`}
            />
          ))}
        </>
      ) : d.kind === 'crown' ? (
        <>
          <circle cx="50" cy="50" r="44" fill="none" stroke={`url(#${gid})`} strokeWidth="3" opacity=".7" />
          {/* a five-point crown sitting on the top of the ring */}
          <path
            d="M22 20 L32 6 L41 16 L50 0 L59 16 L68 6 L78 20 L74 28 L26 28 Z"
            fill={`url(#${gid})`}
          />
          <rect x="24" y="29" width="52" height="6" rx="3" fill={`url(#${gid})`} />
        </>
      ) : (
        <>
          <circle cx="50" cy="50" r="44" fill="none" stroke={`url(#${gid})`} strokeWidth="4" strokeDasharray="14 6" />
          {around(4, 44).map(([x, y], i) => (
            <path
              key={i}
              d={`M${x - 3} ${y - 7} L${x + 3} ${y - 1} L${x} ${y - 1} L${x + 3} ${y + 7} L${x - 3} ${y + 1} L${x} ${y + 1} Z`}
              fill={`url(#${gid})`}
            />
          ))}
        </>
      )}
    </svg>
  )
}
