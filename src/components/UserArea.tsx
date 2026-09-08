import { useEffect, useRef } from 'react'
import { Decoration } from '../ui/Decorations'
import { bannerColorOf, statusColor, statusLabel, type Account } from '../data'
import { DefaultAvatar, ProfileBanner } from '../ui/Art'
import {
  ChevronDownIcon,
  CloseIcon,
  ChevronRightIcon,
  GearIcon,
  MembersIcon,
  HeadphonesIcon,
  HeadphonesOffIcon,
  MicIcon,
  MicOffIcon,
  PencilIcon,
  PlusIcon,
  SwitchAccountsIcon,
} from '../ui/Icons'
import { Tooltip } from '../ui/Tooltip'
import { Nameplate } from '../ui/Nameplate'
import { DisplayName } from '../ui/DisplayName'
import { specFor, StatusGlyph, statusBox, statusMask } from '../ui/Status'
import { BADGES } from '../badges'

/**
 * The status indicator's diameter for a given avatar size, from Discord's own
 * avatar table rather than a proportion of the avatar — see src/ui/Status.tsx.
 */
export const statusSize = (avatar: number) => statusBox(avatar).d

/**
 * An avatar, with presence cut into it.
 *
 * Discord does not lay a dot on top of the avatar: it masks a hole out of the
 * avatar's bottom-right corner and puts the indicator in the gap, so the gap
 * shows whatever is behind. That needs the image inside an SVG the mask can
 * apply to, which is exactly how the client builds it.
 *
 * `status={false}` is for the message feed, where Discord shows no presence at
 * all — presence belongs to the member list, the DM list, the account card and
 * a profile.
 */
export function Avatar({
  account,
  size,
  status = true,
}: {
  account: Account
  size: number
  status?: boolean
}) {
  const spec = specFor(size)
  const box = statusBox(size)
  return (
    <span className="avatar-wrap" style={{ width: size, height: size, flex: `0 0 ${size}px` }}>
      <svg className="avatar-svg" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <foreignObject
          x={0}
          y={0}
          width={size}
          height={size}
          mask={status ? `url(#dc-hole-${spec.size})` : undefined}
        >
          {account.avatar ? (
            <img className="art" src={account.avatar} alt="" draggable={false} />
          ) : (
            <DefaultAvatar color={account.color} />
          )}
        </foreignObject>
        {status ? (
          <rect
            x={box.x}
            y={box.y}
            width={box.d}
            height={box.d}
            fill={statusColor[account.status]}
            mask={`url(#${statusMask(account.status)})`}
          />
        ) : null}
      </svg>
      {/* Discord draws a decoration at 1.2x the avatar box, centred over it */}
      {account.decoration ? (
        <span className="avatar-decoration">
          <Decoration id={account.decoration} size={size * 1.2} />
        </span>
      ) : null}
    </span>
  )
}

/** One of the prompts Discord rotates through on an empty status bubble. */
const STATUS_PROMPT = 'Best dad joke?'

/** The profile popout that opens from the user area. */
/**
 * Discord's user popout.
 *
 * The same card wherever it opens from: anchored above the account card when
 * it has no `at`, and pinned to whatever was clicked when it does — an avatar
 * in the feed, a row in the member list. Discord clamps it into the window,
 * which is what the caller passes an already-clamped point for.
 */
export function ProfilePopout({
  account,
  at,
  onEdit,
  onStatus,
  onSwitch,
  onCustomStatus,
  onViewProfile,
  onClose,
}: {
  account: Account
  /** viewport coordinates when the popout is anchored to something */
  at?: { x: number; y: number }
  onEdit: () => void
  onStatus: () => void
  onSwitch: () => void
  onCustomStatus: () => void
  onViewProfile?: () => void
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
    <div
      className={'popout' + (at ? ' anchored' : '')}
      ref={ref}
      style={
        (at ? { ...skin, left: at.x, top: at.y } : skin) as React.CSSProperties
      }
    >
      <div className="popout-banner" style={themed ? undefined : { background: bannerColorOf(account) }}>
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
        <div className="p-names">
          <Nameplate id={account.nameplate} />
          <div className="p-name">
            <DisplayName account={account} />
          </div>
        </div>
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
            <StatusGlyph status={account.status} size={10} />
            <span>{statusLabel[account.status]}</span>
            <ChevronRightIcon className="p-caret" />
          </button>
        </div>
        <div className="p-group">
          {onViewProfile ? (
            <button className="p-btn" onClick={onViewProfile}>
              <MembersIcon />
              <span>View Full Profile</span>
              <ChevronRightIcon className="p-caret" />
            </button>
          ) : null}
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
              {/* Discord springs a button's contents when they change: the new
                  glyph comes up from scale(0.6). The key is what makes React
                  mount a new one rather than repaint the old. */}
              <span className="icon-swap" key={muted ? 'muted' : 'live'}>
                {muted ? <MicOffIcon /> : <MicIcon />}
              </span>
            </button>
          </Tooltip>
          <button className="caret" aria-label="Audio settings">
            <ChevronDownIcon />
          </button>
        </span>
        <span className={'split' + (deafened ? ' on' : '')}>
          <Tooltip label={deafened ? 'Undeafen' : 'Deafen'} side="below">
            <button className="icon-btn" onClick={onDeafen} aria-label="Toggle deafen">
              <span className="icon-swap" key={deafened ? 'deaf' : 'hearing'}>
                {deafened ? <HeadphonesOffIcon /> : <HeadphonesIcon />}
              </span>
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
