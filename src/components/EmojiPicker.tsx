import { useEffect, useMemo, useRef, useState } from 'react'
import { CATEGORIES, EMOJI } from '../emoji'
import { EmojiByName, EmojiGlyph } from '../markdown'
import {
  GifIcon,
  SearchIcon,
  SmileyIcon,
  SoundboardIcon,
  StarIcon,
  StickerIcon,
} from '../ui/Icons'
import type { FavouriteGif, Server } from '../data'
import { gifArt, GIFS, GIF_CATEGORIES } from '../gifs'
import { vh, vw } from '../zoom'

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
  gif: 'Search GIFs',
  sticker: 'Search stickers',
  soundboard: 'Search sounds',
}

export function EmojiPicker({
  at,
  view: initialView = 'emoji',
  server,
  gifs = [],
  onPick,
  onSticker,
  onGif,
  onLibraryGif,
  onAddGif,
  onClose,
}: {
  at: { x: number; y: number }
  view?: PickerView
  server?: Server | null
  gifs?: FavouriteGif[]
  onPick: (name: string) => void
  onSticker?: (id: string) => void
  onGif?: (id: string) => void
  onLibraryGif?: (id: string, name: string) => void
  onAddGif?: (file: File) => void
  onClose: () => void
}) {
  const gifFile = useRef<HTMLInputElement>(null)
  const gifScroller = useRef<HTMLDivElement>(null)
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
  const library = GIFS.filter(
    (g) => !term || g.name.toLowerCase().includes(term) || g.tags.includes(term),
  )
  const favourites = gifs.filter((g) => !term || g.name.toLowerCase().includes(term))
  const shownCategories = GIF_CATEGORIES.filter((c) => library.some((g) => g.category === c))
  const jumpTo = (cat: string) =>
    gifScroller.current?.querySelector(`[data-cat="${cat}"]`)?.scrollIntoView({ block: 'start' })
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

  const x = Math.max(8, Math.min(at.x, vw() - 372))
  const y = Math.max(8, Math.min(at.y, vh() - 452))

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
        <div className="picker-body">
          {/* the library's own categories down the side, the way the emoji
              view rails its own */}
          <div className="picker-rail">
            {favourites.length ? (
              <button
                aria-label="Favourites"
                title="Favourites"
                onClick={() => jumpTo('favourites')}
              >
                <StarIcon size={18} />
              </button>
            ) : null}
            {GIF_CATEGORIES.map((c) => {
              const first = GIFS.find((g) => g.category === c)
              return first ? (
                <button key={c} aria-label={c} title={c} onClick={() => jumpTo(c)}>
                  <img src={gifArt(first.id)} alt="" draggable={false} />
                </button>
              ) : null
            })}
          </div>
          <div className="picker-grid" ref={gifScroller}>
            <input
              ref={gifFile}
              type="file"
              accept="image/gif,image/webp,image/png,image/jpeg"
              hidden
              aria-hidden="true"
              onChange={(e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (f) onAddGif?.(f)
              }}
            />
            {favourites.length ? (
              <div data-cat="favourites">
                <div className="picker-cat">
                  Favourites
                  <button className="picker-add" onClick={() => gifFile.current?.click()}>
                    Add
                  </button>
                </div>
                <div className="picker-row gifs">
                  {favourites.map((g) => (
                    <button
                      key={g.id}
                      className="picker-gif"
                      aria-label={g.name}
                      title={g.name}
                      onClick={() => {
                        onGif?.(g.id)
                        onClose()
                      }}
                    >
                      <img src={g.url} alt="" draggable={false} />
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {shownCategories.map((c) => (
              <div key={c} data-cat={c}>
                <div className="picker-cat">
                  {c}
                  {c === shownCategories[0] && !favourites.length ? (
                    <button className="picker-add" onClick={() => gifFile.current?.click()}>
                      Add
                    </button>
                  ) : null}
                </div>
                <div className="picker-row gifs">
                  {library
                    .filter((g) => g.category === c)
                    .map((g) => (
                      <button
                        key={g.id}
                        className="picker-gif"
                        aria-label={g.name}
                        title={g.name}
                        onClick={() => {
                          onLibraryGif?.(g.id, g.name)
                          onClose()
                        }}
                      >
                        <img src={gifArt(g.id)} alt="" draggable={false} />
                      </button>
                    ))}
                </div>
              </div>
            ))}
            {!library.length && !favourites.length ? (
              <div className="picker-empty">No GIF matched.</div>
            ) : null}
            <p className="picker-note">
              Discord searches Tenor, which needs a key and a network this page has
              neither of. These are Google&rsquo;s animated emoji — real GIFs, from a host
              that answers.
            </p>
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
