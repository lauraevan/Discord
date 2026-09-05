import { CharacterAvatar, palettes } from '../ui/Art'
import { GearIcon, HeadphonesIcon, MicIcon, MicOffIcon } from '../ui/Icons'
import { Tooltip } from '../ui/Tooltip'

export function UserCard({
  muted,
  deafened,
  onMute,
  onDeafen,
  onSettings,
}: {
  muted: boolean
  deafened: boolean
  onMute: () => void
  onDeafen: () => void
  onSettings: () => void
}) {
  return (
    <div className="user-card">
      <div className="id">
        <div className="avatar-wrap">
          <CharacterAvatar p={palettes.wumpus} variant={0} />
          <span className="status-dot" />
        </div>
        <div className="user-meta">
          <div className="name">Wumpus</div>
          <div className="state">Online</div>
        </div>
      </div>
      <div className="acts">
        <Tooltip label={muted ? 'Unmute' : 'Mute'} side="below">
          <button
            className={'icon-btn' + (muted ? ' on' : '')}
            onClick={onMute}
            aria-label="Toggle mute"
          >
            {muted ? <MicOffIcon size={22} /> : <MicIcon size={22} />}
          </button>
        </Tooltip>
        <Tooltip label={deafened ? 'Undeafen' : 'Deafen'} side="below">
          <button
            className={'icon-btn' + (deafened ? ' on' : '')}
            onClick={onDeafen}
            aria-label="Toggle deafen"
          >
            <HeadphonesIcon size={23} />
          </button>
        </Tooltip>
        <Tooltip label="User Settings" side="below">
          <button className="icon-btn" onClick={onSettings} aria-label="User settings">
            <GearIcon size={23} />
          </button>
        </Tooltip>
      </div>
    </div>
  )
}
