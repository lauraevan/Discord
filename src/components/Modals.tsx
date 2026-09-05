import { useEffect, useState } from 'react'
import {
  serverColors,
  statusColor,
  statusLabel,
  type Account,
  type Channel,
  type Status,
} from '../data'
import { HashIcon, SpeakerIcon } from '../ui/Icons'

/** Escape closes any open overlay, the way Discord's own dialogs do. */
function useEscape(onClose: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
}

function Shell({
  title,
  sub,
  onClose,
  children,
  footer,
}: {
  title: string
  sub?: string
  onClose: () => void
  children: React.ReactNode
  footer: React.ReactNode
}) {
  useEscape(onClose)
  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          {sub ? <p>{sub}</p> : null}
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-foot">{footer}</div>
      </div>
    </div>
  )
}

export function CreateServerModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (name: string, color: string) => void
}) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(serverColors[0])
  return (
    <Shell
      title="Customize your server"
      sub="Give your new server a name and an icon colour. You can always change it later."
      onClose={onClose}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            Back
          </button>
          <button className="btn-primary" disabled={!name.trim()} onClick={() => onCreate(name.trim(), color)}>
            Create
          </button>
        </>
      }
    >
      <label className="field-label" htmlFor="srv">Server name</label>
      <input
        id="srv"
        className="field"
        autoFocus
        value={name}
        placeholder="My server"
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && name.trim() && onCreate(name.trim(), color)}
      />
      <span className="field-label">Icon colour</span>
      <div className="swatches">
        {serverColors.map((c) => (
          <button
            key={c}
            className={'swatch' + (c === color ? ' on' : '')}
            style={{ background: c }}
            onClick={() => setColor(c)}
            aria-label={c}
          />
        ))}
      </div>
    </Shell>
  )
}

export function ChannelModal({
  channel,
  categoryName,
  onClose,
  onSave,
  onDelete,
}: {
  channel: Channel | null
  categoryName: string
  onClose: () => void
  onSave: (name: string, kind: Channel['kind']) => void
  onDelete?: () => void
}) {
  const [name, setName] = useState(channel?.name ?? '')
  const [kind, setKind] = useState<Channel['kind']>(channel?.kind ?? 'text')
  const clean = name.trim().toLowerCase().replace(/\s+/g, '-')
  return (
    <Shell
      title={channel ? 'Edit channel' : 'Create channel'}
      sub={channel ? undefined : `in ${categoryName}`}
      onClose={onClose}
      footer={
        <>
          {channel && onDelete ? (
            <button className="btn-ghost danger" onClick={onDelete}>
              Delete channel
            </button>
          ) : null}
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={!clean} onClick={() => onSave(clean, kind)}>
            {channel ? 'Save changes' : 'Create channel'}
          </button>
        </>
      }
    >
      <span className="field-label">Channel type</span>
      <div className="type-picker">
        {(['text', 'voice'] as const).map((k) => (
          <button
            key={k}
            className={'type-opt' + (kind === k ? ' on' : '')}
            onClick={() => setKind(k)}
          >
            {k === 'text' ? <HashIcon /> : <SpeakerIcon />}
            <span>
              <b>{k === 'text' ? 'Text' : 'Voice'}</b>
              <i>{k === 'text' ? 'Send messages, images and GIFs' : 'Hang out together with voice'}</i>
            </span>
          </button>
        ))}
      </div>
      <label className="field-label" htmlFor="chn">Channel name</label>
      <input
        id="chn"
        className="field"
        autoFocus
        value={name}
        placeholder="new-channel"
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && clean && onSave(clean, kind)}
      />
    </Shell>
  )
}

export function EditProfileModal({
  account,
  onClose,
  onSave,
}: {
  account: Account
  onClose: () => void
  onSave: (a: Account) => void
}) {
  const [draft, setDraft] = useState(account)
  const set = <K extends keyof Account>(k: K, v: Account[K]) =>
    setDraft((d) => ({ ...d, [k]: v }))
  return (
    <Shell
      title="Edit profile"
      onClose={onClose}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={() => onSave(draft)}>
            Save changes
          </button>
        </>
      }
    >
      <label className="field-label" htmlFor="dn">Display name</label>
      <input id="dn" className="field" value={draft.name} onChange={(e) => set('name', e.target.value)} />
      <label className="field-label" htmlFor="un">Username</label>
      <input id="un" className="field" value={draft.handle} onChange={(e) => set('handle', e.target.value)} />
      <label className="field-label" htmlFor="pr">Pronouns</label>
      <input id="pr" className="field" value={draft.pronouns} onChange={(e) => set('pronouns', e.target.value)} />
      <label className="field-label" htmlFor="bi">About me</label>
      <input id="bi" className="field" value={draft.bio} onChange={(e) => set('bio', e.target.value)} />
      <span className="field-label">Avatar colour</span>
      <div className="swatches">
        {serverColors.map((c) => (
          <button
            key={c}
            className={'swatch' + (c === draft.color ? ' on' : '')}
            style={{ background: c }}
            onClick={() => set('color', c)}
            aria-label={c}
          />
        ))}
      </div>
    </Shell>
  )
}

export function StatusMenu({
  account,
  onPick,
  onClose,
}: {
  account: Account
  onPick: (s: Status) => void
  onClose: () => void
}) {
  const list: Status[] = ['online', 'idle', 'dnd', 'invisible']
  useEscape(onClose)
  return (
    <div className="overlay soft" onMouseDown={onClose}>
      <div className="status-menu" onMouseDown={(e) => e.stopPropagation()}>
        {list.map((s) => (
          <button
            key={s}
            className={'status-opt' + (s === account.status ? ' on' : '')}
            onClick={() => onPick(s)}
          >
            <span className="p-dot" style={{ background: statusColor[s] }} />
            {statusLabel[s]}
          </button>
        ))}
      </div>
    </div>
  )
}
