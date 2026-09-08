import { useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { box } from '../zoom'

type Side = 'right' | 'below' | 'above'

/**
 * Discord's tooltips: small, dark, and sprung — the client animates them from
 * scale(0.95) on a tension 2400 / friction 52 spring, which is where the snap
 * comes from. src/springs.css carries that curve; the CSS applies it.
 * Rendered in a portal so the rail's overflow clipping never cuts them off.
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
          const r = box((e.currentTarget as HTMLElement).firstElementChild!)
          setPos(
            side === 'right'
              ? { x: r.right + 12, y: r.top + r.height / 2 }
              : side === 'above'
                ? { x: r.left + r.width / 2, y: r.top - 8 }
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
              className={'tip' + (side === 'right' ? '' : ` ${side}`)}
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
