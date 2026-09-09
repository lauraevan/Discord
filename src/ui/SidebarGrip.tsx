import { useEffect, useRef } from 'react'
import { U } from '../zoom'

/**
 * The handle Discord puts between the channel list and the chat.
 *
 * Discord's sidebar is draggable and remembers where you left it, which is why
 * two captures of the same account measure it differently. It clamps between
 * 240 and 340; those are Discord's numbers, so they are multiplied into the
 * units the stylesheet is written in on the way to --side-w.
 */
export const SIDE_MIN = 240
export const SIDE_MAX = 340
/**
 * The width the app opens at. It is 247 in the units styles.css is written in,
 * which is what docs/reference.png measures — landing anywhere else moves the
 * chat pane a fraction of a pixel and re-rasterises every glyph in it.
 */
export const SIDE_DEFAULT = 308.75

export function SidebarGrip({ width, onWidth }: { width: number; onWidth: (w: number) => void }) {
  const from = useRef<{ x: number; w: number } | null>(null)

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!from.current) return
      const next = from.current.w + (e.clientX - from.current.x)
      onWidth(Math.round(Math.max(SIDE_MIN, Math.min(SIDE_MAX, next))))
    }
    const up = () => {
      if (!from.current) return
      from.current = null
      document.body.classList.remove('resizing')
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [onWidth])

  return (
    <div
      className="side-grip"
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize the channel list"
      aria-valuenow={width}
      aria-valuemin={SIDE_MIN}
      aria-valuemax={SIDE_MAX}
      tabIndex={0}
      onPointerDown={(e) => {
        from.current = { x: e.clientX, w: width }
        document.body.classList.add('resizing')
      }}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 20 : 4
        if (e.key === 'ArrowLeft') onWidth(Math.max(SIDE_MIN, width - step))
        if (e.key === 'ArrowRight') onWidth(Math.min(SIDE_MAX, width + step))
      }}
      onDoubleClick={() => onWidth(SIDE_DEFAULT)}
    />
  )
}

/** The width, in the units styles.css is written in. */
export const sideVar = (w: number) => `${(w * U).toFixed(2)}px`
