import { useMemo, useState } from 'react'
import type { Channel, Server } from '../data'
import { HashIcon, SpeakerIcon } from '../ui/Icons'
import { EmptyArt } from '../ui/Art'

type Hit =
  | { kind: 'server'; server: Server }
  | { kind: 'channel'; server: Server; channel: Channel }

/**
 * Ctrl/Cmd+K. Discord's quick switcher searches servers and channels together,
 * ranks prefix matches above substring matches, and jumps on Enter.
 */
export function QuickSwitcher({
  servers,
  onPick,
  onClose,
}: {
  servers: Server[]
  onPick: (serverId: string, channelId?: string) => void
  onClose: () => void
}) {
  const [q, setQ] = useState('')
  const [pick, setPick] = useState(0)

  const hits = useMemo(() => {
    const term = q.trim().toLowerCase().replace(/^[#@]/, '')
    const all: Hit[] = []
    for (const s of servers) {
      all.push({ kind: 'server', server: s })
      for (const c of s.channels) all.push({ kind: 'channel', server: s, channel: c })
    }
    if (!term) return all.slice(0, 12)
    const name = (h: Hit) => (h.kind === 'server' ? h.server.name : h.channel.name).toLowerCase()
    return all
      .filter((h) => name(h).includes(term))
      .sort((a, b) => Number(name(b).startsWith(term)) - Number(name(a).startsWith(term)))
      .slice(0, 12)
  }, [q, servers])

  const sel = Math.min(pick, Math.max(0, hits.length - 1))

  const go = (h: Hit | undefined) => {
    if (!h) return
    if (h.kind === 'server') onPick(h.server.id)
    else onPick(h.server.id, h.channel.id)
    onClose()
  }

  return (
    <div className="overlay switcher-overlay" onMouseDown={onClose}>
      <div className="switcher" onMouseDown={(e) => e.stopPropagation()}>
        <input
          autoFocus
          value={q}
          placeholder="Where would you like to go?"
          aria-label="Quick switcher"
          onChange={(e) => {
            setQ(e.target.value)
            setPick(0)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose()
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setPick((p) => (p + 1) % Math.max(1, hits.length))
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault()
              setPick((p) => (p - 1 + hits.length) % Math.max(1, hits.length))
            }
            if (e.key === 'Enter') go(hits[sel])
          }}
        />
        <div className="switcher-hint">
          <b>Tip:</b> start with <kbd>#</kbd> to jump straight to a channel.
        </div>
        <div className="switcher-list">
          {hits.map((h, i) => (
            <button
              key={h.kind === 'server' ? h.server.id : h.channel.id}
              className={'switcher-row' + (i === sel ? ' on' : '')}
              onMouseEnter={() => setPick(i)}
              onClick={() => go(h)}
            >
              {h.kind === 'server' ? (
                <span className="switcher-mark" style={{ background: h.server.color }}>
                  {h.server.initials}
                </span>
              ) : h.channel.kind === 'voice' ? (
                <SpeakerIcon />
              ) : (
                <HashIcon />
              )}
              <span className="switcher-name">
                {h.kind === 'server' ? h.server.name : h.channel.name}
              </span>
              {h.kind === 'channel' ? (
                <span className="switcher-where">{h.server.name}</span>
              ) : null}
            </button>
          ))}
          {!hits.length ? (
            <div className="switcher-empty">
              <EmptyArt kind="search" />
              Nothing matched.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
