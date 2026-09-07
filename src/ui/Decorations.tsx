/**
 * Avatar decorations — Discord's own.
 *
 * These are the real Shop collectibles, not drawings of them. Discord serves
 * them as 288x288 APNGs from a CDN this page cannot reach, so they come from
 * uhidontkno/DiscordAvatarDecorations and Hayanaga/SillyTavern-AvatarDecorations-CSS,
 * which carry the same files in public repos. tools/fetch-decorations.py vendors eight complete collections
 * into src/assets/decorations as animated WebP, with the still that best
 * represents each one alongside it — see that file for why the still is
 * chosen on the ring outside the avatar rather than on the whole frame.
 *
 * They are worn the way Discord wears them: the decoration is 1.2x the
 * avatar's box, centred on it, and never intercepts a click.
 */
import index from '../assets/decorations/index.json'
import { COLLECTIONS } from '../shop'

const files = import.meta.glob('../assets/decorations/*.{webp,png}', {
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
  /** the animation, as Discord wears it */
  src: string
  /** the representative still, for a reduced-motion preference */
  still: string
}

/**
 * Orb prices, from the dollar price Discord charges.
 *
 * Discord does not sell these for Orbs, so the rate is the app's: 200 Orbs to
 * the dollar, which puts a Quest's 1,500-Orb payout a little over one $5.99
 * decoration — the shape the two systems have. The prices themselves are
 * Discord's, out of the catalogue in src/shop.ts.
 */
export const orbsOf = (usd: number) => Math.round((usd * 200) / 25) * 25

const PRICES: Record<string, number> = {}
for (const c of COLLECTIONS)
  for (const p of [...c.decorations, ...c.effects, ...c.bundles])
    if (p.price) PRICES[p.id] = p.price

export const DECORATIONS: DecorationDef[] = index.map((d) => ({
  id: d.id,
  name: d.name,
  collection: d.collection,
  orbs: PRICES[d.id] ? orbsOf(PRICES[d.id]) : 1200,
  src: urlFor(d.file),
  still: urlFor(d.still),
}))

const byId = Object.fromEntries(DECORATIONS.map((d) => [d.id, d]))

/**
 * Both frames are rendered and CSS picks one, so the app's Reduced Motion
 * preference reaches a decoration nested deep inside an avatar without every
 * component in between having to pass it down.
 */
export function Decoration({ id, size = 40 }: { id: string; size?: number }) {
  const d = byId[id]
  if (!d) return null
  const props = {
    alt: '',
    width: size,
    height: size,
    draggable: false,
    'aria-hidden': true as const,
  }
  return (
    <>
      <img className="decoration anim" src={d.src} {...props} />
      <img className="decoration still" src={d.still} {...props} />
    </>
  )
}
