import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronRightIcon } from '../ui/Icons'

export type MenuItem =
  | { sep: true }
  | { head: string }
  | {
      label: string
      icon?: ReactNode
      danger?: boolean
      check?: boolean
      /** a submenu, the way Discord's Mute Channel and Notification Settings work */
      sub?: MenuItem[]
      onPick?: () => void
    }

/**
 * Discord's right-click menus: they open at the pointer, flip when they would
 * run off an edge, close on Escape or any click outside, and separate the
 * destructive item off at the bottom in red.
 */
export function ContextMenu({
  at,
  items,
  onClose,
}: {
  at: { x: number; y: number }
  items: MenuItem[]
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const away = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose()
    }
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    const t = setTimeout(() => {
      window.addEventListener('mousedown', away)
      window.addEventListener('contextmenu', away)
    })
    window.addEventListener('keydown', key)
    return () => {
      clearTimeout(t)
      window.removeEventListener('mousedown', away)
      window.removeEventListener('contextmenu', away)
      window.removeEventListener('keydown', key)
    }
  }, [onClose])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    if (r.bottom > window.innerHeight - 8) el.style.top = `${at.y - r.height}px`
    if (r.right > window.innerWidth - 8) el.style.left = `${at.x - r.width}px`
  }, [at])

  return (
    <div className="ctx" style={{ left: at.x, top: at.y }} ref={ref} role="menu">
      <Items items={items} onClose={onClose} />
    </div>
  )
}

function Items({ items, onClose }: { items: MenuItem[]; onClose: () => void }) {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <>
      {items.map((it, i) =>
        'sep' in it ? (
          <div key={i} className="ctx-sep" />
        ) : 'head' in it ? (
          <div key={i} className="ctx-head">
            {it.head}
          </div>
        ) : it.sub ? (
          <div
            key={i}
            className="ctx-wrap"
            onMouseEnter={() => setOpen(i)}
            onMouseLeave={() => setOpen((o) => (o === i ? null : o))}
          >
            <button role="menuitem" aria-haspopup="menu" className="ctx-item">
              <span>{it.label}</span>
              <ChevronRightIcon />
            </button>
            {open === i ? (
              <div className="ctx ctx-sub" role="menu">
                <Items items={it.sub} onClose={onClose} />
              </div>
            ) : null}
          </div>
        ) : (
          <button
            key={i}
            role="menuitem"
            className={'ctx-item' + (it.danger ? ' danger' : '') + (it.check ? ' checked' : '')}
            onClick={() => {
              it.onPick?.()
              onClose()
            }}
          >
            <span>{it.label}</span>
            {it.icon}
          </button>
        ),
      )}
    </>
  )
}
