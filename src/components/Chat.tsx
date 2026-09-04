import { Fragment, useEffect, useRef, type ReactNode } from 'react'
import appBadge from '../assets/badges/app.svg'
import { emoji, emojiByChar, type Channel, type Message } from '../data'
import { DefaultAvatar } from '../ui/Art'
import { HashIcon } from '../ui/Icons'

/* --------------------------------------------------------------- pieces */

export function Avatar({ children }: { children: ReactNode }) {
  return <span className="group-avatar">{children}</span>
}

export function AppBadge() {
  return <img className="app-badge" src={appBadge} alt="APP" />
}

/** Compact server-tag badge (Discord's clan / role tag). */
export function RoleBadge({ tag }: { tag: string }) {
  return (
    <span className="role-badge">
      <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3 3 8l9 5 9-5-9-5Z" fill="#4aa3ff" />
        <path d="m3 12 9 5 9-5-2.6-1.5L12 14l-6.4-3.5L3 12Z" fill="#7fc4ff" />
        <path d="m3 16 9 5 9-5-2.6-1.5L12 18l-6.4-3.5L3 16Z" fill="#2f7fd0" />
      </svg>
      <span>{tag}</span>
    </span>
  )
}

/** Swaps emoji characters for Twemoji images, exactly as Discord does. */
export function RichText({ text }: { text: string }) {
  const parts = [...text]
  return (
    <>
      {parts.map((ch, i) => {
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

export function DateDivider({ label, isNew }: { label: string; isNew?: boolean }) {
  return (
    <div className={'divider' + (isNew ? ' new' : '')}>
      <span>{label}</span>
      {isNew ? <span className="new-pill">NEW</span> : null}
    </div>
  )
}

const dayLabel = (t: number) => {
  const d = new Date(t)
  const today = new Date()
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString()
  const yest = new Date(today.getTime() - 864e5)
  if (same(d, today)) return 'Today'
  if (same(d, yest)) return 'Yesterday'
  return d.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

const timeLabel = (t: number) => {
  const d = new Date(t)
  const today = new Date()
  const stamp = d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
  if (d.toDateString() === today.toDateString()) return `Today at ${stamp}`
  if (d.toDateString() === new Date(today.getTime() - 864e5).toDateString())
    return `Yesterday at ${stamp}`
  return `${d.toLocaleDateString()}, ${stamp}`
}

/* ----------------------------------------------------------------- feed */

function ChannelIntro({ channel }: { channel: Channel }) {
  return (
    <div className="intro">
      <div className="intro-glyph">
        {channel.emoji ? (
          <img src={emoji[channel.emoji]} alt="" width={44} height={44} />
        ) : (
          <HashIcon size={44} />
        )}
      </div>
      <h3>Welcome to #{channel.name}!</h3>
      <p>This is the start of the #{channel.name} channel.</p>
    </div>
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

  let lastDay = ''
  let lastAuthor = ''
  let lastTime = 0

  return (
    <div className="feed" ref={ref}>
      <ChannelIntro channel={channel} />
      {messages.map((m) => {
        const day = dayLabel(m.time)
        const newDay = day !== lastDay
        const grouped =
          !newDay && m.author === lastAuthor && m.time - lastTime < 7 * 60000
        lastDay = day
        lastAuthor = m.author
        lastTime = m.time
        return (
          <Fragment key={m.id}>
            {newDay ? <DateDivider label={day} /> : null}
            {grouped ? (
              <div className="group grouped">
                <div className="msg-line">
                  <RichText text={m.text} />
                </div>
              </div>
            ) : (
              <div className="group">
                <Avatar>
                  <DefaultAvatar />
                </Avatar>
                <div className="msg-head">
                  <span className="author" style={{ color: m.color }}>
                    {m.author}
                  </span>
                  {m.bot ? <AppBadge /> : null}
                  <span className="timestamp">{timeLabel(m.time)}</span>
                </div>
                <div className="msg-line">
                  <RichText text={m.text} />
                </div>
              </div>
            )}
          </Fragment>
        )
      })}
    </div>
  )
}
