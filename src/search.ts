/**
 * Discord's search filters.
 *
 * The client accepts `from:`, `mentions:`, `has:`, `before:`, `during:`,
 * `after:`, `in:` and `pinned:`; anything left over is the text to match.
 */
import type { Channel, Message } from './data'

export type Query = {
  text: string
  from?: string
  in?: string
  has?: string
  before?: string
  after?: string
  pinned?: boolean
}

export const FILTERS: [string, string][] = [
  ['from:', 'user'],
  ['mentions:', 'user'],
  ['has:', 'link, embed, poll, file, image'],
  ['before:', 'specific date'],
  ['during:', 'specific date'],
  ['after:', 'specific date'],
  ['in:', 'channel'],
  ['pinned:', 'true or false'],
]

export function parseQuery(raw: string): Query {
  const q: Query = { text: '' }
  const words: string[] = []
  for (const w of raw.split(/\s+/)) {
    const m = /^(from|mentions|has|before|during|after|in|pinned):(.*)$/i.exec(w)
    if (!m || !m[2]) {
      if (w) words.push(w)
      continue
    }
    const [, key, value] = m
    const k = key.toLowerCase()
    if (k === 'pinned') q.pinned = value.toLowerCase() === 'true'
    else if (k === 'mentions') q.from = value.replace(/^@/, '')
    else if (k === 'during') q.after = value
    else (q as unknown as Record<string, string>)[k] = value.replace(/^[#@]/, '')
  }
  q.text = words.join(' ').toLowerCase()
  return q
}

const day = (s: string) => {
  const t = Date.parse(s)
  return Number.isNaN(t) ? null : t
}

export function matches(q: Query, m: Message, c: Channel, authorName: string) {
  if (q.text && !m.text.toLowerCase().includes(q.text)) return false
  if (q.from && !authorName.toLowerCase().includes(q.from.toLowerCase())) return false
  if (q.in && !c.name.includes(q.in.toLowerCase())) return false
  if (q.pinned !== undefined && !!m.pinned !== q.pinned) return false
  if (q.has) {
    const h = q.has.toLowerCase()
    const ok =
      (h === 'link' && /https?:\/\//.test(m.text)) ||
      (h === 'poll' && !!m.poll) ||
      ((h === 'file' || h === 'image') && !!m.attachments?.length) ||
      (h === 'embed' && /https?:\/\//.test(m.text))
    if (!ok) return false
  }
  const b = q.before && day(q.before)
  if (b && m.time >= b) return false
  const a = q.after && day(q.after)
  if (a && m.time <= a) return false
  return true
}
