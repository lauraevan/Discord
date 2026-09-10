import { useEffect, useRef } from 'react'
import { Decoration } from '../ui/Decorations'
import {
  ACCOUNT_CAPS,
  bannerColorOf,
  statusColor,
  statusLabel,
  type Account,
  type Server,
} from '../data'
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
import { ClydeIcon } from '../ui/Icons'
import { Nameplate } from '../ui/Nameplate'
import { DisplayName } from '../ui/DisplayName'
import { specFor, StatusGlyph, statusBox, statusMask } from '../ui/Status'
import { BADGES } from '../badges'
import { U } from '../zoom'

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
  // `size` is Discord's own number — 40 in a message, 32 in the member list —
  // so the mask spec is looked up on it, and only the box it draws into is
  // brought back into the frame's units
  const px = size * U
  return (
    <span className="avatar-wrap" style={{ width: px, height: px, flex: `0 0 ${px}px` }}>
      <svg className="avatar-svg" width={px} height={px} viewBox={`0 0 ${size} ${size}`}>
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
          <Decoration id={account.decoration} size={px * 1.2} />
        </span>
      ) : null}
    </span>
  )
}

/** Discord prints join dates as "12 Mar 2021" under Member Since. */
function joined(at?: number) {
  if (!at) return '—'
  return new Date(at).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
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
  server,
  since,
  note,
  onNote,
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
  /** the server it was opened in, if any — Discord shows more there */
  server?: Server | null
  /** when the account was made */
  since?: number
  note?: string
  onNote?: (v: string) => void
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
        <Avatar account={account} size={80} />
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

        {/* Opened inside a server, Discord adds three things the account panel
            has no room for: when you joined Discord and when you joined here,
            the roles you hold, and a private note only you ever see. */}
        {server ? (
          <>
            <div className="p-section">
              <div className="p-label">Member Since</div>
              <div className="p-since">
                <span>
                  <ClydeIcon />
                  {joined(since)}
                </span>
                <i />
                <span>
                  <span className="p-since-srv" style={{ background: server.color }}>
                    {server.initials}
                  </span>
                  {joined(server.createdAt)}
                </span>
              </div>
            </div>

            <div className="p-section">
              <div className="p-label">Roles</div>
              <div className="p-roles">
                {server.roles
                  .filter((r) => (server.memberRoles ?? []).includes(r.id) || r.id === 'everyone')
                  .map((r) => (
                    <span className="p-role" key={r.id}>
                      <i style={{ background: r.color ?? '#99aab5' }} />
                      {r.name}
                    </span>
                  ))}
              </div>
            </div>

            <div className="p-section">
              <div className="p-label">Note</div>
              <textarea
                className="p-note"
                rows={1}
                value={note ?? ''}
                placeholder="Click to add a note"
                aria-label="Note"
                /* "Max Characters user notes 500" — Discord's caps table */
                maxLength={ACCOUNT_CAPS.noteChars[0]}
                onChange={(e) => onNote?.(e.target.value)}
              />
            </div>
          </>
        ) : null}
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
  onVoiceSettings,
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
  /** the two carets beside mute and deafen open Voice & Video */
  onVoiceSettings: () => void
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
        <Avatar account={account} size={32} />
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
          {/* Discord's caret opens Voice & Video in settings */}
          <button className="caret" aria-label="Audio settings" onClick={onVoiceSettings}>
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
          <button className="caret" aria-label="Output settings" onClick={onVoiceSettings}>
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
