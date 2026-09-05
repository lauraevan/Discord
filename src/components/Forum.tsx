import { useState } from 'react'
import { uid, type Account, type Channel, type Message } from '../data'
import { renderMarkdown, type MdContext } from '../markdown'
import { ForumIcon, PlusIcon, SearchIcon, ThreadsIcon } from '../ui/Icons'
import { Avatar } from './UserArea'

/**
 * A forum channel: posts rather than a message list.
 *
 * Discord's forum header carries the guidelines, a New Post button, tag
 * filters and a sort control (Latest Activity / Date Posted), and each post is
 * a card with its author, first line, tags and reply count.
 */
export function ForumView({
  channel,
  posts,
  account,
  md,
  onCreate,
  onOpen,
}: {
  channel: Channel
  posts: Message[]
  account: Account
  md: MdContext
  onCreate: (title: string, body: string) => void
  onOpen: (id: string) => void
}) {
  const [composing, setComposing] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sort, setSort] = useState<'activity' | 'date'>('activity')

  const sorted = [...posts].sort((a, b) => (sort === 'date' ? a.time - b.time : b.time - a.time))

  return (
    <div className="forum">
      <div className="forum-bar">
        <div className="forum-search">
          <input placeholder="Search posts" aria-label="Search posts" />
          <SearchIcon />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as 'activity' | 'date')}>
          <option value="activity">Latest Activity</option>
          <option value="date">Date Posted</option>
        </select>
        <button className="btn-primary" onClick={() => setComposing(true)}>
          <PlusIcon />
          New Post
        </button>
      </div>

      {composing ? (
        <div className="forum-composer">
          <input
            autoFocus
            value={title}
            maxLength={100}
            placeholder="Post title"
            aria-label="Post title"
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            value={body}
            placeholder={`Write a message in #${channel.name}`}
            aria-label="Post body"
            onChange={(e) => setBody(e.target.value)}
          />
          <div className="forum-composer-foot">
            <button className="btn-ghost" onClick={() => setComposing(false)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              disabled={!title.trim()}
              onClick={() => {
                onCreate(title.trim(), body.trim())
                setTitle('')
                setBody('')
                setComposing(false)
              }}
            >
              Post
            </button>
          </div>
        </div>
      ) : null}

      <div className="forum-posts">
        {sorted.map((p) => (
          <button className="forum-post" key={p.id} onClick={() => onOpen(p.id)}>
            <div className="forum-post-head">
              <Avatar account={account} size={20} />
              <span className="forum-post-author">{account.name}</span>
              <span className="forum-post-time">
                {new Date(p.time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>
            <div className="forum-post-title">{p.text.split('\n')[0]}</div>
            <div className="forum-post-body">
              {renderMarkdown(p.text.split('\n').slice(1).join('\n').slice(0, 160), md)}
            </div>
            <div className="forum-post-foot">
              <ThreadsIcon />
              <span>{p.reactions?.length ?? 0} reactions</span>
            </div>
          </button>
        ))}
        {!sorted.length && !composing ? (
          <div className="forum-empty">
            <ForumIcon />
            <b>No posts yet</b>
            <span>Start the first conversation in #{channel.name}.</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export const makePost = (author: string, title: string, body: string): Message => ({
  id: uid('m'),
  author,
  time: Date.now(),
  text: body ? `${title}\n${body}` : title,
})
