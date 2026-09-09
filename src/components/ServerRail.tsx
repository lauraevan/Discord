import type { ReactNode } from 'react'
import type { Server } from '../data'
import { AddServerIcon, ClydeIcon, CompassIcon, DownloadIcon } from '../ui/Icons'
import { Tooltip } from '../ui/Tooltip'

function RailItem({
  label,
  active,
  className = '',
  onClick,
  children,
}: {
  label: string
  active?: boolean
  className?: string
  onClick?: () => void
  children: ReactNode
}) {
  return (
    <Tooltip label={label}>
      <div className={'server' + (active ? ' active' : '')}>
        <span className="server-pill" />
        <button className={'server-tile ' + className} onClick={onClick} aria-label={label}>
          {children}
        </button>
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
  discover = false,
  onDiscover,
}: {
  servers: Server[]
  activeId: string | null
  onSelect: (id: string) => void
  onHome: () => void
  onCreate: () => void
  /** Discover is open, so the compass takes the pill the way a server does */
  discover?: boolean
  onDiscover?: () => void
}) {
  return (
    <nav className="rail">
      <div className="rail-scroll">
        <RailItem
          label="Direct Messages"
          active={activeId === null && !discover}
          className="home"
          onClick={onHome}
        >
          <ClydeIcon size={20} />
        </RailItem>
        <div className="rail-sep" />
        {servers.map((s) => (
          <RailItem
            key={s.id}
            label={s.name}
            active={s.id === activeId}
            className="srv"
            onClick={() => onSelect(s.id)}
          >
            {s.icon ? (
              <img className="server-icon" src={s.icon} alt="" />
            ) : (
              <span className="server-initials" style={{ background: s.color }}>
                {s.initials}
              </span>
            )}
          </RailItem>
        ))}
        <RailItem label="Add a Server" className="plain green" onClick={onCreate}>
          <AddServerIcon size={16.8} />
        </RailItem>
        <RailItem label="Discover" active={discover} className="plain green" onClick={onDiscover}>
          <CompassIcon size={16.8} />
        </RailItem>
        <RailItem label="Download Apps" className="plain green">
          <DownloadIcon size={15.9} />
        </RailItem>
      </div>
    </nav>
  )
}
