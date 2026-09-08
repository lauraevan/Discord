import type { Account, Channel, Message } from '../data'
import { renderMarkdown, type MdContext } from '../markdown'
import { CloseIcon, HashIcon } from '../ui/Icons'
import { Avatar } from './UserArea'
import { EmptyArt } from '../ui/Art'

/**
 * Discord puts search results in the right-hand panel, in place of the member
 * list, with a count and a Jump on each hit.
 */
export function SearchResults({
  query,
  results,
  account,
  md,
  onJump,
  onClose,
}: {
  query: string
  results: { channel: Channel; message: Message }[]
  account: Account
  md: MdContext
  onJump: (c: Channel, id: string) => void
  onClose: () => void
}) {
  return (
    <aside className="results">
      <div className="results-head">
        <span>
          {results.length} {results.length === 1 ? 'Result' : 'Results'}
        </span>
        <button onClick={onClose} aria-label="Clear search">
          <CloseIcon />
        </button>
      </div>
      <div className="results-body">
        {results.map(({ channel, message }) => (
          <div className="result" key={message.id}>
            <div className="result-where">
              <HashIcon />
              <span>{channel.name}</span>
            </div>
            <div className="result-card">
              <Avatar account={account} size={32} status={false} />
              <div className="result-main">
                <div className="result-author">{account.name}</div>
                <div className="result-text">{renderMarkdown(message.text, md)}</div>
              </div>
              <button className="result-jump" onClick={() => onJump(channel, message.id)}>
                Jump
              </button>
            </div>
          </div>
        ))}
        {!results.length ? (
          <div className="results-empty">
            <EmptyArt kind="no-results" />
            <p>No results</p>
            <span>Nothing in this server matched “{query}”.</span>
          </div>
        ) : null}
      </div>
    </aside>
  )
}
