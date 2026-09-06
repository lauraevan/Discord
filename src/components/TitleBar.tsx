import { HelpIcon, InboxIcon, ToolsIcon } from '../ui/Icons'
import { Tooltip } from '../ui/Tooltip'

export function TitleBar({
  title,
  initials,
  onInbox,
}: {
  title: string
  initials: string
  onInbox?: () => void
}) {
  return (
    <header className="titlebar">
      <div className="win-title">
        <span className="mark">
          {initials}
        </span>
        <span className="wt">{title}</span>
      </div>
      <div className="win-actions">
        <Tooltip label="Inbox" side="below">
          <button aria-label="Inbox" onClick={onInbox}><InboxIcon size={15} /></button>
        </Tooltip>
        <Tooltip label="Help" side="below">
          <button aria-label="Help" className="help"><HelpIcon size={15} /></button>
        </Tooltip>
        <Tooltip label="Support Tools" side="below">
          <button aria-label="Support tools"><ToolsIcon size={15.5} /></button>
        </Tooltip>
      </div>
    </header>
  )
}
