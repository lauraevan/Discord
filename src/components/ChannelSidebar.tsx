import type { Category, Channel, Server } from '../data'
import {
  AddMemberIcon,
  BoostIcon,
  BrowseChannelsIcon,
  CalendarIcon,
  ChevronDownIcon,
  ForumIcon,
  GearIcon,
  HashIcon,
  MegaphoneIcon,
  MembersIcon,
  PlusIcon,
  RulesIcon,
  SpeakerIcon,
} from '../ui/Icons'
import { Tooltip } from '../ui/Tooltip'

function Glyph({ kind }: { kind: Channel['kind'] }) {
  if (kind === 'announcement') return <MegaphoneIcon />
  if (kind === 'forum') return <ForumIcon />
  if (kind === 'rules') return <RulesIcon />
  if (kind === 'voice') return <SpeakerIcon />
  return <HashIcon />
}

function ChannelRow({
  channel,
  active,
  onSelect,
  onSettings,
}: {
  channel: Channel
  active: boolean
  onSelect: () => void
  onSettings: () => void
}) {
  return (
    <div className={'row' + (active ? ' active' : '')} onClick={onSelect}>
      <Glyph kind={channel.kind} />
      <span className="row-name">{channel.name}</span>
      <span className="row-actions">
        <Tooltip label="Create Invite" side="below">
          <button aria-label="Create invite" onClick={(e) => e.stopPropagation()}>
            <AddMemberIcon />
          </button>
        </Tooltip>
        <Tooltip label="Edit Channel" side="below">
          <button
            aria-label="Edit channel"
            onClick={(e) => {
              e.stopPropagation()
              onSettings()
            }}
          >
            <GearIcon />
          </button>
        </Tooltip>
      </span>
    </div>
  )
}

export function ChannelSidebar({
  server,
  activeChannel,
  collapsed,
  onToggle,
  onSelect,
  onAddChannel,
  onEditChannel,
}: {
  server: Server
  activeChannel: string
  collapsed: string[]
  onToggle: (id: string) => void
  onSelect: (id: string) => void
  onAddChannel: (categoryId: string | null) => void
  onEditChannel: (id: string) => void
}) {
  const loose = server.channels.filter((c) => c.categoryId === null)
  const inCat = (cat: Category) => server.channels.filter((c) => c.categoryId === cat.id)

  return (
    <div className="sidebar">
      <button className="server-header">
        <BoostIcon className="badge-mark" />
        <h1>{server.name}</h1>
        <ChevronDownIcon className="chevron" />
        <Tooltip label="Create Invite" side="below">
          <span className="invite" aria-label="Create invite">
            <AddMemberIcon />
          </span>
        </Tooltip>
      </button>

      <div className="sidebar-scroll">
        <div className="nav-block">
          <div className="row nav">
            <CalendarIcon />
            <span className="row-name">Events</span>
          </div>
          <div className="row nav">
            <BrowseChannelsIcon />
            <span className="row-name">Browse Channels</span>
          </div>
          <div className="row nav">
            <MembersIcon />
            <span className="row-name">Members</span>
          </div>
          <div className="row nav">
            <BoostIcon />
            <span className="row-name">Server Boosts</span>
          </div>
        </div>

        <div className="side-rule" />

        {loose.map((c) => (
          <ChannelRow
            key={c.id}
            channel={c}
            active={c.id === activeChannel}
            onSelect={() => onSelect(c.id)}
            onSettings={() => onEditChannel(c.id)}
          />
        ))}

        {server.categories.map((cat) => (
          <div key={cat.id}>
            <div className={'category' + (collapsed.includes(cat.id) ? ' collapsed' : '')}>
              <button className="cat-label" onClick={() => onToggle(cat.id)}>
                <span>{cat.name}</span>
                <ChevronDownIcon className="chevron" />
              </button>
              <Tooltip label="Create Channel" side="below">
                <button className="cat-add" onClick={() => onAddChannel(cat.id)} aria-label="Create channel">
                  <PlusIcon />
                </button>
              </Tooltip>
            </div>
            {(collapsed.includes(cat.id) ? [] : inCat(cat)).map((c) => (
              <ChannelRow
                key={c.id}
                channel={c}
                active={c.id === activeChannel}
                onSelect={() => onSelect(c.id)}
                onSettings={() => onEditChannel(c.id)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
