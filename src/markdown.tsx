/**
 * Discord-flavour markdown.
 *
 * Discord does not use CommonMark — it has its own dialect, and the differences
 * are the whole point of getting this right: `__x__` is underline rather than
 * bold, `||x||` is a spoiler, `-# x` is subtext, `>>> ` quotes the rest of the
 * message, every newline is a hard break, and tables, images and task lists are
 * deliberately absent. Syntax is per the current formatting docs.
 *
 * Written as a recursive descent parser rather than a pile of regexes so that
 * stacking works the way it does in the client: `***__~~x~~__***` nests.
 */
import { Fragment, useState, type ReactNode } from 'react'
import { byChar, byName } from './emoji'

export type MdContext = {
  channels?: { id: string; name: string }[]
  /** the server's own emoji, so a :shortcode: for one resolves to its image */
  emojis?: { name: string; code?: string; url?: string }[]
  members?: { id: string; name: string; color?: string }[]
  /** highlights the message when the reader is mentioned */
  self?: string
  onChannel?: (id: string) => void
  /**
   * "Show spoiler content" — Discord's three-way setting. `always` reveals
   * every spoiler on sight, `owned` reveals them only in servers you moderate,
   * and `on_click` (the default) keeps them covered until clicked.
   */
  spoilers?: 'always' | 'on_click' | 'owned'
}

/* ----------------------------------------------------------------- emoji */

/**
 * The sprite is keyed by codepoint, so anywhere the app holds a shortcode —
 * a sticker's related emoji, a soundboard sound, a quick reaction — it has to
 * be resolved through the emoji table first. Rendering the name straight into
 * the sprite reference is a blank.
 */
export function EmojiByName({ name, alt }: { name: string; alt?: string }) {
  const e = byName[name]
  if (e == null) return null
  return <EmojiGlyph code={e.code} alt={alt ?? name} />
}

export function EmojiGlyph({ code, alt, big }: { code: string; alt: string; big?: boolean }) {
  return (
    <svg className={'emoji' + (big ? ' jumbo' : '')} role="img" aria-label={alt}>
      <use href={`#e-${code}`} />
    </svg>
  )
}

/**
 * A server's own emoji. An uploaded one is an <img> of its data URL; one saved
 * before uploading worked still carries a twemoji codepoint.
 */
export function GuildEmojiGlyph({
  emoji,
  big,
}: {
  emoji: { name: string; code?: string; url?: string }
  big?: boolean
}) {
  if (emoji.url)
    return (
      <img
        className={'emoji' + (big ? ' jumbo' : '')}
        src={emoji.url}
        alt={`:${emoji.name}:`}
        draggable={false}
      />
    )
  if (emoji.code) return <EmojiGlyph code={emoji.code} alt={`:${emoji.name}:`} big={big} />
  return null
}

/**
 * Does this message mention the reader? Discord paints a message that does in
 * an amber wash with a bar down its left edge, and counts it on the rail — so
 * both of those need the same answer, and it lives here beside the parser
 * that draws the pill.
 *
 * `@everyone` and `@here` count, and a name match is anchored the way the
 * parser's is: the run after the @ has to *start* with the name.
 */
export function mentionsSelf(text: string, name: string) {
  if (/(^|\s)@(everyone|here)\b/.test(text)) return true
  const at = new RegExp(`(^|\\s)@${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
  return at.test(text)
}

/** Surrogate-aware: pulls one user-perceived character off the front. */
function firstChar(s: string, i: number) {
  const cp = s.codePointAt(i)!
  let len = cp > 0xffff ? 2 : 1
  // keep a trailing variation selector or keycap with the base character
  if (s.charCodeAt(i + len) === 0xfe0f) len++
  return s.slice(i, i + len)
}

/**
 * Discord renders a message that is nothing but emoji at a larger size. The
 * real client caps it at 27; past that it goes back to inline size.
 */
export function isJumbo(text: string) {
  const t = text.trim()
  if (!t) return false
  let i = 0
  let n = 0
  while (i < t.length) {
    if (/\s/.test(t[i])) {
      i++
      continue
    }
    // a :shortcode: counts as one emoji, same as the literal character
    const short = /^:([a-z0-9_+-]{2,40}):/i.exec(t.slice(i))
    if (short && byName[short[1].toLowerCase()]) {
      i += short[0].length
      if (++n > 27) return false
      continue
    }
    const ch = firstChar(t, i)
    if (!byChar[ch]) return false
    i += ch.length
    if (++n > 27) return false
  }
  return n > 0
}

/* ---------------------------------------------------------------- inline */

function Spoiler({ children, reveal }: { children: ReactNode; reveal?: boolean }) {
  const [open, setOpen] = useState(!!reveal)
  return (
    <span
      className={'spoiler' + (open ? ' revealed' : '')}
      role="button"
      tabIndex={open ? -1 : 0}
      onClick={() => setOpen(true)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setOpen(true)}
    >
      {children}
    </span>
  )
}

/** Delimiters, longest first so `***` wins over `**` wins over `*`. */
const WRAPPERS: [string, (k: number, kids: ReactNode[]) => ReactNode][] = [
  ['***', (k, kids) => <strong key={k}><em>{kids}</em></strong>],
  ['___', (k, kids) => <u key={k}><em>{kids}</em></u>],
  ['**', (k, kids) => <strong key={k}>{kids}</strong>],
  ['__', (k, kids) => <u key={k}>{kids}</u>],
  ['~~', (k, kids) => <s key={k}>{kids}</s>],
  ['||', (k, kids) => <Spoiler key={k}>{kids}</Spoiler>],
  ['*', (k, kids) => <em key={k}>{kids}</em>],
  ['_', (k, kids) => <em key={k}>{kids}</em>],
]

const URL_RE = /^https?:\/\/[^\s<>()]+[^\s<>().,!?;:'"]/

let key = 0

/** Plain runs: auto-links, mentions, shortcodes and unicode emoji. */
function plain(src: string, ctx: MdContext, jumbo: boolean): ReactNode[] {
  const out: ReactNode[] = []
  let buf = ''
  let i = 0
  const flush = () => {
    if (buf) out.push(<Fragment key={key++}>{buf}</Fragment>)
    buf = ''
  }

  while (i < src.length) {
    const rest = src.slice(i)

    const url = URL_RE.exec(rest)
    if (url) {
      flush()
      out.push(
        <a key={key++} className="md-link" href={url[0]} target="_blank" rel="noreferrer noopener">
          {url[0]}
        </a>,
      )
      i += url[0].length
      continue
    }

    if (src[i] === ':') {
      const m = /^:([a-z0-9_+-]{2,40}):/i.exec(rest)
      // a server's own emoji wins over the unicode table, the way Discord's
      // autocomplete puts the server's first
      const own = m && ctx.emojis?.find((x) => x.name === m[1].toLowerCase())
      if (m && own) {
        flush()
        out.push(<GuildEmojiGlyph key={key++} emoji={own} big={jumbo} />)
        i += m[0].length
        continue
      }
      const e = m && byName[m[1].toLowerCase()]
      if (m && e) {
        flush()
        out.push(<EmojiGlyph key={key++} code={e.code} alt={`:${e.name}:`} big={jumbo} />)
        i += m[0].length
        continue
      }
    }

    if (src[i] === '#' && ctx.channels) {
      const m = /^#([a-z0-9_-]{1,64})/i.exec(rest)
      const ch = m && ctx.channels.find((c) => c.name === m[1])
      if (m && ch) {
        flush()
        out.push(
          <button key={key++} className="md-mention" onClick={() => ctx.onChannel?.(ch.id)}>
            #{ch.name}
          </button>,
        )
        i += m[0].length
        continue
      }
    }

    if (src[i] === '@') {
      // @everyone and @here are Discord's, not a member's, and are pills too
      const all = /^@(everyone|here)\b/.exec(rest)
      if (all) {
        flush()
        out.push(
          <span key={key++} className="md-mention">
            @{all[1]}
          </span>,
        )
        i += all[0].length
        continue
      }
      const m = ctx.members && /^@([\w .-]{1,40})/.exec(rest)
      const hit = m && ctx.members!.find((u) => m[1].toLowerCase().startsWith(u.name.toLowerCase()))
      if (m && hit) {
        flush()
        out.push(
          <span key={key++} className="md-mention" style={hit.color ? { color: hit.color } : undefined}>
            @{hit.name}
          </span>,
        )
        i += 1 + hit.name.length
        continue
      }
    }

    const ch = firstChar(src, i)
    const e = byChar[ch]
    if (e) {
      flush()
      out.push(<EmojiGlyph key={key++} code={e.code} alt={ch} big={jumbo} />)
      i += ch.length
      continue
    }

    buf += src[i]
    i++
  }
  flush()
  return out
}

function inline(src: string, ctx: MdContext, jumbo = false): ReactNode[] {
  const out: ReactNode[] = []
  let buf = ''
  let i = 0
  const flush = () => {
    if (buf) out.push(...plain(buf, ctx, jumbo))
    buf = ''
  }

  while (i < src.length) {
    const c = src[i]

    // a backslash escapes the character after it
    if (c === '\\' && i + 1 < src.length && /[\\*_~`|[\]()>#:@-]/.test(src[i + 1])) {
      buf += src[i + 1]
      i += 2
      continue
    }

    // inline code takes no further parsing inside
    if (c === '`') {
      const m = /^(`{1,3})([^`]+?)\1/.exec(src.slice(i))
      if (m) {
        flush()
        out.push(<code key={key++} className="md-code">{m[2]}</code>)
        i += m[0].length
        continue
      }
    }

    // masked link
    if (c === '[') {
      const m = /^\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/.exec(src.slice(i))
      if (m) {
        flush()
        out.push(
          <a key={key++} className="md-link" href={m[2]} target="_blank" rel="noreferrer noopener">
            {inline(m[1], ctx)}
          </a>,
        )
        i += m[0].length
        continue
      }
    }

    const w = WRAPPERS.find(([tok]) => src.startsWith(tok, i))
    if (w) {
      const close = src.indexOf(w[0], i + w[0].length)
      if (close > i) {
        flush()
        const kids = inline(src.slice(i + w[0].length, close), ctx, jumbo)
        // "Show spoiler content" on `always` reveals every spoiler on sight
        out.push(
          w[0] === '||'
            ? <Spoiler key={key++} reveal={ctx.spoilers === 'always'}>{kids}</Spoiler>
            : w[1](key++, kids),
        )
        i = close + w[0].length
        continue
      }
    }

    buf += c
    i++
  }
  flush()
  return out
}

/* ----------------------------------------------------------------- blocks */

/** Every newline is a hard break in Discord, so lines join with <br>. */
function lines(src: string[], ctx: MdContext, jumbo = false): ReactNode[] {
  return src.flatMap((l, i) => [
    ...(i ? [<br key={key++} />] : []),
    ...inline(l, ctx, jumbo),
  ])
}

export function renderMarkdown(text: string, ctx: MdContext = {}): ReactNode[] {
  const jumbo = isJumbo(text)
  const src = text.split('\n')
  const out: ReactNode[] = []
  let i = 0

  while (i < src.length) {
    const line = src[i]

    // fenced code block
    const fence = /^```([a-z0-9+#-]*)\s*$/i.exec(line)
    if (fence) {
      const body: string[] = []
      i++
      while (i < src.length && !/^```\s*$/.test(src[i])) body.push(src[i++])
      i++ // closing fence
      out.push(
        <pre key={key++} className="md-block">
          <code data-lang={fence[1] || undefined}>{body.join('\n')}</code>
        </pre>,
      )
      continue
    }

    // >>> quotes everything that follows
    if (line.startsWith('>>> ')) {
      const body = [line.slice(4), ...src.slice(i + 1)]
      out.push(
        <blockquote key={key++} className="md-quote">
          {lines(body, ctx)}
        </blockquote>,
      )
      break
    }

    // consecutive `> ` lines form one quote
    if (/^>\s/.test(line)) {
      const body: string[] = []
      while (i < src.length && /^>\s?/.test(src[i])) body.push(src[i++].replace(/^>\s?/, ''))
      out.push(
        <blockquote key={key++} className="md-quote">
          {lines(body, ctx)}
        </blockquote>,
      )
      continue
    }

    const h = /^(#{1,3})\s+(.*)$/.exec(line)
    if (h) {
      const Tag = (['h1', 'h2', 'h3'] as const)[h[1].length - 1]
      out.push(
        <Tag key={key++} className="md-h">
          {inline(h[2], ctx)}
        </Tag>,
      )
      i++
      continue
    }

    if (line.startsWith('-# ')) {
      out.push(
        <div key={key++} className="md-subtext">
          {inline(line.slice(3), ctx)}
        </div>,
      )
      i++
      continue
    }

    // lists: `- `/`* ` and `1. `, two spaces to nest
    if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const items: { depth: number; body: string; ordered: boolean }[] = []
      while (i < src.length && /^\s*([-*]|\d+\.)\s+/.test(src[i])) {
        const m = /^(\s*)([-*]|\d+\.)\s+(.*)$/.exec(src[i])!
        items.push({
          depth: Math.min(2, Math.floor(m[1].length / 2)),
          body: m[3],
          ordered: /\d/.test(m[2]),
        })
        i++
      }
      const ordered = items[0].ordered
      const List = ordered ? 'ol' : 'ul'
      out.push(
        <List key={key++} className="md-list">
          {items.map((it) => (
            <li key={key++} data-depth={it.depth}>
              {inline(it.body, ctx)}
            </li>
          ))}
        </List>,
      )
      continue
    }

    // plain run: gather until the next block-level thing
    const body: string[] = []
    while (
      i < src.length &&
      !/^(```|>\s|>>> |#{1,3}\s|-# |\s*([-*]|\d+\.)\s)/.test(src[i])
    ) {
      body.push(src[i++])
    }
    if (body.length) out.push(<Fragment key={key++}>{lines(body, ctx, jumbo)}</Fragment>)
    else i++
  }

  return out
}
