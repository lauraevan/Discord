import { ArtGem, DefaultAvatar } from '../ui/Art'
import {
  ChevronDownIcon,
  GearIcon,
  HeadphonesIcon,
  MicOffIcon,
} from '../ui/Icons'
import { Tooltip } from '../ui/Tooltip'

export function PromoCard() {
  return (
    <div className="promo">
      <span className="promo-tile">
        <ArtGem />
      </span>
      <span className="promo-logo">
        <span className="l1">STREET</span>
        <span className="l2">FIGHTER</span>
      </span>
      <button className="promo-btn">Get Reward!</button>
    </div>
  )
}

export function UserPanel({
  muted,
  deafened,
  onMute,
  onDeafen,
}: {
  muted: boolean
  deafened: boolean
  onMute: () => void
  onDeafen: () => void
}) {
  return (
    <div className="user-panel">
      <div className="user-id">
        <div className="avatar-wrap">
          <DefaultAvatar />
          <span className="status-dot" />
        </div>
        <div className="user-meta">
          <div className="name">vice</div>
          <div className="state">Online</div>
        </div>
      </div>
      <div className="user-actions">
        <div className={'split-btn' + (muted ? ' muted' : '')}>
          <Tooltip label={muted ? 'Unmute' : 'Mute'} side="below">
            <button className="main" onClick={onMute} aria-label="Toggle mute">
              <MicOffIcon size={21} />
            </button>
          </Tooltip>
          <button className="caret" aria-label="Audio settings">
            <ChevronDownIcon size={13} />
          </button>
        </div>
        <div className={'split-btn' + (deafened ? ' muted' : '')}>
          <Tooltip label={deafened ? 'Undeafen' : 'Deafen'} side="below">
            <button className="main" onClick={onDeafen} aria-label="Toggle deafen">
              <HeadphonesIcon size={20} />
            </button>
          </Tooltip>
          <button className="caret" aria-label="Output settings">
            <ChevronDownIcon size={13} />
          </button>
        </div>
        <Tooltip label="User Settings" side="below">
          <button className="icon-btn" aria-label="User settings">
            <GearIcon size={21} />
          </button>
        </Tooltip>
      </div>
    </div>
  )
}

export function Dock(props: {
  muted: boolean
  deafened: boolean
  onMute: () => void
  onDeafen: () => void
}) {
  return (
    <div className="dock">
      <PromoCard />
      <UserPanel {...props} />
    </div>
  )
}
