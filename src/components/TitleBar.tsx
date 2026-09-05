import {
  HelpIcon,
  InboxIcon,
  MaximizeIcon,
  MinimizeIcon,
  CloseIcon,
} from '../ui/Icons'
import { Tooltip } from '../ui/Tooltip'

export function TitleBar({ title, mark }: { title: string; mark: React.ReactNode }) {
  return (
    <header className="titlebar">
      <div className="traffic">
        <i />
        <i />
        <i />
      </div>
      <div className="win-title">
        <span className="mark">{mark}</span>
        <span>{title}</span>
      </div>
      <div className="win-actions">
        <Tooltip label="Inbox" side="below">
          <button aria-label="Inbox">
            <InboxIcon size={17} />
          </button>
        </Tooltip>
        <Tooltip label="Help" side="below">
          <button aria-label="Help">
            <HelpIcon size={19} />
          </button>
        </Tooltip>
        <span className="sep" />
        <button aria-label="Minimize">
          <MinimizeIcon size={15} />
        </button>
        <button aria-label="Maximize">
          <MaximizeIcon size={14} />
        </button>
        <button aria-label="Close">
          <CloseIcon size={16} />
        </button>
      </div>
    </header>
  )
}
