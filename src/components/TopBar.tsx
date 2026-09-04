import { DefaultAvatar } from '../ui/Art'
import { HelpIcon, InboxIcon } from '../ui/Icons'
import { Tooltip } from '../ui/Tooltip'

export function TopBar({
  title,
  initials,
  color,
}: {
  title: string
  initials?: string
  color?: string
}) {
  return (
    <header className="topbar">
      <div className="topbar-title">
        <span className="topbar-badge" style={color ? { background: color } : undefined}>
          {initials ? <span className="topbar-initials">{initials}</span> : <DefaultAvatar />}
        </span>
        <span>{title}</span>
      </div>
      <div className="topbar-actions">
        <Tooltip label="Inbox" side="below">
          <button className="topbar-btn" aria-label="Inbox">
            <InboxIcon size={17} />
          </button>
        </Tooltip>
        <Tooltip label="Help" side="below">
          <button className="topbar-btn" aria-label="Help">
            <HelpIcon size={19} />
          </button>
        </Tooltip>
      </div>
    </header>
  )
}
