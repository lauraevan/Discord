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
  /** the custom status line and its emoji shortcode */
  customStatus?: string
  customEmoji?: string
  /**
   * Profile theme. Discord's default popout is an accent-coloured banner over
   * a dark card; a themed profile replaces the card with a two-colour wash and
   * flips the text dark. Both appear in the reference frames.
   */
  profileTheme?: [string, string]
  /** ids from src/badges.ts, in the order the profile shows them */
  badges?: string[]
  /** collectible ids bought in the Shop */
  collectibles?: string[]
  /** the avatar decoration currently worn, if any */
  decoration?: string
}

/**
 * The account a freshly registered user gets: their own display name and
 * username, Discord's default blurple, and nothing else. Badges, Nitro and
 * collectibles are all earned from here rather than handed out.
 */
export const accountFor = (displayName: string, username: string): Account => ({
  name: displayName,
  handle: username,
  pronouns: '',
  bio: '',
  status: 'online',
  color: '#5865f2',
  badges: [],
})

export const defaultAccount: Account = {
  name: 'Nebula',
  handle: 'nebula',
  pronouns: 'he/him',
  bio: "i'm... nebula.",
  status: 'online',
  color: '#5865f2',
  profileTheme: ['#e3e1e7', '#bad7b4'],
  customStatus: 'wow',
  badges: [
    'staff',
    'partner',
    'hypesquad',
    'bug_hunter',
    'bravery',
    'early_supporter',
    'bug_hunter_gold',
    'verified_developer',
    'mod_alumni',
    'active_developer',
    'nitro',
    'boost',
  ],
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

export type ChannelKind = 'text' | 'voice' | 'announcement' | 'stage' | 'forum' | 'media' | 'rules'

/**
 * The channel types Create Channel offers, with the client's own descriptions.
 * Discord's numeric type is in the comment; see docs/discord-reference.md.
 */
export const CHANNEL_TYPES: [ChannelKind, string, string][] = [
  ['text', 'Text', 'Send messages, images, GIFs, emoji, opinions, and puns'],
  ['voice', 'Voice', 'Hang out together with voice, video, and screen share'],
  ['announcement', 'Announcement', 'Important updates for people in and out of the server'],
  ['stage', 'Stage', 'Host events with an audience of listeners'],
  ['forum', 'Forum', 'Create a space for organised discussions'],
  ['media', 'Media', 'A gallery-style space for images and video'],
]

export type Channel = {
  id: string
  name: string
  kind: ChannelKind
  categoryId: string | null
  topic?: string
  nsfw?: boolean
  /** seconds; Discord calls this rateLimitPerUser */
  slowmode?: number
  /** set on threads: the channel the thread hangs off */
  parentId?: string
  /** set on threads: the message the thread was started from */
  rootMessageId?: string
  archived?: boolean
}

/** Discord's slowmode steps, as the channel settings slider offers them. */
export const SLOWMODE_STEPS = [0, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200, 21600]

export const slowmodeLabel = (s: number) => {
  if (!s) return 'Off'
  if (s < 60) return `${s}s`
  if (s < 3600) return `${s / 60} min`
  return `${s / 3600} hr`
}

/** Mute durations, in the order the client's notification menu lists them. */
export const MUTE_DURATIONS: [string, number | null][] = [
  ['For 15 Minutes', 15 * 60_000],
  ['For 1 Hour', 60 * 60_000],
  ['For 3 Hours', 3 * 60 * 60_000],
  ['For 8 Hours', 8 * 60 * 60_000],
  ['For 24 Hours', 24 * 60 * 60_000],
  ['Until I turn it back on', null],
]

export type Category = { id: string; name: string }

/** A role, with the permission ids Discord names them by. */
export type Role = {
  id: string
  name: string
  color: string | null
  hoist: boolean
  mentionable: boolean
  permissions: string[]
}

export type GuildEmoji = { id: string; name: string; code: string }

export type Invite = {
  code: string
  createdAt: number
  uses: number
  maxUses: number
  maxAge: number
}

/** An entry in the server's audit log — written by the app's own actions. */
export type AuditEntry = { id: string; time: number; action: string; target: string }

export type Server = {
  id: string
  name: string
  initials: string
  color: string
  /** an uploaded icon, as a data URL; the initials show when there is none */
  icon?: string
  description?: string
  categories: Category[]
  channels: Channel[]
  roles: Role[]
  emojis: GuildEmoji[]
  invites: Invite[]
  bans: { id: string; name: string; reason: string }[]
  audit: AuditEntry[]
  /** ALL_MESSAGES 0 | ONLY_MENTIONS 1 | NO_MESSAGES 2 */
  notifyLevel: 0 | 1 | 2
  boostTier: 0 | 1 | 2 | 3
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
  // Discord gives a new server exactly these two, which is also what keeps the
  // welcome checklist up until you build the channel list out
  channels: [
    { id: uid('ch'), name: 'general', kind: 'text', categoryId: 'text' },
    { id: uid('ch'), name: 'General', kind: 'voice', categoryId: 'voice' },
  ],
  // every server has @everyone; Discord shows it at the bottom of the role list
  roles: [
    {
      id: 'everyone',
      name: '@everyone',
      color: null,
      hoist: false,
      mentionable: false,
      permissions: DEFAULT_PERMISSIONS,
    },
  ],
  emojis: [],
  invites: [],
  bans: [],
  audit: [],
  notifyLevel: 1,
  boostTier: 0,
})

/** Invite codes are 8 characters of Discord's alphabet. */
export const inviteCode = () => {
  const a = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => a[Math.floor(Math.random() * a.length)]).join('')
}

/** A reaction is a shortcode plus the people who added it. */
export type Reaction = { name: string; by: string[] }

/** A poll, shaped the way Discord's poll object is. */
export type Poll = {
  question: string
  answers: { id: number; text: string; emoji?: string }[]
  /** answer id -> voters */
  votes: Record<number, string[]>
  multi: boolean
  expiresAt: number
}

export type Attachment = {
  id: string
  name: string
  /** data URL — everything stays in the browser */
  url: string
  width?: number
  height?: number
  spoiler?: boolean
}

/**
 * Message types Discord renders differently. Numbers are Discord's own
 * MessageType values; see docs/discord-reference.md.
 */
export type MessageType =
  | 'DEFAULT'
  | 'USER_JOIN'
  | 'CHANNEL_PINNED_MESSAGE'
  | 'THREAD_CREATED'
  | 'GUILD_BOOST'
  | 'CHANNEL_NAME_CHANGE'

export type Message = {
  id: string
  author: string
  time: number
  text: string
  type?: MessageType
  poll?: Poll
  attachments?: Attachment[]
  /** id of the thread started from this message */
  threadId?: string
  /** set when the message has been edited, so the client can tag it */
  editedAt?: number
  /** id of the message this one replies to */
  replyTo?: string
  reactions?: Reaction[]
  pinned?: boolean
}

/**
 * Discord groups consecutive messages from one author, and breaks the group
 * after about seven minutes.
 */
export const GROUP_WINDOW = 7 * 60 * 1000

export const groupsWith = (prev: Message | undefined, m: Message) =>
  !!prev &&
  prev.author === m.author &&
  !m.replyTo &&
  m.time - prev.time < GROUP_WINDOW

/** Discord's own slash commands that need no server round-trip. */
export const SLASH: Record<string, (arg: string) => string> = {
  shrug: (a) => `${a} ¯\\_(ツ)_/¯`.trim(),
  tableflip: (a) => `${a} (╯°□°）╯︵ ┻━┻`.trim(),
  unflip: (a) => `${a} ┬─┬ノ( º _ ºノ)`.trim(),
  me: (a) => `*${a}*`,
  spoiler: (a) => `||${a}||`,
}

/**
 * Discord's permissions, grouped and labelled the way the role editor groups
 * them. Ids are Discord's own names.
 */
export const PERMISSION_GROUPS: [string, [string, string, string][]][] = [
  ['General Server Permissions', [
    ['VIEW_CHANNEL', 'View Channels', 'Allows members to view channels by default (excluding private channels).'],
    ['MANAGE_CHANNELS', 'Manage Channels', 'Allows members to create, edit, or delete channels.'],
    ['MANAGE_ROLES', 'Manage Roles', 'Allows members to create new roles and edit roles lower than this one.'],
    ['CREATE_EXPRESSIONS', 'Create Expressions', 'Allows members to add custom emoji, stickers, and sounds in this server.'],
    ['MANAGE_EXPRESSIONS', 'Manage Expressions', 'Allows members to edit or remove custom expressions in this server.'],
    ['VIEW_AUDIT_LOG', 'View Audit Log', "Allows members to view a record of who made which changes in this server."],
    ['MANAGE_WEBHOOKS', 'Manage Webhooks', 'Allows members to create, edit, or delete webhooks.'],
    ['MANAGE_GUILD', 'Manage Server', "Allows members to change this server's name, region, icon and more."],
  ]],
  ['Membership Permissions', [
    ['CREATE_INSTANT_INVITE', 'Create Invite', 'Allows members to invite new people to this server.'],
    ['CHANGE_NICKNAME', 'Change Nickname', 'Allows members to change their own nickname.'],
    ['MANAGE_NICKNAMES', 'Manage Nicknames', "Allows members to change other members' nicknames."],
    ['KICK_MEMBERS', 'Kick Members', 'Allows members to remove other members from this server.'],
    ['BAN_MEMBERS', 'Ban Members', 'Allows members to permanently ban other members from this server.'],
    ['MODERATE_MEMBERS', 'Timeout Members', 'When you time someone out they cannot send messages or react.'],
  ]],
  ['Text Channel Permissions', [
    ['SEND_MESSAGES', 'Send Messages', 'Allows members to send messages in text channels.'],
    ['SEND_MESSAGES_IN_THREADS', 'Send Messages in Threads', 'Allows members to send messages in threads.'],
    ['CREATE_PUBLIC_THREADS', 'Create Public Threads', 'Allows members to create threads that everyone can see.'],
    ['CREATE_PRIVATE_THREADS', 'Create Private Threads', 'Allows members to create invite-only threads.'],
    ['EMBED_LINKS', 'Embed Links', 'Allows links shared by members to show a preview.'],
    ['ATTACH_FILES', 'Attach Files', 'Allows members to upload files or media.'],
    ['ADD_REACTIONS', 'Add Reactions', 'Allows members to add new emoji reactions to a message.'],
    ['USE_EXTERNAL_EMOJIS', 'Use External Emoji', 'Allows members to use emoji from other servers.'],
    ['MENTION_EVERYONE', 'Mention @everyone, @here, and All Roles', 'Allows members to ping every member.'],
    ['MANAGE_MESSAGES', 'Manage Messages', 'Allows members to delete and pin any message.'],
    ['MANAGE_THREADS', 'Manage Threads', 'Allows members to rename, delete, archive and turn on slow mode for threads.'],
    ['READ_MESSAGE_HISTORY', 'Read Message History', 'Allows members to read previous messages.'],
    ['SEND_TTS_MESSAGES', 'Send Text-to-Speech Messages', 'Allows members to send text-to-speech messages.'],
    ['SEND_VOICE_MESSAGES', 'Send Voice Messages', 'Allows members to send voice messages.'],
    ['CREATE_POLLS', 'Create Polls', 'Allows members to create polls.'],
  ]],
  ['Voice Channel Permissions', [
    ['CONNECT', 'Connect', 'Allows members to join voice channels and hear others.'],
    ['SPEAK', 'Speak', 'Allows members to talk in voice channels.'],
    ['STREAM', 'Video', 'Allows members to share their video, screen or games.'],
    ['USE_SOUNDBOARD', 'Use Soundboard', 'Allows members to send sounds from the server soundboard.'],
    ['USE_EXTERNAL_SOUNDS', 'Use External Sounds', 'Allows members to use sounds from other servers.'],
    ['USE_VAD', 'Use Voice Activity', 'Allows members to speak without pressing push-to-talk.'],
    ['PRIORITY_SPEAKER', 'Priority Speaker', 'Allows members to be more easily heard.'],
    ['MUTE_MEMBERS', 'Mute Members', 'Allows members to mute others in voice channels.'],
    ['DEAFEN_MEMBERS', 'Deafen Members', 'Allows members to deafen others in voice channels.'],
    ['MOVE_MEMBERS', 'Move Members', 'Allows members to move others between voice channels.'],
    ['SET_VOICE_CHANNEL_STATUS', 'Set Voice Channel Status', 'Allows members to create and edit voice channel status.'],
  ]],
  ['Events Permissions', [
    ['CREATE_EVENTS', 'Create Events', 'Allows members to create events.'],
    ['MANAGE_EVENTS', 'Manage Events', 'Allows members to edit and cancel events.'],
  ]],
  ['Advanced Permissions', [
    ['ADMINISTRATOR', 'Administrator', 'Members with this permission have every permission and bypass channel-specific permissions. This is a dangerous permission to grant.'],
  ]],
]

/** What @everyone gets on a new server. */
export const DEFAULT_PERMISSIONS = [
  'VIEW_CHANNEL', 'CREATE_INSTANT_INVITE', 'CHANGE_NICKNAME',
  'SEND_MESSAGES', 'SEND_MESSAGES_IN_THREADS', 'CREATE_PUBLIC_THREADS',
  'EMBED_LINKS', 'ATTACH_FILES', 'ADD_REACTIONS', 'USE_EXTERNAL_EMOJIS',
  'READ_MESSAGE_HISTORY', 'SEND_VOICE_MESSAGES', 'CREATE_POLLS',
  'CONNECT', 'SPEAK', 'STREAM', 'USE_SOUNDBOARD', 'USE_VAD',
]

/** The colours Discord offers in the role editor. */
export const ROLE_COLORS = [
  '#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#e91e63',
  '#f1c40f', '#e67e22', '#e74c3c', '#95a5a6', '#607d8b',
  '#11806a', '#1f8b4c', '#206694', '#71368a', '#ad1457',
  '#c27c0e', '#a84300', '#992d22', '#979c9f', '#546e7a',
]

/**
 * Discord's rotating join lines. The client picks one by the message
 * timestamp, so the same message always shows the same line.
 */
export const JOIN_LINES = [
  '%s joined the party.',
  '%s is here.',
  'Welcome, %s. We hope you brought pizza.',
  'A wild %s appeared.',
  '%s just landed.',
  '%s just slid into the server.',
  '%s just showed up!',
  'Welcome %s. Say hi!',
  '%s hopped into the server.',
  'Everyone welcome %s!',
  "Glad you're here, %s.",
  'Good to see you, %s.',
  'Yay you made it, %s!',
]

export const joinLine = (name: string, time: number) =>
  JOIN_LINES[time % JOIN_LINES.length].replace('%s', name)

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
