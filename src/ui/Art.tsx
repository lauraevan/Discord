/**
 * Artwork.
 *
 * Everything Discord ships is Discord's own file, vendored out of a public
 * repo — the Android APK for the default avatars and the sample banner
 * (tools/fetch-android-art.py), taiten312/wumpus for the mascot. Nothing here
 * is drawn.
 */

/* ------------------------------------------------------- default avatars */

const avatars = import.meta.glob('../assets/avatars/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

/**
 * The six default avatars, in the client's own order, keyed by the flat colour
 * each is drawn on. Discord picks between them by account rather than letting
 * anyone choose, so these are the whole set — blurple, grey, green, amber, red
 * and pink — sampled straight out of the shipped files.
 */
export const DEFAULT_AVATAR_COLORS = [
  '#5865f2',
  '#757e8b',
  '#3ba55c',
  '#faa61a',
  '#ed4245',
  '#eb459e',
] as const

const hex = (c: string) => {
  const v = c.replace('#', '')
  const n = parseInt(
    v.length === 3
      ? v
          .split('')
          .map((d) => d + d)
          .join('')
      : v,
    16,
  )
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** The shipped avatar whose colour is closest to the one asked for. */
export function defaultAvatarIndex(color = '#5865f2') {
  const [r, g, b] = hex(color)
  let best = 0
  let dist = Infinity
  DEFAULT_AVATAR_COLORS.forEach((c, i) => {
    const [cr, cg, cb] = hex(c)
    const d = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2
    if (d < dist) {
      dist = d
      best = i
    }
  })
  return best
}

/** Discord's default avatar: the Clyde mark on a flat colour, as shipped. */
export function DefaultAvatar({ color = '#5865f2' }: { color?: string }) {
  const src = avatars[`../assets/avatars/default-${defaultAvatarIndex(color)}.webp`]
  return <img className="art" src={src} alt="" draggable={false} aria-hidden="true" />
}

/* -------------------------------------------------------- sample banner */

const bannerSample = (
  import.meta.glob('../assets/profile/banner-sample.webp', {
    eager: true,
    query: '?url',
    import: 'default',
  }) as Record<string, string>
)['../assets/profile/banner-sample.webp']

/**
 * The banner art Discord itself puts on a themed profile — its own sample
 * banner, out of the mobile client's profile module.
 */
export function ProfileBanner() {
  return <img className="art banner-art" src={bannerSample} alt="" draggable={false} aria-hidden="true" />
}

/* --------------------------------------------------------- empty states */

const empties = import.meta.glob('../assets/empties/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

/**
 * The illustrations Discord runs where a list has nothing in it. These are its
 * own files: the mobile client calls them empties_search_empty_state,
 * messages_noresults and empty_channel_no_text_channels.
 */
export type EmptyKind = 'search' | 'no-results' | 'no-text-channels'

export function EmptyArt({ kind }: { kind: EmptyKind }) {
  const src = empties[`../assets/empties/${kind}.webp`]
  if (!src) return null
  return <img className="empty-art" src={src} alt="" draggable={false} aria-hidden="true" />
}

/* -------------------------------------------------------------- Wumpus */

/**
 * Wumpus.
 *
 * The real one, out of Discord's own APK: flat, two blurples, no outline,
 * two dots for eyes. He was a set of nine outlined fan drawings before, which
 * is not the character Discord's copy is naming when it says "here's Wumpus
 * for now", so there are no poses any more — there is one Wumpus, and it is
 * his.
 */
const wumpus = import.meta.glob('../assets/wumpus/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

export function WumpusMark({ art = 'wump' }: { art?: 'wump' | 'rocket' }) {
  const src = wumpus[`../assets/wumpus/${art}.webp`]
  if (!src) return null
  return (
    <img
      className={'wumpus wumpus-' + art}
      src={src}
      alt=""
      draggable={false}
      aria-hidden="true"
    />
  )
}
