/**
 * One consistent Discord-style SVG icon set.
 *
 * Every glyph is drawn on a 24x24 grid, filled with `currentColor` (a couple
 * use round-capped strokes exactly where Discord's own icons do), and shaped
 * from the reference frame — no icon fonts, no emoji, no mixed libraries.
 */
import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement> & { size?: number }

function Svg({ size = 24, children, ...rest }: P) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

let uid = 0
const nextId = () => `i${++uid}`

export const ClydeIcon = (p: P) => (
  <Svg {...p}>
    <path
      fill="currentColor"
      d="M20.32 4.57A17.6 17.6 0 0 0 15.94 3.2a.07.07 0 0 0-.07.03c-.19.34-.4.78-.55 1.13a16.3 16.3 0 0 0-4.66 0A10.9 10.9 0 0 0 10.1 3.2a.07.07 0 0 0-.07-.03c-1.5.26-2.95.72-4.38 1.37a.06.06 0 0 0-.03.02C2.83 8.72 2.09 12.75 2.45 16.73c0 .02.02.04.04.05a17.7 17.7 0 0 0 5.36 2.7.07.07 0 0 0 .08-.02c.41-.56.78-1.16 1.1-1.78a.07.07 0 0 0-.04-.1c-.58-.22-1.14-.49-1.68-.8a.07.07 0 0 1 0-.11l.33-.26a.07.07 0 0 1 .07 0 12.6 12.6 0 0 0 10.7 0 .07.07 0 0 1 .07 0l.34.26a.07.07 0 0 1 0 .12c-.54.3-1.1.57-1.69.79a.07.07 0 0 0-.04.1c.33.62.7 1.22 1.1 1.78a.07.07 0 0 0 .08.03 17.6 17.6 0 0 0 5.37-2.71.07.07 0 0 0 .03-.05c.43-4.6-.72-8.6-3.06-12.14a.05.05 0 0 0-.03-.02ZM8.75 14.31c-1.05 0-1.92-.97-1.92-2.16 0-1.18.85-2.15 1.92-2.15 1.08 0 1.94.98 1.93 2.15 0 1.19-.86 2.16-1.93 2.16Zm7.12 0c-1.06 0-1.93-.97-1.93-2.16 0-1.18.85-2.15 1.93-2.15 1.07 0 1.94.98 1.92 2.15 0 1.19-.85 2.16-1.92 2.16Z"
    />
  </Svg>
)

const HASH_D =
  'M10.99 3.16A1 1 0 1 0 9 2.84L8.15 8H4a1 1 0 0 0 0 2h3.82l-.67 4H3a1 1 0 1 0 0 2h3.82l-.8 4.84a1 1 0 0 0 1.97.32L8.85 16h3.97l-.8 4.84a1 1 0 0 0 1.97.32l.86-5.16H19a1 1 0 1 0 0-2h-4.82l.67-4H19a1 1 0 1 0 0-2h-3.82l.8-4.84a1 1 0 1 0-1.97-.32L13.15 8H9.18l.8-4.84ZM13.15 14l.67-4H9.85l-.67 4h3.97Z'

export const HashIcon = (p: P) => (
  <Svg {...p}>
    <path fill="currentColor" d={HASH_D} />
  </Svg>
)

/** Threads: the channel hash, tipped onto its side. */
export const ThreadsIcon = (p: P) => (
  <Svg {...p}>
    <g transform="rotate(-42 12 12)" fill="currentColor">
      <rect x="6.6" y="1.9" width="4.5" height="20.2" rx="2.25" />
      <rect x="13.2" y="1.9" width="4.5" height="20.2" rx="2.25" />
      <rect x="4.6" y="7.6" width="15.4" height="2.6" rx="1.3" />
      <rect x="4" y="13.3" width="15.4" height="2.6" rx="1.3" />
    </g>
  </Svg>
)

/** Rules / guidelines channel: a checked page with a second leaf behind it. */
export const RulesIcon = (p: P) => {
  const m = nextId()
  return (
    <Svg {...p}>
      <mask id={m}>
        <rect width="24" height="24" fill="#fff" />
        <path
          d="m6.2 11.7 3.2 3.2 5.6-6"
          stroke="#000"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path d="M6 18.2h9.2" stroke="#000" strokeWidth="2.6" strokeLinecap="round" />
      </mask>
      <path
        fill="currentColor"
        d="M19.4 5.6H21a1.1 1.1 0 0 1 1.1 1.1v13.5a1.1 1.1 0 0 1-1.1 1.1H8a1.1 1.1 0 0 1-1.1-1.1v-1.3h10.3a2.2 2.2 0 0 0 2.2-2.2V5.6Z"
      />
      <rect
        x="1.5"
        y="1.9"
        width="16.2"
        height="18.8"
        rx="2.6"
        fill="currentColor"
        mask={`url(#${m})`}
      />
    </Svg>
  )
}

/** Announcement channel: a megaphone pointing left. */
export const MegaphoneIcon = (p: P) => {
  const m = nextId()
  return (
    <Svg {...p}>
      <mask id={m}>
        <rect width="24" height="24" fill="#fff" />
        <circle cx="9.2" cy="16.6" r="1.5" fill="#000" />
      </mask>
      <g mask={`url(#${m})`}>
        <rect x="2.2" y="9.2" width="4" height="5.8" rx="1.8" fill="currentColor" />
        <path
          fill="currentColor"
          d="M18.6 4.2c1.3-.5 2.4.3 2.4 1.5v12.6c0 1.3-1.1 2-2.4 1.6l-2.9-1.1v-2.3c0-.6-.4-1-1-1h-2.3l-6.3-2.4V9.9l6.3-2.4h2.3c.6 0 1-.4 1-1V4.2l2.9 1Z"
        />
        <path
          fill="currentColor"
          d="M6.6 15.6 12 17.6v1.3a2 2 0 0 1-2 2H8.6a2 2 0 0 1-2-2v-3.3Z"
        />
      </g>
    </Svg>
  )
}

/** Forum channel: two overlapping speech bubbles. */
export const ForumIcon = (p: P) => {
  const m = nextId()
  return (
    <Svg {...p}>
      <mask id={m}>
        <rect width="24" height="24" fill="#fff" />
        <circle cx="15.4" cy="15.4" r="8" fill="#000" />
      </mask>
      <path
        fill="currentColor"
        mask={`url(#${m})`}
        d="M9.6 1.8a7.8 7.8 0 0 1 7.6 9.4 7 7 0 0 0-6 6H3.3a1.2 1.2 0 0 1-.9-2l1.5-1.6A7.8 7.8 0 0 1 9.6 1.8Z"
      />
      <path
        fill="currentColor"
        d="M15.6 9.9a6.2 6.2 0 0 1 4.7 10.2l1 1.1c.4.5.1 1.2-.6 1.2h-5.1a6.2 6.2 0 1 1 0-12.5Z"
      />
    </Svg>
  )
}

export const AddMemberIcon = (p: P) => (
  <Svg {...p}>
    <path
      fill="currentColor"
      d="M10 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM2 19.4C2 16.2 5.6 14 10 14c1 0 2 .1 2.9.3a5.5 5.5 0 0 0 4 6.7H3.2a1.2 1.2 0 0 1-1.2-1.2v-.4Z"
    />
    <path
      fill="currentColor"
      d="M18.5 12.5a1 1 0 0 1 1 1V15H21a1 1 0 1 1 0 2h-1.5v1.5a1 1 0 1 1-2 0V17H16a1 1 0 1 1 0-2h1.5v-1.5a1 1 0 0 1 1-1Z"
    />
  </Svg>
)

/** Browse channels: a stack of rules with a magnifier over the last of them. */
export const BrowseChannelsIcon = (p: P) => {
  const m = nextId()
  return (
    <Svg {...p}>
      <mask id={m}>
        <rect width="24" height="24" fill="#fff" />
        <circle cx="16.4" cy="16.4" r="5.4" fill="#000" />
      </mask>
      <g mask={`url(#${m})`} stroke="currentColor" strokeWidth="2.1" strokeLinecap="round">
        <path d="M3.2 4.6h17.6M3.2 9.2h17.6M3.2 13.8h10.4M3.2 18.4h8.4" />
      </g>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M16.3 11.6a4.7 4.7 0 1 0 2.6 8.6l1.8 1.8a1 1 0 0 0 1.4-1.4l-1.8-1.8a4.7 4.7 0 0 0-4-7.2Zm-2.7 4.7a2.7 2.7 0 1 1 5.4 0 2.7 2.7 0 0 1-5.4 0Z"
        clipRule="evenodd"
      />
    </Svg>
  )
}

/** Discord's carets are thin round-capped strokes, not solid triangles. */
export const ChevronDownIcon = (p: P) => (
  <Svg {...p}>
    <path
      d="m5.5 9 6.5 6.4L18.5 9"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
)

export const ChevronRightIcon = (p: P) => (
  <Svg {...p}>
    <path
      d="m9 5.5 6.4 6.5L9 18.5"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
)

/** Scalloped "server home" rosette with a house cut into it. */
export const ServerHomeIcon = (p: P) => (
  <Svg {...p}>
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M11.03 1.4a1.4 1.4 0 0 1 1.94 0l.9.87c.28.27.66.4 1.04.36l1.25-.12a1.4 1.4 0 0 1 1.5 1.09l.28 1.22c.08.37.33.68.68.83l1.15.5a1.4 1.4 0 0 1 .74 1.8l-.46 1.17c-.14.35-.1.75.1 1.07l.67 1.06a1.4 1.4 0 0 1-.34 1.9l-1 .74c-.31.23-.49.6-.48.98l.04 1.25a1.4 1.4 0 0 1-1.32 1.44l-1.25.07c-.38.02-.72.23-.92.55l-.65 1.07a1.4 1.4 0 0 1-1.83.54l-1.12-.56a1.2 1.2 0 0 0-1.08 0l-1.12.56a1.4 1.4 0 0 1-1.83-.54l-.65-1.07a1.2 1.2 0 0 0-.92-.55l-1.25-.07a1.4 1.4 0 0 1-1.32-1.44l.04-1.25a1.2 1.2 0 0 0-.48-.98l-1-.74a1.4 1.4 0 0 1-.34-1.9l.67-1.06c.2-.32.24-.72.1-1.07l-.46-1.17a1.4 1.4 0 0 1 .74-1.8l1.15-.5c.35-.15.6-.46.68-.83l.28-1.22a1.4 1.4 0 0 1 1.5-1.09l1.25.12c.38.04.76-.09 1.03-.36l.91-.87Zm1.6 4.32a1 1 0 0 0-1.26 0l-4 3.2A1 1 0 0 0 7 9.7v5.3a1 1 0 0 0 1 1h1.5v-3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v3H16a1 1 0 0 0 1-1V9.7a1 1 0 0 0-.37-.78l-4-3.2Z"
      clipRule="evenodd"
    />
  </Svg>
)

/** Muted-channel bell: bell shape, knocked through by the slash. */
export const BellOffIcon = (p: P) => {
  const m = nextId()
  return (
    <Svg {...p}>
      <mask id={m}>
        <rect width="24" height="24" fill="#fff" />
        <path
          d="M3.6 20.4 20.4 3.6"
          stroke="#000"
          strokeWidth="4.4"
          strokeLinecap="round"
        />
      </mask>
      <g mask={`url(#${m})`}>
        <path
          fill="currentColor"
          d="M12 2.2c-3.9 0-7 3.1-7 7v3.4l-1.5 2.8a1.3 1.3 0 0 0 1.2 2h14.6a1.3 1.3 0 0 0 1.2-2L19 12.6V9.2c0-3.9-3.1-7-7-7Z"
        />
        <path fill="currentColor" d="M9.3 19a2.7 2.7 0 0 0 5.4 0H9.3Z" />
      </g>
      <path
        d="M4.4 19.6 19.6 4.4"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </Svg>
  )
}

export const PinIcon = (p: P) => (
  <Svg {...p}>
    <path
      fill="currentColor"
      d="m13.1 3.3 7.6 7.6a1.3 1.3 0 0 1-1.2 2.2l-2.4-.5-2.9 2.9.4 2.3a1.4 1.4 0 0 1-2.3 1.3l-3-3-4.3 4.3a1 1 0 0 1-1.4-1.4l4.3-4.3-3-3a1.4 1.4 0 0 1 1.3-2.3l2.3.4 2.9-2.9-.5-2.4a1.3 1.3 0 0 1 2.2-1.2Z"
    />
  </Svg>
)

export const MembersIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="17.2" cy="6.6" r="3.5" fill="currentColor" />
    <path
      fill="currentColor"
      d="M16.9 12.2c3.1.3 5.1 2.1 5.1 4.6v.9c0 .7-.5 1.2-1.2 1.2h-2.3v-1c0-2.2-.9-4.1-2.4-5.4l.8-.3Z"
    />
    <circle cx="9.6" cy="7.5" r="4.3" fill="currentColor" />
    <path
      fill="currentColor"
      d="M9.6 13.7c4.3 0 7.7 2.2 7.7 5.3v.5c0 .8-.6 1.4-1.4 1.4H3.3c-.8 0-1.4-.6-1.4-1.4V19c0-3.1 3.4-5.3 7.7-5.3Z"
    />
  </Svg>
)

export const SearchIcon = (p: P) => (
  <Svg {...p}>
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M15.62 17.03a9 9 0 1 1 1.41-1.41l4.68 4.67a1 1 0 0 1-1.42 1.42l-4.67-4.68ZM17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
      clipRule="evenodd"
    />
  </Svg>
)

export const InboxIcon = (p: P) => (
  <Svg {...p}>
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M5.42 3.62A2 2 0 0 1 7.3 2.3h9.4a2 2 0 0 1 1.88 1.32l3.3 9.06a2 2 0 0 1 .12.68v6.14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6.14a2 2 0 0 1 .12-.68l3.3-9.06ZM7.65 4.6l-2.9 7.9h2.83a1 1 0 0 1 .93.64l.72 1.86h5.54l.72-1.86a1 1 0 0 1 .93-.64h2.84l-2.9-7.9H7.65Z"
      clipRule="evenodd"
    />
  </Svg>
)

export const HelpIcon = (p: P) => (
  <Svg {...p}>
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm.28 4.3c-1.9 0-3.16.9-3.66 2.25-.16.44.14.9.6.98l.6.11c.4.07.77-.15.97-.5.27-.5.72-.8 1.4-.8.86 0 1.4.48 1.4 1.15 0 .6-.3.94-1.2 1.55-.98.65-1.4 1.32-1.35 2.4v.13c.02.44.38.78.82.78h.55c.45 0 .82-.37.82-.82v-.03c0-.62.25-.96 1.19-1.58 1-.66 1.6-1.44 1.6-2.62 0-1.75-1.44-3-3.74-3ZM12 15.8a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6Z"
      clipRule="evenodd"
    />
  </Svg>
)

/** Mic with a slash cut through it — Discord's muted state. */
export const MicOffIcon = (p: P) => {
  const m = nextId()
  return (
    <Svg {...p}>
      <mask id={m}>
        <rect width="24" height="24" fill="#fff" />
        <path
          d="M3.8 20.2 20.2 3.8"
          stroke="#000"
          strokeWidth="4.2"
          strokeLinecap="round"
        />
      </mask>
      <g mask={`url(#${m})`}>
        <rect x="8.9" y="2.2" width="6.2" height="11.6" rx="3.1" fill="currentColor" />
        <path
          fill="currentColor"
          d="M6 10.6a1 1 0 0 1 2 0 4 4 0 0 0 8 0 1 1 0 1 1 2 0 6 6 0 0 1-5 5.92V19h2.2a1 1 0 1 1 0 2H8.8a1 1 0 1 1 0-2H11v-2.48a6 6 0 0 1-5-5.92Z"
        />
      </g>
      <path
        d="M4.6 19.4 19.4 4.6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </Svg>
  )
}

export const MicIcon = (p: P) => (
  <Svg {...p}>
    <rect x="8.9" y="2.2" width="6.2" height="11.6" rx="3.1" fill="currentColor" />
    <path
      fill="currentColor"
      d="M6 10.6a1 1 0 0 1 2 0 4 4 0 0 0 8 0 1 1 0 1 1 2 0 6 6 0 0 1-5 5.92V19h2.2a1 1 0 1 1 0 2H8.8a1 1 0 1 1 0-2H11v-2.48a6 6 0 0 1-5-5.92Z"
    />
  </Svg>
)

export const HeadphonesIcon = (p: P) => (
  <Svg {...p}>
    <path
      d="M4.6 15.2v-3.1a7.4 7.4 0 0 1 14.8 0v3.1"
      stroke="currentColor"
      strokeWidth="2.7"
      strokeLinecap="round"
      fill="none"
    />
    <rect x="2.6" y="12.5" width="5.2" height="8.7" rx="2.6" fill="currentColor" />
    <rect x="16.2" y="12.5" width="5.2" height="8.7" rx="2.6" fill="currentColor" />
  </Svg>
)

export const GearIcon = (p: P) => {
  const m = nextId()
  return (
    <Svg {...p}>
      <mask id={m}>
        <rect width="24" height="24" fill="#fff" />
        <circle cx="12" cy="12" r="3.4" fill="#000" />
      </mask>
      <g mask={`url(#${m})`} fill="currentColor">
        <circle cx="12" cy="12" r="7.1" />
        {[0, 45, 90, 135].map((a) => (
          <rect
            key={a}
            x="10.1"
            y="2.1"
            width="3.8"
            height="19.8"
            rx="1.3"
            transform={`rotate(${a} 12 12)`}
          />
        ))}
      </g>
    </Svg>
  )
}

export const PlusIcon = (p: P) => (
  <Svg {...p}>
    <path
      fill="currentColor"
      d="M13 3a1 1 0 1 0-2 0v8H3a1 1 0 1 0 0 2h8v8a1 1 0 1 0 2 0v-8h8a1 1 0 1 0 0-2h-8V3Z"
    />
  </Svg>
)

export const SmileyIcon = (p: P) => (
  <Svg {...p}>
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM8.75 10.5a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Zm7.75-1.25a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Zm-8.4 4.4a1 1 0 0 1 1.4.15 3.2 3.2 0 0 0 5 0 1 1 0 1 1 1.55 1.26 5.2 5.2 0 0 1-8.1 0 1 1 0 0 1 .15-1.4Z"
      clipRule="evenodd"
    />
  </Svg>
)

export const CompassIcon = (p: P) => (
  <Svg {...p}>
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.2 5.1-2.06 5.5a1.5 1.5 0 0 1-.88.88l-5.5 2.06a.5.5 0 0 1-.65-.65l2.06-5.5c.16-.42.47-.73.88-.88l5.5-2.06a.5.5 0 0 1 .65.65ZM12 13.2a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4Z"
      clipRule="evenodd"
    />
  </Svg>
)

/** The four-point sparkle Discord puts beside a highlighted category. */
export const SparkleIcon = (p: P) => (
  <Svg {...p}>
    <path
      fill="currentColor"
      d="M12 1.2c.5 4.7 3 7.7 9.4 10.1a.75.75 0 0 1 0 1.4C15 15.1 12.5 18.1 12 22.8c-.5-4.7-3-7.7-9.4-10.1a.75.75 0 0 1 0-1.4C9 8.9 11.5 5.9 12 1.2Z"
    />
  </Svg>
)

export const CheckIcon = (p: P) => (
  <Svg {...p}>
    <path
      fill="currentColor"
      d="M20.7 6.3a1 1 0 0 1 0 1.4l-10 10a1 1 0 0 1-1.4 0l-5-5a1 1 0 1 1 1.4-1.4l4.3 4.29 9.3-9.3a1 1 0 0 1 1.4 0Z"
    />
  </Svg>
)

export const CloseIcon = (p: P) => (
  <Svg {...p}>
    <path
      fill="currentColor"
      d="M18.7 5.3a1 1 0 0 0-1.4 0L12 10.58 6.7 5.3a1 1 0 0 0-1.4 1.42L10.58 12 5.3 17.3a1 1 0 1 0 1.4 1.4L12 13.42l5.3 5.3a1 1 0 0 0 1.4-1.42L13.42 12l5.3-5.3a1 1 0 0 0 0-1.4Z"
    />
  </Svg>
)

/* ------------------------------------------------------------- additions */

/** Notification bell (unmuted). */
export const BellIcon = (p: P) => (
  <Svg {...p}>
    <path
      fill="currentColor"
      d="M12 2.2c-3.9 0-7 3.1-7 7v3.4l-1.5 2.8a1.3 1.3 0 0 0 1.2 2h14.6a1.3 1.3 0 0 0 1.2-2L19 12.6V9.2c0-3.9-3.1-7-7-7Z"
    />
    <path fill="currentColor" d="M9.3 19a2.7 2.7 0 0 0 5.4 0H9.3Z" />
  </Svg>
)

/** Overflow "..." button. */
export const MoreIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="5.2" cy="12" r="2.1" fill="currentColor" />
    <circle cx="12" cy="12" r="2.1" fill="currentColor" />
    <circle cx="18.8" cy="12" r="2.1" fill="currentColor" />
  </Svg>
)

/** Voice channel speaker. */
export const SpeakerIcon = (p: P) => (
  <Svg {...p}>
    <path
      fill="currentColor"
      d="M11.4 3.3a1 1 0 0 1 .6.9v15.6a1 1 0 0 1-1.63.78L6.3 17H3.5A1.5 1.5 0 0 1 2 15.5v-7A1.5 1.5 0 0 1 3.5 7h2.8l4.07-3.58a1 1 0 0 1 1.03-.12Z"
    />
    <path
      d="M15.6 8.4a5 5 0 0 1 0 7.2M18.4 5.6a9 9 0 0 1 0 12.8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
  </Svg>
)

export const CalendarIcon = (p: P) => (
  <Svg {...p}>
    <path
      fill="currentColor"
      d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v2H3V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1ZM3 10h18v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9Zm4 3a1 1 0 1 0 0 2h2a1 1 0 1 0 0-2H7Zm6 0a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-4Zm-6 4a1 1 0 1 0 0 2h2a1 1 0 1 0 0-2H7Zm6 0a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-4Z"
    />
  </Svg>
)

export const FolderIcon = (p: P) => (
  <Svg {...p}>
    <path
      fill="currentColor"
      d="M3 6a2 2 0 0 1 2-2h4.2a2 2 0 0 1 1.5.7l1.1 1.3H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z"
    />
  </Svg>
)

/** Server verified rosette. */
export const VerifiedIcon = (p: P) => (
  <Svg {...p}>
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M11.03 1.4a1.4 1.4 0 0 1 1.94 0l.9.87c.28.27.66.4 1.04.36l1.25-.12a1.4 1.4 0 0 1 1.5 1.09l.28 1.22c.08.37.33.68.68.83l1.15.5a1.4 1.4 0 0 1 .74 1.8l-.46 1.17c-.14.35-.1.75.1 1.07l.67 1.06a1.4 1.4 0 0 1-.34 1.9l-1 .74c-.31.23-.49.6-.48.98l.04 1.25a1.4 1.4 0 0 1-1.32 1.44l-1.25.07c-.38.02-.72.23-.92.55l-.65 1.07a1.4 1.4 0 0 1-1.83.54l-1.12-.56a1.2 1.2 0 0 0-1.08 0l-1.12.56a1.4 1.4 0 0 1-1.83-.54l-.65-1.07a1.2 1.2 0 0 0-.92-.55l-1.25-.07a1.4 1.4 0 0 1-1.32-1.44l.04-1.25a1.2 1.2 0 0 0-.48-.98l-1-.74a1.4 1.4 0 0 1-.34-1.9l.67-1.06c.2-.32.24-.72.1-1.07l-.46-1.17a1.4 1.4 0 0 1 .74-1.8l1.15-.5c.35-.15.6-.46.68-.83l.28-1.22a1.4 1.4 0 0 1 1.5-1.09l1.25.12c.38.04.76-.09 1.03-.36l.91-.87Zm5.38 6.9a1 1 0 0 1 .1 1.4l-5.2 6a1 1 0 0 1-1.46.05l-2.8-2.8a1 1 0 1 1 1.4-1.4l2.04 2.03 4.51-5.2a1 1 0 0 1 1.41-.08Z"
      clipRule="evenodd"
    />
  </Svg>
)

export const GiftIcon = (p: P) => (
  <Svg {...p}>
    <path
      fill="currentColor"
      d="M12 6.2c-.6-1.4-1.5-2.9-3-3.5-1.8-.7-3.6.3-3.9 2-.2 1 .2 1.9.9 2.5H4a2 2 0 0 0-2 2v1.6c0 .6.4 1 1 1h8V6.2Zm1.9 0h-.9v5.6h8c.6 0 1-.4 1-1V9.2a2 2 0 0 0-2-2h-2c.7-.6 1.1-1.5.9-2.5-.3-1.7-2.1-2.7-3.9-2-1.1.4-1.9 1.4-2.5 2.5.2.3.3.7.4 1ZM3.6 13.4V19a2 2 0 0 0 2 2H11v-7.6H3.6Zm9.4 0V21h5.4a2 2 0 0 0 2-2v-5.6H13Z"
    />
  </Svg>
)

export const GifIcon = (p: P) => (
  <Svg {...p}>
    <rect
      x="2.2"
      y="4.6"
      width="19.6"
      height="14.8"
      rx="3"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <path
      fill="currentColor"
      d="M9.1 11.3H7.4c-.1-.5-.5-.8-1.1-.8-.8 0-1.3.6-1.3 1.6s.5 1.6 1.4 1.6c.6 0 1-.3 1.1-.8h-1v-1h2.6v.9c0 1.4-1 2.4-2.7 2.4-1.8 0-3-1.2-3-3.1s1.2-3.1 3-3.1c1.5 0 2.5.8 2.7 2.3Zm1.5-2.2h1.6v6h-1.6v-6Zm3 0h4.2v1.4h-2.6v1.1h2.3v1.3h-2.3v2.2h-1.6v-6Z"
    />
  </Svg>
)

export const StickerIcon = (p: P) => (
  <Svg {...p}>
    <path
      fill="currentColor"
      d="M4 3.5h16a1.5 1.5 0 0 1 1.5 1.5v8.2h-4.6a3.7 3.7 0 0 0-3.7 3.7v4.6H4A1.5 1.5 0 0 1 2.5 20V5A1.5 1.5 0 0 1 4 3.5Zm10.7 17.7v-4a2.5 2.5 0 0 1 2.5-2.5h4l-6.5 6.5Z"
    />
  </Svg>
)

/** Apps / activities launcher. */
export const AppsIcon = (p: P) => (
  <Svg {...p}>
    <path
      fill="currentColor"
      d="M7.5 3a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Zm9 11a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Zm-9 0a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Zm9-11a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z"
    />
  </Svg>
)

export const SendIcon = (p: P) => (
  <Svg {...p}>
    <path
      fill="currentColor"
      d="M3.2 4.3c-.5-.9.4-1.9 1.3-1.5l16.2 7.3c.9.4.9 1.6 0 2l-16.2 7.3c-.9.4-1.8-.6-1.3-1.5L6.6 12 3.2 4.3Z"
    />
  </Svg>
)

export const VideoIcon = (p: P) => (
  <Svg {...p}>
    <path
      fill="currentColor"
      d="M4 6h9a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm13.2 4.3 3.4-2.4a.9.9 0 0 1 1.4.7v6.8a.9.9 0 0 1-1.4.7l-3.4-2.4v-3.4Z"
    />
  </Svg>
)

export const MinimizeIcon = (p: P) => (
  <Svg {...p}>
    <path d="M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
)

export const MaximizeIcon = (p: P) => (
  <Svg {...p}>
    <rect
      x="5.5"
      y="5.5"
      width="13"
      height="13"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.8"
      fill="none"
    />
  </Svg>
)

/** Download / desktop-app rail button. */
export const DownloadIcon = (p: P) => (
  <Svg {...p}>
    <path
      fill="currentColor"
      d="M12 2a1 1 0 0 1 1 1v10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-5 5a1 1 0 0 1-1.4 0l-5-5a1 1 0 1 1 1.4-1.4l3.3 3.3V3a1 1 0 0 1 1-1ZM4 18a1 1 0 0 1 1 1v1h14v-1a1 1 0 1 1 2 0v1.5A1.5 1.5 0 0 1 19.5 22h-15A1.5 1.5 0 0 1 3 20.5V19a1 1 0 0 1 1-1Z"
    />
  </Svg>
)

/** Server boosts (the "rocket in a shield" mark). */
export const BoostIcon = (p: P) => (
  <Svg {...p}>
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M12 1.6 3 6v6.2c0 5 3.7 9.2 9 10.2 5.3-1 9-5.2 9-10.2V6l-9-4.4Zm0 3.9 5.2 5.2-1.4 1.4-2.8-2.8v7.3h-2V9.3l-2.8 2.8-1.4-1.4L12 5.5Z"
      clipRule="evenodd"
    />
  </Svg>
)

/** Window "expand / restore" control from the title bar. */
export const ExpandIcon = (p: P) => (
  <Svg {...p}>
    <path
      fill="currentColor"
      d="M4 4h6v2H6.4l4.3 4.3-1.4 1.4L5 7.4V11H3V5a1 1 0 0 1 1-1Zm10 0h6a1 1 0 0 1 1 1v6h-2V7.4l-4.3 4.3-1.4-1.4L17.6 6H14V4ZM3 13h2v3.6l4.3-4.3 1.4 1.4L6.4 18H10v2H4a1 1 0 0 1-1-1v-6Zm16 0h2v6a1 1 0 0 1-1 1h-6v-2h3.6l-4.3-4.3 1.4-1.4L19 16.6V13Z"
    />
  </Svg>
)

/** Pencil, used by Edit Profile / Edit Channel. */
export const PencilIcon = (p: P) => (
  <Svg {...p}>
    <path
      fill="currentColor"
      d="M19.3 3.3a2.5 2.5 0 0 1 3.5 3.5l-1.3 1.3-3.5-3.5 1.3-1.3ZM16.6 6l3.5 3.5-9.6 9.6-4.4.9.9-4.4L16.6 6Z"
    />
  </Svg>
)
