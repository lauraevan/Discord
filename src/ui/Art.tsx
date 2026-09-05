/**
 * Hand-built SVG artwork: the character avatars and object server icons.
 * Nothing here is traced from a screenshot — each is drawn from primitives,
 * parameterised so a whole cast can share one drawing routine.
 */

export type Palette = {
  bg1: string
  bg2: string
  skin: string
  hair: string
  shirt: string
  accent?: string
}

let seq = 0
const gid = () => `g${++seq}`

/**
 * A Discord-style character portrait: gradient disc, shoulders, head, hair.
 * `variant` shifts the hair silhouette so the cast reads as distinct people.
 */
export function CharacterAvatar({
  p,
  variant = 0,
  glasses = false,
}: {
  p: Palette
  variant?: number
  glasses?: boolean
}) {
  const id = gid()
  return (
    <svg viewBox="0 0 48 48" className="art" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={p.bg1} />
          <stop offset="1" stopColor={p.bg2} />
        </linearGradient>
        <clipPath id={id + 'c'}>
          <rect width="48" height="48" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}c)`}>
        <rect width="48" height="48" fill={`url(#${id})`} />
        {/* shoulders */}
        <path
          d="M6 48c1.4-8.2 8.2-12.4 18-12.4S40.6 39.8 42 48Z"
          fill={p.shirt}
        />
        <path d="M20 34h8v5l-4 3-4-3Z" fill={p.skin} opacity=".9" />
        {/* head */}
        <ellipse cx="24" cy="24.5" rx="9.4" ry="10.4" fill={p.skin} />
        {/* hair */}
        {variant === 0 && (
          <path
            d="M13.6 24c-.6-7 4.2-11.6 10.4-11.6S35 17 34.4 24c-.8-3-2.6-4.8-5.4-5.6-2.6-.8-4.8.6-8 .2-2.4-.3-4.4 1.6-5.6 5.4h-1.8Z"
            fill={p.hair}
          />
        )}
        {variant === 1 && (
          <>
            <path
              d="M13.4 25c-.8-7.4 4-12.2 10.6-12.2S35.4 17.6 34.6 25c-1.2-1-1.8-3-2-5.2-3 1.8-9.8 2-13.6.4-.4 2.2-1.4 3.8-2.8 4.8h-2.8Z"
              fill={p.hair}
            />
            <circle cx="15" cy="15" r="2.2" fill={p.hair} />
            <circle cx="33" cy="15" r="2.2" fill={p.hair} />
            <circle cx="19" cy="11.5" r="2.4" fill={p.hair} />
            <circle cx="29" cy="11.5" r="2.4" fill={p.hair} />
            <circle cx="24" cy="10.4" r="2.6" fill={p.hair} />
          </>
        )}
        {variant === 2 && (
          <>
            <path
              d="M12.8 26c-1-8 4-13.4 11.2-13.4S36.2 18 35.2 26c-1.6-1.4-2-4-2.2-6.6-4 2.4-11 2.6-15.6.6-.2 2.6-.8 4.6-2 6h-2.6Z"
              fill={p.hair}
            />
            <path d="M31 9c4 1.6 5.6 5 5.2 9-1.6-3.4-3.4-5.6-5.2-9Z" fill={p.hair} />
          </>
        )}
        {variant === 3 && (
          <>
            <path
              d="M13 23.5C12.4 15 17.8 10.6 24 10.6S35.6 15 35 23.5c-1.4-2.2-1.6-5-1.8-7.6-4.6 3-12.2 3.2-16.6.8-.2 2.6-1.2 5-2.6 6.8H13Z"
              fill={p.hair}
            />
            <path d="M9.5 22.5c1.6-8 6.6-12 14.5-12v3c-6 0-10.4 3.4-11.8 9h-2.7Z" fill={p.hair} />
          </>
        )}
        {variant === 4 && (
          <path
            d="M13.6 26c-1-8.6 3.8-14 10.4-14s11.4 5.4 10.4 14c-1.4-2-1.6-5.2-1.8-8-3.4 3.6-13.6 3.8-17.2.6-.2 3-.6 5.4-1.8 7.4Z"
            fill={p.hair}
          />
        )}
        {/* face */}
        <ellipse cx="20.4" cy="24.6" rx="1.25" ry="1.5" fill="#2b2130" />
        <ellipse cx="27.6" cy="24.6" rx="1.25" ry="1.5" fill="#2b2130" />
        <path
          d="M21.4 29.2c1.6 1.1 3.6 1.1 5.2 0"
          stroke="#2b2130"
          strokeWidth="1.1"
          strokeLinecap="round"
          fill="none"
        />
        {glasses && (
          <g stroke="#f4f4f8" strokeWidth="1.1" fill="none">
            <circle cx="20.4" cy="24.4" r="3.1" />
            <circle cx="27.8" cy="24.4" r="3.1" />
            <path d="M23.5 24.2h1.2M13.6 23.4l3.7.6M34.4 23.4l-3.7.6" />
          </g>
        )}
      </g>
    </svg>
  )
}

export const palettes: Record<string, Palette> = {
  witch: { bg1: '#4bd07f', bg2: '#2ea45c', skin: '#f0c9b0', hair: '#241a2e', shirt: '#7a6bd8' },
  locke: { bg1: '#f472b6', bg2: '#d6337a', skin: '#8d5a3c', hair: '#2a1a14', shirt: '#dfe4f2' },
  graggle: { bg1: '#6f63d8', bg2: '#3b2f9e', skin: '#e2a98a', hair: '#1e1524', shirt: '#cfd6ee' },
  phibi: { bg1: '#5b8ff0', bg2: '#3358c4', skin: '#f2c6a8', hair: '#e8557d', shirt: '#2c3f7a' },
  moat: { bg1: '#5566e8', bg2: '#2f3a9c', skin: '#edbfa0', hair: '#22284f', shirt: '#c9d2ef' },
  cap: { bg1: '#f27cc0', bg2: '#c43f8e', skin: '#c98a63', hair: '#2b1a20', shirt: '#f6e2ee' },
  danno: { bg1: '#f083a8', bg2: '#c2437a', skin: '#f0c3a4', hair: '#3a2030', shirt: '#ffd9e6' },
  wumpus: { bg1: '#8b6cf0', bg2: '#4a2fa8', skin: '#c9b6f5', hair: '#2a1c4a', shirt: '#6b52c8' },
}

/* ------------------------------------------------------------ object tiles */

type ObjKind = 'cube' | 'ghost' | 'peach' | 'duck'

export function ObjectTile({ kind }: { kind: ObjKind }) {
  const id = gid()
  const g: Record<ObjKind, [string, string]> = {
    cube: ['#f472d0', '#d94aa8'],
    ghost: ['#e879c6', '#b93f9a'],
    peach: ['#4ad07f', '#1f9a56'],
    duck: ['#f472d0', '#c9439f'],
  }
  const [a, b] = g[kind]
  return (
    <svg viewBox="0 0 48 48" className="art" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      <rect width="48" height="48" fill={`url(#${id})`} />
      {kind === 'cube' && (
        <>
          <path d="M14 18 24 12l10 6-10 6Z" fill="#eef0f5" />
          <path d="M14 18v12l10 6V24Z" fill="#c9ccd8" />
          <path d="M34 18v12l-10 6V24Z" fill="#a48cf0" />
          <rect x="17.5" y="22" width="4" height="3.2" rx="1" fill="#5be0b0" />
          <rect x="27" y="24.5" width="4" height="3.2" rx="1" fill="#8de0ff" />
        </>
      )}
      {kind === 'ghost' && (
        <>
          <path
            d="M13 34V22a11 11 0 0 1 22 0v12l-3.7-2.6L27.6 34l-3.6-2.6L20.4 34l-3.7-2.6Z"
            fill="#c9b8f2"
          />
          <ellipse cx="20" cy="23" rx="1.8" ry="2.3" fill="#2b2044" />
          <ellipse cx="28" cy="23" rx="1.8" ry="2.3" fill="#2b2044" />
        </>
      )}
      {kind === 'peach' && (
        <>
          <circle cx="24" cy="28" r="11" fill="#dfe3ee" />
          <path d="M24 17c-3 0-5.4 1.6-6.6 4 2.4-1 5-1 6.6.4 1.6-1.4 4.2-1.4 6.6-.4-1.2-2.4-3.6-4-6.6-4Z" fill="#c8cddd" />
          <path d="M24 17c0-4 2-6.5 6-7.5-1 3-2 5-6 7.5Z" fill="#3fbf76" />
          <path d="M24 17c-2.5-2-5-2.6-8-2 2 2.6 4.6 3.4 8 2Z" fill="#57cf88" />
        </>
      )}
      {kind === 'duck' && (
        <>
          <ellipse cx="23" cy="31" rx="12" ry="9" fill="#8c7ce8" />
          <circle cx="30" cy="20" r="8" fill="#9d8cf2" />
          <path d="M36 20c3 0 5 1.4 5 2.6s-2 2.4-5 2.4Z" fill="#f2a4d0" />
          <circle cx="31.5" cy="18.5" r="1.6" fill="#2b2044" />
          <path d="M11 30c2-2 5-2.6 8-2-2 3-5 4-8 2Z" fill="#7a68d8" />
        </>
      )}
    </svg>
  )
}

/** Discord's default avatar: the Clyde mark on a flat colour. */
export function DefaultAvatar({ color = '#5865f2' }: { color?: string }) {
  return (
    <svg viewBox="0 0 48 48" className="art" aria-hidden="true">
      <rect width="48" height="48" fill={color} />
      <g transform="translate(9.6 9.6) scale(1.2)">
        <path
          fill="#fff"
          d="M20.32 4.57A17.6 17.6 0 0 0 15.94 3.2a.07.07 0 0 0-.07.03c-.19.34-.4.78-.55 1.13a16.3 16.3 0 0 0-4.66 0A10.9 10.9 0 0 0 10.1 3.2a.07.07 0 0 0-.07-.03c-1.5.26-2.95.72-4.38 1.37a.06.06 0 0 0-.03.02C2.83 8.72 2.09 12.75 2.45 16.73c0 .02.02.04.04.05a17.7 17.7 0 0 0 5.36 2.7.07.07 0 0 0 .08-.02c.41-.56.78-1.16 1.1-1.78a.07.07 0 0 0-.04-.1c-.58-.22-1.14-.49-1.68-.8a.07.07 0 0 1 0-.11l.33-.26a.07.07 0 0 1 .07 0 12.6 12.6 0 0 0 10.7 0 .07.07 0 0 1 .07 0l.34.26a.07.07 0 0 1 0 .12c-.54.3-1.1.57-1.69.79a.07.07 0 0 0-.04.1c.33.62.7 1.22 1.1 1.78a.07.07 0 0 0 .08.03 17.6 17.6 0 0 0 5.37-2.71.07.07 0 0 0 .03-.05c.43-4.6-.72-8.6-3.06-12.14a.05.05 0 0 0-.03-.02ZM8.75 14.31c-1.05 0-1.92-.97-1.92-2.16 0-1.18.85-2.15 1.92-2.15 1.08 0 1.94.98 1.93 2.15 0 1.19-.86 2.16-1.93 2.16Zm7.12 0c-1.06 0-1.93-.97-1.93-2.16 0-1.18.85-2.15 1.93-2.15 1.07 0 1.94.98 1.92 2.15 0 1.19-.85 2.16-1.92 2.16Z"
        />
      </g>
    </svg>
  )
}
