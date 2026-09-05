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

export const ClydeIcon = (p: P) => (
  <Svg {...p}>
    <path
      fill="currentColor"
      d="M20.32 4.57A17.6 17.6 0 0 0 15.94 3.2a.07.07 0 0 0-.07.03c-.19.34-.4.78-.55 1.13a16.3 16.3 0 0 0-4.66 0A10.9 10.9 0 0 0 10.1 3.2a.07.07 0 0 0-.07-.03c-1.5.26-2.95.72-4.38 1.37a.06.06 0 0 0-.03.02C2.83 8.72 2.09 12.75 2.45 16.73c0 .02.02.04.04.05a17.7 17.7 0 0 0 5.36 2.7.07.07 0 0 0 .08-.02c.41-.56.78-1.16 1.1-1.78a.07.07 0 0 0-.04-.1c-.58-.22-1.14-.49-1.68-.8a.07.07 0 0 1 0-.11l.33-.26a.07.07 0 0 1 .07 0 12.6 12.6 0 0 0 10.7 0 .07.07 0 0 1 .07 0l.34.26a.07.07 0 0 1 0 .12c-.54.3-1.1.57-1.69.79a.07.07 0 0 0-.04.1c.33.62.7 1.22 1.1 1.78a.07.07 0 0 0 .08.03 17.6 17.6 0 0 0 5.37-2.71.07.07 0 0 0 .03-.05c.43-4.6-.72-8.6-3.06-12.14a.05.05 0 0 0-.03-.02ZM8.75 14.31c-1.05 0-1.92-.97-1.92-2.16 0-1.18.85-2.15 1.92-2.15 1.08 0 1.94.98 1.93 2.15 0 1.19-.86 2.16-1.93 2.16Zm7.12 0c-1.06 0-1.93-.97-1.93-2.16 0-1.18.85-2.15 1.93-2.15 1.07 0 1.94.98 1.92 2.15 0 1.19-.85 2.16-1.92 2.16Z"
    />
  </Svg>
)

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


/**
 * Threads (channel header).
 *
 * Discord's 2025 header glyph: a four-bar comb tilted 45 degrees. The icon set
 * we generate from ships the older hash-and-speech-bubble threads icon, so this
 * one is drawn here, its geometry fitted to the reference frame (bar lengths,
 * thickness and spacing measured off the 17px glyph).
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

/**
 * Browse Channels (sidebar).
 *
 * The 2025 glyph: a stack of four rules with a magnifier over the lower right.
 * The generated set ships the older hash-and-magnifier version.
 */
export const BrowseChannelsIcon = (p: P) => (
  <Svg {...p}>
    <g fill="currentColor">
      <rect x="2.5" y="4" width="19" height="2.2" rx="1.1" />
      <rect x="2.5" y="8.3" width="19" height="2.2" rx="1.1" />
      <rect x="2.5" y="12.6" width="13" height="2.2" rx="1.1" />
      <rect x="2.5" y="16.9" width="9" height="2.2" rx="1.1" />
    </g>
    <circle cx="16.6" cy="16.6" r="3.6" stroke="currentColor" strokeWidth="2.1" />
    <path
      d="m19.5 19.5 2.2 2.2"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
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
export const MoreIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="5.2" cy="12" r="2.1" fill="currentColor" />
    <circle cx="12" cy="12" r="2.1" fill="currentColor" />
    <circle cx="18.8" cy="12" r="2.1" fill="currentColor" />
  </Svg>
)

/** Voice channel speaker. */
export const FolderIcon = (p: P) => (
  <Svg {...p}>
    <path
      fill="currentColor"
      d="M3 6a2 2 0 0 1 2-2h4.2a2 2 0 0 1 1.5.7l1.1 1.3H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z"
    />
  </Svg>
)

/** Server verified rosette. */
/**
 * Verified server rosette (shown beside the server name).
 *
 * A twelve-lobed disc with the check knocked out, so the scallops stay crisp
 * at the 15px the sidebar header renders it at.
 */
export const VerifiedIcon = (p: P) => (
  <Svg {...p}>
    <mask id="verified-check">
      <rect width="24" height="24" fill="#000" />
      <g fill="#fff">
        <circle cx="12" cy="12" r="7.7" />
        <circle cx="19.60" cy="12.00" r="2.2" />
        <circle cx="18.58" cy="15.80" r="2.2" />
        <circle cx="15.80" cy="18.58" r="2.2" />
        <circle cx="12.00" cy="19.60" r="2.2" />
        <circle cx="8.20" cy="18.58" r="2.2" />
        <circle cx="5.42" cy="15.80" r="2.2" />
        <circle cx="4.40" cy="12.00" r="2.2" />
        <circle cx="5.42" cy="8.20" r="2.2" />
        <circle cx="8.20" cy="5.42" r="2.2" />
        <circle cx="12.00" cy="4.40" r="2.2" />
        <circle cx="15.80" cy="5.42" r="2.2" />
        <circle cx="18.58" cy="8.20" r="2.2" />
      </g>
      <path
        d="m8.1 12.1 2.7 2.7 5.1-5.6"
        stroke="#000"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </mask>
    <rect width="24" height="24" fill="currentColor" mask="url(#verified-check)" />
  </Svg>
)

/** Add a Server: a filled disc with the plus knocked out of it. */
export const AddServerIcon = (p: P) => (
  <Svg {...p}>
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M12 2.2a9.8 9.8 0 1 0 0 19.6 9.8 9.8 0 0 0 0-19.6Zm1.15 5.05a1.15 1.15 0 0 0-2.3 0v3.6h-3.6a1.15 1.15 0 0 0 0 2.3h3.6v3.6a1.15 1.15 0 0 0 2.3 0v-3.6h3.6a1.15 1.15 0 0 0 0-2.3h-3.6v-3.6Z"
      clipRule="evenodd"
    />
  </Svg>
)

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

/* ---------------------------------------------------------------------------
   Discord's own icons, generated from totallytavi/discord-app-icons
   (2023/tabs-v1). Re-exported here so components import from one place.
   ------------------------------------------------------------------------ */
export {
  HashIcon,
  SpeakerIcon,
  MegaphoneIcon,
  ForumIcon,
  RulesIcon,
  StageIcon,
  EventsIcon,
  EventsIcon as CalendarIcon,
  BrowseChannelsIcon as BrowseChannelsTabIcon,
  MembersIcon,
  BellIcon,
  BellOffIcon,
  PinIcon,
  ThreadsChannelIcon,
  SearchIcon,
  InboxIcon,
  GearIcon,
  MicIcon,
  MicOffIcon,
  HeadphonesIcon,
  HeadphonesOffIcon,
  AddMemberIcon,
  BoostIcon,
  ChannelCreateIcon,
  CaretIcon,
  GiftIcon,
  GifIcon,
  StickerIcon,
  DownloadIcon,
  EditServerProfileIcon,
} from './DiscordIcons'
