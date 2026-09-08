import { useEffect, useState } from 'react'
import {
  CHANNEL_TYPES,
  serverColors,
  statusLabel,
  type Account,
  type Channel,
  type Status,
} from '../data'
import { StatusGlyph } from '../ui/Status'
import {
  ForumIcon,
  HashIcon,
  SmileyIcon,
  MegaphoneIcon,
  SpeakerIcon,
  StageIcon,
  VideoIcon,
} from '../ui/Icons'

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
        {CHANNEL_TYPES.map(([k, label, note]) => {
          const Icon =
            k === 'text'
              ? HashIcon
              : k === 'voice'
                ? SpeakerIcon
                : k === 'announcement'
                  ? MegaphoneIcon
                  : k === 'stage'
                    ? StageIcon
                    : k === 'forum'
                      ? ForumIcon
                      : VideoIcon
          return (
            <button
              key={k}
              className={'type-opt' + (kind === k ? ' on' : '')}
              onClick={() => setKind(k)}
            >
              <Icon />
              <span>
                <b>{label}</b>
                <i>{note}</i>
              </span>
              <span className="type-radio" />
            </button>
          )
        })}
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
  onCustomStatus,
  onClose,
}: {
  account: Account
  onPick: (s: Status) => void
  onCustomStatus: () => void
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
            <StatusGlyph status={s} size={10} />
            {statusLabel[s]}
          </button>
        ))}
        {/* Discord keeps custom status inside this submenu, not as a row of
            its own on the popout */}
        <div className="status-sep" />
        <button className="status-opt" onClick={onCustomStatus}>
          <SmileyIcon />
          {account.customStatus ? 'Edit Custom Status' : 'Set Custom Status'}
        </button>
      </div>
    </div>
  )
}

/**
 * Switch Accounts.
 *
 * Discord lists the accounts you are signed in to and offers to add another.
 * There is one account here and no login to add a second with, so the panel
 * shows the real one and says plainly why the other row does nothing.
 */
export function SwitchAccounts({
  account,
  onClose,
  onSignOut,
}: {
  account: Account
  onClose: () => void
  onSignOut: () => void
}) {
  useEscape(onClose)
  return (
    <div className="overlay soft" onMouseDown={onClose}>
      <div className="status-menu accounts" onMouseDown={(e) => e.stopPropagation()}>
        <div className="accounts-head">Accounts</div>
        <button className="status-opt on">
          <StatusGlyph status={account.status} size={10} />
          <span className="accounts-name">
            {account.name}
            <span>{account.handle}</span>
          </span>
        </button>
        <div className="status-sep" />
        <button className="status-opt" onClick={onSignOut}>
          Add an Account
        </button>
        <button className="status-opt danger" onClick={onSignOut}>
          Log Out
        </button>
      </div>
    </div>
  )
}

/**
 * Use Apps.
 *
 * Discord lists the apps installed on the server and links out to the App
 * Directory. Nothing is installed here, and nothing could be — an app is a
 * program on Discord's side — so the panel shows that empty state honestly.
 */
export function AppsPanel({ onClose }: { onClose: () => void }) {
  useEscape(onClose)
  return (
    <div className="overlay soft" onMouseDown={onClose}>
      <div className="status-menu apps-panel" onMouseDown={(e) => e.stopPropagation()}>
        <div className="accounts-head">Apps</div>
        <p className="apps-empty">
          No apps are installed on this server. Apps run on Discord&rsquo;s side, so a page cannot
          bring its own.
        </p>
      </div>
    </div>
  )
}
