import { useState } from 'react'
import { Select as Dropdown } from '../ui/Select'
import type { Account } from '../data'
import { byName, EMOJI } from '../emoji'
import { EmojiGlyph } from '../markdown'
import { CloseIcon } from '../ui/Icons'

/** Discord's "Set a custom status" modal, with its clear-after options. */
const CLEAR_AFTER: [string, number | null][] = [
  ["Today", null],
  ['4 hours', 4 * 3600e3],
  ['1 hour', 3600e3],
  ['30 minutes', 30 * 60e3],
  ["Don't clear", null],
]

export function CustomStatus({
  account,
  onSave,
  onClose,
}: {
  account: Account
  onSave: (text: string, emoji?: string) => void
  onClose: () => void
}) {
  const [text, setText] = useState(account.customStatus ?? '')
  const [emoji, setEmoji] = useState(account.customEmoji ?? '')
  const [pick, setPick] = useState(false)
  const [clear, setClear] = useState("Don't clear")

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="modal status-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Set a custom status</h3>
          <button className="modal-x" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>
        <div className="modal-body">
          <label className="set-field-label">WHAT'S COOKIN', {account.name.toUpperCase()}?</label>
          <div className="cs-row">
            <button
              className="cs-emoji"
              aria-label="Pick an emoji"
              onClick={() => setPick((v) => !v)}
            >
              {emoji && byName[emoji] ? (
                <EmojiGlyph code={byName[emoji].code} alt={emoji} />
              ) : (
                <span className="cs-emoji-empty">☺</span>
              )}
            </button>
            <input
              value={text}
              maxLength={128}
              placeholder="Support has arrived!"
              aria-label="Custom status"
              onChange={(e) => setText(e.target.value)}
            />
            {text || emoji ? (
              <button
                className="cs-clear"
                aria-label="Clear"
                onClick={() => {
                  setText('')
                  setEmoji('')
                }}
              >
                <CloseIcon />
              </button>
            ) : null}
          </div>
          {pick ? (
            <div className="cs-picker">
              {EMOJI.slice(0, 60).map((e) => (
                <button
                  key={e.code}
                  aria-label={`:${e.name}:`}
                  onClick={() => {
                    setEmoji(e.name)
                    setPick(false)
                  }}
                >
                  <EmojiGlyph code={e.code} alt={e.name} />
                </button>
              ))}
            </div>
          ) : null}
          <label className="set-field-label">CLEAR AFTER</label>
          <Dropdown
            aria-label="Clear After"
            value={clear}
            options={CLEAR_AFTER.map(([label]) => ({ value: label, label }))}
            onChange={setClear}
          />
        </div>
        <div className="modal-foot">
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={() => onSave(text.trim(), emoji || undefined)}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
