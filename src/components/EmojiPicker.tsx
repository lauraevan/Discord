import { useEffect, useMemo, useRef, useState } from 'react'
import { CATEGORIES, EMOJI } from '../emoji'
import { EmojiByName, EmojiGlyph } from '../markdown'
import { GifIcon, SearchIcon, SmileyIcon, SoundboardIcon, StickerIcon } from '../ui/Icons'
import type { Server } from '../data'

/**
 * Discord's expression picker.
 *
 * One popover with four views, which the client's own enum names emoji, gif,
 * sticker and soundboard — every button on the right of the composer opens
 * this and switches the view rather than opening a picker of its own. The
 * emoji view is a search field, a category rail and a grid scrolling under
 * sticky headings; the rest are what this build can honestly put behind them.
 */
export type PickerView = 'emoji' | 'gif' | 'sticker' | 'soundboard'

const PLACEHOLDER: Record<PickerView, string> = {
  emoji: 'Search emoji',
  gif: 'Search Tenor',
  sticker: 'Search stickers',
  soundboard: 'Search sounds',
}

export function EmojiPicker({
  at,
  view: initialView = 'emoji',
  server,
  onPick,
  onSticker,
  onClose,
}: {
  at: { x: number; y: number }
  view?: PickerView
  server?: Server | null
  onPick: (name: string) => void
  onSticker?: (id: string) => void
  onClose: () => void
}) {
  const [view, setView] = useState<PickerView>(initialView)
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

  const term = q.trim().toLowerCase()
  const stickers = (server?.stickers ?? []).filter(
    (st) => !term || st.name.toLowerCase().includes(term) || st.related.includes(term),
  )
  const sounds = (server?.sounds ?? []).filter(
    (sd) => !term || sd.name.toLowerCase().includes(term),
  )

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
            placeholder={PLACEHOLDER[view]}
            aria-label={PLACEHOLDER[view]}
            onChange={(e) => setQ(e.target.value)}
          />
          <SearchIcon />
        </div>
      </div>
      {view === 'gif' ? (
        <div className="picker-body picker-plain">
          <div className="picker-empty tall">
            <GifIcon size={40} />
            <b>GIFs come from Tenor</b>
            <span>
              Discord searches Tenor for these, which is a request to somebody else's
              server — a page with no network of its own has nowhere to send it.
            </span>
          </div>
        </div>
      ) : view === 'sticker' ? (
        <div className="picker-body picker-plain">
          {stickers.length ? (
            <div className="picker-grid">
              <div className="picker-cat">{server?.name ?? 'Server'}</div>
              <div className="picker-row stickers">
                {stickers.map((st) => (
                  <button
                    key={st.id}
                    className="picker-sticker"
                    aria-label={st.name}
                    title={st.name}
                    onClick={() => {
                      onSticker?.(st.id)
                      onClose()
                    }}
                  >
                    {st.url ? (
                      <img src={st.url} alt={st.name} draggable={false} />
                    ) : (
                      <EmojiByName name={st.related} alt={st.name} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="picker-empty tall">
              <StickerIcon size={40} />
              <b>No stickers yet</b>
              <span>
                Server Settings &rsaquo; Stickers uploads them, and they show up here for
                everyone in the server.
              </span>
            </div>
          )}
        </div>
      ) : view === 'soundboard' ? (
        <div className="picker-body picker-plain">
          {sounds.length ? (
            <div className="picker-grid">
              <div className="picker-cat">{server?.name ?? 'Server'}</div>
              <div className="picker-row sounds">
                {sounds.map((sd) => (
                  <span className="picker-sound" key={sd.id} title={`${sd.name} · ${Math.round(sd.volume * 100)}%`}>
                    <EmojiByName name={sd.emoji} alt={sd.name} />
                    <b>{sd.name}</b>
                  </span>
                ))}
              </div>
              <p className="picker-note">
                Nothing plays — a soundboard needs the voice server the sound would go out
                over.
              </p>
            </div>
          ) : (
            <div className="picker-empty tall">
              <SoundboardIcon size={40} />
              <b>No sounds yet</b>
              <span>Server Settings &rsaquo; Soundboard adds them.</span>
            </div>
          )}
        </div>
      ) : (
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
      )}
      {view === 'emoji' ? (
        <div className="picker-foot">
          <EmojiGlyph code={hover.code} alt={hover.name} />
          <span>:{hover.name}:</span>
        </div>
      ) : null}
      {/* the client's own four views, switched from inside the picker rather
          than by opening a different one */}
      <div className="picker-tabs" role="tablist">
        {(
          [
            ['gif', 'GIF', GifIcon],
            ['sticker', 'Stickers', StickerIcon],
            ['emoji', 'Emoji', SmileyIcon],
            ['soundboard', 'Soundboard', SoundboardIcon],
          ] as [PickerView, string, typeof GifIcon][]
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            role="tab"
            aria-selected={view === id}
            aria-label={label}
            className={view === id ? 'on' : undefined}
            onClick={() => {
              setView(id)
              setQ('')
            }}
          >
            <Icon size={20} />
          </button>
        ))}
      </div>
    </div>
  )
}
