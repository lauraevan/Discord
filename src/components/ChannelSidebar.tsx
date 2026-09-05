import { Fragment } from 'react'
import type { Category, Channel, Server } from '../data'
import {
  AddMemberIcon,
  BoostIcon,
  BrowseChannelsIcon,
  VerifiedIcon,
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
  ThreadsIcon,
} from '../ui/Icons'
import { Tooltip } from '../ui/Tooltip'

function Glyph({ kind, thread }: { kind: Channel['kind']; thread?: boolean }) {
  if (thread) return <ThreadsIcon />
  if (kind === 'announcement') return <MegaphoneIcon />
  if (kind === 'forum') return <ForumIcon />
  if (kind === 'rules') return <RulesIcon />
  if (kind === 'voice') return <SpeakerIcon />
  return <HashIcon />
}

function ChannelRow({
  channel,
  active,
  unread,
  inVoice,
  onSelect,
  onSettings,
  onContext,
}: {
  channel: Channel
  active: boolean
  unread: boolean
  inVoice: boolean
  onSelect: () => void
  onSettings: () => void
  onContext: (at: { x: number; y: number }) => void
}) {
  return (
    <div
      className={
        'row' +
        (active ? ' active' : '') +
        (unread ? ' unread' : '') +
        (inVoice ? ' in-voice' : '') +
        (channel.parentId ? ' thread' : '')
      }
      onClick={onSelect}
      onContextMenu={(e) => {
        e.preventDefault()
        onContext({ x: e.clientX, y: e.clientY })
      }}
    >
      {unread && !active ? <span className="unread-pip" /> : null}
      <Glyph kind={channel.kind} thread={!!channel.parentId} />
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
  unread,
  voice,
  collapsed,
  onToggle,
  onSelect,
  onAddChannel,
  onEditChannel,
  onContext,
  onHeader,
}: {
  server: Server
  activeChannel: string
  unread: Record<string, boolean>
  voice: string | null
  collapsed: string[]
  onToggle: (id: string) => void
  onSelect: (id: string) => void
  onAddChannel: (categoryId: string | null) => void
  onEditChannel: (id: string) => void
  onContext: (id: string, at: { x: number; y: number }) => void
  onHeader: (at: { x: number; y: number }) => void
}) {
  // threads hang off their parent channel rather than sitting in the list
  const top = server.channels.filter((c) => !c.parentId)
  const loose = top.filter((c) => c.categoryId === null)
  const inCat = (cat: Category) => top.filter((c) => c.categoryId === cat.id)
  const threadsOf = (id: string) => server.channels.filter((c) => c.parentId === id)

  const row = (c: Channel) => (
    <Fragment key={c.id}>
      <ChannelRow
        channel={c}
        active={c.id === activeChannel}
        unread={!!unread[c.id]}
        inVoice={voice === c.id}
        onSelect={() => onSelect(c.id)}
        onSettings={() => onEditChannel(c.id)}
        onContext={(at) => onContext(c.id, at)}
      />
      {threadsOf(c.id).map((t) => (
        <ChannelRow
          key={t.id}
          channel={t}
          active={t.id === activeChannel}
          unread={!!unread[t.id]}
          inVoice={false}
          onSelect={() => onSelect(t.id)}
          onSettings={() => onEditChannel(t.id)}
          onContext={(at) => onContext(t.id, at)}
        />
      ))}
    </Fragment>
  )

  return (
    <div className="sidebar">
      <button
        className="server-header"
        onClick={(e) => {
          const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
          onHeader({ x: r.left + 8, y: r.bottom + 4 })
        }}
      >
        <VerifiedIcon className="badge-mark" />
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

        {loose.map(row)}

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
            {(collapsed.includes(cat.id) ? [] : inCat(cat)).map(row)}
          </div>
        ))}
      </div>
    </div>
  )
}
