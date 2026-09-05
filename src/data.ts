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

export const emojiByChar: Record<string, string> = {
  '📚': byCode['1f4da'],
  '📣': byCode['1f4e3'],
  '👋': byCode['1f44b'],
  '💌': byCode['1f48c'],
  '🤡': byCode['1f921'],
  '👀': byCode['1f440'],
  '🔗': byCode['1f517'],
  '💡': byCode['1f4a1'],
  '🌐': byCode['1f310'],
  '🔥': byCode['1f525'],
  '👍': byCode['1f44d'],
  '❌': byCode['274c'],
  '✌': byCode['270c'],
  '📜': byCode['1f4dc'],
  '✅': byCode['2705'],
  '✨': byCode['2728'],
}

/* --------------------------------------------------------------- account */

export type Status = 'online' | 'idle' | 'dnd' | 'invisible'

export type Account = {
  name: string
  handle: string
  pronouns: string
  bio: string
  status: Status
  /** avatar + profile accent, chosen from the palette below */
  color: string
}

export const defaultAccount: Account = {
  name: 'Nebula',
  handle: 'nebula',
  pronouns: 'he/him',
  bio: "i'm... nebula.",
  status: 'online',
  color: '#5865f2',
}

export const statusLabel: Record<Status, string> = {
  online: 'Online',
  idle: 'Idle',
  dnd: 'Do Not Disturb',
  invisible: 'Invisible',
}

export const statusColor: Record<Status, string> = {
  online: '#23a55a',
  idle: '#f0b232',
  dnd: '#f23f43',
  invisible: '#80848e',
}

/* --------------------------------------------------------------- servers */

export type ChannelKind = 'text' | 'voice' | 'announcement' | 'forum' | 'rules'

export type Channel = {
  id: string
  name: string
  kind: ChannelKind
  categoryId: string | null
}

export type Category = { id: string; name: string }

export type Server = {
  id: string
  name: string
  initials: string
  color: string
  categories: Category[]
  channels: Channel[]
}

let seq = 0
export const uid = (p: string) => `${p}-${Date.now().toString(36)}-${++seq}`

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => [...w][0])
    .join('')
    .toUpperCase()

/** The one server the account starts with — the user's own, and empty. */
export const makeServer = (name: string, color = '#5865f2'): Server => ({
  id: uid('srv'),
  name,
  initials: initialsOf(name),
  color,
  categories: [
    { id: 'text', name: 'Text Channels' },
    { id: 'voice', name: 'Voice Channels' },
  ],
  channels: [
    { id: uid('ch'), name: 'ok-ui-test', kind: 'text', categoryId: null },
    { id: uid('ch'), name: 'general', kind: 'text', categoryId: 'text' },
  ],
})

export type Message = {
  id: string
  author: string
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
