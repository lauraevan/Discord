import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChannelSidebar } from './components/ChannelSidebar'
import { ChatFeed, ChatHeader } from './components/Chat'
import { Composer } from './components/Composer'
import { ContextMenu, type MenuItem } from './components/ContextMenu'
import { EmojiPicker } from './components/EmojiPicker'
import { MemberList } from './components/MemberList'
import {
  ChannelModal,
  CreateServerModal,
  EditProfileModal,
  StatusMenu,
} from './components/Modals'
import { Pins } from './components/Pins'
import { QuickSwitcher } from './components/QuickSwitcher'
import { SearchResults } from './components/SearchResults'
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
import { SPRITE } from './emoji'
import type { MdContext } from './markdown'
import {
  isAccount,
  isMessages,
  isServers,
  isThemeId,
  K,
  load,
  purgeOldSchemas,
  save,
} from './storage'
import { allThemes, applyTheme, defaultThemes } from './themes'

purgeOldSchemas()
const themeIds = allThemes.map((t) => t.id)

type Picker = { target: 'composer' | string; at: { x: number; y: number } }
type Ctx = { items: MenuItem[]; at: { x: number; y: number } }

export default function App() {
  const [servers, setServers] = useState<Server[]>(() =>
    load(K.servers, [makeServer("Nebula's Server")], isServers),
  )
  const [account, setAccount] = useState<Account>(() => load(K.account, defaultAccount, isAccount))
  const [messages, setMessages] = useState<Record<string, Message[]>>(() =>
    load<Record<string, Message[]>>(K.messages, {}, isMessages),
  )
  const [themeId, setThemeId] = useState<string>(() => load(K.theme, 'dark', isThemeId(themeIds)))
  const [lastRead, setLastRead] = useState<Record<string, number>>(() =>
    load<Record<string, number>>(K.reads, {}, (v): v is Record<string, number> => !!v && typeof v === 'object'),
  )

  const [activeServer, setActiveServer] = useState<string | null>(servers[0]?.id ?? null)
  const [activeChannel, setActiveChannel] = useState<string>(servers[0]?.channels?.[0]?.id ?? '')
  const [collapsed, setCollapsed] = useState<string[]>([])
  const [muted, setMuted] = useState(true)
  const [deafened, setDeafened] = useState(false)
  const [voice, setVoice] = useState<string | null>(null)

  const [creatingServer, setCreatingServer] = useState(false)
  const [channelModal, setChannelModal] = useState<
    { mode: 'create'; categoryId: string | null } | { mode: 'edit'; id: string } | null
  >(null)
  const [editingProfile, setEditingProfile] = useState(false)
  const [statusMenu, setStatusMenu] = useState(false)
  const [popout, setPopout] = useState(false)
  const [themePanel, setThemePanel] = useState(false)

  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [picker, setPicker] = useState<Picker | null>(null)
  const [ctx, setCtx] = useState<Ctx | null>(null)
  const [switcher, setSwitcher] = useState(false)
  // the reference frame has the member list hidden, and Discord remembers the
  // last state per user, so start where the reference does
  const [membersOpen, setMembersOpen] = useState(false)
  const [pinsOpen, setPinsOpen] = useState(false)
  const [query, setQuery] = useState('')

  const theme = allThemes.find((t) => t.id === themeId) ?? defaultThemes[2]
  useEffect(() => applyTheme(theme), [theme])
  useEffect(() => save(K.theme, themeId), [themeId])
  useEffect(() => save(K.servers, servers), [servers])
  useEffect(() => save(K.account, account), [account])
  useEffect(() => save(K.messages, messages), [messages])
  useEffect(() => save(K.reads, lastRead), [lastRead])

  const server = servers.find((s) => s.id === activeServer) ?? servers[0]
  const channel: Channel | undefined =
    server?.channels.find((c) => c.id === activeChannel) ??
    server?.channels.find((c) => c.kind !== 'voice')

  const key = server && channel ? `${server.id}/${channel.id}` : ''
  const thread = useMemo(() => messages[key] ?? [], [messages, key])
  const keyOf = useCallback((s: Server, c: Channel) => `${s.id}/${c.id}`, [])

  /* ------------------------------------------------------------- unread */

  const unread = useMemo(() => {
    const out: Record<string, boolean> = {}
    if (!server) return out
    for (const c of server.channels) {
      const k = keyOf(server, c)
      const last = messages[k]?.at(-1)
      out[c.id] = !!last && last.time > (lastRead[k] ?? 0)
    }
    return out
  }, [server, messages, lastRead, keyOf])

  const unreadFrom = useMemo(() => {
    const mark = lastRead[key]
    if (!mark) return null
    const first = thread.find((m) => m.time > mark)
    return first ? first.time : null
  }, [lastRead, key, thread])

  const markRead = useCallback(() => {
    if (key) setLastRead((r) => ({ ...r, [key]: Date.now() }))
  }, [key])

  const markServerRead = useCallback(() => {
    if (!server) return
    const now = Date.now()
    setLastRead((r) => {
      const next = { ...r }
      for (const c of server.channels) next[keyOf(server, c)] = now
      return next
    })
  }, [server, keyOf])

  // opening a channel marks it read a moment later, the way the client does
  useEffect(() => {
    if (!key) return
    const t = setTimeout(markRead, 900)
    return () => clearTimeout(t)
  }, [key, thread.length, markRead])

  /* ------------------------------------------------------------ mutations */

  const patchServer = (id: string, fn: (s: Server) => Server) =>
    setServers((all) => all.map((s) => (s.id === id ? fn(s) : s)))

  const patchThread = (fn: (list: Message[]) => Message[]) =>
    setMessages((all) => ({ ...all, [key]: fn(all[key] ?? []) }))

  const createServer = (name: string, color: string) => {
    const s = { ...makeServer(name, color), color, initials: initialsOf(name) }
    setServers((all) => [...all, s])
    setActiveServer(s.id)
    setActiveChannel(s.channels[0]?.id ?? '')
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

  const deleteChannel = (id: string) => {
    if (!server) return
    patchServer(server.id, (s) => ({ ...s, channels: s.channels.filter((c) => c.id !== id) }))
    setChannelModal(null)
  }

  const send = (text: string) => {
    if (!key) return
    const m: Message = {
      id: uid('m'),
      author: account.handle,
      time: Date.now(),
      text,
      ...(replyTo ? { replyTo: replyTo.id } : {}),
    }
    patchThread((list) => [...list, m])
    setReplyTo(null)
  }

  const editMessage = (id: string, text: string) =>
    patchThread((list) =>
      text
        ? list.map((m) => (m.id === id ? { ...m, text, editedAt: Date.now() } : m))
        : list.filter((m) => m.id !== id),
    )

  const deleteMessage = (id: string) => patchThread((list) => list.filter((m) => m.id !== id))

  const react = (id: string, name: string) =>
    patchThread((list) =>
      list.map((m) => {
        if (m.id !== id) return m
        const rs = m.reactions ?? []
        const hit = rs.find((r) => r.name === name)
        if (!hit) return { ...m, reactions: [...rs, { name, by: [account.handle] }] }
        const mine = hit.by.includes(account.handle)
        const by = mine ? hit.by.filter((h) => h !== account.handle) : [...hit.by, account.handle]
        return {
          ...m,
          reactions: by.length
            ? rs.map((r) => (r.name === name ? { ...r, by } : r))
            : rs.filter((r) => r.name !== name),
        }
      }),
    )

  const togglePin = (id: string) =>
    patchThread((list) => list.map((m) => (m.id === id ? { ...m, pinned: !m.pinned } : m)))

  const jumpTo = (id: string) => {
    setPinsOpen(false)
    setQuery('')
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-msg="${id}"]`)
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      el?.classList.add('flash')
      setTimeout(() => el?.classList.remove('flash'), 1400)
    })
  }

  /* --------------------------------------------------------- keyboard */

  const anyOverlay =
    creatingServer || channelModal || editingProfile || statusMenu || switcher || !!picker || !!ctx

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSwitcher(true)
        return
      }
      if (mod && e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault()
        setMuted((m) => !m)
        return
      }
      if (e.key === 'Escape' && !anyOverlay) {
        if (e.shiftKey) markServerRead()
        else if (replyTo) setReplyTo(null)
        else if (query) setQuery('')
        else markRead()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [anyOverlay, markRead, markServerRead, replyTo, query])

  /* ------------------------------------------------------------- render */

  const editing =
    channelModal?.mode === 'edit'
      ? (server?.channels.find((c) => c.id === channelModal.id) ?? null)
      : null
  const catName =
    channelModal?.mode === 'create'
      ? (server?.categories.find((c) => c.id === channelModal.categoryId)?.name ?? 'this server')
      : ''

  const md: MdContext = {
    channels: server?.channels ?? [],
    members: [{ id: 'self', name: account.name, color: account.color }],
    self: account.name,
    onChannel: (id) => setActiveChannel(id),
  }

  const messageMenu = (m: Message): MenuItem[] => [
    { label: 'Add Reaction', onPick: () => setPicker({ target: m.id, at: { x: 400, y: 300 } }) },
    { label: 'Edit Message', onPick: () => setEditingId(m.id) },
    { label: 'Reply', onPick: () => setReplyTo(m) },
    { label: m.pinned ? 'Unpin Message' : 'Pin Message', onPick: () => togglePin(m.id) },
    { sep: true },
    { label: 'Copy Text', onPick: () => navigator.clipboard?.writeText(m.text) },
    { label: 'Mark Unread', onPick: () => setLastRead((r) => ({ ...r, [key]: m.time - 1 })) },
    { sep: true },
    { label: 'Delete Message', danger: true, onPick: () => deleteMessage(m.id) },
  ]

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q || !server) return []
    return server.channels.flatMap((c) =>
      (messages[keyOf(server, c)] ?? [])
        .filter((m) => m.text.toLowerCase().includes(q))
        .map((m) => ({ channel: c, message: m })),
    )
  }, [query, server, messages, keyOf])

  return (
    <div className="app">
      <span style={{ display: 'none' }} dangerouslySetInnerHTML={{ __html: SPRITE }} />
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
              unread={unread}
              voice={voice}
              collapsed={collapsed}
              onToggle={(id) =>
                setCollapsed((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))
              }
              onSelect={(id) => {
                const c = server.channels.find((x) => x.id === id)
                if (c?.kind === 'voice') setVoice((v) => (v === id ? null : id))
                else setActiveChannel(id)
              }}
              onAddChannel={(categoryId) => setChannelModal({ mode: 'create', categoryId })}
              onEditChannel={(id) => setChannelModal({ mode: 'edit', id })}
              onContext={(id, at) =>
                setCtx({
                  at,
                  items: [
                    { label: 'Mark As Read', onPick: markRead },
                    { label: 'Edit Channel', onPick: () => setChannelModal({ mode: 'edit', id }) },
                    { sep: true },
                    { label: 'Delete Channel', danger: true, onPick: () => deleteChannel(id) },
                  ],
                })
              }
            />
          ) : null}
          <UserArea
            account={account}
            muted={muted}
            deafened={deafened}
            voice={voice ? (server?.channels.find((c) => c.id === voice)?.name ?? null) : null}
            onLeaveVoice={() => setVoice(null)}
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
              <ChatHeader
                channel={channel}
                serverName={server.name}
                query={query}
                onQuery={setQuery}
                membersOpen={membersOpen}
                onToggleMembers={() => setMembersOpen((v) => !v)}
                onPins={() => setPinsOpen((v) => !v)}
              />
              {pinsOpen ? (
                <Pins
                  pinned={thread.filter((m) => m.pinned)}
                  account={account}
                  md={md}
                  onJump={jumpTo}
                  onUnpin={togglePin}
                  onClose={() => setPinsOpen(false)}
                />
              ) : null}
              <div className="chat-body">
                <div className="chat-main">
                  <ChatFeed
                    channel={channel}
                    messages={thread}
                    all={thread}
                    account={account}
                    md={md}
                    unreadFrom={unreadFrom}
                    editingId={editingId}
                    onStartEdit={setEditingId}
                    onEditChannel={() => setChannelModal({ mode: 'edit', id: channel.id })}
                    onEdit={editMessage}
                    onReply={setReplyTo}
                    onReact={react}
                    onPin={togglePin}
                    onOpenPicker={(id, at) => setPicker({ target: id, at })}
                    onContext={(m, at) => setCtx({ at, items: messageMenu(m) })}
                  />
                  <Composer
                    channel={channel}
                    channels={server.channels}
                    account={account}
                    replyTo={replyTo}
                    onCancelReply={() => setReplyTo(null)}
                    onSend={send}
                    onEditLast={() => {
                      const mine = [...thread].reverse().find((m) => m.author === account.handle)
                      if (mine) setEditingId(mine.id)
                    }}
                    onOpenPicker={(at) => setPicker({ target: 'composer', at })}
                  />
                </div>
                {query.trim() ? (
                  <SearchResults
                    query={query}
                    results={results}
                    account={account}
                    md={md}
                    onJump={(c, id) => {
                      setActiveChannel(c.id)
                      jumpTo(id)
                    }}
                    onClose={() => setQuery('')}
                  />
                ) : membersOpen ? (
                  <MemberList account={account} onOpenProfile={() => setPopout(true)} />
                ) : null}
              </div>
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

      {switcher ? (
        <QuickSwitcher
          servers={servers}
          onPick={(sid, cid) => {
            setActiveServer(sid)
            const s = servers.find((x) => x.id === sid)
            setActiveChannel(cid ?? s?.channels.find((c) => c.kind !== 'voice')?.id ?? '')
          }}
          onClose={() => setSwitcher(false)}
        />
      ) : null}

      {picker ? (
        <EmojiPicker
          at={picker.at}
          onPick={(name) => {
            if (picker.target === 'composer') send(`:${name}:`)
            else react(picker.target, name)
          }}
          onClose={() => setPicker(null)}
        />
      ) : null}

      {ctx ? <ContextMenu at={ctx.at} items={ctx.items} onClose={() => setCtx(null)} /> : null}

      {creatingServer ? (
        <CreateServerModal onClose={() => setCreatingServer(false)} onCreate={createServer} />
      ) : null}
      {channelModal ? (
        <ChannelModal
          channel={editing}
          categoryName={catName}
          onClose={() => setChannelModal(null)}
          onSave={saveChannel}
          onDelete={
            channelModal.mode === 'edit' ? () => deleteChannel(channelModal.id) : undefined
          }
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
