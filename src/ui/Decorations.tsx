/**
 * Avatar decorations — Discord's own.
 *
 * These are the real Shop collectibles, not drawings of them. Discord serves
 * them as 288x288 APNGs from a CDN this page cannot reach, so they come from
 * Hayanaga/SillyTavern-AvatarDecorations-CSS, which carries the same files in
 * a public repo. tools/fetch-decorations.py vendors four complete collections
 * into src/assets/decorations, reducing each animation to the single frame
 * that best represents it at rest — see that file for why the frame is chosen
 * on the ring rather than the whole disc.
 *
 * They are worn the way Discord wears them: the decoration is 1.2x the
 * avatar's box, centred on it, and never intercepts a click.
 */
import index from '../assets/decorations/index.json'

const files = import.meta.glob('../assets/decorations/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const urlFor = (file: string) =>
  files[`../assets/decorations/${file}`] ?? ''

export type DecorationDef = {
  id: string
  name: string
  collection: string
  orbs: number
  src: string
}

/**
 * Orb prices. Discord prices collectibles per collection rather than per item,
 * with the odd standout costing more; these follow that shape.
 */
const PRICE: Record<string, number> = {
  Elements: 1200,
  Space: 1500,
  'Lo-Fi Vibes': 1200,
  'Lunar New Year': 1800,
}

const PREMIUM = new Set(['astronaut-helmet', 'dragons-smile', 'stardust', 'rainy-mood'])

export const DECORATIONS: DecorationDef[] = index.map((d) => ({
  id: d.id,
  name: d.name,
  collection: d.collection,
  orbs: PRICE[d.collection] + (PREMIUM.has(d.id) ? 600 : 0),
  src: urlFor(d.file),
}))

const byId = Object.fromEntries(DECORATIONS.map((d) => [d.id, d]))

export function Decoration({ id, size = 40 }: { id: string; size?: number }) {
  const d = byId[id]
  if (!d) return null
  return (
    <img
      className="decoration"
      src={d.src}
      alt=""
      width={size}
      height={size}
      draggable={false}
      aria-hidden="true"
    />
  )
}
