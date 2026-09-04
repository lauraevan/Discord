import { emoji, type Category, type Channel, type Server } from '../data'
import {
  AddMemberIcon,
  BrowseChannelsIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ForumIcon,
  HashIcon,
  MegaphoneIcon,
  PlusIcon,
  RulesIcon,
  ServerHomeIcon,
  SparkleIcon,
} from '../ui/Icons'
import { Tooltip } from '../ui/Tooltip'

function ChannelGlyph({ kind }: { kind: Channel['kind'] }) {
  if (kind === 'rules') return <RulesIcon className="ch-icon" />
  if (kind === 'announcement') return <MegaphoneIcon className="ch-icon" />
  if (kind === 'forum') return <ForumIcon className="ch-icon" />
  return <HashIcon className="ch-icon" />
}

export function ServerHeader({ name }: { name: string }) {
  return (
    <div className="server-header">
      <ServerHomeIcon className="home-mark" />
      <h1>{name}</h1>
      <ChevronDownIcon className="chevron" />
      <Tooltip label="Create Invite" side="below">
        <AddMemberIcon className="invite" />
      </Tooltip>
    </div>
  )
}

export function BoostGoal() {
  return (
    <div className="boost-card">
      <span className="label">Boost Goal</span>
      <span className="value">0/36 Boosts</span>
      <ChevronRightIcon className="chevron" />
    </div>
  )
}

export function BrowseChannels() {
  return (
    <div className="browse-row">
      <BrowseChannelsIcon />
      <span>Browse Channels</span>
    </div>
  )
}

export function ChannelRow({
  channel,
  active,
  onSelect,
}: {
  channel: Channel
  active: boolean
  onSelect: () => void
}) {
  const cls =
    'channel' +
    (active ? ' active' : '') +
    (channel.unread && !active ? ' unread' : '') +
    (channel.muted && !active ? ' muted' : '')
  return (
    <button className={cls} onClick={onSelect}>
      {channel.unread && !active ? <span className="channel-dot" /> : null}
      <ChannelGlyph kind={channel.kind} />
      {channel.emoji ? <img className="ch-emoji" src={emoji[channel.emoji]} alt="" /> : null}
      <span className="channel-name">{channel.name}</span>
      {channel.trailingEmoji ? (
        <img className="trailing-emoji" src={emoji[channel.trailingEmoji]} alt="" />
      ) : null}
      {channel.badge ? <span className="badge-count ch-badge">{channel.badge}</span> : null}
      {channel.invite && active ? <AddMemberIcon className="ch-action" /> : null}
    </button>
  )
}

export function ChannelCategory({
  category,
  collapsed,
  activeChannel,
  onToggle,
  onSelect,
}: {
  category: Category
  collapsed: boolean
  activeChannel: string
  onToggle: () => void
  onSelect: (id: string) => void
}) {
  return (
    <>
      <button className={'category' + (collapsed ? ' collapsed' : '')} onClick={onToggle}>
        {category.icon === 'sparkle' ? (
          <SparkleIcon className="cat-icon" />
        ) : (
          <img className="cat-emoji" src={emoji.globe} alt="" />
        )}
        <span className="category-name">{category.name}</span>
        <ChevronDownIcon className="chevron" />
      </button>
      {category.channels
        .filter((c) => !collapsed || c.id === activeChannel || c.unread)
        .map((c) => (
          <ChannelRow
            key={c.id}
            channel={c}
            active={c.id === activeChannel}
            onSelect={() => onSelect(c.id)}
          />
        ))}
    </>
  )
}

export function ChannelSidebar({
  server,
  categories,
  activeChannel,
  collapsed,
  onToggle,
  onSelect,
  onCreate,
}: {
  server: Server | null
  categories: Category[]
  activeChannel: string
  collapsed: string[]
  onToggle: (id: string) => void
  onSelect: (id: string) => void
  onCreate: () => void
}) {
  if (!server) {
    return (
      <div className="sidebar">
        <div className="server-header plain">
          <h1>Home</h1>
        </div>
        <div className="sidebar-scroll">
          <button className="add-server-row" onClick={onCreate}>
            <PlusIcon />
            <span>Create a server</span>
          </button>
          <p className="sidebar-hint">
            Servers you create show up in the rail on the left.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="sidebar">
      <ServerHeader name={server.name} />
      <div className="sidebar-scroll">
        <BoostGoal />
        <div className="side-rule" />
        <BrowseChannels />
        <div className="side-rule" style={{ marginTop: '13.5px' }} />
        {categories.map((cat) => (
          <ChannelCategory
            key={cat.id}
            category={cat}
            collapsed={collapsed.includes(cat.id)}
            activeChannel={activeChannel}
            onToggle={() => onToggle(cat.id)}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}
