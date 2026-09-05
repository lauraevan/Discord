import { useEffect, useMemo, useState } from 'react'
import { ChannelSidebar } from './components/ChannelSidebar'
import { ChatFeed, ChatHeader } from './components/Chat'
import { Composer, TypingIndicator } from './components/Composer'
import { CreateServerModal } from './components/CreateServerModal'
import { ServerArt, ServerRail } from './components/ServerRail'
import { ThemePanel } from './components/ThemePanel'
import { TitleBar } from './components/TitleBar'
import { UserCard } from './components/UserCard'
import {
  crew,
  folderServers,
  messHall,
  railServers,
  tailServers,
  type Channel,
  type Message,
  type Server,
} from './data'
import { allThemes, applyTheme, defaultThemes } from './themes'

const STORE_SERVERS = 'discord-ui:servers'
const STORE_MESSAGES = 'discord-ui:messages'
const STORE_THEME = 'discord-ui:theme'

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

const starterCategories = () => [
  {
    id: 'text',
    name: 'Text Channels',
    channels: [
      { id: 'general', name: 'general', kind: 'text' as const },
      { id: 'off-topic', name: 'off-topic', kind: 'text' as const },
    ],
  },
  {
    id: 'voice',
    name: 'Voice Channels',
    channels: [{ id: 'general-voice', name: 'General', kind: 'voice' as const }],
  },
]

export default function App() {
  const [custom, setCustom] = useState<Server[]>(() => load<Server[]>(STORE_SERVERS, []))
  const [messages, setMessages] = useState<Record<string, Message[]>>(() =>
    load<Record<string, Message[]>>(STORE_MESSAGES, {}),
  )
  const [themeId, setThemeId] = useState<string>(() => load<string>(STORE_THEME, 'dark'))
  const [activeServer, setActiveServer] = useState<string>('crew')
  const [activeChannel, setActiveChannel] = useState('mess-hall')
  const [collapsed, setCollapsed] = useState<string[]>([])
  const [muted, setMuted] = useState(false)
  const [deafened, setDeafened] = useState(false)
  const [creating, setCreating] = useState(false)
  const [themePanel, setThemePanel] = useState(false)

  const theme = allThemes.find((t) => t.id === themeId) ?? defaultThemes[2]

  useEffect(() => applyTheme(theme), [theme])
  useEffect(() => {
    localStorage.setItem(STORE_THEME, JSON.stringify(themeId))
  }, [themeId])
  useEffect(() => {
    localStorage.setItem(STORE_SERVERS, JSON.stringify(custom))
  }, [custom])
  useEffect(() => {
    localStorage.setItem(STORE_MESSAGES, JSON.stringify(messages))
  }, [messages])

  const servers = useMemo(() => [crew, ...railServers, ...folderServers, ...tailServers, ...custom], [custom])
  const server = servers.find((s) => s.id === activeServer) ?? crew

  const channels: Channel[] = server.categories.flatMap((c) => c.channels)
  const channel =
    channels.find((c) => c.id === activeChannel && c.kind !== 'voice') ??
    channels.find((c) => c.kind !== 'voice') ??
    channels[0]

  const key = `${server.id}/${channel?.id ?? ''}`
  const seeded = server.id === 'crew' && channel?.id === 'mess-hall' ? messHall : []
  const thread = [...seeded, ...(messages[key] ?? [])]

  const createServer = (name: string, color: string) => {
    const id = `srv-${Date.now().toString(36)}`
    const initials = name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => [...w][0])
      .join('')
      .toUpperCase()
    setCustom((s) => [
      ...s,
      {
        id,
        name,
        square: true,
        art: { kind: 'initials', initials, color },
        categories: starterCategories(),
      },
    ])
    setActiveServer(id)
    setActiveChannel('general')
    setCreating(false)
  }

  const send = (text: string) => {
    const msg: Message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      author: 'wumpus',
      time: `Today at ${new Date().toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      })}`,
      text,
    }
    setMessages((m) => ({ ...m, [key]: [...(m[key] ?? []), msg] }))
  }

  return (
    <div className="app">
      <TitleBar title={server.name} mark={<ServerArt server={server} />} />
      <div className="app-body">
        <div className="left-col">
          <ServerRail
            head={railServers}
            tail={[crew]}
            folder={folderServers}
            custom={[...tailServers, ...custom]}
            activeId={activeServer}
            onSelect={(id) => {
              setActiveServer(id)
              const s = servers.find((x) => x.id === id)
              const first = s?.categories.flatMap((c) => c.channels).find((c) => c.kind !== 'voice')
              setActiveChannel(first?.id ?? '')
            }}
            onHome={() => setActiveServer('crew')}
            onCreate={() => setCreating(true)}
          />
          <ChannelSidebar
            server={server}
            activeChannel={channel?.id ?? ''}
            collapsed={collapsed}
            onToggle={(id) =>
              setCollapsed((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))
            }
            onSelect={setActiveChannel}
          />
          <UserCard
            muted={muted}
            deafened={deafened}
            onMute={() => setMuted((m) => !m)}
            onDeafen={() => setDeafened((d) => !d)}
            onSettings={() => setThemePanel((v) => !v)}
          />
        </div>

        <main className="chat">
          {channel ? (
            <>
              <ChatHeader channel={channel} />
              <ChatFeed channel={channel} messages={thread} />
              <Composer channelName={channel.name} onSend={send} />
              <TypingIndicator
                who={server.id === 'crew' && channel.id === 'mess-hall' ? ['Moatmonsturr', 'Phibi'] : []}
              />
            </>
          ) : null}
        </main>

        {themePanel ? (
          <ThemePanel
            current={themeId}
            onPick={(t) => setThemeId(t.id)}
            onClose={() => setThemePanel(false)}
          />
        ) : null}
      </div>

      {creating ? (
        <CreateServerModal onClose={() => setCreating(false)} onCreate={createServer} />
      ) : null}
    </div>
  )
}
