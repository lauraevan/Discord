import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AutoModAction,
  SLASH,
  uid,
  type Account,
  type Attachment,
  type AutoModRule,
  type Channel,
  type Message,
} from '../data'
import { autoModHit } from './ServerSettings'
import { messageLimit, uploadLimitMb, type PremiumTypeValue } from '../nitro'
import { EMOJI } from '../emoji'
import { EmojiGlyph } from '../markdown'
import {
  AppsIcon,
  ChevronRightIcon,
  CircleInformationIcon,
  CloseIcon,
  CloseSmallIcon,
  EyeIcon,
  GifIcon,
  GiftIcon,
  PencilIcon,
  PlusIcon,
  PollBarsIcon,
  SchedulePlusIcon,
  SmileyIcon,
  StickerIcon,
  ThreadPlusIcon,
  TrashIcon,
  UploadFileIcon,
} from '../ui/Icons'
import { Tooltip } from '../ui/Tooltip'

type Suggestion = { key: string; label: string; hint?: string; insert: string; code?: string }

/**
 * The composer's autocomplete. Discord opens it on `@`, `#`, `:` and `/` while
 * the token is still being typed, filters as you go, and commits on Tab/Enter.
 */
function useAutocomplete(value: string, caret: number, channels: Channel[], account: Account) {
  return useMemo(() => {
    const upto = value.slice(0, caret)
    const m = /(^|\s)([@#:/])([\w+-]*)$/.exec(upto)
    if (!m) return null
    const [, , sigil, term] = m
    const start = caret - term.length - 1
    const q = term.toLowerCase()
    let items: Suggestion[] = []

    if (sigil === '#') {
      items = channels
        .filter((c) => c.kind !== 'voice' && c.name.includes(q))
        .map((c) => ({ key: c.id, label: `#${c.name}`, insert: `#${c.name} ` }))
    } else if (sigil === '@') {
      items = [{ key: 'self', label: account.name, hint: account.handle, insert: `@${account.name} ` }]
        .filter((s) => s.label.toLowerCase().includes(q) || s.hint!.includes(q))
    } else if (sigil === ':') {
      if (term.length < 1) return null
      items = EMOJI.filter((e) => e.name.includes(q))
        .slice(0, 10)
        .map((e) => ({ key: e.code, label: `:${e.name}:`, insert: `:${e.name}: `, code: e.code }))
    } else {
      items = Object.keys(SLASH)
        .filter((n) => n.startsWith(q))
        .map((n) => ({ key: n, label: `/${n}`, hint: 'built-in', insert: `/${n} ` }))
    }
    if (!items.length) return null
    return { sigil, start, items: items.slice(0, 10) }
  }, [value, caret, channels, account])
}

/**
 * The times Discord's Schedule Message submenu offers. Delivery here happens
 * while the app is open — there is no server to hold a queued message.
 */
const SCHEDULE_OPTIONS: [string, () => number][] = [
  ['Tomorrow morning', () => atClock(1, 9)],
  ['Tomorrow afternoon', () => atClock(1, 15)],
  ['Next Monday', () => nextMonday(9)],
]

function atClock(daysAhead: number, hour: number) {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  d.setHours(hour, 0, 0, 0)
  return d.getTime()
}

function nextMonday(hour: number) {
  const d = new Date()
  d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7))
  d.setHours(hour, 0, 0, 0)
  return d.getTime()
}

export function Composer({
  channel,
  channels,
  account,
  replyTo,
  onCancelReply,
  onSend,
  onEditLast,
  onOpenPicker,
  onPoll,
  onThread,
  onApps,
  onSchedule,
  premiumType,
  onGiftNitro,
  automod,
}: {
  channel: Channel
  channels: Channel[]
  account: Account
  replyTo: Message | null
  onCancelReply: () => void
  onSend: (text: string, attachments: Attachment[]) => void
  onEditLast: () => void
  onOpenPicker: (at: { x: number; y: number }) => void
  onPoll: () => void
  onThread: () => void
  onApps: () => void
  onSchedule: (text: string, at: number) => void
  /** the account's premium type, which is what sets the two caps below */
  premiumType: PremiumTypeValue
  onGiftNitro: () => void
  /** the server's AutoMod rules, which block a message before it is sent */
  automod?: AutoModRule[]
}) {
  const [value, setValue] = useState('')
  const [blocked, setBlocked] = useState<string | null>(null)
  // Discord holds a picked file in the composer until you send, with its own
  // preview card and a spoiler / rename / remove toolbar
  const [pending, setPending] = useState<Attachment[]>([])
  const [tooBig, setTooBig] = useState<string | null>(null)
  const [caret, setCaret] = useState(0)
  const [pick, setPick] = useState(0)
  const [plusOpen, setPlusOpen] = useState(false)
  const [schedOpen, setSchedOpen] = useState(false)
  const input = useRef<HTMLTextAreaElement>(null)
  const file = useRef<HTMLInputElement>(null)

  // Nitro raises both of the composer's caps, so they are read off the
  // account's premium type rather than hard-coded
  const limit = messageLimit(premiumType)
  const uploadCap = uploadLimitMb(premiumType)

  /** Images pasted or picked become data URLs; nothing leaves the browser. */
  const take = (f: File) => {
    if (!f.type.startsWith('image/')) return
    if (f.size > uploadCap * 1024 * 1024) {
      // Discord's own wording when a file is over the account's limit
      setTooBig(`Your files are too powerful. Max upload size is ${uploadCap}MB.`)
      return
    }
    setTooBig(null)
    const r = new FileReader()
    r.onload = () =>
      setPending((all) => [...all, { id: uid('att'), name: f.name, url: String(r.result) }])
    r.readAsDataURL(f)
  }
  const ac = useAutocomplete(value, caret, channels, account)

  useEffect(() => {
    if (replyTo) input.current?.focus()
  }, [replyTo])

  // the composer grows with the message, the way Discord's does
  useEffect(() => {
    const el = input.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 260)}px`
  }, [value])

  // clamp rather than reset from an effect: the list shrinks as you type
  const sel = ac ? Math.min(pick, ac.items.length - 1) : 0

  const accept = (s: Suggestion) => {
    if (!ac) return
    const next = value.slice(0, ac.start) + s.insert + value.slice(caret)
    setValue(next)
    const at = ac.start + s.insert.length
    requestAnimationFrame(() => {
      input.current?.setSelectionRange(at, at)
      setCaret(at)
    })
  }

  const submit = () => {
    const raw = value.trim()
    if (raw.length > limit) return
    if (!raw && pending.length === 0) return
    // AutoMod runs before the send, the way Discord's does: a rule that blocks
    // a message stops it here and says which rule caught it
    const caught = autoModHit(automod, raw)
    if (caught && caught.rule.actions.includes(AutoModAction.BLOCK_MESSAGE)) {
      setBlocked(`${caught.rule.name} blocked this message.`)
      return
    }
    setBlocked(null)
    const slash = /^\/(\w+)\s*([\s\S]*)$/.exec(raw)
    const run = slash && SLASH[slash[1]]
    onSend(run ? run(slash[2]) : raw, pending)
    setValue('')
    setPending([])
    setCaret(0)
  }

  const acts = [
    { label: 'Gift a Nitro subscription', Icon: GiftIcon, on: onGiftNitro },
    { label: 'GIF', Icon: GifIcon, on: () => {} },
    { label: 'Sticker', Icon: StickerIcon, on: () => {} },
    {
      label: 'Emoji',
      Icon: SmileyIcon,
      on: (e: React.MouseEvent) => {
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
        onOpenPicker({ x: r.right - 360, y: r.top - 440 })
      },
    },
    { label: 'Apps', Icon: AppsIcon, on: () => {} },
  ]

  return (
    <div className="composer-wrap">
      {blocked ? (
        <div className="composer-blocked" role="alert">
          <CircleInformationIcon size={16} />
          {blocked}
          <button aria-label="Dismiss" onClick={() => setBlocked(null)}>
            <CloseSmallIcon size={14} />
          </button>
        </div>
      ) : null}
      {replyTo ? (
        <div className="reply-bar">
          <span>
            Replying to <b>{account.name}</b>
          </span>
          <button onClick={onCancelReply} aria-label="Cancel reply">
            <CloseIcon />
          </button>
        </div>
      ) : null}

      {ac ? (
        <div className="autocomplete">
          <div className="ac-head">
            {ac.sigil === '#'
              ? 'CHANNELS'
              : ac.sigil === '@'
                ? 'MEMBERS'
                : ac.sigil === ':'
                  ? 'EMOJI MATCHING'
                  : 'BUILT-IN COMMANDS'}
          </div>
          {ac.items.map((s, i) => (
            <button
              key={s.key}
              className={'ac-row' + (i === sel ? ' on' : '')}
              onMouseEnter={() => setPick(i)}
              onMouseDown={(e) => {
                e.preventDefault()
                accept(s)
              }}
            >
              {s.code ? <EmojiGlyph code={s.code} alt={s.label} /> : null}
              <span className="ac-label">{s.label}</span>
              {s.hint ? <span className="ac-hint">{s.hint}</span> : null}
            </button>
          ))}
        </div>
      ) : null}

      {plusOpen ? (
        <>
          <div className="plus-scrim" onMouseDown={() => setPlusOpen(false)} />
          <div className="plus-menu">
            {/* the five items Discord's plus menu carries, in its order */}
            <button
              onClick={() => {
                file.current?.click()
                setPlusOpen(false)
              }}
            >
              <UploadFileIcon />
              Upload a File
            </button>
            <button
              onClick={() => {
                onThread()
                setPlusOpen(false)
              }}
            >
              <ThreadPlusIcon />
              Create Thread
            </button>
            <button
              onClick={() => {
                onPoll()
                setPlusOpen(false)
              }}
            >
              <PollBarsIcon />
              Create Poll
            </button>
            <button
              onClick={() => {
                onApps()
                setPlusOpen(false)
              }}
            >
              <AppsIcon />
              Use Apps
            </button>
            <div
              className="plus-wrap"
              onMouseEnter={() => setSchedOpen(true)}
              onMouseLeave={() => setSchedOpen(false)}
            >
              <button aria-haspopup="menu">
                <SchedulePlusIcon />
                Schedule Message
                <ChevronRightIcon className="plus-caret" />
              </button>
              {schedOpen ? (
                <div className="plus-menu plus-sub" role="menu">
                  {SCHEDULE_OPTIONS.map(([label, at]) => (
                    <button
                      key={label}
                      disabled={!value.trim()}
                      title={value.trim() ? 'Sends while the app is open' : 'Type a message first'}
                      onClick={() => {
                        onSchedule(value.trim(), at())
                        setValue('')
                        setPlusOpen(false)
                        setSchedOpen(false)
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </>
      ) : null}

      <input
        ref={file}
        type="file"
        accept="image/*"
        hidden
        aria-hidden="true"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) take(f)
          e.target.value = ''
        }}
      />

      <div className={'composer' + (replyTo ? ' replying' : '')}>
        <Tooltip label="Upload a File" side="above">
          <button
            className={'plus' + (plusOpen ? ' on' : '')}
            aria-label="Upload a file"
            onClick={() => setPlusOpen((v) => !v)}
          >
            <PlusIcon />
          </button>
        </Tooltip>
        <textarea
          ref={input}
          rows={1}
          className="composer-input"
          value={value}
          placeholder={`Message #${channel.name}`}
          aria-label={`Message #${channel.name}`}
          onChange={(e) => {
            setValue(e.target.value)
            setCaret(e.target.selectionStart)
            setPick(0)
          }}
          onPaste={(e) => {
            const f = [...e.clipboardData.files][0]
            if (f) {
              e.preventDefault()
              take(f)
            }
          }}
          onKeyUp={(e) => setCaret((e.target as HTMLTextAreaElement).selectionStart)}
          onClick={(e) => setCaret((e.target as HTMLTextAreaElement).selectionStart)}
          onKeyDown={(e) => {
            if (ac) {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setPick((p) => (p + 1) % ac.items.length)
                return
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault()
                setPick((p) => (p - 1 + ac.items.length) % ac.items.length)
                return
              }
              if (e.key === 'Tab' || e.key === 'Enter') {
                e.preventDefault()
                accept(ac.items[sel])
                return
              }
              if (e.key === 'Escape') {
                e.preventDefault()
                setCaret(-1)
                return
              }
            }
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit()
              return
            }
            if (e.key === 'ArrowUp' && !value) {
              e.preventDefault()
              onEditLast()
            }
            if (e.key === 'Escape' && replyTo) onCancelReply()
          }}
        />
        {/* Discord shows the remaining characters once you are within 200 of
            the limit, and turns it red past it */}
        {value.length > limit - 200 ? (
          <span className={'composer-count' + (value.length > limit ? ' over' : '')}>
            {(limit - value.length).toLocaleString()}
          </span>
        ) : null}
        <div className="composer-acts">
          {acts.map(({ label, Icon, on }) => (
            <Tooltip key={label} label={label} side="above">
              <button aria-label={label} className={label.toLowerCase().replace(/\W+/g, '-')} onClick={on}>
                <Icon />
              </button>
            </Tooltip>
          ))}
        </div>
      </div>
      {pending.length ? (
        <div className="upload-tray">
          {pending.map((a) => (
            <figure key={a.id} className={'upload-card' + (a.spoiler ? ' spoiler' : '')}>
              <div className="upload-thumb">
                <img src={a.url} alt={a.name} />
                {a.spoiler ? <span className="upload-spoiler-tag">SPOILER</span> : null}
              </div>
              <figcaption>{a.name}</figcaption>
              <div className="upload-acts">
                <Tooltip label={a.spoiler ? 'Remove Spoiler' : 'Mark as Spoiler'} side="above">
                  <button
                    aria-label="Mark as spoiler"
                    onClick={() =>
                      setPending((all) =>
                        all.map((x) => (x.id === a.id ? { ...x, spoiler: !x.spoiler } : x)),
                      )
                    }
                  >
                    <EyeIcon />
                  </button>
                </Tooltip>
                <Tooltip label="Edit File Name" side="above">
                  <button
                    aria-label="Edit file name"
                    onClick={() => {
                      const name = prompt('File name', a.name)
                      if (name)
                        setPending((all) => all.map((x) => (x.id === a.id ? { ...x, name } : x)))
                    }}
                  >
                    <PencilIcon />
                  </button>
                </Tooltip>
                <Tooltip label="Remove Attachment" side="above">
                  <button
                    className="danger"
                    aria-label="Remove attachment"
                    onClick={() => setPending((all) => all.filter((x) => x.id !== a.id))}
                  >
                    <TrashIcon />
                  </button>
                </Tooltip>
              </div>
            </figure>
          ))}
        </div>
      ) : null}

      {tooBig ? (
        <div className="composer-toobig" role="alert">
          {tooBig}
          <button onClick={() => setTooBig(null)} aria-label="Dismiss">
            <CloseIcon />
          </button>
        </div>
      ) : null}
    </div>
  )
}
