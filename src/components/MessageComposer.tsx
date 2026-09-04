import { useState } from 'react'
import { PlusIcon, SmileyIcon } from '../ui/Icons'

export function MessageComposer({
  channelName,
  readOnly,
  onSend,
}: {
  channelName: string
  readOnly: boolean
  onSend: (text: string) => void
}) {
  const [value, setValue] = useState('')

  const send = () => {
    const text = value.trim()
    if (!text) return
    onSend(text)
    setValue('')
  }

  return (
    <div className="composer-wrap">
      <div className={'composer' + (readOnly ? ' disabled' : '')}>
        <button className="plus-btn" aria-label="Upload a file" disabled={readOnly}>
          <PlusIcon className="plus" />
        </button>
        {readOnly ? (
          <span className="placeholder">
            You do not have permission to send messages in this channel.
          </span>
        ) : (
          <>
            <input
              className="composer-input"
              value={value}
              placeholder={`Message #${channelName}`}
              aria-label={`Message #${channelName}`}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
            />
            <button
              className="composer-emoji"
              aria-label="Select emoji"
              onClick={() => setValue((v) => v + '🔥')}
            >
              <SmileyIcon />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
