import { ExpandIcon, HelpIcon, InboxIcon } from '../ui/Icons'
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
          <button aria-label="Help"><HelpIcon size={15} /></button>
        </Tooltip>
        <Tooltip label="Toggle Full Screen" side="below">
          <button aria-label="Toggle full screen"><ExpandIcon size={14} /></button>
        </Tooltip>
      </div>
    </header>
  )
}
