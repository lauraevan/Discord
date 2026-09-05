import { Fragment, useEffect, useRef, useState } from 'react'
import { emojiByChar, type Account, type Channel, type Message } from '../data'
import { Avatar } from './UserArea'
import {
  AppsIcon,
  BellIcon,
  ForumIcon,
  GifIcon,
  GiftIcon,
  HashIcon,
  MegaphoneIcon,
  MembersIcon,
  PencilIcon,
  PinIcon,
  PlusIcon,
  RulesIcon,
  SearchIcon,
  SmileyIcon,
  SpeakerIcon,
  StickerIcon,
  ThreadsIcon,
} from '../ui/Icons'
import { Tooltip } from '../ui/Tooltip'

function Glyph({ kind }: { kind: Channel['kind'] }) {
  if (kind === 'announcement') return <MegaphoneIcon />
  if (kind === 'forum') return <ForumIcon />
  if (kind === 'rules') return <RulesIcon />
  if (kind === 'voice') return <SpeakerIcon />
  return <HashIcon />
}

export function ChatHeader({
  channel,
  serverName,
}: {
  channel: Channel
  serverName: string
}) {
  const tools = [
    { label: 'Threads', Icon: ThreadsIcon },
    { label: 'Notification Settings', Icon: BellIcon },
    { label: 'Pinned Messages', Icon: PinIcon },
    { label: 'Show Member List', Icon: MembersIcon },
  ]
  return (
    <header className="chat-header">
      <Glyph kind={channel.kind} />
      <h2>{channel.name}</h2>
      <div className="chat-tools">
        {tools.map(({ label, Icon }) => (
          <Tooltip key={label} label={label} side="below">
            <button aria-label={label}>
              <Icon />
            </button>
          </Tooltip>
        ))}
        <div className="searchbox">
          <input placeholder={`Search ${serverName}`} aria-label="Search" />
          <SearchIcon />
        </div>
      </div>
    </header>
  )
}

function RichText({ text }: { text: string }) {
  return (
    <>
      {[...text].map((ch, i) => {
        const url = emojiByChar[ch]
        return url ? (
          <img key={i} className="inline-emoji" src={url} alt={ch} />
        ) : (
          <Fragment key={i}>{ch}</Fragment>
        )
      })}
    </>
  )
}

const stamp = (t: number) => {
  const d = new Date(t)
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  const today = new Date().toDateString() === d.toDateString()
  return today ? `Today at ${time}` : `${d.toLocaleDateString()} ${time}`
}

export function ChatFeed({
  channel,
  messages,
  account,
  onEditChannel,
}: {
  channel: Channel
  messages: Message[]
  account: Account
  onEditChannel: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length, channel.id])

  let last = ''
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
      {messages.map((m) => {
        const grouped = m.author === last
        last = m.author
        return grouped ? (
          <div className="group grouped" key={m.id}>
            <div className="msg-line">
              <RichText text={m.text} />
            </div>
          </div>
        ) : (
          <div className="group" key={m.id}>
            <span className="group-avatar">
              <Avatar account={account} size={40} />
            </span>
            <div className="msg-head">
              <span className="author">{account.name}</span>
              <span className="timestamp">{stamp(m.time)}</span>
            </div>
            <div className="msg-line">
              <RichText text={m.text} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function Composer({
  channelName,
  onSend,
}: {
  channelName: string
  onSend: (t: string) => void
}) {
  const [value, setValue] = useState('')
  const acts = [
    { label: 'Gift a Nitro subscription', Icon: GiftIcon },
    { label: 'GIF', Icon: GifIcon },
    { label: 'Sticker', Icon: StickerIcon },
    { label: 'Emoji', Icon: SmileyIcon },
    { label: 'Apps', Icon: AppsIcon },
  ]
  return (
    <div className="composer-wrap">
      <div className="composer">
        <Tooltip label="Upload a File" side="below">
          <button className="plus" aria-label="Upload a file">
            <PlusIcon />
          </button>
        </Tooltip>
        <input
          className="composer-input"
          value={value}
          placeholder={`Message #${channelName}`}
          aria-label={`Message #${channelName}`}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              const t = value.trim()
              if (t) {
                onSend(t)
                setValue('')
              }
            }
          }}
        />
        <div className="composer-acts">
          {acts.map(({ label, Icon }) => (
            <Tooltip key={label} label={label} side="below">
              <button aria-label={label}>
                <Icon />
              </button>
            </Tooltip>
          ))}
        </div>
      </div>
    </div>
  )
}
