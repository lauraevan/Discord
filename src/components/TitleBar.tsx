import { ChevronLeftIcon, ChevronRightIcon, HelpIcon, InboxIcon } from '../ui/Icons'
import { Tooltip } from '../ui/Tooltip'

/**
 * Discord's desktop navigation/title bar.
 *
 * Current desktop builds place browser-style Back and Forward controls on the
 * top-left, keep the current destination centered, and leave Inbox/Help on the
 * right. The navigation controls intentionally stay visible while disabled so
 * the bar does not shift as history changes.
 */
export function TitleBar({
  title,
  initials,
  canBack,
  canForward,
  onBack,
  onForward,
  onInbox,
}: {
  title: string
  initials: string
  canBack?: boolean
  canForward?: boolean
  onBack?: () => void
  onForward?: () => void
  onInbox?: () => void
}) {
  return (
    <header className="titlebar">
      <div className="win-nav" aria-label="Navigation history">
        <Tooltip label="Back" side="below">
          <button aria-label="Back" disabled={!canBack} onClick={onBack}>
            <ChevronLeftIcon />
          </button>
        </Tooltip>
        <Tooltip label="Forward" side="below">
          <button aria-label="Forward" disabled={!canForward} onClick={onForward}>
            <ChevronRightIcon />
          </button>
        </Tooltip>
      </div>

      <div className="win-title">
        {initials ? <span className="mark">{initials}</span> : null}
        <span className="wt">{title}</span>
      </div>

      <div className="win-actions">
        <Tooltip label="Inbox" side="below">
          <button aria-label="Inbox" onClick={onInbox}><InboxIcon size={15} /></button>
        </Tooltip>
        <Tooltip label="Help" side="below">
          <button
            aria-label="Help"
            className="help"
            onClick={() => window.open('https://support.discord.com/', '_blank', 'noopener')}
          >
            <HelpIcon size={15} />
          </button>
        </Tooltip>
      </div>
    </header>
  )
}
