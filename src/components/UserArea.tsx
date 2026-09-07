import { useEffect, useRef } from 'react'
import { Decoration } from '../ui/Decorations'
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
  PlusIcon,
  SwitchAccountsIcon,
} from '../ui/Icons'
import { Tooltip } from '../ui/Tooltip'
import { BADGES } from '../badges'

/**
 * The status indicator's diameter for a given avatar size.
 *
 * Discord does not scale it proportionally — it steps, and the step flattens
 * as the avatar grows, so the dot on a 80px profile avatar is only a fifth of
 * it where the dot on a 24px one is a third. Measured off the reference
 * frames: 16 on the popout's 80px avatar, 10 on the user card's 32px one.
 */
export function statusSize(avatar: number) {
  const steps: [number, number][] = [
    [16, 6],
    [20, 6],
    [24, 8],
    [32, 10],
    [40, 12],
    [48, 16],
    [80, 16],
    [100, 24],
    [152, 32],
  ]
  for (const [at, dot] of steps) if (avatar <= at) return dot
  return Math.round(avatar * 0.21)
}

export function Avatar({ account, size }: { account: Account; size: number }) {
  const dot = statusSize(size)
  return (
    <span className="avatar-wrap" style={{ width: size, height: size, flex: `0 0 ${size}px` }}>
      <DefaultAvatar color={account.color} />
      {/* Discord draws a decoration at 1.2x the avatar box, centred over it */}
      {account.decoration ? (
        <span className="avatar-decoration">
          <Decoration id={account.decoration} size={size * 1.2} />
        </span>
      ) : null}
      <span
        className="status-dot"
        style={{
          background: statusColor[account.status],
          width: dot,
          height: dot,
          // the gap around the dot is a hole punched through the avatar, so it
          // takes the colour of whatever the avatar is sitting on
          boxShadow: `0 0 0 ${Math.max(2, Math.round(dot * 0.2))}px var(--avatar-ring, var(--card))`,
        }}
      />
    </span>
  )
}

/** One of the prompts Discord rotates through on an empty status bubble. */
const STATUS_PROMPT = 'Best dad joke?'

/** The profile popout that opens from the user area. */
export function ProfilePopout({
  account,
  onEdit,
  onStatus,
  onSwitch,
  onCustomStatus,
  onClose,
}: {
  account: Account
  onEdit: () => void
  onStatus: () => void
  onSwitch: () => void
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

  // the popout paints from these; a themed profile washes the card, the
  // default one leaves it dark under an accent banner
  const badges = BADGES.filter((b) => (account.badges ?? []).includes(b.id))
  const themed = account.profileTheme
  const skin = themed
    ? {
        '--pop-body': `linear-gradient(180deg, ${themed[0]} 0%, ${themed[1]} 100%)`,
        '--pop-card': themed[0],
        '--pop-ring': '#dfdee4',
        '--pop-chip': '#f3eeff',
        '--pop-chip-text': '#2f3235',
        '--pop-name': '#0a0a0a',
        '--pop-sub': '#4e564f',
        '--pop-bio': '#333d36',
        '--pop-label': '#4a554f',
        '--pop-caret': '#66716b',
        '--pop-row': 'rgba(255, 255, 255, 0.24)',
        '--pop-row-hover': 'rgba(255, 255, 255, 0.3)',
        '--pop-divider': 'rgba(0, 0, 0, 0.033)',
      }
    : {
        '--pop-body': '#242426',
        '--pop-card': '#242426',
        '--pop-ring': '#242426',
        '--pop-chip': '#2e2d33',
        '--pop-chip-text': '#dbdee1',
        '--pop-name': '#f2f3f5',
        '--pop-sub': '#b5bac1',
        '--pop-bio': '#dbdee1',
        '--pop-label': '#dbdee1',
        '--pop-caret': '#b5bac1',
        '--pop-row': '#2e2d33',
        '--pop-row-hover': '#37363d',
        '--pop-divider': 'rgba(255, 255, 255, 0.06)',
      }

  return (
    <div className="popout" ref={ref} style={skin as React.CSSProperties}>
      <div className="popout-banner" style={themed ? undefined : { background: account.color }}>
        {themed ? <ProfileBanner /> : null}
      </div>
      <div className="popout-avatar">
        <Avatar account={account} size={64} />
      </div>
      {/* Discord's status bubble: a pill with a two-circle tail pointing back
          at the avatar, not the plain chip this used to draw */}
      {/* with a status set the bubble shows it; without one Discord shows a
          plus and an italic prompt inviting you to add one */}
      <button className="popout-chip" aria-label="Custom status" onClick={onCustomStatus}>
        <i className="chip-tail2" />
        <i className="chip-tail1" />
        <span className={'chip-body' + (account.customStatus ? '' : ' hint')}>
          {account.customStatus ? (
            account.customStatus
          ) : (
            <>
              <PlusIcon />
              <em>{STATUS_PROMPT}</em>
            </>
          )}
        </span>
      </button>
      <div className="popout-body">
        <div className="p-name">{account.name}</div>
        <div className="p-sub">
          {account.handle}
          {account.pronouns ? ` • ${account.pronouns}` : ''}
        </div>
        <div className="p-badges">
          {badges.map((b) => (
            <Tooltip key={b.id} label={b.label} side="above">
              <img className="p-badge" src={b.src} alt={b.label} />
            </Tooltip>
          ))}
        </div>
        {account.bio ? <div className="p-bio">{account.bio}</div> : null}
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
          <button className="p-btn" onClick={onSwitch}>
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
  profileOpen,
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
  /** the popout is open, which is when Discord swaps the line for the username */
  profileOpen: boolean
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
      {/* the second line is the custom status, or the plain status when there
          is none; hovering the card — or opening the popout — swaps it for the
          username, which is what all four reference frames show */}
      <button className={'id' + (profileOpen ? ' open' : '')} onClick={onOpenProfile}>
        <Avatar account={account} size={26} />
        <span className="user-meta">
          <span className="name">{account.name}</span>
          <span className="state">
            <i className="state-status">{account.customStatus || statusLabel[account.status]}</i>
            <i className="state-handle">{account.handle}</i>
          </span>
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
