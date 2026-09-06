import { useLayoutEffect, useRef, useState } from 'react'
import {
  groupsWith,
  joinLine,
  type Account,
  type Channel,
  type Message,
  type Poll,
  type Reaction,
  type Server,
} from '../data'
import { byName } from '../emoji'
import { ServerOnboarding } from './Onboarding'
import { EmojiGlyph, renderMarkdown, type MdContext } from '../markdown'
import {
  BellIcon,
  ForumIcon,
  HashIcon,
  MegaphoneIcon,
  MemberListIcon,
  MoreIcon,
  PencilIcon,
  PinIcon,
  ReactIcon,
  ReplyIcon,
  RulesIcon,
  SparkleIcon,
  ThreadsIcon as ThreadGlyph,
  SearchIcon,
  SpeakerIcon,
  ThreadsIcon,
} from '../ui/Icons'
import { FILTERS } from '../search'
import { Tooltip } from '../ui/Tooltip'
import { PollView } from './Poll'
import { Avatar } from './UserArea'

export function Glyph({ kind }: { kind: Channel['kind'] }) {
  if (kind === 'announcement') return <MegaphoneIcon />
  if (kind === 'forum') return <ForumIcon />
  if (kind === 'rules') return <RulesIcon />
  if (kind === 'voice') return <SpeakerIcon />
  return <HashIcon />
}

/* ----------------------------------------------------------------- header */

export function ChatHeader({
  channel,
  serverName,
  query,
  onQuery,
  membersOpen,
  onToggleMembers,
  onPins,
}: {
  channel: Channel
  serverName: string
  query: string
  onQuery: (q: string) => void
  membersOpen: boolean
  onToggleMembers: () => void
  onPins: () => void
}) {
  return (
    <header className="chat-header">
      <Glyph kind={channel.kind} />
      <h2>{channel.name}</h2>
      <div className="chat-tools">
        <Tooltip label="Threads" side="below">
          <button aria-label="Threads">
            <ThreadsIcon />
          </button>
        </Tooltip>
        <Tooltip label="Notification Settings" side="below">
          <button aria-label="Notification settings">
            <BellIcon />
          </button>
        </Tooltip>
        <Tooltip label="Pinned Messages" side="below">
          <button aria-label="Pinned messages" onClick={onPins}>
            <PinIcon />
          </button>
        </Tooltip>
        <Tooltip label={membersOpen ? 'Hide Member List' : 'Show Member List'} side="below">
          <button
            aria-label="Toggle member list"
            className={membersOpen ? 'on' : undefined}
            onClick={onToggleMembers}
          >
            <MemberListIcon />
          </button>
        </Tooltip>
        <SearchBox serverName={serverName} query={query} onQuery={onQuery} />
      </div>
    </header>
  )
}

/** The search field, with Discord's filter list under it while focused. */
function SearchBox({
  serverName,
  query,
  onQuery,
}: {
  serverName: string
  query: string
  onQuery: (q: string) => void
}) {
  const [focus, setFocus] = useState(false)
  // Discord shows the options list while you are at the start of a term or
  // partway through a filter name, not over your search results
  const last = query.split(/\s+/).pop() ?? ''
  const partial = !query.trim() || FILTERS.some(([t]) => t.startsWith(last.toLowerCase()) && !last.includes(':'))
  const open = focus && partial
  return (
    <div className="searchbox-wrap">
      <div className="searchbox">
        <input
          value={query}
          placeholder={`Search ${serverName}`}
          aria-label="Search"
          onFocus={() => setFocus(true)}
          onBlur={() => setTimeout(() => setFocus(false), 140)}
          onChange={(e) => onQuery(e.target.value)}
        />
        <SearchIcon />
      </div>
      {open ? (
        <div className="search-hints">
          <div className="search-hints-head">SEARCH OPTIONS</div>
          {FILTERS.map(([token, hint]) => (
            <button
              key={token}
              className="search-hint"
              onMouseDown={(e) => {
                e.preventDefault()
                onQuery(query ? `${query.replace(/\s*$/, '')} ${token}` : token)
              }}
            >
              <span className="search-token">{token}</span>
              <span className="search-hint-note">{hint}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/* ---------------------------------------------------------------- helpers */

const time = (t: number) =>
  new Date(t).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

const dayKey = (t: number) => new Date(t).toDateString()

/** The divider carries the full date even for today, as the reference shows. */
function dayLabel(t: number) {
  return new Date(t).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Reply previews are plain text in the client — strip the syntax. */
function preview(text: string) {
  return text
    .replace(/```[a-z]*\n?/gi, '')
    .replace(/[*_~`|>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * The inline stamp is the time alone — the date lives on the divider above it,
 * which is how the reference renders a message. The full date stays available
 * on the element's title.
 */
function stamp(t: number) {
  return time(t)
}

/* -------------------------------------------------------------- reactions */

function Reactions({
  reactions,
  self,
  onToggle,
  onAdd,
}: {
  reactions: Reaction[]
  self: string
  onToggle: (name: string) => void
  onAdd: () => void
}) {
  if (!reactions.length) return null
  return (
    <div className="reactions">
      {reactions.map((r) => {
        const mine = r.by.includes(self)
        const e = byName[r.name]
        return (
          <Tooltip key={r.name} label={`:${r.name}:`} side="above">
            <button
              className={'reaction' + (mine ? ' mine' : '')}
              onClick={() => onToggle(r.name)}
              aria-label={`${r.name}, ${r.by.length}`}
              aria-pressed={mine}
            >
              {e ? <EmojiGlyph code={e.code} alt={r.name} /> : `:${r.name}:`}
              <span>{r.by.length}</span>
            </button>
          </Tooltip>
        )
      })}
      <Tooltip label="Add Reaction" side="above">
        <button className="reaction add" onClick={onAdd} aria-label="Add reaction">
          <ReactIcon />
        </button>
      </Tooltip>
    </div>
  )
}

/**
 * System messages. Discord renders these as a single centred line with a small
 * glyph instead of an avatar and author.
 */
function SystemRow({ m, name }: { m: Message; name: string }) {
  const line =
    m.type === 'USER_JOIN'
      ? joinLine(name, m.time)
      : m.type === 'CHANNEL_PINNED_MESSAGE'
        ? `${name} pinned a message to this channel.`
        : m.type === 'THREAD_CREATED'
          ? `${name} started a thread: ${m.text}`
          : m.type === 'GUILD_BOOST'
            ? `${name} just boosted the server!`
            : m.type === 'CHANNEL_NAME_CHANGE'
              ? `${name} changed the channel name: ${m.text}`
              : m.text
  const Glyph =
    m.type === 'CHANNEL_PINNED_MESSAGE'
      ? PinIcon
      : m.type === 'THREAD_CREATED'
        ? ThreadGlyph
        : m.type === 'GUILD_BOOST'
          ? SparkleIcon
          : ArrowJoin
  return (
    <div className="system-msg">
      <span className="system-glyph">
        <Glyph />
      </span>
      <span className="system-text">{line}</span>
      <span className="system-time">{time(m.time)}</span>
    </div>
  )
}

/** The little join arrow Discord uses on USER_JOIN lines. */
const ArrowJoin = () => (
  <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden="true">
    <path
      fill="currentColor"
      d="M12.5 3.2a1.2 1.2 0 0 0 0 2.4h5.1a1.1 1.1 0 0 1 1.1 1.1v10.6a1.1 1.1 0 0 1-1.1 1.1h-5.1a1.2 1.2 0 0 0 0 2.4h5.1a3.5 3.5 0 0 0 3.5-3.5V6.7a3.5 3.5 0 0 0-3.5-3.5h-5.1Zm-1.06 5.55a1.2 1.2 0 0 0-1.7 1.7l.85.85H3.7a1.2 1.2 0 0 0 0 2.4h6.89l-.85.85a1.2 1.2 0 1 0 1.7 1.7l2.9-2.9a1.2 1.2 0 0 0 0-1.7l-2.9-2.9Z"
    />
  </svg>
)

/* ----------------------------------------------------------------- feed */

export function ChatFeed({
  channel,
  server,
  messages,
  all,
  account,
  md,
  unreadFrom,
  editingId,
  onStartEdit,
  onEditChannel,
  onEdit,
  onReply,
  onReact,
  onPin,
  onOpenPicker,
  onContext,
  onVote,
  onOnboard,
}: {
  channel: Channel
  server: Server | null
  messages: Message[]
  all: Message[]
  account: Account
  md: MdContext
  unreadFrom: number | null
  editingId: string | null
  onStartEdit: (id: string | null) => void
  onEditChannel: () => void
  onEdit: (id: string, text: string) => void
  onReply: (m: Message) => void
  onReact: (id: string, name: string) => void
  onPin: (id: string) => void
  onOpenPicker: (id: string, at: { x: number; y: number }) => void
  onContext: (m: Message, at: { x: number; y: number }) => void
  onVote: (id: string, answer: number) => void
  onOnboard: (what: 'invite' | 'icon' | 'boosts' | 'apps') => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState('')

  // Discord keeps the checklist up on a server that is still as it was created
  // — it stays after the first message, as the reference shows — and drops it
  // once the channel list has been built out.
  const showChecklist = !!server && server.channels.length <= 2

  useLayoutEffect(() => {
    const el = ref.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length, channel.id])

  // when App points at a message to edit, seed the draft from it
  useLayoutEffect(() => {
    if (editingId) setDraft(all.find((m) => m.id === editingId)?.text ?? '')
  }, [editingId, all])

  const commit = () => {
    if (editingId) onEdit(editingId, draft.trim())
    onStartEdit(null)
  }

  let lastDay = ''
  return (
    <div className="feed" ref={ref}>
      {/* a brand new server shows the checklist in place of the channel intro,
          the way Discord does until the server has been used */}
      {server && showChecklist ? (
        <ServerOnboarding
          server={server}
          hasMessages={messages.length > 0}
          onInvite={() => onOnboard('invite')}
          onIcon={() => onOnboard('icon')}
          onBoosts={() => onOnboard('boosts')}
          onApps={() => onOnboard('apps')}
        />
      ) : (
        <div className="intro">
          <span className="intro-glyph">
            <Glyph kind={channel.kind} />
          </span>
          <h3>Welcome to #{channel.name}!</h3>
          <p>This is the start of the #{channel.name} channel.</p>
          <button className="intro-btn" onClick={onEditChannel}>
            <PencilIcon />
            <span>Edit Channel</span>
          </button>
        </div>
      )}

      {messages.map((m, idx) => {
        const prev = messages[idx - 1]
        const grouped = groupsWith(prev, m)
        const day = dayKey(m.time)
        const newDay = day !== lastDay
        lastDay = day
        const parent = m.replyTo ? all.find((x) => x.id === m.replyTo) : undefined
        const isUnread = unreadFrom !== null && m.time >= unreadFrom

        if (m.type && m.type !== 'DEFAULT') {
          return (
            <div key={m.id} data-msg={m.id}>
              {newDay ? (
                <div className="divider">
                  <span>{dayLabel(m.time)}</span>
                </div>
              ) : null}
              <SystemRow m={m} name={account.name} />
            </div>
          )
        }

        return (
          <div key={m.id} data-msg={m.id}>
            {newDay ? (
              <div className="divider">
                <span>{dayLabel(m.time)}</span>
              </div>
            ) : null}
            {isUnread && (unreadFrom === m.time || !prev || prev.time < unreadFrom) ? (
              <div className="divider unread">
                <span>NEW</span>
              </div>
            ) : null}

            <div
              className={'group' + (grouped && !newDay ? ' grouped' : '') + (m.pinned ? ' pinned' : '')}
              onContextMenu={(e) => {
                e.preventDefault()
                onContext(m, { x: e.clientX, y: e.clientY })
              }}
            >
              {parent ? (
                <div className="reply-ref">
                  <span className="reply-spine" />
                  <Avatar account={account} size={16} />
                  <span className="reply-author">{account.name}</span>
                  <span className="reply-text">{preview(parent.text)}</span>
                </div>
              ) : null}

              {grouped && !newDay ? (
                <span className="gutter-time">{time(m.time)}</span>
              ) : (
                <>
                  <span className="group-avatar">
                    <Avatar account={account} size={40} />
                  </span>
                  <div className="msg-head">
                    <span className="author" style={{ color: account.color }}>
                      {account.name}
                    </span>
                    <span className="timestamp">{stamp(m.time)}</span>
                  </div>
                </>
              )}

              {editingId === m.id ? (
                <div className="edit-box">
                  <textarea
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') onStartEdit(null)
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        commit()
                      }
                    }}
                  />
                  <div className="edit-hint">
                    escape to <button onClick={() => onStartEdit(null)}>cancel</button> · enter to{' '}
                    <button onClick={commit}>save</button>
                  </div>
                </div>
              ) : (
                <div className="msg-line">
                  {renderMarkdown(m.text, md)}
                  {m.editedAt ? (
                    <Tooltip label={stamp(m.editedAt)} side="above">
                      <span className="edited">(edited)</span>
                    </Tooltip>
                  ) : null}
                </div>
              )}

              {m.poll ? (
                <PollView
                  poll={m.poll as Poll}
                  account={account}
                  onVote={(a) => onVote(m.id, a)}
                />
              ) : null}

              {m.attachments?.length ? (
                <div className="attachments">
                  {m.attachments.map((a) => (
                    <a
                      key={a.id}
                      className={'attachment' + (a.spoiler ? ' spoiler-file' : '')}
                      href={a.url}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      <img src={a.url} alt={a.name} />
                    </a>
                  ))}
                </div>
              ) : null}

              <Reactions
                reactions={m.reactions ?? []}
                self={account.handle}
                onToggle={(name) => onReact(m.id, name)}
                onAdd={() => {
                  const r = ref.current?.getBoundingClientRect()
                  onOpenPicker(m.id, { x: (r?.right ?? 0) - 380, y: (r?.bottom ?? 0) - 440 })
                }}
              />

              <div className="msg-actions">
                <Tooltip label="Add Reaction" side="above">
                  <button
                    aria-label="Add reaction"
                    onClick={(e) => {
                      const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
                      onOpenPicker(m.id, { x: r.right - 360, y: r.bottom + 6 })
                    }}
                  >
                    <ReactIcon />
                  </button>
                </Tooltip>
                <Tooltip label="Reply" side="above">
                  <button aria-label="Reply" onClick={() => onReply(m)}>
                    <ReplyIcon />
                  </button>
                </Tooltip>
                <Tooltip label="Edit" side="above">
                  <button aria-label="Edit" onClick={() => onStartEdit(m.id)}>
                    <PencilIcon />
                  </button>
                </Tooltip>
                <Tooltip label={m.pinned ? 'Unpin Message' : 'Pin Message'} side="above">
                  <button
                    aria-label="Pin message"
                    className={m.pinned ? 'on' : undefined}
                    onClick={() => onPin(m.id)}
                  >
                    <PinIcon />
                  </button>
                </Tooltip>
                <Tooltip label="More" side="above">
                  <button
                    aria-label="More"
                    onClick={(e) => {
                      const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
                      onContext(m, { x: r.left, y: r.bottom + 4 })
                    }}
                  >
                    <MoreIcon />
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
