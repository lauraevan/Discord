/**
 * The modern Discord icon set.
 *
 * Drawn to match the reference frame, which is a current client — not the 2023
 * icon set, whose glyphs are visibly different (two-person "members" vs one, a
 * filled GIF chip vs an outlined one, a ringed "add server" vs a solid disc, a
 * hash-and-speech-bubble "threads" vs the tilted comb, and so on).
 *
 * House style, taken from the reference: solid shapes with the detail knocked
 * out rather than thin strokes, generous weight, rounded terminals, drawn on a
 * 24x24 grid and filled with `currentColor`.
 */
import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement> & { size?: number }

function Svg({ size = 24, children, ...rest }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...rest}>
      {children}
    </svg>
  )
}

/** Most glyphs are a single filled path; this keeps them to one line each. */
const solid = (d: string, rule: 'evenodd' | 'nonzero' = 'evenodd') =>
  function Icon(p: P) {
    return (
      <Svg {...p}>
        <path fill="currentColor" fillRule={rule} clipRule="evenodd" d={d} />
      </Svg>
    )
  }

/* ------------------------------------------------------------ channels */

/**
 * The channel hash.
 *
 * Measured off the reference frame's 28px intro glyph rather than guessed: the
 * strokes are 2.45px on 28, so 1.66 units on a 19-unit ink height, and the whole
 * mark leans 9.8 degrees — the bars stay horizontal but shift with the skew,
 * which is why the top bar sits a pixel right of the bottom one.
 */
export function HashIcon(p: P) {
  return (
    <Svg {...p}>
      {/* skewX(-9.8deg) pinned so the glyph's middle row stays put */}
      <g fill="currentColor" transform="matrix(1,0,-0.1727,1,2.0724,0)">
        <rect x="2.85" y="8.39" width="18.3" height="1.66" />
        <rect x="2.85" y="14.29" width="18.3" height="1.66" />
        <rect x="7.8" y="2.5" width="1.66" height="19" />
        <rect x="14.54" y="2.5" width="1.66" height="19" />
      </g>
    </Svg>
  )
}

/** Switch Accounts: a person knocked out of a filled disc. */
export const SwitchAccountsIcon = solid(
  'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 4.4a3.1 3.1 0 1 1 0 6.2 3.1 3.1 0 0 1 0-6.2Zm0 14.2a8.5 8.5 0 0 1-5.62-2.12c.5-2.2 3-3.38 5.62-3.38s5.12 1.18 5.62 3.38A8.5 8.5 0 0 1 12 20.6Z',
)

export const SpeakerIcon = solid(
  'M11.4 3.3a1 1 0 0 1 .6.9v15.6a1 1 0 0 1-1.63.78L6.05 17H3.6A1.6 1.6 0 0 1 2 15.4V8.6A1.6 1.6 0 0 1 3.6 7h2.45l4.32-3.58a1 1 0 0 1 1.03-.12Zm3.3 3.1a1.3 1.3 0 0 1 1.8.36 9.6 9.6 0 0 1 0 10.48 1.3 1.3 0 1 1-2.16-1.44 7 7 0 0 0 0-7.6 1.3 1.3 0 0 1 .36-1.8Zm3.9-3.2a1.3 1.3 0 0 1 1.78.44 16 16 0 0 1 0 16.72 1.3 1.3 0 0 1-2.22-1.34 13.4 13.4 0 0 0 0-14.04 1.3 1.3 0 0 1 .44-1.78Z',
  'nonzero',
)

export const MegaphoneIcon = solid(
  'M20.6 2.2a1.4 1.4 0 0 1 .9 1.3v17a1.4 1.4 0 0 1-2.26 1.1l-4.9-3.8H12l.9 3.5a1.2 1.2 0 0 1-1.16 1.5H8.9a1.2 1.2 0 0 1-1.17-.9L6.5 17.8H5a3 3 0 0 1-3-3v-5.6a3 3 0 0 1 3-3h9.34l4.9-3.8a1.4 1.4 0 0 1 1.36-.2Z',
  'nonzero',
)

export const ForumIcon = solid(
  'M4.4 3h15.2A2.4 2.4 0 0 1 22 5.4v8.9a2.4 2.4 0 0 1-2.4 2.4h-2.1l-3.9 3.9a1 1 0 0 1-1.7-.7v-3.2H4.4A2.4 2.4 0 0 1 2 14.3V5.4A2.4 2.4 0 0 1 4.4 3Zm2 3.5a1.25 1.25 0 0 0 0 2.5h11.2a1.25 1.25 0 0 0 0-2.5H6.4Zm0 4.2a1.25 1.25 0 0 0 0 2.5h7a1.25 1.25 0 0 0 0-2.5h-7Z',
)

export const RulesIcon = solid(
  'M5.4 2h13.2A2.4 2.4 0 0 1 21 4.4v15.2a2.4 2.4 0 0 1-2.4 2.4H5.4A2.4 2.4 0 0 1 3 19.6V4.4A2.4 2.4 0 0 1 5.4 2Zm2 4.3a1.2 1.2 0 0 0 0 2.4h9.2a1.2 1.2 0 0 0 0-2.4H7.4Zm0 4.5a1.2 1.2 0 0 0 0 2.4h9.2a1.2 1.2 0 0 0 0-2.4H7.4Zm0 4.5a1.2 1.2 0 0 0 0 2.4h5.2a1.2 1.2 0 0 0 0-2.4H7.4Z',
)

export const StageIcon = solid(
  'M12 2a10 10 0 0 0-7.6 16.5 1.3 1.3 0 0 0 2-1.7 7.4 7.4 0 1 1 11.2 0 1.3 1.3 0 1 0 2 1.7A10 10 0 0 0 12 2Zm0 4.6a5.4 5.4 0 0 0-4.1 8.9 1.3 1.3 0 0 0 2-1.7 2.8 2.8 0 1 1 4.2 0 1.3 1.3 0 0 0 2 1.7A5.4 5.4 0 0 0 12 6.6Zm0 5.9a2.2 2.2 0 0 1 2.05 3l-1 2.6a1.1 1.1 0 0 1-2.1 0l-1-2.6A2.2 2.2 0 0 1 12 12.5Z',
  'nonzero',
)

/* ---------------------------------------------------------- sidebar nav */

/** Calendar with a filled header band and an event dot. */
export function EventsIcon(p: P) {
  return (
    <Svg {...p}>
      <g fill="currentColor">
        <rect x="6.9" y="1.8" width="2.7" height="4.6" rx="1.35" />
        <rect x="14.4" y="1.8" width="2.7" height="4.6" rx="1.35" />
        <path d="M3.4 7.6a2.9 2.9 0 0 1 2.9-2.9h11.4a2.9 2.9 0 0 1 2.9 2.9v1.7H3.4V7.6Z" />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M3.4 11h17.2v7.7a2.9 2.9 0 0 1-2.9 2.9H6.3a2.9 2.9 0 0 1-2.9-2.9V11Zm4.3 2a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5Zm4.4.6a1.15 1.15 0 0 0 0 2.3h5a1.15 1.15 0 0 0 0-2.3h-5Z"
        />
      </g>
    </Svg>
  )
}
export { EventsIcon as CalendarIcon }

/** Rules stacked over a magnifier — not the old hash-and-magnifier. */
export function BrowseChannelsIcon(p: P) {
  return (
    <Svg {...p}>
      <g fill="currentColor">
        <rect x="2.4" y="4" width="19.2" height="2.3" rx="1.15" />
        <rect x="2.4" y="8.4" width="19.2" height="2.3" rx="1.15" />
        <rect x="2.4" y="12.8" width="12.6" height="2.3" rx="1.15" />
        <rect x="2.4" y="17.2" width="8.6" height="2.3" rx="1.15" />
      </g>
      <circle cx="16.7" cy="16.7" r="3.5" stroke="currentColor" strokeWidth="2.2" />
      <path d="m19.6 19.6 2 2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  )
}

/** Two people — the modern glyph; the old set drew one. */
export const MembersIcon = solid(
  'M9.5 5.1a4.1 4.1 0 1 1 0 8.2 4.1 4.1 0 0 1 0-8.2Zm8.1-2.9a3.1 3.1 0 1 1 0 6.2 3.1 3.1 0 0 1 0-6.2ZM9.5 14.6c3.9 0 6.9 2.5 6.9 6a1.2 1.2 0 0 1-1.2 1.2H3.8a1.2 1.2 0 0 1-1.2-1.2c0-3.5 3-6 6.9-6Zm8.4-4.3c2.5 0 4.1 1.9 4.1 4.4a1.15 1.15 0 0 1-1.15 1.15h-2.5a8.8 8.8 0 0 0-3.2-4.9 5.9 5.9 0 0 1 2.75-.65Z',
  'nonzero',
)

export { MembersIcon as MemberListIcon }

/** Boost gem: a tall hexagon ring with the inner mark. */
export const BoostIcon = solid(
  'M12 1.6a1.4 1.4 0 0 1 .9.33l6.6 5.6a1.4 1.4 0 0 1 .5 1.07v6.8a1.4 1.4 0 0 1-.5 1.07l-6.6 5.6a1.4 1.4 0 0 1-1.8 0l-6.6-5.6a1.4 1.4 0 0 1-.5-1.07V8.6a1.4 1.4 0 0 1 .5-1.07l6.6-5.6a1.4 1.4 0 0 1 .9-.33Zm0 2.72L6.4 9.1v5.8l5.6 4.75 5.6-4.75V9.1L12 4.32Zm0 3.08a1.2 1.2 0 0 1 1.2 1.2v6a1.2 1.2 0 0 1-2.4 0v-6A1.2 1.2 0 0 1 12 7.4Z',
)

/* ----------------------------------------------------------- chat header */

/**
 * Threads: a four-bar comb tilted 45 degrees. Fitted to the reference glyph —
 * bar lengths, thickness and spacing measured off it at 17px.
 */
export const ThreadsIcon = (p: P) => (
  <Svg {...p}>
    <g fill="currentColor" transform="rotate(-45 12 12)">
      <rect x="4" y="4.05" width="16" height="3" rx="0.75" />
      <rect x="6.3" y="8.35" width="11.4" height="3" rx="0.75" />
      <rect x="6.3" y="12.65" width="11.4" height="3" rx="0.75" />
      <rect x="4" y="16.95" width="16" height="3" rx="0.75" />
    </g>
  </Svg>
)

export const BellIcon = solid(
  'M12 2.2a7.3 7.3 0 0 0-7.3 7.3v3.1l-1.5 2.7A1.4 1.4 0 0 0 4.4 17.5h15.2a1.4 1.4 0 0 0 1.2-2.2l-1.5-2.7V9.5A7.3 7.3 0 0 0 12 2.2ZM9.1 19a2.9 2.9 0 0 0 5.8 0H9.1Z',
  'nonzero',
)

export const BellOffIcon = solid(
  'M3.4 2.1 21.9 20.6l-1.5 1.5-2.6-2.6H4.4a1.4 1.4 0 0 1-1.2-2.2l1.5-2.7V9.5c0-1.2.3-2.4.8-3.4L1.9 3.6l1.5-1.5ZM9.1 19h5.8a2.9 2.9 0 0 1-5.8 0Zm3-16.8A7.3 7.3 0 0 1 19.3 9.5v3.1l1.5 2.7a1.4 1.4 0 0 1-.2 1.6L7.6 4.1a7.3 7.3 0 0 1 4.5-1.9Z',
  'nonzero',
)

export const PinIcon = solid(
  'M14.9 1.9a1.3 1.3 0 0 1 1.84 0l5.36 5.36a1.3 1.3 0 0 1-1.32 2.16l-1.3-.36-3.06 3.06.45 2.35a1.3 1.3 0 0 1-2.2 1.16l-3.02-3.02-4.73 4.73a1.15 1.15 0 0 1-1.63-1.63l4.73-4.73L7 7.96a1.3 1.3 0 0 1 1.16-2.2l2.35.45 3.06-3.06-.36-1.3a1.3 1.3 0 0 1 .69-1.95Z',
  'nonzero',
)

export const SearchIcon = solid(
  'M10.6 2.4a8.2 8.2 0 1 0 4.86 14.81l4.44 4.43a1.3 1.3 0 0 0 1.84-1.84l-4.43-4.44A8.2 8.2 0 0 0 10.6 2.4Zm0 2.6a5.6 5.6 0 1 1 0 11.2 5.6 5.6 0 0 1 0-11.2Z',
)

/* ------------------------------------------------------------- composer */

export const PlusIcon = solid(
  'M13.2 3.6a1.2 1.2 0 0 0-2.4 0v7.2H3.6a1.2 1.2 0 0 0 0 2.4h7.2v7.2a1.2 1.2 0 0 0 2.4 0v-7.2h7.2a1.2 1.2 0 0 0 0-2.4h-7.2V3.6Z',
  'nonzero',
)

/** Gift: two bow loops over a lid, box split down the middle. */
export function GiftIcon(p: P) {
  return (
    <Svg {...p}>
      <g fill="currentColor" fillRule="evenodd" clipRule="evenodd">
        <path d="M8.9 1.9a2.75 2.75 0 1 1 0 5.5 2.75 2.75 0 0 1 0-5.5Zm0 1.65a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2Zm6.2-1.65a2.75 2.75 0 1 1 0 5.5 2.75 2.75 0 0 1 0-5.5Zm0 1.65a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2Z" />
        <rect x="2.6" y="6.7" width="18.8" height="5" rx="1.1" />
        <path d="M4.4 12.9h6.5v8.7H6.6a2.2 2.2 0 0 1-2.2-2.2v-6.5Zm8.7 0h6.5v6.5a2.2 2.2 0 0 1-2.2 2.2h-4.3v-8.7Z" />
      </g>
    </Svg>
  )
}

/** A filled chip with GIF knocked out — the old set had it inverted. */
export function GifIcon(p: P) {
  return (
    <Svg {...p}>
      <mask id="gif-letters">
        <rect x="2.4" y="4.6" width="19.2" height="14.8" rx="3.2" fill="#fff" />
        <text
          x="12"
          y="15.05"
          textAnchor="middle"
          fontFamily="'gg sans fallback', system-ui, sans-serif"
          fontSize="8.6"
          fontWeight="800"
          letterSpacing="-0.2"
          fill="#000"
        >
          GIF
        </text>
      </mask>
      <rect
        x="2.4"
        y="4.6"
        width="19.2"
        height="14.8"
        rx="3.2"
        fill="currentColor"
        mask="url(#gif-letters)"
      />
    </Svg>
  )
}

/** Sticker: a rounded square with a face and a peeled corner. */
export function StickerIcon(p: P) {
  return (
    <Svg {...p}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.6 3.2h10.8a3.4 3.4 0 0 1 3.4 3.4v6.2h-4.3a3.9 3.9 0 0 0-3.9 3.9v4.1H6.6a3.4 3.4 0 0 1-3.4-3.4V6.6a3.4 3.4 0 0 1 3.4-3.4Zm2.5 5.3a1.35 1.35 0 1 0 0 2.7 1.35 1.35 0 0 0 0-2.7Zm5.8 0a1.35 1.35 0 1 0 0 2.7 1.35 1.35 0 0 0 0-2.7Zm-6.1 4.9a1 1 0 0 0-.32 1.38 4.85 4.85 0 0 0 8.24 0 1 1 0 1 0-1.7-1.06 2.85 2.85 0 0 1-4.84 0 1 1 0 0 0-1.38-.32Z"
      />
      <path
        fill="currentColor"
        d="M14.6 20.3v-3.6a2.1 2.1 0 0 1 2.1-2.1h3.6l-5.7 5.7Z"
      />
    </Svg>
  )
}

export const SmileyIcon = solid(
  'M12 2.3a9.7 9.7 0 1 0 0 19.4 9.7 9.7 0 0 0 0-19.4ZM8.9 8.4a1.45 1.45 0 1 1 0 2.9 1.45 1.45 0 0 1 0-2.9Zm6.2 0a1.45 1.45 0 1 1 0 2.9 1.45 1.45 0 0 1 0-2.9Zm-7 5.2a1.1 1.1 0 0 1 1.52.35 3.95 3.95 0 0 0 6.76 0 1.1 1.1 0 1 1 1.87 1.16 6.15 6.15 0 0 1-10.5 0 1.1 1.1 0 0 1 .35-1.51Z',
)

/** Apps: square, triangle, circle, sparkle. */
export function AppsIcon(p: P) {
  return (
    <Svg {...p}>
      <g fill="currentColor">
        <rect x="2.7" y="2.7" width="7.6" height="7.6" rx="2" />
        <path d="M16.75 2.6c.47 0 .9.25 1.14.66l3.2 5.5a1.32 1.32 0 0 1-1.14 1.98h-6.4a1.32 1.32 0 0 1-1.14-1.98l3.2-5.5c.24-.41.67-.66 1.14-.66Z" />
        <circle cx="6.5" cy="17.5" r="3.9" />
        <path d="M16.9 12.7c.3 0 .56.2.64.5l.5 1.87c.13.5.52.88 1.01 1.01l1.87.5a.66.66 0 0 1 0 1.28l-1.87.5c-.5.13-.88.52-1.01 1.01l-.5 1.87a.66.66 0 0 1-1.28 0l-.5-1.87a1.33 1.33 0 0 0-1.01-1.01l-1.87-.5a.66.66 0 0 1 0-1.28l1.87-.5c.5-.13.88-.52 1.01-1.01l.5-1.87c.08-.3.35-.5.64-.5Z" />
      </g>
    </Svg>
  )
}

/* ----------------------------------------------------------------- rail */

export const ClydeIcon = (p: P) => (
  <Svg {...p}>
    <path
      fill="currentColor"
      d="M20.32 4.57A17.6 17.6 0 0 0 15.94 3.2a.07.07 0 0 0-.07.03c-.19.34-.4.78-.55 1.13a16.3 16.3 0 0 0-4.66 0A10.9 10.9 0 0 0 10.1 3.2a.07.07 0 0 0-.07-.03c-1.5.26-2.95.72-4.38 1.37a.06.06 0 0 0-.03.02C2.83 8.72 2.09 12.75 2.45 16.73c0 .02.02.04.04.05a17.7 17.7 0 0 0 5.36 2.7.07.07 0 0 0 .08-.02c.41-.56.78-1.16 1.1-1.78a.07.07 0 0 0-.04-.1c-.58-.22-1.14-.49-1.68-.8a.07.07 0 0 1 0-.11l.33-.26a.07.07 0 0 1 .07 0 12.6 12.6 0 0 0 10.7 0 .07.07 0 0 1 .07 0l.34.26a.07.07 0 0 1 0 .12c-.54.3-1.1.57-1.69.79a.07.07 0 0 0-.04.1c.33.62.7 1.22 1.1 1.78a.07.07 0 0 0 .08.03 17.6 17.6 0 0 0 5.37-2.71.07.07 0 0 0 .03-.05c.43-4.6-.72-8.6-3.06-12.14a.05.05 0 0 0-.03-.02ZM8.75 14.31c-1.05 0-1.92-.97-1.92-2.16 0-1.18.85-2.15 1.92-2.15 1.08 0 1.94.98 1.93 2.15 0 1.19-.86 2.16-1.93 2.16Zm7.12 0c-1.06 0-1.93-.97-1.93-2.16 0-1.18.85-2.15 1.93-2.15 1.07 0 1.94.98 1.92 2.15 0 1.19-.85 2.16-1.92 2.16Z"
    />
  </Svg>
)

/** Add a Server: a ring with a plus inside it, not a solid disc. */
export const AddServerIcon = solid(
  // a filled disc with the plus knocked out, which is what the reference
  // shows; the old glyph drew a ring with a plus inside it
  'M12 2.3a9.7 9.7 0 1 0 0 19.4 9.7 9.7 0 0 0 0-19.4Zm1.3 4.55v3.85h3.85a1.3 1.3 0 0 1 0 2.6H13.3v3.85a1.3 1.3 0 0 1-2.6 0V13.3H6.85a1.3 1.3 0 0 1 0-2.6h3.85V6.85a1.3 1.3 0 0 1 2.6 0Z',
)

/** Discover: a filled disc with the compass rose knocked out of it. */
export const CompassIcon = solid(
  'M12 2.3a9.7 9.7 0 1 0 0 19.4 9.7 9.7 0 0 0 0-19.4Zm4.72 4.28a.62.62 0 0 1 .8.8l-2.34 6.24a1.9 1.9 0 0 1-1.11 1.11l-6.24 2.34a.62.62 0 0 1-.8-.8l2.34-6.24a1.9 1.9 0 0 1 1.11-1.11l6.24-2.34ZM12 10.4a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2Z',
)

/** Download: arrow over a separate rule. */
export function DownloadIcon(p: P) {
  return (
    <Svg {...p}>
      <path
        fill="currentColor"
        d="M12 2.6a1.35 1.35 0 0 1 1.35 1.35v8.13l2.5-2.5a1.35 1.35 0 0 1 1.91 1.91l-4.8 4.8a1.35 1.35 0 0 1-1.92 0l-4.8-4.8a1.35 1.35 0 0 1 1.91-1.91l2.5 2.5V3.95A1.35 1.35 0 0 1 12 2.6Z"
      />
      <rect x="3.6" y="18.8" width="16.8" height="2.6" rx="1.3" fill="currentColor" />
    </Svg>
  )
}

/* ------------------------------------------------------------ user area */

export const MicIcon = solid(
  'M12 2.2a3.6 3.6 0 0 0-3.6 3.6v6a3.6 3.6 0 1 0 7.2 0v-6A3.6 3.6 0 0 0 12 2.2ZM5.6 10.2a1.2 1.2 0 0 1 1.2 1.2 5.2 5.2 0 0 0 10.4 0 1.2 1.2 0 0 1 2.4 0 7.6 7.6 0 0 1-6.4 7.5v2.1h2.4a1.2 1.2 0 0 1 0 2.4H8.4a1.2 1.2 0 0 1 0-2.4h2.4v-2.1a7.6 7.6 0 0 1-6.4-7.5 1.2 1.2 0 0 1 1.2-1.2Z',
  'nonzero',
)

export const MicOffIcon = solid(
  'M3.4 2.1 21.9 20.6l-1.55 1.55-4.2-4.2a7.5 7.5 0 0 1-2.95 1.05v2.1h2.4a1.2 1.2 0 0 1 0 2.4H8.4a1.2 1.2 0 0 1 0-2.4h2.4v-2.1a7.6 7.6 0 0 1-6.4-7.5 1.2 1.2 0 0 1 2.4 0 5.2 5.2 0 0 0 7.2 4.8l-1.87-1.87A3.6 3.6 0 0 1 8.4 11.8V9.9L1.85 3.65 3.4 2.1Zm8.6.1a3.6 3.6 0 0 1 3.6 3.6v6c0 .3-.04.6-.11.88L8.4 5.6v-.02A3.6 3.6 0 0 1 12 2.2Zm7.2 8a1.2 1.2 0 0 1 1.2 1.2c0 1.2-.28 2.34-.78 3.35l-1.83-1.83c.1-.49.15-1 .15-1.52a1.2 1.2 0 0 1 1.26-1.2Z',
  'nonzero',
)

export const HeadphonesIcon = solid(
  'M12 2.4a9.6 9.6 0 0 0-9.6 9.6v5.4A3.4 3.4 0 0 0 5.8 20.8h1.4a1.6 1.6 0 0 0 1.6-1.6v-4.6a1.6 1.6 0 0 0-1.6-1.6H4.9V12a7.1 7.1 0 1 1 14.2 0v1h-2.3a1.6 1.6 0 0 0-1.6 1.6v4.6a1.6 1.6 0 0 0 1.6 1.6h1.4a3.4 3.4 0 0 0 3.4-3.4V12A9.6 9.6 0 0 0 12 2.4Z',
  'nonzero',
)

export const HeadphonesOffIcon = solid(
  'M3.4 2.1 21.9 20.6l-1.55 1.55-2.62-2.62a3.4 3.4 0 0 1-.52.04h-1.4a1.6 1.6 0 0 1-1.6-1.6v-4.6c0-.35.11-.67.3-.93L2.72 1.75 3.4 2.1Zm8.6.3A9.6 9.6 0 0 1 21.6 12v5.4c0 .5-.11.98-.3 1.41L16.8 14.3V13h2.3v-1a7.1 7.1 0 0 0-9.86-6.53L7.3 3.63A9.55 9.55 0 0 1 12 2.4ZM4.44 6.53 6.9 8.99A7.07 7.07 0 0 0 4.9 12v1h2.3a1.6 1.6 0 0 1 1.6 1.6v4.6a1.6 1.6 0 0 1-1.6 1.6H5.8a3.4 3.4 0 0 1-3.4-3.4V12c0-2.07.66-4 1.77-5.57Z',
  'nonzero',
)

export const GearIcon = solid(
  'M10.36 2h3.28a1.2 1.2 0 0 1 1.18.97l.34 1.75c.5.2.97.47 1.4.79l1.68-.58a1.2 1.2 0 0 1 1.43.54l1.64 2.84a1.2 1.2 0 0 1-.25 1.5l-1.34 1.17a7.6 7.6 0 0 1 0 1.6l1.34 1.17a1.2 1.2 0 0 1 .25 1.5l-1.64 2.84a1.2 1.2 0 0 1-1.43.54l-1.68-.58c-.43.32-.9.59-1.4.79l-.34 1.75a1.2 1.2 0 0 1-1.18.97h-3.28a1.2 1.2 0 0 1-1.18-.97l-.34-1.75c-.5-.2-.97-.47-1.4-.79l-1.68.58a1.2 1.2 0 0 1-1.43-.54l-1.64-2.84a1.2 1.2 0 0 1 .25-1.5l1.34-1.17a7.6 7.6 0 0 1 0-1.6L3.24 9.81a1.2 1.2 0 0 1-.25-1.5l1.64-2.84a1.2 1.2 0 0 1 1.43-.54l1.68.58c.43-.32.9-.59 1.4-.79l.34-1.75A1.2 1.2 0 0 1 10.36 2ZM12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z',
)

/* ------------------------------------------------------------- chrome */

export const ChevronDownIcon = (p: P) => (
  <Svg {...p}>
    <path
      d="m5.5 8.5 6.5 6.5 6.5-6.5"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

export const ChevronRightIcon = (p: P) => (
  <Svg {...p}>
    <path
      d="m9 5.5 6.5 6.5L9 18.5"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

export const CloseIcon = (p: P) => (
  <Svg {...p}>
    <path
      d="M5.5 5.5l13 13m0-13-13 13"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
  </Svg>
)

export const CheckIcon = (p: P) => (
  <Svg {...p}>
    <path
      d="m4.8 12.4 4.7 4.7 9.7-10.2"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

export const MinimizeIcon = (p: P) => (
  <Svg {...p}>
    <path d="M5 12h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </Svg>
)

export const MaximizeIcon = (p: P) => (
  <Svg {...p}>
    <rect
      x="5.2"
      y="5.2"
      width="13.6"
      height="13.6"
      rx="2.4"
      stroke="currentColor"
      strokeWidth="1.6"
    />
  </Svg>
)

export const ExpandIcon = (p: P) => (
  <Svg {...p}>
    <path
      d="M9.4 4.6H4.6v4.8m10 -4.8h4.8v4.8M9.4 19.4H4.6v-4.8m10 4.8h4.8v-4.8"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

/**
 * Help: a filled disc with the question mark knocked out, so the bar colour
 * shows through it. The reference's title bar draws it green.
 */
export const HelpIcon = solid(
  'M12 2.3a9.7 9.7 0 1 0 0 19.4 9.7 9.7 0 0 0 0-19.4Zm0 3.9a3.7 3.7 0 0 1 3.7 3.7c0 1.5-.8 2.35-1.9 3.05-.6.4-.85.65-.85 1.05a.95.95 0 0 1-1.9 0c0-1.4.83-2.2 1.72-2.78.75-.5 1.03-.78 1.03-1.32a1.8 1.8 0 1 0-3.6 0 .95.95 0 0 1-1.9 0A3.7 3.7 0 0 1 12 6.2Zm0 10.1a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Z',
)

/**
 * The crossed screwdriver and wrench the reference's title bar carries as its
 * third action, where the old build guessed a full-screen toggle.
 */
export function ToolsIcon(p: P) {
  return (
    <Svg {...p}>
      <g fill="currentColor">
        {/* screwdriver, top-left to bottom-right */}
        <g transform="rotate(45 12 12)">
          <rect x="10.75" y="9.2" width="2.5" height="11.4" rx="0.5" />
          <rect x="9.5" y="3.4" width="5" height="6.2" rx="1.7" />
        </g>
        {/* wrench, bottom-left to top-right, with an open ring head */}
        <g transform="rotate(-45 12 12)">
          <rect x="10.75" y="8.6" width="2.5" height="12" rx="0.5" />
          <path
            fillRule="evenodd"
            d="M12 2.6a4.1 4.1 0 1 1 0 8.2 4.1 4.1 0 0 1 0-8.2Zm0 2.15a1.95 1.95 0 1 0 0 3.9 1.95 1.95 0 0 0 0-3.9Z"
          />
        </g>
      </g>
    </Svg>
  )
}

/** Inbox: a rounded square with the tray notched out of its lower half. */
export const InboxIcon = solid(
  'M7 1.6h10a4.4 4.4 0 0 1 4.4 4.4v12a4.4 4.4 0 0 1-4.4 4.4H7a4.4 4.4 0 0 1-4.4-4.4V6A4.4 4.4 0 0 1 7 1.6Zm0 2.4A2 2 0 0 0 5 6v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H7Z' +
    'M5 12.8h3.5a1.2 1.2 0 0 1 1.07.66l.55 1.1a1.2 1.2 0 0 0 1.07.66h1.62a1.2 1.2 0 0 0 1.07-.66l.55-1.1a1.2 1.2 0 0 1 1.07-.66H19V18a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-5.2Z',
)

export const MoreIcon = solid(
  'M5.2 9.8a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4Zm6.8 0a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4Zm6.8 0a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4Z',
  'nonzero',
)

export const PencilIcon = solid(
  'M19.1 2.9a3 3 0 0 1 0 4.24l-1.2 1.2-4.24-4.24 1.2-1.2a3 3 0 0 1 4.24 0ZM12.25 5.5l4.25 4.25-8.4 8.4-5.2 1 1-5.2 8.35-8.45Z',
  'nonzero',
)

/** Verified server rosette. */
export function VerifiedIcon(p: P) {
  const pts = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2
    return `<circle cx="${(12 + 7.6 * Math.cos(a)).toFixed(2)}" cy="${(12 + 7.6 * Math.sin(a)).toFixed(2)}" r="2.5" />`
  }).join('')
  return (
    <Svg {...p}>
      <mask id="verified-rosette">
        <rect width="24" height="24" fill="#000" />
        <g fill="#fff" dangerouslySetInnerHTML={{ __html: `<circle cx="12" cy="12" r="7.9" />${pts}` }} />
        <path
          d="m8 12.1 2.75 2.75L16 8.9"
          stroke="#000"
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </mask>
      <rect width="24" height="24" fill="currentColor" mask="url(#verified-rosette)" />
    </Svg>
  )
}

/** A person with a plus — "create invite". */
export const AddMemberIcon = solid(
  'M10.2 3a4.4 4.4 0 1 1 0 8.8 4.4 4.4 0 0 1 0-8.8Zm0 10.4c4.1 0 7.4 2.7 7.4 6.4a1.2 1.2 0 0 1-1.2 1.2H4a1.2 1.2 0 0 1-1.2-1.2c0-3.7 3.3-6.4 7.4-6.4Zm8.6-9.6a1.1 1.1 0 0 1 1.1 1.1v2.2h2.2a1.1 1.1 0 0 1 0 2.2h-2.2v2.2a1.1 1.1 0 0 1-2.2 0V9.3h-2.2a1.1 1.1 0 0 1 0-2.2h2.2V4.9a1.1 1.1 0 0 1 1.1-1.1Z',
  'nonzero',
)

export const ServerHomeIcon = solid(
  'M12 2.6a1.6 1.6 0 0 1 1.02.37l8 6.6A1.6 1.6 0 0 1 21.6 11v8.4a2 2 0 0 1-2 2h-4.4v-6h-6.4v6H4.4a2 2 0 0 1-2-2V11a1.6 1.6 0 0 1 .58-1.23l8-6.6A1.6 1.6 0 0 1 12 2.6Z',
  'nonzero',
)

export const SparkleIcon = solid(
  'M12 2.2c.35 0 .66.24.75.58l1.02 3.82c.24.9.94 1.6 1.84 1.84l3.82 1.02a.78.78 0 0 1 0 1.5l-3.82 1.02c-.9.24-1.6.94-1.84 1.84l-1.02 3.82a.78.78 0 0 1-1.5 0l-1.02-3.82a2.6 2.6 0 0 0-1.84-1.84L4.57 10.96a.78.78 0 0 1 0-1.5l3.82-1.02c.9-.24 1.6-.94 1.84-1.84l1.02-3.82c.09-.34.4-.58.75-.58Zm6.6 12.6c.3 0 .56.2.65.49l.4 1.36c.1.35.38.63.73.73l1.36.4a.68.68 0 0 1 0 1.3l-1.36.4c-.35.1-.63.38-.73.73l-.4 1.36a.68.68 0 0 1-1.3 0l-.4-1.36a1.13 1.13 0 0 0-.73-.73l-1.36-.4a.68.68 0 0 1 0-1.3l1.36-.4c.35-.1.63-.38.73-.73l.4-1.36c.09-.29.35-.49.65-.49Z',
  'nonzero',
)

export const FolderIcon = solid(
  'M3.8 4h5.1a2 2 0 0 1 1.5.68l1.1 1.24h8.7a2 2 0 0 1 2 2v9.68a2 2 0 0 1-2 2H3.8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
  'nonzero',
)

export const SendIcon = solid(
  'M21.4 2.6a1 1 0 0 1 .22 1.08l-7 17.5a1 1 0 0 1-1.85.04l-3.1-6.9-6.9-3.1a1 1 0 0 1 .04-1.85l17.5-7a1 1 0 0 1 1.09.23Z',
  'nonzero',
)

export const VideoIcon = solid(
  'M3.4 5h11.2a2.4 2.4 0 0 1 2.4 2.4v1.9l3.7-2.44a1 1 0 0 1 1.55.84v8.62a1 1 0 0 1-1.55.84L17 14.7v1.9a2.4 2.4 0 0 1-2.4 2.4H3.4A2.4 2.4 0 0 1 1 16.6V7.4A2.4 2.4 0 0 1 3.4 5Z',
  'nonzero',
)

export const EditServerProfileIcon = PencilIcon
export const ChannelCreateIcon = PlusIcon
export const CaretIcon = ChevronDownIcon
export const ThreadsChannelIcon = ThreadsIcon

/* -------------------------------------------------- message + list actions */

export const ReplyIcon = solid(
  'M10.3 4.2a1.2 1.2 0 0 1 .38 1.98L7.65 9.2h5.55a8.6 8.6 0 0 1 8.6 8.6v1.2a1.2 1.2 0 0 1-2.4 0v-1.2a6.2 6.2 0 0 0-6.2-6.2H7.65l3.03 3.02a1.2 1.2 0 1 1-1.7 1.7l-5.1-5.1a1.2 1.2 0 0 1 0-1.7l5.1-5.1a1.2 1.2 0 0 1 1.32-.22Z',
  'nonzero',
)

/** Add a reaction: a smiley with a plus. */
export function ReactIcon(p: P) {
  return (
    <Svg {...p}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2.4a9.6 9.6 0 1 0 9.34 11.86 4.6 4.6 0 0 1-1.9.5 7.7 7.7 0 1 1-8.1-9.86 4.6 4.6 0 0 1 .5-1.9c-.28-.03-.56-.05-.84-.05Zm-3.1 6a1.45 1.45 0 1 1 0 2.9 1.45 1.45 0 0 1 0-2.9Zm6.2 0a1.45 1.45 0 1 1 0 2.9 1.45 1.45 0 0 1 0-2.9Zm-7 5.2a1.1 1.1 0 0 1 1.52.35 3.95 3.95 0 0 0 6.76 0 1.1 1.1 0 1 1 1.87 1.16 6.15 6.15 0 0 1-10.5 0 1.1 1.1 0 0 1 .35-1.51Z"
      />
      <path
        fill="currentColor"
        d="M18.6 1.6a1.1 1.1 0 0 1 1.1 1.1v1.9h1.9a1.1 1.1 0 0 1 0 2.2h-1.9v1.9a1.1 1.1 0 0 1-2.2 0V6.8h-1.9a1.1 1.1 0 0 1 0-2.2h1.9V2.7a1.1 1.1 0 0 1 1.1-1.1Z"
      />
    </Svg>
  )
}

export const TrashIcon = solid(
  'M9.2 2h5.6a1.2 1.2 0 0 1 1.2 1.2V4h4a1.1 1.1 0 0 1 0 2.2H4a1.1 1.1 0 0 1 0-2.2h4v-.8A1.2 1.2 0 0 1 9.2 2ZM5.5 7.8h13l-.86 11.36A2.4 2.4 0 0 1 15.25 21.4h-6.5a2.4 2.4 0 0 1-2.39-2.24L5.5 7.8Z',
  'nonzero',
)

export const CopyIcon = solid(
  'M8.4 2h9.2A2.4 2.4 0 0 1 20 4.4v9.2a2.4 2.4 0 0 1-2.4 2.4h-1.2v-1.6a4 4 0 0 0-4-4H6.8V4.4A2.4 2.4 0 0 1 8.4 2ZM4.4 10h8a2.4 2.4 0 0 1 2.4 2.4v7.2A2.4 2.4 0 0 1 12.4 22h-8A2.4 2.4 0 0 1 2 19.6v-7.2A2.4 2.4 0 0 1 4.4 10Z',
  'nonzero',
)

export const JumpIcon = solid(
  'M12 2.6a1.3 1.3 0 0 1 1.3 1.3v12.2l4.15-4.15a1.3 1.3 0 0 1 1.84 1.84l-6.37 6.37a1.3 1.3 0 0 1-1.84 0L4.71 13.79a1.3 1.3 0 1 1 1.84-1.84l4.15 4.15V3.9A1.3 1.3 0 0 1 12 2.6Z',
  'nonzero',
)

export const MarkReadIcon = solid(
  'M2.6 5.4a2.4 2.4 0 0 1 2.4-2.4h14a2.4 2.4 0 0 1 2.4 2.4v6.9a6.6 6.6 0 0 0-9.24 6.5H5a2.4 2.4 0 0 1-2.4-2.4V5.4Zm2.9.9a1 1 0 0 0-.6 1.8l6.5 4.7a1 1 0 0 0 1.2 0l6.5-4.7a1 1 0 0 0-1.2-1.62L12 10.7 6.1 6.48a1 1 0 0 0-.6-.18Zm12.6 6.9a4.6 4.6 0 1 1 0 9.2 4.6 4.6 0 0 1 0-9.2Zm2.2 2.9a.9.9 0 0 0-1.28 0l-1.72 1.72-.62-.62a.9.9 0 0 0-1.28 1.28l1.26 1.26a.9.9 0 0 0 1.28 0l2.36-2.36a.9.9 0 0 0 0-1.28Z',
)
