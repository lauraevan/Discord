/**
 * Artwork for the Nitro tab — Discord's own, none of it drawn here.
 *
 * The cover behind the hero, the cloud band, the NITRO and NITRO BASIC
 * wordmarks, the sparkles, the MOST POPULAR pill and the bento illustrations
 * come off Discord's own Nitro page (tools/fetch-nitro-web-art.mjs); the
 * plan-selection Wumpus, the boost gem, the gifting art and the tenure badges
 * come out of its Android client and its badge set
 * (tools/fetch-nitro-art.py). Both files say where each piece is from.
 */


export function NitroWordmark() {
  return (
    <div className="nitro-wordmark">
      <span className="nitro-wordmark-small">World of</span>
      <NitroArt name="wordmark-nitro" className="nitro-wordmark-art" />
    </div>
  )
}

/**
 * Discord's own Nitro artwork.
 *
 * The plan-selection Wumpus, the boost gem, the yearly-upsell scene, the
 * gifting art and the tenure badges are the real illustrations, vendored by
 * tools/fetch-nitro-art.py out of the Android client's own resources and out
 * of the badge set — see that file for where each comes from. Nothing here is
 * drawn.
 */
const art = import.meta.glob('../assets/nitro/*.{webp,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

export function NitroArt({ name, className }: { name: string; className?: string }) {
  const src =
    art[`../assets/nitro/${name}.webp`] ?? art[`../assets/nitro/${name}.svg`]
  if (!src) return null
  return <img className={className} src={src} alt="" draggable={false} aria-hidden="true" />
}

/** The badge for a tenure level, by the month count the client files it under. */
export const tenureBadge = (months: number) => `tenure-${months}`
