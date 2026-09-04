/**
 * Hand-built SVG artwork. Nothing here is lifted from a screenshot: every mark
 * is drawn with plain SVG primitives.
 */

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

/** The gem tile shown at the left of the reward banner. */
export function ArtGem() {
  return (
    <svg viewBox="0 0 48 48" className="art" aria-hidden="true">
      <defs>
        <linearGradient id="gem" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7b5cf0" />
          <stop offset=".5" stopColor="#4b3bd6" />
          <stop offset="1" stopColor="#8e5bd0" />
        </linearGradient>
      </defs>
      <path
        d="M15 6h18l9 9v18l-9 9H15l-9-9V15Z"
        fill="url(#gem)"
        stroke="#a98bff"
        strokeWidth="1.2"
      />
      <path d="M15 6h18l-9 8Zm-9 9 9-9-3 12Zm36 0-9-9 3 12Z" fill="#5f45e0" opacity=".55" />
      <path
        d="m24 11 3.6 8.4L36 23l-8.4 3.6L24 35l-3.6-8.4L12 23l8.4-3.6Z"
        fill="#fdf6ff"
        opacity=".95"
      />
    </svg>
  )
}
