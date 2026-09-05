import type { ReactNode } from 'react'
import type { Server } from '../data'
import { ClydeIcon, CompassIcon, DownloadIcon, PlusIcon } from '../ui/Icons'
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
        <RailItem label="Direct Messages" active={activeId === null} className="home" onClick={onHome}>
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
            <span className="server-initials" style={{ background: s.color }}>
              {s.initials}
            </span>
          </RailItem>
        ))}
        <RailItem label="Add a Server" className="plain green" onClick={onCreate}>
          <PlusIcon size={17} />
        </RailItem>
        <RailItem label="Discover" className="plain green">
          <CompassIcon size={18} />
        </RailItem>
        <RailItem label="Download Apps" className="plain green">
          <DownloadIcon size={17} />
        </RailItem>
      </div>
    </nav>
  )
}
