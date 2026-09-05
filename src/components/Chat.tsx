import { useLayoutEffect, useRef, useState } from 'react'
import {
  groupsWith,
  type Account,
  type Channel,
  type Message,
  type Reaction,
} from '../data'
import { byName } from '../emoji'
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
  SearchIcon,
  SpeakerIcon,
  ThreadsIcon,
} from '../ui/Icons'
import { Tooltip } from '../ui/Tooltip'
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
        <div className="searchbox">
          <input
            value={query}
            placeholder={`Search ${serverName}`}
            aria-label="Search"
            onChange={(e) => onQuery(e.target.value)}
          />
          <SearchIcon />
        </div>
      </div>
    </header>
  )
}

/* ---------------------------------------------------------------- helpers */

const time = (t: number) =>
  new Date(t).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

const dayKey = (t: number) => new Date(t).toDateString()

function dayLabel(t: number) {
  const d = new Date(t)
  const today = new Date()
  const yday = new Date(today.getTime() - 864e5)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}

/** Reply previews are plain text in the client — strip the syntax. */
function preview(text: string) {
  return text
    .replace(/```[a-z]*\n?/gi, '')
    .replace(/[*_~`|>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Discord's own wording: "Today at 4:32 PM". */
function stamp(t: number) {
  const label = dayLabel(t)
  return label === 'Today' || label === 'Yesterday'
    ? `${label} at ${time(t)}`
    : `${new Date(t).toLocaleDateString()} ${time(t)}`
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

/* ----------------------------------------------------------------- feed */

export function ChatFeed({
  channel,
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
}: {
  channel: Channel
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
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState('')

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

      {messages.map((m, idx) => {
        const prev = messages[idx - 1]
        const grouped = groupsWith(prev, m)
        const day = dayKey(m.time)
        const newDay = day !== lastDay
        lastDay = day
        const parent = m.replyTo ? all.find((x) => x.id === m.replyTo) : undefined
        const isUnread = unreadFrom !== null && m.time >= unreadFrom

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
