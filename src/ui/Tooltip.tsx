import { useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

type Side = 'right' | 'below'

/**
 * Discord's tooltips: instant, tiny, no spring. Rendered in a portal so the
 * rail's overflow clipping never cuts them off.
 */
export function Tooltip({
  label,
  side = 'right',
  children,
}: {
  label: string
  side?: Side
  children: ReactNode
}) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)

  return (
    <>
      <span
        style={{ display: 'contents' }}
        onMouseEnter={(e) => {
          const r = (e.currentTarget as HTMLElement)
            .firstElementChild!.getBoundingClientRect()
          setPos(
            side === 'right'
              ? { x: r.right + 12, y: r.top + r.height / 2 }
              : { x: r.left + r.width / 2, y: r.bottom + 8 },
          )
        }}
        onMouseLeave={() => setPos(null)}
      >
        {children}
      </span>
      {pos
        ? createPortal(
            <div
              className={side === 'below' ? 'tip below' : 'tip'}
              style={{ left: pos.x, top: pos.y }}
            >
              {label}
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
