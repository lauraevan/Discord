import { useEffect, useRef } from 'react'
import { statusColor, statusLabel, type Account } from '../data'
import { DefaultAvatar, ProfileBanner } from '../ui/Art'
import {
  ChevronDownIcon,
  CloseIcon,
  ChevronRightIcon,
  GearIcon,
  HeadphonesIcon,
  MicIcon,
  MicOffIcon,
  PencilIcon,
  SwitchAccountsIcon,
} from '../ui/Icons'
import { Tooltip } from '../ui/Tooltip'
import { BADGES } from '../badges'

export function Avatar({ account, size }: { account: Account; size: number }) {
  return (
    <span className="avatar-wrap" style={{ width: size, height: size, flex: `0 0 ${size}px` }}>
      <DefaultAvatar color={account.color} />
      <span
        className="status-dot"
        style={{
          background: statusColor[account.status],
          width: size * 0.42,
          height: size * 0.42,
        }}
      />
    </span>
  )
}

/** The profile popout that opens from the user area. */
export function ProfilePopout({
  account,
  onEdit,
  onStatus,
  onCustomStatus,
  onClose,
}: {
  account: Account
  onEdit: () => void
  onStatus: () => void
  onCustomStatus: () => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const away = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose()
    }
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('mousedown', away)
    window.addEventListener('keydown', key)
    return () => {
      window.removeEventListener('mousedown', away)
      window.removeEventListener('keydown', key)
    }
  }, [onClose])

  return (
    <div className="popout" ref={ref}>
      <div className="popout-banner">
        <ProfileBanner />
      </div>
      <div className="popout-avatar">
        <Avatar account={account} size={64} />
      </div>
      {/* Discord's status bubble: a pill with a two-circle tail pointing back
          at the avatar, not the plain chip this used to draw */}
      <span className="popout-chip" aria-label="Status">
        <i className="chip-tail2" />
        <i className="chip-tail1" />
        <span className="chip-body">wow</span>
      </span>
      <div className="popout-body">
        <div className="p-name">{account.name}</div>
        <div className="p-sub">
          {account.handle} • {account.pronouns}
        </div>
        <div className="p-badges">
          {BADGES.map((b) => (
            <Tooltip key={b.id} label={b.label} side="above">
              <img className="p-badge" src={b.src} alt={b.label} />
            </Tooltip>
          ))}
        </div>
        <div className="p-bio">{account.customStatus || account.bio}</div>
        {/* Discord groups these: Edit Profile and the status row share a card,
            Switch Accounts sits in its own. Custom status lives inside the
            status submenu, not as a row of its own. */}
        <div className="p-group">
          <button className="p-btn" onClick={onEdit}>
            <PencilIcon />
            <span>Edit Profile</span>
          </button>
          <button className="p-btn" onClick={onStatus}>
            <span className="p-dot" style={{ background: statusColor[account.status] }} />
            <span>{statusLabel[account.status]}</span>
            <ChevronRightIcon className="p-caret" />
          </button>
        </div>
        <div className="p-group">
          <button className="p-btn" onClick={onCustomStatus}>
            <SwitchAccountsIcon />
            <span>Switch Accounts</span>
            <ChevronRightIcon className="p-caret" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function UserArea({
  account,
  muted,
  deafened,
  voice,
  onLeaveVoice,
  onMute,
  onDeafen,
  onSettings,
  onOpenProfile,
}: {
  account: Account
  muted: boolean
  deafened: boolean
  voice: string | null
  onLeaveVoice: () => void
  onMute: () => void
  onDeafen: () => void
  onSettings: () => void
  onOpenProfile: () => void
}) {
  return (
    <div className={'user-card' + (voice ? ' with-voice' : '')}>
      {voice ? (
        <div className="voice-strip">
          <span className="voice-dot" />
          <span className="voice-meta">
            <b>Voice Connected</b>
            <span>{voice}</span>
          </span>
          <button className="voice-leave" onClick={onLeaveVoice} aria-label="Disconnect">
            <CloseIcon />
          </button>
        </div>
      ) : null}
      <button className="id" onClick={onOpenProfile}>
        <Avatar account={account} size={26} />
        <span className="user-meta">
          <span className="name">{account.name}</span>
          <span className="state">{account.handle}</span>
        </span>
      </button>
      <div className="acts">
        <span className={'split' + (muted ? ' on' : '')}>
          <Tooltip label={muted ? 'Unmute' : 'Mute'} side="below">
            <button className="icon-btn" onClick={onMute} aria-label="Toggle mute">
              {muted ? <MicOffIcon /> : <MicIcon />}
            </button>
          </Tooltip>
          <button className="caret" aria-label="Audio settings">
            <ChevronDownIcon />
          </button>
        </span>
        <span className={'split' + (deafened ? ' on' : '')}>
          <Tooltip label={deafened ? 'Undeafen' : 'Deafen'} side="below">
            <button className="icon-btn" onClick={onDeafen} aria-label="Toggle deafen">
              <HeadphonesIcon />
            </button>
          </Tooltip>
          <button className="caret" aria-label="Output settings">
            <ChevronDownIcon />
          </button>
        </span>
        <Tooltip label="User Settings" side="below">
          <button className="icon-btn" onClick={onSettings} aria-label="User settings">
            <GearIcon />
          </button>
        </Tooltip>
      </div>
    </div>
  )
}
