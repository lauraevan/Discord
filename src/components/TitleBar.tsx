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
          {/* Discord's help button opens its help centre. It stays a <button>
              rather than an <a>: an anchor's intrinsic box is 2px narrower
              here, and the three glyphs' positions are measured off the
              reference frame down to the pixel. */}
          <button
            aria-label="Help"
            className="help"
            onClick={() => window.open('https://support.discord.com/', '_blank', 'noopener')}
          >
            <HelpIcon size={15} />
          </button>
        </Tooltip>
        <Tooltip label="Support Tools" side="below">
          <button aria-label="Support tools"><ToolsIcon size={15.5} /></button>
        </Tooltip>
      </div>
    </header>
  )
}
