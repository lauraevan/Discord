import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  groupsWith,
  joinLine,
  roleColor,
  type Account,
  type Attachment,
  type Channel,
  type Message,
  type Poll,
  type Reaction,
  type Server,
} from '../data'
import { byName } from '../emoji'
import { ServerOnboarding } from './Onboarding'
import { EmojiByName, EmojiGlyph, renderMarkdown, type MdContext } from '../markdown'
import {
  BellIcon,
  DownloadIcon,
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
  StarIcon,
  ThreadsIcon as ThreadGlyph,
  SearchIcon,
  SpeakerIcon,
  ThreadsIcon,
} from '../ui/Icons'
import { FILTERS } from '../search'
import { fileIcon, fileSize, isGif, isImage } from '../files'
import { springScrollIntoView } from '../motion'
import { DisplayName } from '../ui/DisplayName'
import { Tooltip } from '../ui/Tooltip'
import { box, point } from '../zoom'
import { InfoModal } from './Modals'
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
  onThreads,
  threadsOpen,
}: {
  channel: Channel
  serverName: string
  query: string
  onQuery: (q: string) => void
  membersOpen: boolean
  onToggleMembers: () => void
  onPins: () => void
  onThreads: () => void
  threadsOpen: boolean
}) {
  const [topicOpen, setTopicOpen] = useState(false)

  return (
    <header className="chat-header">
      <Glyph kind={channel.kind} />
      <h2>{channel.name}</h2>
      {/* Discord hangs the topic off the name behind a divider, on one line;
          the whole of it opens in a dialog, because most topics do not fit */}
      {channel.topic?.trim() ? (
        <>
          <span className="header-sep" />
          <button className="header-topic" onClick={() => setTopicOpen(true)}>
            {channel.topic}
          </button>
        </>
      ) : null}
      <div className="chat-tools">
        <Tooltip label="Threads" side="below">
          <button aria-label="Threads" className={threadsOpen ? 'on' : undefined} onClick={onThreads}>
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
      {topicOpen && channel.topic ? (
        <InfoModal title={`#${channel.name}`} onClose={() => setTopicOpen(false)}>
          <p className="topic-full">{channel.topic}</p>
        </InfoModal>
      ) : null}
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
 * The stamp on a group's first message.
 *
 * Today is the bare time — docs/refs shows "bullet  7:59 PM" against a
 * "September 5, 2026" divider, so the day is already on screen and Discord
 * does not repeat it. Yesterday is "Yesterday at 5:42 PM", and anything older
 * is the short date followed by the time. Compact mode prints the time alone
 * in the gutter, which is the point of it, and the full date stays on the
 * element's title either way.
 */
function stamp(t: number) {
  const d = new Date(t)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return time(t)
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday at ${time(t)}`
  return `${d.toLocaleDateString(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })} ${time(t)}`
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
  /**
   * Discord pops the emoji when the reaction becomes yours — a three-leg
   * spring, 1 -> 0.8 -> 1.1 -> 1, and only on the one you just added. So the
   * pop is armed by the transition into `mine`, not by the render.
   */
  const wasMine = useRef<Set<string>>(new Set())
  const [popped, setPopped] = useState<string | null>(null)
  useEffect(() => {
    const now = new Set(reactions.filter((r) => r.by.includes(self)).map((r) => r.name))
    for (const name of now) if (!wasMine.current.has(name)) setPopped(name)
    wasMine.current = now
  }, [reactions, self])

  if (!reactions.length) return null
  return (
    <div className="reactions">
      {reactions.map((r) => {
        const mine = r.by.includes(self)
        const e = byName[r.name]
        return (
          <Tooltip key={r.name} label={`:${r.name}:`} side="above">
            <button
              className={
                'reaction' + (mine ? ' mine' : '') + (popped === r.name ? ' popped' : '')
              }
              onAnimationEnd={() => popped === r.name && setPopped(null)}
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
  onOpenPicker,
  onOpenProfile,
  onFavouriteGif,
  favourited,
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
  onOpenPicker: (id: string, at: { x: number; y: number }) => void
  onOpenProfile: (anchor: HTMLElement) => void
  onFavouriteGif: (a: Attachment) => void
  favourited: (url: string) => boolean
  onContext: (m: Message, at: { x: number; y: number }) => void
  onVote: (id: string, answer: number) => void
  onOnboard: (what: 'invite' | 'icon' | 'boosts' | 'apps') => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState('')

  /**
   * Following a reply back to what it answers: Discord scrolls the message
   * into view and flashes it, which its own list calls a JUMP_TARGET.
   */
  const jumpTo = (id: string) => {
    const el = ref.current?.querySelector(`[data-msg="${id}"]`)
    if (el == null || ref.current == null) return
    // Discord's own scroller, not the browser's: a heavy clamped spring that
    // eases into the target rather than decelerating on a bezier
    springScrollIntoView(ref.current, el)
    el.classList.remove('jump-target')
    // restart the flash even when the same message is jumped to twice
    void (el as HTMLElement).offsetWidth
    el.classList.add('jump-target')
    window.setTimeout(() => el.classList.remove('jump-target'), 1400)
  }

  // Discord keeps the checklist up on a server that is still as it was created
  // — it stays after the first message, as the reference shows — and drops it
  // once the channel list has been built out.
  const showChecklist = !!server && server.channels.length <= 2

  // Discord paints an author's name in their top coloured role. @everyone
  // carries no colour, so on a server with no roles set up the name is just
  // the header colour — which is what the reference frames show.
  const nameColor = roleColor(server)

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
                onContext(m, point(e))
              }}
            >
              {/* the toolbar Discord floats over a hovered message: two quick
                  reactions, add reaction, reply, edit on your own, and more */}
              <div className="msg-acts" role="group" aria-label="Message actions">
                {['thumbsup', 'joy'].map((code) => (
                  <Tooltip key={code} label={`:${code}:`} side="above">
                    <button
                      aria-label={`React with :${code}:`}
                      onClick={() => onReact(m.id, code)}
                    >
                      <EmojiByName name={code} alt={`:${code}:`} />
                    </button>
                  </Tooltip>
                ))}
                <Tooltip label="Add Reaction" side="above">
                  <button
                    aria-label="Add reaction"
                    onClick={(e) => {
                      const r = box(e.currentTarget as HTMLElement)
                      onOpenPicker(m.id, { x: r.left, y: r.bottom + 4 })
                    }}
                  >
                    <ReactIcon size={20} />
                  </button>
                </Tooltip>
                <Tooltip label="Reply" side="above">
                  <button aria-label="Reply" onClick={() => onReply(m)}>
                    <ReplyIcon size={20} />
                  </button>
                </Tooltip>
                {m.author === account.handle ? (
                  <Tooltip label="Edit" side="above">
                    <button aria-label="Edit" onClick={() => onStartEdit(m.id)}>
                      <PencilIcon size={20} />
                    </button>
                  </Tooltip>
                ) : null}
                <Tooltip label="More" side="above">
                  <button
                    aria-label="More"
                    onClick={(e) => {
                      const r = box(e.currentTarget as HTMLElement)
                      onContext(m, { x: r.right - 4, y: r.bottom + 4 })
                    }}
                  >
                    <MoreIcon size={20} />
                  </button>
                </Tooltip>
              </div>

              {parent ? (
                <div
                  className="reply-ref"
                  role="link"
                  tabIndex={0}
                  onClick={() => jumpTo(parent.id)}
                  onKeyDown={(e) => e.key === 'Enter' && jumpTo(parent.id)}
                >
                  <span className="reply-spine" />
                  <Avatar account={account} size={16} status={false} />
                  <span className="reply-author">{account.name}</span>
                  <span className="reply-text">{preview(parent.text)}</span>
                </div>
              ) : null}

              {grouped && !newDay ? (
                <span className="gutter-time">{time(m.time)}</span>
              ) : (
                <>
                  {/* Discord opens the user popout from either the avatar or
                      the name, anchored to whichever was clicked */}
                  <button
                    className="group-avatar"
                    aria-label={`${account.name}'s profile`}
                    onClick={(e) => onOpenProfile(e.currentTarget)}
                  >
                    <Avatar account={account} size={40} status={false} />
                  </button>
                  <div className="msg-head">
                    <button className="author" onClick={(e) => onOpenProfile(e.currentTarget)}>
                      <DisplayName account={account} color={nameColor} />
                    </button>
                    <span
                      className="timestamp"
                      data-short={time(m.time)}
                      title={new Date(m.time).toLocaleString()}
                    >
                      {stamp(m.time)}
                    </span>
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

              {/* Discord sends a sticker as the whole message and draws it
                  at 160px, with no bubble around it */}
              {m.stickers?.length ? (
                <div className="msg-stickers">
                  {m.stickers.map((id) => {
                    const st = server?.stickers?.find((x) => x.id === id)
                    if (!st) return null
                    return st.url ? (
                      <img key={id} className="msg-sticker" src={st.url} alt={st.name} title={st.name} />
                    ) : (
                      <span key={id} className="msg-sticker glyph" title={st.name}>
                        <EmojiByName name={st.related} alt={st.name} />
                      </span>
                    )
                  })}
                </div>
              ) : null}

              {m.attachments?.length ? (
                <div className="attachments">
                  {m.attachments.map((a) =>
                    isImage(a.name, a.contentType) ? (
                      <span
                        key={a.id}
                        className={'attachment' + (a.spoiler ? ' spoiler-file' : '')}
                      >
                        <a href={a.url} target="_blank" rel="noreferrer noopener">
                          <img src={a.url} alt={a.name} />
                        </a>
                        {/* Discord marks a GIF and lets you star it from the
                            message, which is where a favourite comes from */}
                        {isGif(a.name, a.contentType) ? (
                          <>
                            <span className="attachment-gif">GIF</span>
                            <Tooltip
                              label={favourited(a.url) ? 'Favorited' : 'Add to Favorites'}
                              side="above"
                            >
                              <button
                                className={'attachment-fav' + (favourited(a.url) ? ' on' : '')}
                                aria-label="Add to Favorites"
                                onClick={() => onFavouriteGif(a)}
                              >
                                <StarIcon size={16} />
                              </button>
                            </Tooltip>
                          </>
                        ) : null}
                      </span>
                    ) : (
                      /* Discord cards anything it cannot show: the badge for
                         the file's class, its name as a link, its size, and a
                         download button on the right */
                      <div
                        key={a.id}
                        className={'file-card' + (a.spoiler ? ' spoiler-file' : '')}
                      >
                        <img
                          className="file-badge"
                          src={fileIcon(a.name, a.contentType)}
                          alt=""
                          draggable={false}
                        />
                        <div className="file-meta">
                          <a href={a.url} download={a.name} className="file-name">
                            {a.name}
                          </a>
                          {a.size ? <span className="file-size">{fileSize(a.size)}</span> : null}
                        </div>
                        <a
                          className="file-dl"
                          href={a.url}
                          download={a.name}
                          aria-label={`Download ${a.name}`}
                        >
                          <DownloadIcon />
                        </a>
                      </div>
                    ),
                  )}
                </div>
              ) : null}

              <Reactions
                reactions={m.reactions ?? []}
                self={account.handle}
                onToggle={(name) => onReact(m.id, name)}
                onAdd={() => {
                  const r = ref.current ? box(ref.current) : undefined
                  onOpenPicker(m.id, { x: (r?.right ?? 0) - 380, y: (r?.bottom ?? 0) - 440 })
                }}
              />

            </div>
          </div>
        )
      })}
    </div>
  )
}
