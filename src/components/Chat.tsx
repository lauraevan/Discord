import { Fragment, useEffect, useRef } from 'react'
import { emojiByChar, people, type Channel, type Message } from '../data'
import { CharacterAvatar } from '../ui/Art'
import {
  BellIcon,
  ForumIcon,
  HashIcon,
  MegaphoneIcon,
  MembersIcon,
  MoreIcon,
  PinIcon,
  RulesIcon,
  SearchIcon,
  SpeakerIcon,
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

export function ChatHeader({ channel }: { channel: Channel }) {
  const tools = [
    { label: 'Threads', Icon: ThreadsIcon },
    { label: 'Notification Settings', Icon: BellIcon },
    { label: 'Pinned Messages', Icon: PinIcon },
    { label: 'Show Member List', Icon: MembersIcon },
    { label: 'More', Icon: MoreIcon },
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
          <input placeholder="Search" aria-label="Search" />
          <SearchIcon />
        </div>
      </div>
    </header>
  )
}

/** Swaps emoji characters for Twemoji images, exactly as Discord does. */
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

export function ChatFeed({
  channel,
  messages,
}: {
  channel: Channel
  messages: Message[]
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const pin = () => (el.scrollTop = el.scrollHeight)
    pin()
    const t = window.setTimeout(pin, 60)
    return () => window.clearTimeout(t)
  }, [messages.length, channel.id])

  let last = ''
  return (
    <div className="feed" ref={ref}>
      <div className="intro">
        <div className="intro-glyph">
          <Glyph kind={channel.kind} />
        </div>
        <h3>Welcome to #{channel.name}!</h3>
        <p>This is the start of the #{channel.name} channel.</p>
      </div>
      {messages.map((m) => {
        const p = people[m.author]
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
              <CharacterAvatar p={p.palette} variant={p.variant} glasses={p.glasses} />
            </span>
            <div className="msg-head">
              <span className="author" style={{ color: p.color }}>
                {p.name}
              </span>
              <span className="timestamp">{m.time}</span>
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
