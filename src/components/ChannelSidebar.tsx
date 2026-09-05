import type { Category, Channel, Server } from '../data'
import { people } from '../data'
import { CharacterAvatar } from '../ui/Art'
import {
  BrowseChannelsIcon,
  CalendarIcon,
  ChevronDownIcon,
  ForumIcon,
  HashIcon,
  MegaphoneIcon,
  MicOffIcon,
  RulesIcon,
  SpeakerIcon,
  VerifiedIcon,
  VideoIcon,
} from '../ui/Icons'

function Glyph({ kind }: { kind: Channel['kind'] }) {
  if (kind === 'announcement') return <MegaphoneIcon />
  if (kind === 'forum') return <ForumIcon />
  if (kind === 'rules') return <RulesIcon />
  if (kind === 'voice') return <SpeakerIcon />
  return <HashIcon />
}

export function ServerHeader({ server }: { server: Server }) {
  return (
    <button className="server-header">
      {server.verified ? <VerifiedIcon className="badge-mark" /> : null}
      <h1>{server.name}</h1>
      <ChevronDownIcon className="chevron" />
    </button>
  )
}

function VoiceMember({
  id,
  video,
  muted,
}: {
  id: string
  video?: boolean
  muted?: boolean
}) {
  const p = people[id]
  return (
    <div className="voice-member">
      <span className="pfp">
        <CharacterAvatar p={p.palette} variant={p.variant} glasses={p.glasses} />
      </span>
      <span className="vname">{p.name}</span>
      {video || muted ? (
        <span className="vicons">
          {video ? <VideoIcon /> : null}
          {muted ? <MicOffIcon className="off" /> : null}
        </span>
      ) : null}
    </div>
  )
}

export function ChannelSidebar({
  server,
  activeChannel,
  collapsed,
  onToggle,
  onSelect,
}: {
  server: Server
  activeChannel: string
  collapsed: string[]
  onToggle: (id: string) => void
  onSelect: (id: string) => void
}) {
  return (
    <div className="sidebar">
      <ServerHeader server={server} />
      <div className="sidebar-scroll">
        <div style={{ height: 18 }} />
        <button className="row">
          <CalendarIcon />
          <span className="row-name">2 Events</span>
        </button>
        <button className="row">
          <BrowseChannelsIcon />
          <span className="row-name">Browse Channels</span>
        </button>
        <div className="section-gap" />

        {server.categories.map((cat: Category) => (
          <div key={cat.id}>
            {cat.name ? (
              <button
                className={'category' + (collapsed.includes(cat.id) ? ' collapsed' : '')}
                onClick={() => onToggle(cat.id)}
              >
                <span>{cat.name}</span>
                <ChevronDownIcon className="chevron" />
              </button>
            ) : null}
            {(collapsed.includes(cat.id) ? [] : cat.channels).map((c) => (
              <div key={c.id}>
                <button
                  className={
                    'row' +
                    (c.id === activeChannel ? ' active' : '') +
                    (c.unread ? ' unread' : '') +
                    (c.connected?.length ? ' in-voice' : '')
                  }
                  onClick={() => onSelect(c.id)}
                >
                  {c.unread && c.id !== activeChannel ? <span className="dot" /> : null}
                  <Glyph kind={c.kind} />
                  <span className="row-name">{c.name}</span>
                </button>
                {c.threads?.map((t) => (
                  <button key={t.id} className="thread">
                    {t.name}
                  </button>
                ))}
                {c.connected?.map((m) => (
                  <VoiceMember key={m.person} id={m.person} video={m.video} muted={m.muted} />
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
