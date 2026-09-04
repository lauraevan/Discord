import { useEffect, useMemo, useState } from 'react'
import { ChannelHeader } from './components/ChannelHeader'
import { ChannelSidebar } from './components/ChannelSidebar'
import { ChatFeed } from './components/Chat'
import { CreateServerModal } from './components/CreateServerModal'
import { Dock } from './components/Dock'
import { MessageComposer } from './components/MessageComposer'
import { ServerRail } from './components/ServerRail'
import { TopBar } from './components/TopBar'
import {
  starterCategories,
  type Category,
  type Message,
  type Server,
} from './data'
import { ClydeIcon } from './ui/Icons'

const STORE_SERVERS = 'discord-ui:servers'
const STORE_MESSAGES = 'discord-ui:messages'

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export default function App() {
  const [servers, setServers] = useState<Server[]>(() =>
    load<Server[]>(STORE_SERVERS, []),
  )
  const [messages, setMessages] = useState<Record<string, Message[]>>(() =>
    load<Record<string, Message[]>>(STORE_MESSAGES, {}),
  )
  const [activeServer, setActiveServer] = useState<string | null>(null)
  const [activeChannel, setActiveChannel] = useState('general')
  const [collapsed, setCollapsed] = useState<string[]>([])
  const [muted, setMuted] = useState(true)
  const [deafened, setDeafened] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORE_SERVERS, JSON.stringify(servers))
  }, [servers])
  useEffect(() => {
    localStorage.setItem(STORE_MESSAGES, JSON.stringify(messages))
  }, [messages])

  const server = servers.find((s) => s.id === activeServer) ?? null
  const categories: Category[] = useMemo(
    () => (server ? starterCategories() : []),
    [server],
  )
  const channel =
    categories.flatMap((c) => c.channels).find((c) => c.id === activeChannel) ??
    categories.flatMap((c) => c.channels)[0] ??
    null

  const key = server && channel ? `${server.id}/${channel.id}` : ''
  const thread = messages[key] ?? []

  const createServer = (name: string, color: string) => {
    const id = `srv-${Date.now().toString(36)}`
    const initials = name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => [...w][0])
      .join('')
      .toUpperCase()
    setServers((s) => [...s, { id, name, initials, color }])
    setActiveServer(id)
    setActiveChannel('general')
    setCreating(false)
  }

  const send = (text: string) => {
    if (!key) return
    const msg: Message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      author: 'vice',
      time: Date.now(),
      text,
    }
    setMessages((m) => ({ ...m, [key]: [...(m[key] ?? []), msg] }))
  }

  return (
    <div className="app">
      <TopBar
          title={server ? server.name : 'Discord'}
          initials={server?.initials}
          color={server?.color}
        />
      <div className="app-body">
        <div className="left-col">
          <ServerRail
            servers={servers}
            activeId={activeServer}
            onSelect={(id) => {
              setActiveServer(id)
              setActiveChannel('general')
            }}
            onHome={() => setActiveServer(null)}
            onCreate={() => setCreating(true)}
          />
          <ChannelSidebar
            server={server}
            categories={categories}
            activeChannel={channel?.id ?? ''}
            collapsed={collapsed}
            onToggle={(id) =>
              setCollapsed((c) =>
                c.includes(id) ? c.filter((x) => x !== id) : [...c, id],
              )
            }
            onSelect={setActiveChannel}
            onCreate={() => setCreating(true)}
          />
          <Dock
            muted={muted}
            deafened={deafened}
            onMute={() => setMuted((m) => !m)}
            onDeafen={() => setDeafened((d) => !d)}
          />
        </div>

        <main className="chat">
          {server && channel ? (
            <>
              <ChannelHeader channel={channel} serverName={server.name} />
              <ChatFeed channel={channel} messages={thread} />
              <MessageComposer
                channelName={channel.name}
                readOnly={!!channel.readOnly}
                onSend={send}
              />
            </>
          ) : (
            <div className="home-empty">
              <ClydeIcon size={86} />
              <h3>No servers yet</h3>
              <p>
                Hit the <b>+</b> button on the left to create your first server.
                Channels, messages and everything else land here.
              </p>
              <button className="btn-primary" onClick={() => setCreating(true)}>
                Create a server
              </button>
            </div>
          )}
        </main>
      </div>

      {creating ? (
        <CreateServerModal onClose={() => setCreating(false)} onCreate={createServer} />
      ) : null}
    </div>
  )
}
