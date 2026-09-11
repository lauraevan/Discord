import { HelpIcon, InboxIcon } from '../ui/Icons'
import { Tooltip } from '../ui/Tooltip'

/**
 * The window's own bar: the guild mark and name, then Inbox and Help.
 *
 * There is no third button. docs/reference.png's account carries a Support
 * Tools one and all four 1:1 captures do not — an account difference rather
 * than a version one — and keeping it pushed the two that *are* there out of
 * place: dropping it takes the headers region from 5.212 to 4.965 and the
 * capture from 2.749 to 2.729, for 0.008 on the frame. That is the same trade
 * every other frame-against-capture disagreement in docs/discord-reference.md
 * is decided on, so please do not put it back.
 */
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
        {/* on Home there is no guild to mark, and Discord shows the title on
            its own rather than an empty tile beside it */}
        {initials ? <span className="mark">{initials}</span> : null}
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
      </div>
    </header>
  )
}
