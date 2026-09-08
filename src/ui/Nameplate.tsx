import { nameplateArt, nameplateById } from '../nameplates'

/**
 * A nameplate, behind whatever it belongs to.
 *
 * Discord paints this under a member's row and under the name on a profile.
 * The asset is authored for exactly that: it already fades from nothing on the
 * left to art on the right, so it is drawn edge to edge with nothing added —
 * a mask or a wash on top would fade it twice. It is decoration, so it never
 * takes a click.
 */
export function Nameplate({ id }: { id?: string }) {
  const plate = nameplateById(id)
  if (!plate) return null
  return (
    <span className="nameplate" aria-hidden>
      <img src={nameplateArt(plate.id)} alt="" draggable={false} />
    </span>
  )
}
