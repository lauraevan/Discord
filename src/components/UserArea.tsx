import { useEffect, useRef } from 'react'
import { statusColor, statusLabel, type Account } from '../data'
import { DefaultAvatar, ProfileBanner } from '../ui/Art'
import {
  ChevronDownIcon,
  CloseIcon,
  SmileyIcon,
  ChevronRightIcon,
  GearIcon,
  HeadphonesIcon,
  MicIcon,
  MicOffIcon,
  PencilIcon,
  MembersIcon,
} from '../ui/Icons'
import { Tooltip } from '../ui/Tooltip'

export function Avatar({ account, size }: { account: Account; size: number }) {
  return (
    <span className="avatar-wrap" style={{ width: size, height: size, flex: `0 0 ${size}px` }}>
      <DefaultAvatar color={account.color} />
      <span
        className="status-dot"
        style={{
          background: statusColor[account.status],
          width: size * 0.36,
          height: size * 0.36,
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
        <Avatar account={account} size={52} />
      </div>
      <span className="popout-chip">wow</span>
      <div className="popout-body">
        <div className="p-name">{account.name}</div>
        <div className="p-sub">
          {account.handle} • {account.pronouns}
        </div>
        <div className="p-accent" style={{ background: account.color }} />
        <div className="p-bio">{account.bio}</div>
        <div className="popout-actions">
          <button className="p-btn" onClick={onEdit}>
            <PencilIcon />
            <span>Edit Profile</span>
          </button>
          <button className="p-btn" onClick={onStatus}>
            <span className="p-dot" style={{ background: statusColor[account.status] }} />
            <span>{statusLabel[account.status]}</span>
            <ChevronRightIcon className="p-caret" />
          </button>
          <button className="p-btn" onClick={onCustomStatus}>
            <SmileyIcon />
            <span>{account.customStatus ? 'Edit Custom Status' : 'Set Custom Status'}</span>
          </button>
          <button className="p-btn">
            <MembersIcon />
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
        <Avatar account={account} size={28} />
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
