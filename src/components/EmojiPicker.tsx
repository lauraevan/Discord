import { useEffect, useMemo, useRef, useState } from 'react'
import { CATEGORIES, EMOJI } from '../emoji'
import { EmojiGlyph } from '../markdown'
import { SearchIcon } from '../ui/Icons'

/**
 * Discord's emoji picker: a search field, a category rail down the side, and a
 * grid that scrolls under sticky category headings. Picking one closes it.
 */
export function EmojiPicker({
  at,
  onPick,
  onClose,
}: {
  at: { x: number; y: number }
  onPick: (name: string) => void
  onClose: () => void
}) {
  const [q, setQ] = useState('')
  const [hover, setHover] = useState(EMOJI[0])
  const ref = useRef<HTMLDivElement>(null)
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const away = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose()
    }
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    // defer so the click that opened the picker doesn't immediately close it
    const t = setTimeout(() => window.addEventListener('mousedown', away))
    window.addEventListener('keydown', key)
    return () => {
      clearTimeout(t)
      window.removeEventListener('mousedown', away)
      window.removeEventListener('keydown', key)
    }
  }, [onClose])

  const groups = useMemo(() => {
    const term = q.trim().toLowerCase()
    return CATEGORIES.map(([id, label]) => ({
      id,
      label,
      items: EMOJI.filter((e) => e.cat === id && (!term || e.name.includes(term))),
    })).filter((g) => g.items.length)
  }, [q])

  const x = Math.max(8, Math.min(at.x, window.innerWidth - 372))
  const y = Math.max(8, Math.min(at.y, window.innerHeight - 452))

  return (
    <div className="picker" style={{ left: x, top: y }} ref={ref}>
      <div className="picker-top">
        <div className="picker-search">
          <input
            autoFocus
            value={q}
            placeholder="Search emoji"
            aria-label="Search emoji"
            onChange={(e) => setQ(e.target.value)}
          />
          <SearchIcon />
        </div>
      </div>
      <div className="picker-body">
        <div className="picker-rail">
          {groups.map((g) => (
            <button
              key={g.id}
              aria-label={g.label}
              title={g.label}
              onClick={() =>
                scroller.current
                  ?.querySelector(`[data-cat="${g.id}"]`)
                  ?.scrollIntoView({ block: 'start' })
              }
            >
              <EmojiGlyph code={g.items[0].code} alt={g.label} />
            </button>
          ))}
        </div>
        <div className="picker-grid" ref={scroller}>
          {groups.map((g) => (
            <div key={g.id} data-cat={g.id}>
              <div className="picker-cat">{g.label}</div>
              <div className="picker-row">
                {g.items.map((e) => (
                  <button
                    key={e.code}
                    className="picker-cell"
                    aria-label={`:${e.name}:`}
                    onMouseEnter={() => setHover(e)}
                    onClick={() => {
                      onPick(e.name)
                      onClose()
                    }}
                  >
                    <EmojiGlyph code={e.code} alt={e.name} />
                  </button>
                ))}
              </div>
            </div>
          ))}
          {!groups.length ? <div className="picker-empty">No emoji matched.</div> : null}
        </div>
      </div>
      <div className="picker-foot">
        <EmojiGlyph code={hover.code} alt={hover.name} />
        <span>:{hover.name}:</span>
      </div>
    </div>
  )
}
