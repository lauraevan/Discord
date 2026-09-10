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
          {/* Discord's help button opens its help centre; this is the real one */}
          <a
            aria-label="Help"
            className="help"
            href="https://support.discord.com/"
            target="_blank"
            rel="noreferrer noopener"
          >
            <HelpIcon size={15} />
          </a>
        </Tooltip>
        <Tooltip label="Support Tools" side="below">
          <button aria-label="Support tools"><ToolsIcon size={15.5} /></button>
        </Tooltip>
      </div>
    </header>
  )
}
