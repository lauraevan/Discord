import type { Server } from '../data'
import { ChevronRightIcon, CheckIcon } from '../ui/Icons'
import {
  ArrowDownArt,
  ControllerArt,
  DartArt,
  GemArt,
  MailboxArt,
  PaintArt,
} from '../ui/PixelArt'

/**
 * The new-server checklist.
 *
 * Discord replaces a channel's usual intro with this while a server is still
 * empty: a two-line welcome, a line of copy, and six steps that tick off as
 * you do them. Laid out from the reference frame — a 325px column centred in
 * the chat pane, 47px rows on a 6px gap.
 */
export function ServerOnboarding({
  server,
  hasMessages,
  onInvite,
  onIcon,
  onBoosts,
  onApps,
}: {
  server: Server
  hasMessages: boolean
  onInvite: () => void
  onIcon: () => void
  onBoosts: () => void
  onApps: () => void
}) {
  const steps = [
    { art: <MailboxArt />, label: 'Invite your friends', done: false, act: onInvite },
    { art: <PaintArt />, label: 'Personalize your server with an icon', done: false, act: onIcon },
    { art: <DartArt />, label: 'Send your first message', done: hasMessages, act: undefined },
    { art: <ArrowDownArt />, label: 'Download the Discord App', done: false, act: undefined },
    { art: <ControllerArt />, label: 'Add your first app', done: false, act: onApps },
    { art: <GemArt />, label: 'Unlock perks for everyone with Boosts', done: false, act: onBoosts },
  ]

  return (
    <div className="onboard">
      <h2>
        Welcome to
        <br />
        {server.name}
      </h2>
      <p>
        This is your brand new, shiny server. Here are some steps to help you get started. For more,
        check out our <span className="link">Getting Started guide</span>.
      </p>
      <div className="onboard-steps">
        {steps.map((s) => (
          <button
            key={s.label}
            className={'onboard-step' + (s.done ? ' done' : '')}
            onClick={s.act}
            disabled={s.done || !s.act}
          >
            <span className="onboard-art">{s.art}</span>
            <span className="onboard-label">{s.label}</span>
            {s.done ? (
              <span className="onboard-check">
                <CheckIcon />
              </span>
            ) : (
              <ChevronRightIcon className="onboard-caret" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
