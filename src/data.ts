/** Twemoji assets, resolved at build time (Discord renders emoji as images). */
const emojiFiles = import.meta.glob('./assets/emoji/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const byCode: Record<string, string> = {}
for (const [path, url] of Object.entries(emojiFiles)) {
  byCode[path.split('/').pop()!.replace('.svg', '')] = url
}

export const emoji = {
  books: byCode['1f4da'],
  megaphone: byCode['1f4e3'],
  wave: byCode['1f44b'],
  loveLetter: byCode['1f48c'],
  clown: byCode['1f921'],
  eyes: byCode['1f440'],
  link: byCode['1f517'],
  bulb: byCode['1f4a1'],
  globe: byCode['1f310'],
  fire: byCode['1f525'],
  thumbsUp: byCode['1f44d'],
  cross: byCode['274c'],
  peace: byCode['270c'],
  scroll: byCode['1f4dc'],
  check: byCode['2705'],
  sparkles: byCode['2728'],
}

/** Characters Discord would swap for a Twemoji image inside message text. */
export const emojiByChar: Record<string, string> = {
  '📚': emoji.books,
  '📣': emoji.megaphone,
  '👋': emoji.wave,
  '💌': emoji.loveLetter,
  '🤡': emoji.clown,
  '👀': emoji.eyes,
  '🔗': emoji.link,
  '💡': emoji.bulb,
  '🌐': emoji.globe,
  '🔥': emoji.fire,
  '👍': emoji.thumbsUp,
  '❌': emoji.cross,
  '✌': emoji.peace,
  '📜': emoji.scroll,
  '✅': emoji.check,
  '✨': emoji.sparkles,
}

export type Server = {
  id: string
  name: string
  initials: string
  color: string
  badge?: number
  unread?: boolean
}

export type ChannelKind = 'text' | 'rules' | 'announcement' | 'forum'

export type Channel = {
  id: string
  name: string
  kind: ChannelKind
  emoji?: keyof typeof emoji
  trailingEmoji?: keyof typeof emoji
  unread?: boolean
  muted?: boolean
  badge?: number
  invite?: boolean
  /** rules channels are read-only for everyone but staff */
  readOnly?: boolean
}

export type Category = {
  id: string
  name: string
  icon: 'sparkle' | 'globe'
  channels: Channel[]
}

/** A brand new server, shaped the way Discord seeds one. */
export const starterCategories = (): Category[] => [
  {
    id: 'information',
    name: 'Information',
    icon: 'sparkle',
    channels: [
      { id: 'rules', name: 'rules', kind: 'rules', emoji: 'books', readOnly: true, invite: true },
      { id: 'announcements', name: 'announcements', kind: 'announcement', muted: true },
    ],
  },
  {
    id: 'text',
    name: 'Text Channels',
    icon: 'globe',
    channels: [
      { id: 'general', name: 'general', kind: 'text' },
      { id: 'off-topic', name: 'off-topic', kind: 'text' },
      { id: 'ideas', name: 'ideas', kind: 'forum', trailingEmoji: 'bulb' },
    ],
  },
]

export type Message = {
  id: string
  author: string
  color?: string
  bot?: boolean
  time: number
  text: string
}

export const serverColors = [
  '#5865f2',
  '#3ba55d',
  '#faa81a',
  '#ed4245',
  '#eb459e',
  '#9b59b6',
  '#1abc9c',
  '#e67e22',
]
