import { useState } from 'react'
import { serverColors } from '../data'

export function CreateServerModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (name: string, color: string) => void
}) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(serverColors[0])
  const submit = () => {
    const clean = name.trim()
    if (clean) onCreate(clean, color)
  }
  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Customize your server</h3>
          <p>
            Give your new server a personality with a name and an icon colour. You can
            always change it later.
          </p>
        </div>
        <div className="modal-body">
          <label className="field-label" htmlFor="srv-name">
            Server name
          </label>
          <input
            id="srv-name"
            className="field"
            value={name}
            autoFocus
            placeholder="Wumpus's server"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
              if (e.key === 'Escape') onClose()
            }}
          />
          <span className="field-label">Icon colour</span>
          <div className="swatches">
            {serverColors.map((c) => (
              <button
                key={c}
                className={'swatch' + (c === color ? ' on' : '')}
                style={{ background: c }}
                onClick={() => setColor(c)}
                aria-label={`Use ${c}`}
              />
            ))}
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn-ghost" onClick={onClose}>
            Back
          </button>
          <button className="btn-primary" onClick={submit} disabled={!name.trim()}>
            Create
          </button>
        </div>
      </div>
    </div>
  )
}
