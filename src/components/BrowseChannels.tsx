import { useState } from 'react'
import type { Server, Channel } from '../data'
import { CloseIcon } from '../ui/Icons'
import { Glyph } from './ChannelSidebar'

/**
 * Discord's Browse Channels — the surface behind the sidebar row of that name.
 *
 * Discord lists every channel in the server grouped by category, with its
 * topic beneath, so a member can find the ones they are not already in. The
 * labels are Discord's: "Browse Channels", "Search Channels", "Show All
 * Channels".
 */
export function BrowseChannels({
  server,
  onOpen,
  onClose,
}: {
  server: Server
  onOpen: (id: string) => void
  onClose: () => void
}) {
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()
  const match = (c: Channel) =>
    !needle || c.name.toLowerCase().includes(needle) || (c.topic ?? '').toLowerCase().includes(needle)

  // threads are not browsable; Discord lists channels only
  const all = server.channels.filter((c) => !c.parentId && match(c))
  const loose = all.filter((c) => c.categoryId === null)
  const groups = server.categories
    .map((cat) => ({ cat, list: all.filter((c) => c.categoryId === cat.id) }))
    .filter((g) => g.list.length)

  const row = (c: Channel) => (
    <button key={c.id} className="browse-row" onClick={() => onOpen(c.id)}>
      <Glyph kind={c.kind} />
      <span className="browse-name">{c.name}</span>
      {c.topic ? <span className="browse-topic">{c.topic}</span> : null}
    </button>
  )

  return (
    <div className="browse">
      <div className="browse-head">
        <h2>Browse Channels</h2>
        <button className="events-close" aria-label="Close" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>
      <input
        className="browse-search"
        value={q}
        autoFocus
        placeholder="Search Channels"
        aria-label="Search Channels"
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="browse-list">
        {loose.length ? <div className="browse-group">{loose.map(row)}</div> : null}
        {groups.map(({ cat, list }) => (
          <div className="browse-group" key={cat.id}>
            <div className="browse-cat">{cat.name}</div>
            {list.map(row)}
          </div>
        ))}
        {!loose.length && !groups.length ? (
          <p className="events-empty">No results found</p>
        ) : null}
      </div>
    </div>
  )
}
