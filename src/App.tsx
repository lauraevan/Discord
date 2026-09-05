import { useEffect, useMemo, useState } from 'react'
import { ChannelSidebar } from './components/ChannelSidebar'
import { ChatFeed, ChatHeader, Composer } from './components/Chat'
import {
  ChannelModal,
  CreateServerModal,
  EditProfileModal,
  StatusMenu,
} from './components/Modals'
import { ServerRail } from './components/ServerRail'
import { ThemePanel } from './components/ThemePanel'
import { TitleBar } from './components/TitleBar'
import { ProfilePopout, UserArea } from './components/UserArea'
import {
  defaultAccount,
  initialsOf,
  makeServer,
  uid,
  type Account,
  type Channel,
  type Message,
  type Server,
  type Status,
} from './data'
import { allThemes, applyTheme, defaultThemes } from './themes'

const K = {
  servers: 'discord-ui:servers',
  messages: 'discord-ui:messages',
  theme: 'discord-ui:theme',
  account: 'discord-ui:account',
}

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
    load<Server[]>(K.servers, [makeServer("Nebula's Server")]),
  )
  const [account, setAccount] = useState<Account>(() => load<Account>(K.account, defaultAccount))
  const [messages, setMessages] = useState<Record<string, Message[]>>(() => load(K.messages, {}))
  const [themeId, setThemeId] = useState<string>(() => load<string>(K.theme, 'dark'))

  const [activeServer, setActiveServer] = useState<string | null>(servers[0]?.id ?? null)
  const [activeChannel, setActiveChannel] = useState<string>(servers[0]?.channels[0]?.id ?? '')
  const [collapsed, setCollapsed] = useState<string[]>([])
  const [muted, setMuted] = useState(true)
  const [deafened, setDeafened] = useState(false)

  const [creatingServer, setCreatingServer] = useState(false)
  const [channelModal, setChannelModal] = useState<
    { mode: 'create'; categoryId: string | null } | { mode: 'edit'; id: string } | null
  >(null)
  const [editingProfile, setEditingProfile] = useState(false)
  const [statusMenu, setStatusMenu] = useState(false)
  const [popout, setPopout] = useState(false)
  const [themePanel, setThemePanel] = useState(false)

  const theme = allThemes.find((t) => t.id === themeId) ?? defaultThemes[2]
  useEffect(() => applyTheme(theme), [theme])
  useEffect(() => localStorage.setItem(K.theme, JSON.stringify(themeId)), [themeId])
  useEffect(() => localStorage.setItem(K.servers, JSON.stringify(servers)), [servers])
  useEffect(() => localStorage.setItem(K.account, JSON.stringify(account)), [account])
  useEffect(() => localStorage.setItem(K.messages, JSON.stringify(messages)), [messages])

  const server = servers.find((s) => s.id === activeServer) ?? servers[0]
  const channel: Channel | undefined =
    server?.channels.find((c) => c.id === activeChannel) ??
    server?.channels.find((c) => c.kind !== 'voice')

  const key = server && channel ? `${server.id}/${channel.id}` : ''
  const thread = useMemo(() => messages[key] ?? [], [messages, key])

  const patchServer = (id: string, fn: (s: Server) => Server) =>
    setServers((all) => all.map((s) => (s.id === id ? fn(s) : s)))

  const createServer = (name: string, color: string) => {
    const s = { ...makeServer(name, color), color, initials: initialsOf(name) }
    setServers((all) => [...all, s])
    setActiveServer(s.id)
    setActiveChannel(s.channels[0].id)
    setCreatingServer(false)
  }

  const saveChannel = (name: string, kind: Channel['kind']) => {
    if (!server || !channelModal) return
    if (channelModal.mode === 'create') {
      const c: Channel = { id: uid('ch'), name, kind, categoryId: channelModal.categoryId }
      patchServer(server.id, (s) => ({ ...s, channels: [...s.channels, c] }))
      if (kind !== 'voice') setActiveChannel(c.id)
    } else {
      patchServer(server.id, (s) => ({
        ...s,
        channels: s.channels.map((c) => (c.id === channelModal.id ? { ...c, name, kind } : c)),
      }))
    }
    setChannelModal(null)
  }

  const deleteChannel = () => {
    if (!server || channelModal?.mode !== 'edit') return
    patchServer(server.id, (s) => ({
      ...s,
      channels: s.channels.filter((c) => c.id !== channelModal.id),
    }))
    setChannelModal(null)
  }

  const send = (text: string) => {
    if (!key) return
    const m: Message = { id: uid('m'), author: account.handle, time: Date.now(), text }
    setMessages((all) => ({ ...all, [key]: [...(all[key] ?? []), m] }))
  }

  const editing =
    channelModal?.mode === 'edit'
      ? (server?.channels.find((c) => c.id === channelModal.id) ?? null)
      : null
  const catName =
    channelModal?.mode === 'create'
      ? (server?.categories.find((c) => c.id === channelModal.categoryId)?.name ?? 'this server')
      : ''

  return (
    <div className="app">
      <TitleBar
        title={server?.name ?? 'Discord'}
        initials={server?.initials ?? 'D'}
        color={server?.color ?? '#5865f2'}
      />
      <div className="app-body">
        <div className="left-col">
          <ServerRail
            servers={servers}
            activeId={activeServer}
            onSelect={(id) => {
              setActiveServer(id)
              const s = servers.find((x) => x.id === id)
              setActiveChannel(s?.channels.find((c) => c.kind !== 'voice')?.id ?? '')
            }}
            onHome={() => setActiveServer(servers[0]?.id ?? null)}
            onCreate={() => setCreatingServer(true)}
          />
          {server ? (
            <ChannelSidebar
              server={server}
              activeChannel={channel?.id ?? ''}
              collapsed={collapsed}
              onToggle={(id) =>
                setCollapsed((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))
              }
              onSelect={setActiveChannel}
              onAddChannel={(categoryId) => setChannelModal({ mode: 'create', categoryId })}
              onEditChannel={(id) => setChannelModal({ mode: 'edit', id })}
            />
          ) : null}
          <UserArea
            account={account}
            muted={muted}
            deafened={deafened}
            onMute={() => setMuted((m) => !m)}
            onDeafen={() => setDeafened((d) => !d)}
            onSettings={() => setThemePanel((v) => !v)}
            onOpenProfile={() => setPopout((v) => !v)}
          />
          {popout ? (
            <ProfilePopout
              account={account}
              onEdit={() => {
                setPopout(false)
                setEditingProfile(true)
              }}
              onStatus={() => setStatusMenu(true)}
              onClose={() => setPopout(false)}
            />
          ) : null}
        </div>

        <main className="chat">
          {server && channel ? (
            <>
              <ChatHeader channel={channel} serverName={server.name} />
              <ChatFeed
                channel={channel}
                messages={thread}
                account={account}
                onEditChannel={() => setChannelModal({ mode: 'edit', id: channel.id })}
              />
              <Composer channelName={channel.name} onSend={send} />
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

      {creatingServer ? (
        <CreateServerModal onClose={() => setCreatingServer(false)} onCreate={createServer} />
      ) : null}
      {channelModal ? (
        <ChannelModal
          channel={editing}
          categoryName={catName}
          onClose={() => setChannelModal(null)}
          onSave={saveChannel}
          onDelete={channelModal.mode === 'edit' ? deleteChannel : undefined}
        />
      ) : null}
      {editingProfile ? (
        <EditProfileModal
          account={account}
          onClose={() => setEditingProfile(false)}
          onSave={(a) => {
            setAccount(a)
            setEditingProfile(false)
          }}
        />
      ) : null}
      {statusMenu ? (
        <StatusMenu
          account={account}
          onClose={() => setStatusMenu(false)}
          onPick={(s: Status) => {
            setAccount((a) => ({ ...a, status: s }))
            setStatusMenu(false)
          }}
        />
      ) : null}
    </div>
  )
}
