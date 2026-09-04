import { emoji, type Channel } from '../data'
import {
  BellOffIcon,
  ForumIcon,
  HashIcon,
  MegaphoneIcon,
  MembersIcon,
  PinIcon,
  RulesIcon,
  SearchIcon,
  ThreadsIcon,
} from '../ui/Icons'
import { Tooltip } from '../ui/Tooltip'

export function SearchBox({ placeholder }: { placeholder: string }) {
  return (
    <div className="searchbox">
      <input placeholder={placeholder} aria-label={placeholder} />
      <SearchIcon />
    </div>
  )
}

export function Toolbar({ serverName }: { serverName: string }) {
  const tools = [
    { label: 'Threads', Icon: ThreadsIcon },
    { label: 'Notification Settings', Icon: BellOffIcon },
    { label: 'Pinned Messages', Icon: PinIcon },
    { label: 'Show Member List', Icon: MembersIcon },
  ]
  return (
    <div className="chat-tools">
      {tools.map(({ label, Icon }) => (
        <Tooltip key={label} label={label} side="below">
          <button aria-label={label}>
            <Icon />
          </button>
        </Tooltip>
      ))}
      <SearchBox placeholder={`Search ${serverName}`} />
    </div>
  )
}

export function ChannelHeader({
  channel,
  serverName,
}: {
  channel: Channel
  serverName: string
}) {
  const Glyph =
    channel.kind === 'rules'
      ? RulesIcon
      : channel.kind === 'announcement'
        ? MegaphoneIcon
        : channel.kind === 'forum'
          ? ForumIcon
          : HashIcon
  return (
    <header className="chat-header">
      <Glyph className="ch-icon" />
      {channel.emoji ? (
        <img className="ch-emoji" src={emoji[channel.emoji]} alt="" />
      ) : null}
      <h2>{channel.name}</h2>
      <Toolbar serverName={serverName} />
    </header>
  )
}
