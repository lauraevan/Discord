import type { ReactNode } from 'react'
import type { Server } from '../data'
import { AddServerIcon, ClydeIcon, CompassIcon, DownloadIcon } from '../ui/Icons'
import { Tooltip } from '../ui/Tooltip'

function RailItem({
  label,
  active,
  unread,
  mentions = 0,
  className = '',
  onClick,
  children,
}: {
  label: string
  active?: boolean
  /** anything unread here, which Discord shows as the pill at its smallest */
  unread?: boolean
  /** how many unread messages mention the reader, badged on the tile */
  mentions?: number
  className?: string
  onClick?: () => void
  children: ReactNode
}) {
  return (
    <Tooltip label={label}>
      <div className={'server' + (active ? ' active' : '') + (unread ? ' unread' : '')}>
        <span className="server-pill" />
        <button className={'server-tile ' + className} onClick={onClick} aria-label={label}>
          {children}
        </button>
        {mentions > 0 ? (
          <span className="server-badge" aria-label={`${mentions} mentions`}>
            {mentions > 99 ? '99+' : mentions}
          </span>
        ) : null}
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
  state = {},
}: {
  servers: Server[]
  activeId: string | null
  onSelect: (id: string) => void
  onHome: () => void
  onCreate: () => void
  /** Discover is open, so the compass takes the pill the way a server does */
  discover?: boolean
  onDiscover?: () => void
  /** per server: anything unread, and how many messages mention the reader */
  state?: Record<string, { unread: boolean; mentions: number }>
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
            unread={s.id !== activeId && !!state[s.id]?.unread}
            mentions={s.id === activeId ? 0 : (state[s.id]?.mentions ?? 0)}
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
