import { useEffect, useRef } from 'react'
import type { Channel, Message } from '../data'
import { CloseIcon, ThreadsIcon } from '../ui/Icons'

/**
 * Discord's Threads panel.
 *
 * The channel header's threads button drops a list of the threads hanging off
 * that channel — the name, who started it and how many messages are in it —
 * and picking one opens it. Discord splits it into Active and Archived; a
 * thread here is archived once it has been marked so, which is the same rule.
 */
export function Threads({
  channel,
  threads,
  counts,
  onOpen,
  onClose,
}: {
  channel: Channel
  threads: Channel[]
  /** thread id -> the messages in it, for the count and the last line */
  counts: Record<string, Message[]>
  onOpen: (id: string) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const away = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose()
    }
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    const t = setTimeout(() => window.addEventListener('mousedown', away))
    window.addEventListener('keydown', key)
    return () => {
      clearTimeout(t)
      window.removeEventListener('mousedown', away)
      window.removeEventListener('keydown', key)
    }
  }, [onClose])

  const active = threads.filter((t) => !t.archived)
  const archived = threads.filter((t) => t.archived)

  const list = (group: Channel[]) =>
    group.map((t) => {
      const msgs = counts[t.id] ?? []
      const last = msgs[msgs.length - 1]
      return (
        <button className="thread-card" key={t.id} onClick={() => onOpen(t.id)}>
          <ThreadsIcon />
          <span className="thread-main">
            <span className="thread-name">{t.name}</span>
            <span className="thread-sub">
              {msgs.length} {msgs.length === 1 ? 'message' : 'messages'}
              {last ? ` · ${last.text.replace(/\s+/g, ' ').slice(0, 44)}` : ''}
            </span>
          </span>
        </button>
      )
    })

  return (
    <div className="pins threads-panel" ref={ref}>
      <div className="pins-head">
        <span>Threads</span>
        <button onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>
      </div>
      <div className="pins-body">
        {threads.length === 0 ? (
          <div className="pins-empty">
            <p>There are no threads yet.</p>
            <span>
              Start one from a message&rsquo;s menu, or from the composer&rsquo;s plus, and it
              shows up here.
            </span>
          </div>
        ) : (
          <>
            {active.length ? (
              <>
                <div className="thread-group">Active — {active.length}</div>
                {list(active)}
              </>
            ) : null}
            {archived.length ? (
              <>
                <div className="thread-group">Archived — {archived.length}</div>
                {list(archived)}
              </>
            ) : null}
          </>
        )}
      </div>
      <div className="threads-foot">in #{channel.name}</div>
    </div>
  )
}
