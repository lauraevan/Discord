import { useState } from 'react'
import {
  AppsIcon,
  GifIcon,
  GiftIcon,
  PlusIcon,
  SendIcon,
  SmileyIcon,
  StickerIcon,
} from '../ui/Icons'
import { Tooltip } from '../ui/Tooltip'

export function Composer({
  channelName,
  onSend,
}: {
  channelName: string
  onSend: (text: string) => void
}) {
  const [value, setValue] = useState('')
  const send = () => {
    const t = value.trim()
    if (!t) return
    onSend(t)
    setValue('')
  }
  const acts = [
    { label: 'Gift a Nitro subscription', Icon: GiftIcon },
    { label: 'GIF', Icon: GifIcon },
    { label: 'Sticker', Icon: StickerIcon },
    { label: 'Emoji', Icon: SmileyIcon },
    { label: 'Apps', Icon: AppsIcon },
  ]
  return (
    <div className="composer-wrap">
      <div className="composer">
        <button className="plus" aria-label="Upload a file">
          <PlusIcon />
        </button>
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
        <div className="composer-acts">
          {acts.map(({ label, Icon }) => (
            <Tooltip key={label} label={label} side="below">
              <button aria-label={label}>
                <Icon />
              </button>
            </Tooltip>
          ))}
          <button
            className={'send' + (value.trim() ? ' ready' : '')}
            onClick={send}
            aria-label="Send"
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  )
}

export function TypingIndicator({ who }: { who: string[] }) {
  if (!who.length) return <div className="typing" />
  const names =
    who.length === 1
      ? who[0]
      : who.slice(0, -1).join(', ') + ' and ' + who[who.length - 1]
  return (
    <div className="typing">
      <span className="dots">
        <i />
        <i />
        <i />
      </span>
      <span>
        <b>{names}</b> {who.length === 1 ? 'is' : 'are'} typing...
      </span>
    </div>
  )
}
