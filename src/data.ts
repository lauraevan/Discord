import { palettes, type Palette } from './ui/Art'

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

/* ------------------------------------------------------------------ people */

export type Person = {
  id: string
  name: string
  color?: string
  palette: Palette
  variant: number
  glasses?: boolean
}

export const people: Record<string, Person> = {
  wumpus: { id: 'wumpus', name: 'Wumpus', palette: palettes.wumpus, variant: 0 },
  graggle: {
    id: 'graggle',
    name: 'Graggle',
    color: '#9b59b6',
    palette: palettes.graggle,
    variant: 3,
  },
  locke: {
    id: 'locke',
    name: 'locke',
    color: '#e91e63',
    palette: palettes.locke,
    variant: 1,
  },
  phibi: { id: 'phibi', name: 'Phibi', color: '#3498db', palette: palettes.phibi, variant: 2 },
  moat: {
    id: 'moat',
    name: 'Moatmonsturr',
    color: '#3498db',
    palette: palettes.moat,
    variant: 4,
    glasses: true,
  },
  cap: { id: 'cap', name: 'Cap', color: '#e67e22', palette: palettes.cap, variant: 0 },
  danno: { id: 'danno', name: 'Danno', color: '#1abc9c', palette: palettes.danno, variant: 1 },
}

/* ---------------------------------------------------------------- channels */

export type ChannelKind = 'text' | 'announcement' | 'forum' | 'rules' | 'voice'

export type Thread = { id: string; name: string }

export type Channel = {
  id: string
  name: string
  kind: ChannelKind
  unread?: boolean
  threads?: Thread[]
  /** people sitting in a voice channel */
  connected?: { person: string; video?: boolean; muted?: boolean }[]
}

export type Category = {
  id: string
  name?: string
  channels: Channel[]
}

export type Server = {
  id: string
  name: string
  verified?: boolean
  /** rail artwork */
  art: { kind: 'character'; person: string } | { kind: 'object'; obj: string } | { kind: 'initials'; initials: string; color: string }
  square?: boolean
  badge?: number
  unread?: boolean
  categories: Category[]
}

export const crew: Server = {
  id: 'crew',
  name: 'The Crew',
  verified: true,
  square: true,
  art: { kind: 'object', obj: 'cube' },
  categories: [
    {
      id: 'main',
      channels: [
        { id: 'announcements', name: 'announcements', kind: 'announcement' },
        { id: 'resource-share', name: 'resource-share', kind: 'text', unread: true },
        { id: 'mess-hall', name: 'mess-hall', kind: 'text' },
        {
          id: 'gaming',
          name: 'gaming',
          kind: 'text',
          threads: [
            { id: 'game-night', name: 'Game night planning' },
            { id: 'trivia', name: 'Trivia Time' },
          ],
        },
      ],
    },
    {
      id: 'voice',
      name: 'Voice Channels',
      channels: [
        { id: 'wumpus-n-friends', name: 'wumpus-n-friends', kind: 'voice' },
        {
          id: 'the-lounge',
          name: 'the-lounge',
          kind: 'voice',
          connected: [
            { person: 'cap', video: true, muted: true },
            { person: 'danno' },
            { person: 'graggle' },
            { person: 'phibi' },
          ],
        },
      ],
    },
  ],
}

/** The other servers in the rail. */
export const railServers: Server[] = [
  {
    id: 'coven',
    name: 'The Coven',
    art: { kind: 'character', person: 'witch' },
    badge: 2,
    unread: true,
    categories: [],
  },
  {
    id: 'studio',
    name: 'Studio Hours',
    art: { kind: 'character', person: 'locke' },
    badge: 1,
    unread: true,
    categories: [],
  },
]

export const folderServers: Server[] = [
  { id: 'ghosts', name: 'Ghost Club', square: true, art: { kind: 'object', obj: 'ghost' }, categories: [] },
  { id: 'orchard', name: 'The Orchard', square: true, art: { kind: 'object', obj: 'peach' }, categories: [] },
]

export const tailServers: Server[] = [
  { id: 'ducks', name: 'Rubber Ducks', square: true, art: { kind: 'object', obj: 'duck' }, unread: true, categories: [] },
]

export type Message = {
  id: string
  author: string
  time: string
  text: string
}

/** #mess-hall transcript. */
export const messHall: Message[] = [
  { id: 'm1', author: 'phibi', time: 'Today at 6:52 PM', text: 'anyone around tonight?' },
  { id: 'm2', author: 'cap', time: 'Today at 6:54 PM', text: 'always. what are we running' },
  { id: 'm3', author: 'graggle', time: 'Today at 6:58 PM', text: 'i vote something co-op' },
  { id: 'm4', author: 'locke', time: 'Today at 7:01 PM', text: 'co-op means i carry again 😤' },
  { id: 'm5', author: 'danno', time: 'Today at 7:03 PM', text: 'you carried us straight off a cliff last time' },
  { id: 'm6', author: 'moat', time: 'Today at 7:05 PM', text: 'in fairness the cliff was load bearing' },
  { id: 'm7', author: 'phibi', time: 'Today at 7:07 PM', text: 'lounge is open whenever' },
  { id: 'm8', author: 'graggle', time: 'Today at 7:11 PM', text: "yo who's got tips on the next big game?" },
  { id: 'm9', author: 'locke', time: 'Today at 7:13 PM', text: 'Ha! you know I got the inside scoop!' },
  { id: 'm10', author: 'phibi', time: 'Today at 7:15 PM', text: 'Yeah, but the games you play are TOO long' },
  { id: 'm11', author: 'moat', time: 'Today at 7:18 PM', text: "yeah i don't want anything too wild. something easy?" },
  { id: 'm12', author: 'locke', time: 'Today at 7:18 PM', text: "Everyone needs to chill, I'm the goat game predictor" },
]

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
