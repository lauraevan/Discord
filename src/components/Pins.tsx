import { useEffect, useRef } from 'react'
import type { Account, Message } from '../data'
import { renderMarkdown, type MdContext } from '../markdown'
import { CloseIcon } from '../ui/Icons'
import { Avatar } from './UserArea'

/** The pinned-messages popover that hangs off the header's pin button. */
export function Pins({
  pinned,
  account,
  md,
  onJump,
  onUnpin,
  onClose,
}: {
  pinned: Message[]
  account: Account
  md: MdContext
  onJump: (id: string) => void
  onUnpin: (id: string) => void
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

  return (
    <div className="pins" ref={ref}>
      <div className="pins-head">
        <span>Pinned Messages</span>
        <button onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>
      </div>
      <div className="pins-body">
        {pinned.length ? (
          pinned.map((m) => (
            <div className="pin-card" key={m.id}>
              <Avatar account={account} size={32} />
              <div className="pin-main">
                <div className="pin-author">{account.name}</div>
                <div className="pin-text">{renderMarkdown(m.text, md)}</div>
                <div className="pin-actions">
                  <button onClick={() => onJump(m.id)}>Jump</button>
                  <button onClick={() => onUnpin(m.id)}>Unpin</button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="pins-empty">
            <p>Nothing pinned yet.</p>
            <span>Pin a message from its hover menu and it shows up here.</span>
          </div>
        )}
      </div>
    </div>
  )
}
