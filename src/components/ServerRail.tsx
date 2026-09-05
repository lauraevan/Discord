import type { ReactNode } from 'react'
import type { Server } from '../data'
import { people } from '../data'
import { CharacterAvatar, ObjectTile, palettes } from '../ui/Art'
import { ClydeIcon, CompassIcon, FolderIcon, PlusIcon } from '../ui/Icons'
import { Tooltip } from '../ui/Tooltip'

export function ServerArt({ server }: { server: Server }) {
  const a = server.art
  if (a.kind === 'object') return <ObjectTile kind={a.obj as never} />
  if (a.kind === 'character') {
    const key = a.person
    const p = palettes[key] ?? people[key]?.palette ?? palettes.wumpus
    const variant = people[key]?.variant ?? (key === 'witch' ? 0 : 1)
    return <CharacterAvatar p={p} variant={variant} />
  }
  return (
    <span className="server-initials" style={{ background: a.color }}>
      {a.initials}
    </span>
  )
}

function Tile({
  server,
  active,
  onSelect,
}: {
  server: Server
  active: boolean
  onSelect: () => void
}) {
  return (
    <Tooltip label={server.name}>
      <div
        className={
          'server' +
          (server.square ? ' square' : '') +
          (active ? ' active' : '') +
          (server.unread && !active ? ' unread' : '')
        }
      >
        <span className="server-pill" />
        <button className="server-tile" onClick={onSelect} aria-label={server.name}>
          <ServerArt server={server} />
        </button>
        {server.badge ? <span className="badge-count">{server.badge}</span> : null}
      </div>
    </Tooltip>
  )
}

function RailButton({
  label,
  children,
  onClick,
}: {
  label: string
  children: ReactNode
  onClick?: () => void
}) {
  return (
    <Tooltip label={label}>
      <div className="server square">
        <span className="server-pill" />
        <button className="server-tile plain" onClick={onClick} aria-label={label}>
          <span className="glyph-circle">{children}</span>
        </button>
      </div>
    </Tooltip>
  )
}

export function ServerRail({
  head,
  folder,
  tail,
  custom,
  activeId,
  onSelect,
  onHome,
  onCreate,
}: {
  head: Server[]
  folder: Server[]
  tail: Server[]
  custom: Server[]
  activeId: string | null
  onSelect: (id: string) => void
  onHome: () => void
  onCreate: () => void
}) {
  return (
    <nav className="rail">
      <div className="rail-scroll">
        <Tooltip label="Direct Messages">
          <div className={'server square' + (activeId === null ? ' active' : '')}>
            <span className="server-pill" />
            <button className="server-tile home" onClick={onHome} aria-label="Direct Messages">
              <ClydeIcon size={28} />
            </button>
          </div>
        </Tooltip>
        {head.map((s) => (
          <Tile key={s.id} server={s} active={s.id === activeId} onSelect={() => onSelect(s.id)} />
        ))}
        <div className="rail-sep" />
        {tail.map((s) => (
          <Tile key={s.id} server={s} active={s.id === activeId} onSelect={() => onSelect(s.id)} />
        ))}
        <div className="folder">
          <div className="folder-head">
            <span className="tile">
              <FolderIcon size={26} />
            </span>
          </div>
          {folder.map((s) => (
            <Tile key={s.id} server={s} active={s.id === activeId} onSelect={() => onSelect(s.id)} />
          ))}
        </div>
        <Tooltip label="Game Night">
          <div className="server square" style={{ marginBottom: 19 }}>
            <span className="server-pill" />
            <button className="server-tile" aria-label="Game Night">
              <span className="folder-grid">
                <span style={{ background: 'linear-gradient(135deg,#7ee0a0,#3aa76d)' }} />
                <span style={{ background: 'linear-gradient(135deg,#8fb6f5,#4a6fd0)' }} />
                <span style={{ background: 'linear-gradient(135deg,#a9c4f7,#5c7fd8)' }} />
                <span style={{ background: 'linear-gradient(135deg,#f28ac8,#c2409a)' }} />
              </span>
            </button>
          </div>
        </Tooltip>
        {custom.map((s, i) => (
          <div key={s.id} style={i === 0 ? { marginBottom: 2 } : undefined}>
            <Tile server={s} active={s.id === activeId} onSelect={() => onSelect(s.id)} />
          </div>
        ))}
        <RailButton label="Add a Server" onClick={onCreate}>
          <PlusIcon size={19} />
        </RailButton>
        <RailButton label="Discover">
          <CompassIcon size={20} />
        </RailButton>
      </div>
    </nav>
  )
}
