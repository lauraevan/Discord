import { statusColor, type Status } from '../data'

/**
 * Presence, drawn the way the client draws it.
 *
 * Discord's status indicator is not a coloured dot: it is one coloured square
 * per status with an SVG mask over it, and the mask is what makes idle a
 * crescent, Do Not Disturb a circle with a bar through it, offline a ring and
 * streaming a play triangle. The mask geometry below is lifted verbatim out of
 * the shipped bundle, in the `objectBoundingBox` units it uses there.
 *
 * The gap around the indicator is a hole cut out of the avatar rather than a
 * ring drawn on top, which is why the crescent and the ring show whatever the
 * avatar is sitting on. Discord cuts it with a second mask, so this does too:
 * the avatar goes inside a `foreignObject` that mask applies to.
 */

/**
 * Discord's own avatar table. Every size it ships carries the indicator's
 * diameter, the width of the gap around it, and how far in from the corner it
 * sits — none of which is a proportion of the avatar, which is why guessing at
 * it gets 44, 56, 72 and 96 wrong.
 */
export const AVATAR_SPECS = [
  { size: 16, status: 6, stroke: 2, offset: 0 },
  { size: 20, status: 6, stroke: 2, offset: 0 },
  { size: 24, status: 8, stroke: 3, offset: 0 },
  { size: 32, status: 10, stroke: 3, offset: 0 },
  { size: 40, status: 12, stroke: 4, offset: 0 },
  { size: 44, status: 12, stroke: 4, offset: 0 },
  { size: 48, status: 12, stroke: 4, offset: 0 },
  { size: 56, status: 14, stroke: 4, offset: 2 },
  { size: 72, status: 16, stroke: 6, offset: 4 },
  { size: 80, status: 16, stroke: 6, offset: 4 },
  { size: 96, status: 20, stroke: 8, offset: 6 },
  { size: 120, status: 24, stroke: 8, offset: 8 },
  { size: 152, status: 30, stroke: 10, offset: 10 },
] as const

export type AvatarSpec = (typeof AVATAR_SPECS)[number]

/** The row Discord would use for an avatar this big. */
export function specFor(size: number): AvatarSpec {
  let best: AvatarSpec = AVATAR_SPECS[0]
  for (const s of AVATAR_SPECS) if (Math.abs(s.size - size) < Math.abs(best.size - size)) best = s
  return best
}

/** Where the indicator sits, in the avatar's own pixels. */
export function statusBox(size: number) {
  const spec = specFor(size)
  // scaled rather than the raw table numbers: the hole's centre is a fraction
  // of the box, so at a size Discord does not ship the dot only stays centred
  // in its hole if it scales the same way
  const d = Math.round((spec.status * size) / spec.size)
  const inset = Math.round((spec.offset * size) / spec.size)
  return { d, x: size - d - inset, y: size - d - inset }
}

/* ------------------------------------------------------------------ masks */

const holes = () =>
  AVATAR_SPECS.map(({ size, status, offset }) => {
    // the client's own maths: the hole's centre sits status/2 + offset in from
    // the corner, and its radius is that plus a twentieth of the avatar
    const corner = (status / 2 + offset) / size
    const radius = corner + 0.05
    return (
      <mask key={size} id={`dc-hole-${size}`} maskContentUnits="objectBoundingBox" viewBox="0 0 1 1">
        <circle fill="white" cx={0.5} cy={0.5} r={0.5} />
        <circle fill="black" cx={1 - corner} cy={1 - corner} r={radius} />
      </mask>
    )
  })

/**
 * The mask sprite. Rendered once at the root; every avatar and indicator on
 * the page points at it by id, exactly as the client does.
 */
export function StatusMasks() {
  return (
    <svg
      aria-hidden
      width={0}
      height={0}
      style={{ position: 'absolute', pointerEvents: 'none' }}
      viewBox="0 0 1 1"
    >
      <mask id="dc-status-online" maskContentUnits="objectBoundingBox" viewBox="0 0 1 1">
        <circle fill="white" cx={0.5} cy={0.5} r={0.5} />
      </mask>
      <mask id="dc-status-idle" maskContentUnits="objectBoundingBox" viewBox="0 0 1 1">
        <circle fill="white" cx={0.5} cy={0.5} r={0.5} />
        <circle fill="black" cx={0.25} cy={0.25} r={0.375} />
      </mask>
      <mask id="dc-status-dnd" maskContentUnits="objectBoundingBox" viewBox="0 0 1 1">
        <circle fill="white" cx={0.5} cy={0.5} r={0.5} />
        <rect fill="black" x={0.125} y={0.375} width={0.75} height={0.25} rx={0.125} ry={0.125} />
      </mask>
      <mask id="dc-status-offline" maskContentUnits="objectBoundingBox" viewBox="0 0 1 1">
        <circle fill="white" cx={0.5} cy={0.5} r={0.5} />
        <circle fill="black" cx={0.5} cy={0.5} r={0.25} />
      </mask>
      <mask id="dc-status-streaming" maskContentUnits="objectBoundingBox" viewBox="0 0 1 1">
        <circle fill="white" cx={0.5} cy={0.5} r={0.5} />
        <polygon fill="black" points="0.35,0.25 0.78301275,0.5 0.35,0.75" />
      </mask>
      {holes()}
    </svg>
  )
}

/** The mask id for a status. Invisible wears the offline ring, as in Discord. */
export const statusMask = (status: Status) =>
  `dc-status-${status === 'invisible' ? 'offline' : status}`

/**
 * The indicator on its own, for the places Discord shows one without an
 * avatar — the status menu, the popout's own row.
 */
export function StatusGlyph({ status, size = 10 }: { status: Status; size?: number }) {
  return (
    <svg className="status-glyph" width={size} height={size} viewBox="0 0 1 1" aria-hidden>
      <rect width={1} height={1} fill={statusColor[status]} mask={`url(#${statusMask(status)})`} />
    </svg>
  )
}
