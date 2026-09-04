import type { Server } from '../data'
import { ClydeIcon, CompassIcon, PlusIcon } from '../ui/Icons'
import { Tooltip } from '../ui/Tooltip'

export function ServerIcon({
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
          'server' + (active ? ' active' : '') + (server.unread && !active ? ' unread' : '')
        }
      >
        <span className="server-pill" />
        <button
          className="server-tile"
          onClick={onSelect}
          aria-label={server.name}
          style={{ background: server.color }}
        >
          <span className="server-initials">{server.initials}</span>
        </button>
        {server.badge ? <span className="badge-count">{server.badge}</span> : null}
      </div>
    </Tooltip>
  )
}

export function ServerRail({
  servers,
  activeId,
  onSelect,
  onHome,
  onCreate,
}: {
  servers: Server[]
  activeId: string | null
  onSelect: (id: string) => void
  onHome: () => void
  onCreate: () => void
}) {
  return (
    <nav className="rail">
      <div className="rail-scroll">
        <Tooltip label="Direct Messages">
          <div className={'server' + (activeId === null ? ' active' : '')}>
            <span className="server-pill" />
            <button className="server-tile home" onClick={onHome} aria-label="Direct Messages">
              <ClydeIcon size={27} />
            </button>
          </div>
        </Tooltip>
        <div className="rail-sep" />
        {servers.map((s) => (
          <ServerIcon
            key={s.id}
            server={s}
            active={s.id === activeId}
            onSelect={() => onSelect(s.id)}
          />
        ))}
        <Tooltip label="Add a Server">
          <div className="server">
            <span className="server-pill" />
            <button className="server-tile add" onClick={onCreate} aria-label="Add a Server">
              <PlusIcon size={22} />
            </button>
          </div>
        </Tooltip>
        <Tooltip label="Discover">
          <div className="server">
            <span className="server-pill" />
            <button className="server-tile add" aria-label="Discover">
              <CompassIcon size={24} />
            </button>
          </div>
        </Tooltip>
      </div>
    </nav>
  )
}
