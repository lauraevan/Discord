import { nameplateArt, nameplateById, nameplateWash } from '../nameplates'

/**
 * A nameplate, behind whatever it belongs to.
 *
 * Discord paints this under a member's row and under the name on a profile: a
 * wash derived from the artwork's own colours running left to right, with the
 * art itself at the trailing edge fading out so the name stays readable. It is
 * decoration, so it never takes a click.
 */
export function Nameplate({ id }: { id?: string }) {
  const plate = nameplateById(id)
  if (!plate) return null
  return (
    <span className="nameplate" aria-hidden style={{ background: nameplateWash(plate) }}>
      <img src={nameplateArt(plate.id)} alt="" draggable={false} />
    </span>
  )
}
