import { useEffect, useRef, useState } from 'react'
import type { Account, Message } from '../data'
import { renderMarkdown, type MdContext } from '../markdown'
import { CloseIcon } from '../ui/Icons'
import { Avatar } from './UserArea'

/**
 * The pinned-messages popover that hangs off the header's pin button.
 *
 * Discord's layout, from the Pin Messages FAQ: each pin carries a **Jump**
 * button, and an **X** that removes it — with the confirmation skipped when
 * shift is held ("To skip the confirmation prompt when removing a pin, hold
 * Shift and select the X icon next to the pinned message in the Pins window").
 * The list arrives already sorted, most recently pinned first.
 */
export function Pins({
  pinned,
  account,
  md,
  dm,
  onJump,
  onUnpin,
  onClose,
}: {
  pinned: Message[]
  account: Account
  md: MdContext
  /** a DM's empty state and its permission line differ from a channel's */
  dm?: boolean
  onJump: (id: string) => void
  onUnpin: (id: string, skipConfirm: boolean) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  // holding shift swaps the X's tooltip and skips the confirmation
  const [shift, setShift] = useState(false)
  useEffect(() => {
    const away = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose()
    }
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Shift') setShift(true)
    }
    const up = (e: KeyboardEvent) => e.key === 'Shift' && setShift(false)
    const t = setTimeout(() => window.addEventListener('mousedown', away))
    window.addEventListener('keydown', key)
    window.addEventListener('keyup', up)
    return () => {
      clearTimeout(t)
      window.removeEventListener('mousedown', away)
      window.removeEventListener('keydown', key)
      window.removeEventListener('keyup', up)
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
              <Avatar account={account} size={32} status={false} />
              <div className="pin-main">
                <div className="pin-author">{account.name}</div>
                <div className="pin-text">{renderMarkdown(m.text, md)}</div>
                <div className="pin-actions">
                  <button onClick={() => onJump(m.id)}>Jump</button>
                </div>
              </div>
              <button
                className="pin-remove"
                aria-label={shift ? 'Unpin' : 'Remove'}
                title={shift ? 'Unpin' : 'Remove'}
                onClick={(e) => onUnpin(m.id, e.shiftKey)}
              >
                <CloseIcon />
              </button>
            </div>
          ))
        ) : (
          <div className="pins-empty">
            <p>
              {dm ? 'This direct message doesn’t have' : 'This channel doesn’t have any'}
              <br />
              {dm ? 'any pinned messages... yet.' : 'pinned messages... yet.'}
            </p>
            <span>
              {dm
                ? 'You can pin a message from its context menu.'
                : "Users with the 'Pin Messages' permission can pin a message from its context menu."}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
