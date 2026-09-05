import { useEffect, useRef, useState } from 'react'
import type { Account, Channel, Message, Server } from '../data'
import { CloseIcon, HashIcon, MarkReadIcon } from '../ui/Icons'
import { Avatar } from './UserArea'

type Tab = 'unreads' | 'for_you' | 'mentions'

/**
 * The Inbox popout from the header.
 *
 * Discord's tabs are Unreads, For You and Mentions, with a Mark As Read
 * control on the right and per-channel groups underneath.
 */
export function Inbox({
  server,
  account,
  unreadChannels,
  messagesFor,
  onJump,
  onMarkRead,
  onClose,
}: {
  server: Server | undefined
  account: Account
  unreadChannels: Channel[]
  messagesFor: (c: Channel) => Message[]
  onJump: (c: Channel, id: string) => void
  onMarkRead: () => void
  onClose: () => void
}) {
  const [tab, setTab] = useState<Tab>('unreads')
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

  // For You and Mentions need other people; with one member both stay empty
  const groups = tab === 'unreads' ? unreadChannels : []

  return (
    <div className="inbox" ref={ref}>
      <div className="inbox-head">
        <div className="inbox-tabs">
          {(['unreads', 'for_you', 'mentions'] as Tab[]).map((t) => (
            <button
              key={t}
              className={'inbox-tab' + (t === tab ? ' on' : '')}
              onClick={() => setTab(t)}
            >
              {t === 'for_you' ? 'For You' : t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <button className="inbox-mark" onClick={onMarkRead} aria-label="Mark all as read">
          <MarkReadIcon />
        </button>
        <button onClick={onClose} aria-label="Close inbox">
          <CloseIcon />
        </button>
      </div>
      <div className="inbox-body">
        {groups.map((c) => {
          const list = messagesFor(c).slice(-3)
          return (
            <div className="inbox-group" key={c.id}>
              <div className="inbox-where">
                <HashIcon />
                <span>{c.name}</span>
                <i>{server?.name}</i>
              </div>
              {list.map((m) => (
                <button className="inbox-msg" key={m.id} onClick={() => onJump(c, m.id)}>
                  <Avatar account={account} size={28} />
                  <span className="inbox-author">{account.name}</span>
                  <span className="inbox-text">{m.text.replace(/\n/g, ' ').slice(0, 90)}</span>
                </button>
              ))}
            </div>
          )
        })}
        {!groups.length ? (
          <div className="inbox-empty">
            {tab === 'unreads' ? (
              <>
                <b>You're all caught up!</b>
                <span>Nothing unread in this server.</span>
              </>
            ) : tab === 'mentions' ? (
              <>
                <b>No mentions</b>
                <span>Nobody has mentioned you — there is nobody else here to do it.</span>
              </>
            ) : (
              <>
                <b>Nothing for you yet</b>
                <span>For You surfaces posts Discord picks for you, which needs their servers.</span>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
