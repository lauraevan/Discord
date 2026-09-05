import { statusColor, type Account, type Channel } from '../data'
import {
  CloseIcon,
  ExpandIcon,
  MembersIcon,
  MicIcon,
  MicOffIcon,
  SmileyIcon,
  SpeakerIcon,
  VideoIcon,
} from '../ui/Icons'
import { Tooltip } from '../ui/Tooltip'
import { Avatar } from './UserArea'

/**
 * The voice channel view.
 *
 * Discord fills the chat pane with participant tiles and puts the control tray
 * along the bottom — camera, screen share, activities, soundboard, then the red
 * disconnect. Nothing here carries audio: a page has no voice server, and the
 * tray says so rather than pretending.
 */
export function VoiceView({
  channel,
  account,
  muted,
  deafened,
  onMute,
  onDeafen,
  onLeave,
}: {
  channel: Channel
  account: Account
  muted: boolean
  deafened: boolean
  onMute: () => void
  onDeafen: () => void
  onLeave: () => void
}) {
  return (
    <div className="voice-view">
      <div className="voice-stage">
        <div className="voice-tile">
          <span className={'voice-avatar' + (muted ? '' : ' speaking')}>
            <Avatar account={account} size={80} />
          </span>
          <span className="voice-name">
            {muted ? <MicOffIcon /> : null}
            {account.name}
          </span>
          <span className="voice-dot-lg" style={{ background: statusColor[account.status] }} />
        </div>
      </div>

      <div className="voice-note">
        Connected to <b>{channel.name}</b>. No audio is flowing — voice needs a media server, which
        a static page does not have.
      </div>

      <div className="voice-tray">
        <Tooltip label="Turn On Camera" side="above">
          <button className="vt off" aria-label="Turn on camera" disabled>
            <VideoIcon />
          </button>
        </Tooltip>
        <Tooltip label="Share Your Screen" side="above">
          <button className="vt off" aria-label="Share your screen" disabled>
            <ExpandIcon />
          </button>
        </Tooltip>
        <Tooltip label="Activities" side="above">
          <button className="vt off" aria-label="Activities" disabled>
            <MembersIcon />
          </button>
        </Tooltip>
        <Tooltip label="Soundboard" side="above">
          <button className="vt off" aria-label="Soundboard" disabled>
            <SmileyIcon />
          </button>
        </Tooltip>
        <Tooltip label={muted ? 'Unmute' : 'Mute'} side="above">
          <button className={'vt' + (muted ? ' on' : '')} aria-label="Toggle mute" onClick={onMute}>
            {muted ? <MicOffIcon /> : <MicIcon />}
          </button>
        </Tooltip>
        <Tooltip label={deafened ? 'Undeafen' : 'Deafen'} side="above">
          <button
            className={'vt' + (deafened ? ' on' : '')}
            aria-label="Toggle deafen"
            onClick={onDeafen}
          >
            <SpeakerIcon />
          </button>
        </Tooltip>
        <Tooltip label="Disconnect" side="above">
          <button className="vt leave" aria-label="Disconnect" onClick={onLeave}>
            <CloseIcon />
          </button>
        </Tooltip>
      </div>
    </div>
  )
}

/** The row Discord shows under a voice channel for each person in it. */
export function VoiceMember({ account }: { account: Account }) {
  return (
    <div className="voice-member">
      <Avatar account={account} size={24} />
      <span>{account.name}</span>
    </div>
  )
}
