import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChannelSidebar } from './components/ChannelSidebar'
import { ChannelSettings } from './components/ChannelSettings'
import { ChatFeed, ChatHeader } from './components/Chat'
import { Composer } from './components/Composer'
import { ContextMenu, type MenuItem } from './components/ContextMenu'
import { ForumView, makePost } from './components/Forum'
import { EmojiPicker, type PickerView } from './components/EmojiPicker'
import { FriendsPage, HomeSidebar, ProfileModal, type HomeView } from './components/Home'
import { LoginScreen, RegisterScreen } from './components/Auth'
import { CreateServerFlow, applyTemplate, type NewServer } from './components/CreateServer'
import { NitroPage } from './components/Nitro'
import { QuestsPage } from './components/Quests'
import { ShopPage } from './components/Shop'
import { Inbox } from './components/Inbox'
import { MemberList } from './components/MemberList'
import {
  ChannelModal,
  EditProfileModal,
  StatusMenu,
  SwitchAccounts,
  AppsPanel,
} from './components/Modals'
import { Pins } from './components/Pins'
import { CustomStatus } from './components/CustomStatus'
import { CreatePoll } from './components/Poll'
import { QuickSwitcher } from './components/QuickSwitcher'
import { SearchResults } from './components/SearchResults'
import { ServerSettings } from './components/ServerSettings'
import { ServerRail } from './components/ServerRail'
import { ThemePanel } from './components/ThemePanel'
import { EmptyArt } from './ui/Art'
import { AgeGate } from './components/AgeGate'
import { VoiceView } from './components/Voice'
import { TitleBar } from './components/TitleBar'
import { UserSettings } from './components/UserSettings'
import { ProfilePopout, UserArea } from './components/UserArea'
import {
  MUTE_DURATIONS,
  accountFor,
  initialsOf,
  makeServer,
  uid,
  type Account,
  type Attachment,
  type Channel,
  type Message,
  type Server,
  type Status,
} from './data'
import { SPRITE } from './emoji'
import { defaultPrefs, type Prefs } from './prefs'
import type { MdContext } from './markdown'
import { matches, parseQuery } from './search'
import {
  isAccount,
  isCredentials,
  isGifts,
  isMessages,
  isNumber,
  isQuestStatus,
  isScheduled,
  isRecord,
  isServers,
  isSession,
  isSubscription,
  isThemeId,
  K,
  load,
  purgeOldSchemas,
  save,
  type Credential,
} from './storage'
import {
  PremiumType,
  currentType,
  giftLength,
  isActive,
  type Gift,
  type Subscription,
} from './nitro'
import {
  QUESTS,
  beat,
  enroll,
  type Quest,
  type QuestUserStatus,
} from './quests'
import { allThemes, applyTheme, defaultThemes } from './themes'

purgeOldSchemas()
const themeIds = allThemes.map((t) => t.id)

/** What the window title says for each of the home views. */
const HOME_TITLES: Record<HomeView, string> = {
  friends: 'Friends',
  nitro: 'Nitro',
  shop: 'Shop',
  quests: 'Quests',
}

type Picker = {
  target: 'composer' | string
  at: { x: number; y: number }
  /** which of the picker's four views to open on */
  view?: PickerView
}
type Ctx = { items: MenuItem[]; at: { x: number; y: number } }

/**
 * The account gate.
 *
 * There is no account server behind this page, so registration and login are
 * local (see src/auth.ts) — but they are a real gate: nothing below renders
 * until somebody is signed in, and the client is keyed on the username so
 * switching accounts remounts it.
 */
export default function App() {
  const [credentials, setCredentials] = useState<Credential[]>(() =>
    load(K.credentials, [], isCredentials),
  )
  const [session, setSession] = useState<string | null>(() => load(K.session, null, isSession))
  const [screen, setScreen] = useState<'login' | 'register'>(
    credentials.length ? 'login' : 'register',
  )

  useEffect(() => save(K.credentials, credentials), [credentials])
  useEffect(() => save(K.session, session), [session])

  const me = session ? (credentials.find((c) => c.username === session) ?? null) : null

  if (!me) {
    return screen === 'login' ? (
      <LoginScreen
        credentials={credentials}
        onLogin={(c) => setSession(c.username)}
        onRegister={() => setScreen('register')}
      />
    ) : (
      <RegisterScreen
        credentials={credentials}
        onLogin={() => setScreen('login')}
        onCreated={(c) => {
          setCredentials((all) => [...all, c])
          setSession(c.username)
        }}
      />
    )
  }
  // logging out lands on the login screen, not back on registration
  return (
    <Client
      key={me.username}
      me={me}
      onSignOut={() => {
        setSession(null)
        setScreen('login')
      }}
    />
  )
}

function Client({ me, onSignOut }: { me: Credential; onSignOut: () => void }) {
  const [servers, setServers] = useState<Server[]>(() =>
    load(K.servers, [makeServer(`${me.displayName}'s server`)], isServers),
  )
  const [account, setAccount] = useState<Account>(() => {
    const saved = load<Account | null>(K.account, null, (v): v is Account | null =>
      v === null || isAccount(v),
    )
    // the stored account belongs to whoever was signed in last; a different
    // account starts from its own registration details
    return saved && saved.handle === me.username ? saved : accountFor(me.displayName, me.username)
  })
  const [subscription, setSubscription] = useState<Subscription | null>(() =>
    load<Subscription | null>(K.subscription, null, isSubscription),
  )
  const [gifts, setGifts] = useState<Gift[]>(() => load(K.gifts, [], isGifts))
  const [orbs, setOrbs] = useState<number>(() => load(K.orbs, 0, isNumber))
  const [questStatus, setQuestStatus] = useState<Record<string, QuestUserStatus>>(() =>
    load<Record<string, QuestUserStatus>>(K.quests, {}, isQuestStatus),
  )
  const [messages, setMessages] = useState<Record<string, Message[]>>(() =>
    load<Record<string, Message[]>>(K.messages, {}, isMessages),
  )
  const [themeId, setThemeId] = useState<string>(() => load(K.theme, 'dark', isThemeId(themeIds)))
  const [prefs, setPrefs] = useState<Prefs>(() => ({
    ...defaultPrefs,
    ...load<Record<string, unknown>>(K.prefs, {}, isRecord),
  }))
  const [lastRead, setLastRead] = useState<Record<string, number>>(() =>
    load<Record<string, number>>(K.reads, {}, (v): v is Record<string, number> => !!v && typeof v === 'object'),
  )

  const [activeServer, setActiveServer] = useState<string | null>(servers[0]?.id ?? null)
  const [activeChannel, setActiveChannel] = useState<string>(servers[0]?.channels?.[0]?.id ?? '')
  // Discord asks once per session before opening an age-restricted channel
  const [nsfwOk, setNsfwOk] = useState<string[]>([])
  const [collapsed, setCollapsed] = useState<string[]>([])
  const [muted, setMuted] = useState(true)
  const [deafened, setDeafened] = useState(false)
  const [voice, setVoice] = useState<string | null>(null)

  const [creatingServer, setCreatingServer] = useState(false)
  const [channelModal, setChannelModal] = useState<
    { mode: 'create'; categoryId: string | null } | { mode: 'edit'; id: string } | null
  >(null)
  const [editingProfile, setEditingProfile] = useState(false)
  const [scheduled, setScheduled] = useState<
    { id: string; key: string; text: string; at: number }[]
  >(() => load(K.scheduled, [], isScheduled))
  const [appsPanel, setAppsPanel] = useState(false)
  const [statusMenu, setStatusMenu] = useState(false)
  const [switchAccounts, setSwitchAccounts] = useState(false)
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
  const [userSettings, setUserSettings] = useState(false)
  const [friendsTab, setFriendsTab] = useState<'online' | 'all' | 'pending' | 'blocked' | 'add'>('online')
  const [homeView, setHomeView] = useState<HomeView>('friends')
  const [profileModal, setProfileModal] = useState(false)
  // Discord's user popout, anchored to whatever opened it
  const [userPopout, setUserPopout] = useState<{ x: number; y: number } | null>(null)

  /**
   * Places the popout beside an anchor and clamps it into the window, which is
   * what the client does rather than letting it run off an edge.
   */
  const openProfileAt = (anchor: HTMLElement, side: 'right' | 'left' = 'right') => {
    const r = anchor.getBoundingClientRect()
    const W = 247
    const H = 380
    const x = side === 'right' ? r.right + 8 : r.left - W - 8
    setUserPopout({
      x: Math.max(8, Math.min(x, window.innerWidth - W - 8)),
      y: Math.max(8, Math.min(r.top - 8, window.innerHeight - H - 8)),
    })
  }
  const [pollModal, setPollModal] = useState(false)
  const [channelSettings, setChannelSettings] = useState<string | null>(null)
  const [customStatus, setCustomStatus] = useState(false)
  const [inboxOpen, setInboxOpen] = useState(false)
  /** channelId -> mute expiry (null = until turned back on) */
  const [mutes, setMutes] = useState<Record<string, number | null>>({})
  const [serverSettings, setServerSettings] = useState(false)
  const [query, setQuery] = useState('')

  const theme = allThemes.find((t) => t.id === themeId) ?? defaultThemes[2]
  useEffect(() => applyTheme(theme), [theme])
  useEffect(() => save(K.theme, themeId), [themeId])
  useEffect(() => save(K.servers, servers), [servers])
  useEffect(() => save(K.account, account), [account])
  useEffect(() => save(K.messages, messages), [messages])
  useEffect(() => save(K.reads, lastRead), [lastRead])
  useEffect(() => save(K.prefs, prefs), [prefs])
  useEffect(() => save(K.scheduled, scheduled), [scheduled])
  useEffect(() => save(K.subscription, subscription), [subscription])
  useEffect(() => save(K.gifts, gifts), [gifts])
  useEffect(() => save(K.orbs, orbs), [orbs])
  useEffect(() => save(K.quests, questStatus), [questStatus])

  // the appearance pane drives real CSS variables, not a mock preview
  useEffect(() => {
    const r = document.documentElement.style
    r.setProperty('--msg-font', `${prefs.fontScale}px`)
    r.setProperty('--msg-gap', `${prefs.spaceBetween}px`)
    r.setProperty('--app-zoom', String(prefs.zoom / 100))
    r.setProperty('--app-saturate', String(prefs.saturation / 100))
    r.setProperty('--link-underline', prefs.underlineLinks ? 'underline' : 'none')
    document.body.classList.toggle('compact', prefs.messageDisplay === 'compact')
    document.body.classList.toggle('reduced-motion', prefs.reducedMotion)
    document.body.classList.toggle('streamer', prefs.streamerMode)
  }, [prefs])

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

  /** Server edits go through here so the audit log records them, as Discord's does. */
  const patchActiveServer = (
    fn: (s: Server) => Server,
    audit?: { action: string; target: string },
  ) => {
    if (!server) return
    patchServer(server.id, (s) => {
      const next = fn(s)
      return audit
        ? {
            ...next,
            audit: [
              { id: uid('a'), time: Date.now(), action: audit.action, target: audit.target },
              ...next.audit,
            ].slice(0, 60),
          }
        : next
    })
  }

  const patchThread = (fn: (list: Message[]) => Message[]) =>
    setMessages((all) => ({ ...all, [key]: fn(all[key] ?? []) }))

  const createServer = ({ name, color, icon, template }: NewServer) => {
    const { categories, channels } = applyTemplate(template)
    const s: Server = {
      ...makeServer(name, color),
      color,
      icon,
      initials: initialsOf(name),
      categories,
      channels,
    }
    setServers((all) => [...all, s])
    setActiveServer(s.id)
    setActiveChannel(channels.find((c) => c.kind !== 'voice')?.id ?? '')
    setCreatingServer(false)
  }

  /* ------------------------------------------------------- nitro + quests */

  const premiumType = currentType(subscription)

  /** Quests finished but not yet collected — the number the tab badges. */
  const questsReady = QUESTS.filter(
    (q) => questStatus[q.id]?.completedAt != null && questStatus[q.id]?.claimedAt == null,
  ).length

  /** Subscribing grants the Nitro badge, the way the account's does. */
  const subscribe = (s: Subscription) => {
    setSubscription(s)
    setAccount((a) => ({ ...a, badges: [...new Set([...(a.badges ?? []), 'nitro'])] }))
  }

  const cancelSubscription = () => {
    setSubscription(null)
    setAccount((a) => ({ ...a, badges: (a.badges ?? []).filter((b) => b !== 'nitro') }))
  }

  const buyGift = (g: Gift) => setGifts((all) => [g, ...all])

  /** Redeem a code, or a discord.gift link with a code on the end of it. */
  const redeemGift = (raw: string) => {
    const code = raw.trim().split('/').pop() ?? ''
    const gift = gifts.find((g) => g.code === code && !g.redeemedAt)
    if (!gift) return
    setGifts((all) => all.map((g) => (g.code === code ? { ...g, redeemedAt: Date.now() } : g)))
    subscribe({
      premiumType: gift.tier === 'nitro' ? PremiumType.TIER_2 : PremiumType.TIER_0,
      interval: gift.interval,
      source: 'gift',
      until:
        Math.max(Date.now(), isActive(subscription) ? subscription.until : 0) +
        giftLength(gift.interval),
    })
  }

  /**
   * One heartbeat of quest progress, applied to the status the app already
   * holds. The sheet only says which quest is running: several beats can land
   * before React re-renders, so a tick that carried its own copy of the quest
   * would overwrite the progress the previous tick just wrote.
   */
  const beatQuest = useCallback((questId: string, seconds: number, terminal = false) => {
    setQuestStatus((all) => {
      const q = QUESTS.find((x) => x.id === questId)
      if (!q) return all
      return {
        ...all,
        [questId]: beat({ ...q, userStatus: all[questId] ?? null }, seconds, terminal),
      }
    })
  }, [])

  const enrollQuest = useCallback(
    (q: Quest) => setQuestStatus((all) => ({ ...all, [q.id]: enroll(q) })),
    [],
  )

  const claimQuest = (questId: string, payout: number) => {
    setOrbs((n) => n + payout)
    setQuestStatus((all) => ({
      ...all,
      [questId]: { ...all[questId], claimedAt: Date.now() },
    }))
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

  /** A sticker is its own message: Discord sends it with no text at all. */
  const sendSticker = (id: string) => {
    if (!key) return
    patchThread((list) => [
      ...list,
      {
        id: uid('m'),
        author: account.handle,
        time: Date.now(),
        text: '',
        stickers: [id],
        ...(replyTo ? { replyTo: replyTo.id } : {}),
      },
    ])
    setReplyTo(null)
  }

  const send = (text: string, attachments: Attachment[] = []) => {
    if (!key) return
    const m: Message = {
      id: uid('m'),
      author: account.handle,
      time: Date.now(),
      text,
      ...(attachments.length ? { attachments } : {}),
      ...(replyTo ? { replyTo: replyTo.id } : {}),
    }
    patchThread((list) => [...list, m])
    setReplyTo(null)
  }

  /**
   * Schedule Message.
   *
   * Discord queues these on its servers; a page has nowhere to keep them but
   * the browser, so they are stored locally and delivered on the next tick
   * the app is open — including straight after a reload, if the time passed
   * while it was shut.
   */
  const scheduleSend = (text: string, at: number) => {
    if (!key || !text) return
    setScheduled((q) => [...q, { id: uid('sch'), key, text, at }])
  }

  useEffect(() => {
    if (!scheduled.length) return
    const flush = () => {
      const now = Date.now()
      const due = scheduled.filter((s) => s.at <= now)
      if (!due.length) return
      setMessages((all) => {
        const next = { ...all }
        for (const s of due) {
          const m: Message = { id: uid('m'), author: account.handle, time: s.at, text: s.text }
          next[s.key] = [...(next[s.key] ?? []), m]
        }
        return next
      })
      setScheduled((q) => q.filter((s) => s.at > now))
    }
    flush()
    const t = setInterval(flush, 15_000)
    return () => clearInterval(t)
  }, [scheduled, account.handle])

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
    patchThread((list) => {
      const target = list.find((m) => m.id === id)
      const next = list.map((m) => (m.id === id ? { ...m, pinned: !m.pinned } : m))
      // Discord posts a system message when something is pinned
      return target?.pinned
        ? next
        : [
            ...next,
            {
              id: uid('m'),
              author: account.handle,
              time: Date.now(),
              text: '',
              type: 'CHANNEL_PINNED_MESSAGE' as const,
            },
          ]
    })

  const vote = (id: string, answer: number) =>
    patchThread((list) =>
      list.map((m) => {
        if (m.id !== id || !m.poll) return m
        const votes = { ...m.poll.votes }
        const already = (votes[answer] ?? []).includes(account.handle)
        // single-answer polls clear the other picks first, as Discord's do
        if (!m.poll.multi)
          for (const k of Object.keys(votes))
            votes[Number(k)] = votes[Number(k)].filter((h) => h !== account.handle)
        votes[answer] = already
          ? (votes[answer] ?? []).filter((h) => h !== account.handle)
          : [...(votes[answer] ?? []), account.handle]
        return { ...m, poll: { ...m.poll, votes } }
      }),
    )

  const createThread = (m: Message, name: string) => {
    if (!server) return
    const id = uid('ch')
    patchServer(server.id, (s) => ({
      ...s,
      channels: [
        ...s.channels,
        {
          id,
          name,
          kind: 'text' as const,
          categoryId: channel?.categoryId ?? null,
          parentId: channel?.id,
          rootMessageId: m.id,
        },
      ],
    }))
    patchThread((list) => [
      ...list.map((x) => (x.id === m.id ? { ...x, threadId: id } : x)),
      {
        id: uid('m'),
        author: account.handle,
        time: Date.now(),
        text: name,
        type: 'THREAD_CREATED' as const,
      },
    ])
    setActiveChannel(id)
  }

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
    {
      label: 'Create Thread',
      onPick: () =>
        createThread(m, m.text.slice(0, 40).replace(/\s+/g, '-').toLowerCase() || 'thread'),
    },
    { label: m.pinned ? 'Unpin Message' : 'Pin Message', onPick: () => togglePin(m.id) },
    { sep: true },
    { label: 'Copy Text', onPick: () => navigator.clipboard?.writeText(m.text) },
    {
      label: 'Copy Message Link',
      onPick: () =>
        navigator.clipboard?.writeText(`${location.origin}/channels/${server?.id}/${channel?.id}/${m.id}`),
    },
    { label: 'Mark Unread', onPick: () => setLastRead((r) => ({ ...r, [key]: m.time - 1 })) },
    { sep: true },
    { label: 'Delete Message', danger: true, onPick: () => deleteMessage(m.id) },
    ...(prefs.developerMode
      ? [{ sep: true as const }, { label: 'Copy Message ID', onPick: () => navigator.clipboard?.writeText(m.id) }]
      : []),
  ]

  const results = useMemo(() => {
    if (!query.trim() || !server) return []
    const q = parseQuery(query)
    return server.channels.flatMap((c) =>
      (messages[keyOf(server, c)] ?? [])
        .filter((m) => !m.type || m.type === 'DEFAULT')
        .filter((m) => matches(q, m, c, account.name))
        .map((m) => ({ channel: c, message: m })),
    )
  }, [query, server, messages, keyOf, account.name])

  return (
    <div className="app">
      <span style={{ display: 'none' }} dangerouslySetInnerHTML={{ __html: SPRITE }} />
      <TitleBar
        title={activeServer === null ? HOME_TITLES[homeView] : (server?.name ?? 'Discord')}
        initials={activeServer === null ? '' : (server?.initials ?? 'D')}
        onInbox={() => setInboxOpen((v) => !v)}
      />
      {inboxOpen ? (
        <Inbox
          server={server}
          account={account}
          unreadChannels={server?.channels.filter((c) => unread[c.id]) ?? []}
          messagesFor={(c) => (server ? (messages[keyOf(server, c)] ?? []) : [])}
          onJump={(c, id) => {
            setActiveChannel(c.id)
            setInboxOpen(false)
            jumpTo(id)
          }}
          onMarkRead={markServerRead}
          onClose={() => setInboxOpen(false)}
        />
      ) : null}
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
            onHome={() => setActiveServer(null)}
            onCreate={() => setCreatingServer(true)}
          />
          {activeServer === null ? (
            <HomeSidebar
              view={homeView}
              tab={friendsTab}
              questsDone={questsReady}
              onView={setHomeView}
              onTab={(t) => {
                setHomeView('friends')
                setFriendsTab(t)
              }}
            />
          ) : server ? (
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
                if (c?.kind === 'voice') {
                  setVoice(id)
                  setActiveChannel(id)
                } else setActiveChannel(id)
              }}
              onAddChannel={(categoryId) => setChannelModal({ mode: 'create', categoryId })}
              onEditChannel={(id) => setChannelSettings(id)}
              onHeader={(at) =>
                setCtx({
                  at,
                  items: [
                    { label: 'Server Boost', onPick: () => setServerSettings(true) },
                    { label: 'Invite People', onPick: () => setServerSettings(true) },
                    { label: 'Server Settings', onPick: () => setServerSettings(true) },
                    { label: 'Create Channel', onPick: () => setChannelModal({ mode: 'create', categoryId: null }) },
                    { label: 'Create Category', onPick: () => setChannelModal({ mode: 'create', categoryId: null }) },
                    { sep: true },
                    { label: 'Notification Settings', onPick: () => setServerSettings(true) },
                    { label: 'Privacy Settings', onPick: () => setUserSettings(true) },
                    { label: 'Edit Server Profile', onPick: () => setUserSettings(true) },
                    { sep: true },
                    { label: 'Mark As Read', onPick: markServerRead },
                    ...(prefs.developerMode
                      ? [{ label: 'Copy Server ID', onPick: () => navigator.clipboard?.writeText(server.id) }]
                      : []),
                    { sep: true },
                    { label: 'Delete Server', danger: true, onPick: () => setServerSettings(true) },
                  ],
                })
              }
              onContext={(id, at) => {
                const c = server.channels.find((x) => x.id === id)
                const muted = id in mutes
                setCtx({
                  at,
                  items: [
                    { label: 'Mark As Read', onPick: markRead },
                    { sep: true },
                    { label: 'Invite People', onPick: () => setServerSettings(true) },
                    {
                      label: 'Copy Link',
                      onPick: () =>
                        navigator.clipboard?.writeText(
                          `${location.origin}/channels/${server.id}/${id}`,
                        ),
                    },
                    { sep: true },
                    muted
                      ? {
                          label: 'Unmute Channel',
                          onPick: () =>
                            setMutes(({ [id]: _drop, ...rest }) => rest),
                        }
                      : {
                          label: 'Mute Channel',
                          sub: MUTE_DURATIONS.map(([label, ms]) => ({
                            label,
                            onPick: () =>
                              setMutes((m) => ({ ...m, [id]: ms === null ? null : Date.now() + ms })),
                          })),
                        },
                    {
                      label: 'Notification Settings',
                      sub: [
                        { head: 'Notification Settings' },
                        { label: 'Use Server Default', check: true },
                        { label: 'All Messages' },
                        { label: 'Only @mentions' },
                        { label: 'Nothing' },
                      ],
                    },
                    { sep: true },
                    { label: 'Edit Channel', onPick: () => setChannelSettings(id) },
                    {
                      label: 'Duplicate Channel',
                      onPick: () =>
                        c &&
                        patchServer(server.id, (s) => ({
                          ...s,
                          channels: [...s.channels, { ...c, id: uid('ch'), name: `${c.name}-2` }],
                        })),
                    },
                    { sep: true },
                    { label: 'Delete Channel', danger: true, onPick: () => deleteChannel(id) },
                    ...(prefs.developerMode
                      ? [
                          { sep: true as const },
                          { label: 'Copy Channel ID', onPick: () => navigator.clipboard?.writeText(id) },
                        ]
                      : []),
                  ],
                })
              }}
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
            onSettings={() => setUserSettings(true)}
            profileOpen={popout}
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
              onSwitch={() => setSwitchAccounts(true)}
              onCustomStatus={() => {
                setPopout(false)
                setCustomStatus(true)
              }}
              onClose={() => setPopout(false)}
            />
          ) : null}
        </div>

        {activeServer === null ? (
          homeView === 'nitro' ? (
            <NitroPage
              subscription={subscription}
              gifts={gifts}
              orbs={orbs}
              onSubscribe={subscribe}
              onCancel={cancelSubscription}
              onGift={buyGift}
              onRedeem={redeemGift}
            />
          ) : homeView === 'quests' ? (
            <QuestsPage
              status={questStatus}
              orbs={orbs}
              multiplier={premiumType === PremiumType.TIER_2}
              account={account}
              owned={account.collectibles ?? []}
              onBuy={(id, price) => {
                setOrbs((n) => n - price)
                setAccount((a) => ({ ...a, collectibles: [...(a.collectibles ?? []), id] }))
              }}
              onEquip={(id) => setAccount((a) => ({ ...a, decoration: id }))}
              onEnroll={enrollQuest}
              onBeat={beatQuest}
              onClaim={(q, payout) => claimQuest(q.id, payout)}
            />
          ) : homeView === 'shop' ? (
            <ShopPage
              account={account}
              orbs={orbs}
              premiumType={premiumType}
              owned={account.collectibles ?? []}
              equipped={account.decoration}
              onBuy={(id, price) => {
                setOrbs((n) => n - price)
                setAccount((a) => ({ ...a, collectibles: [...(a.collectibles ?? []), id] }))
              }}
              onEquip={(id) => setAccount((a) => ({ ...a, decoration: id }))}
              onEquipNameplate={(id) =>
                setAccount((a) => ({ ...a, nameplate: id || undefined }))
              }
            />
          ) : (
            <FriendsPage tab={friendsTab} onTab={setFriendsTab} />
          )
        ) : (
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
                  {channel.nsfw && !nsfwOk.includes(channel.id) ? (
                    <AgeGate
                      channel={channel}
                      onEnter={() => setNsfwOk((all) => [...all, channel.id])}
                      onLeave={() => {
                        const other = server.channels.find(
                          (c) => c.id !== channel.id && c.kind === 'text' && !c.nsfw,
                        )
                        if (other) setActiveChannel(other.id)
                      }}
                    />
                  ) : voice === channel.id ? (
                    <VoiceView
                      channel={channel}
                      account={account}
                      muted={muted}
                      deafened={deafened}
                      onMute={() => setMuted((m) => !m)}
                      onDeafen={() => setDeafened((d) => !d)}
                      onLeave={() => setVoice(null)}
                    />
                  ) : channel.kind === 'forum' ? (
                    <ForumView
                      channel={channel}
                      posts={thread}
                      account={account}
                      md={md}
                      onCreate={(title, body) =>
                        patchThread((list) => [...list, makePost(account.handle, title, body)])
                      }
                      onOpen={jumpTo}
                    />
                  ) : (
                  <>
                  <ChatFeed
                    channel={channel}
                    server={server ?? null}
                    messages={thread}
                    all={thread}
                    account={account}
                    md={md}
                    unreadFrom={unreadFrom}
                    editingId={editingId}
                    onStartEdit={setEditingId}
                    onEditChannel={() => setChannelModal({ mode: 'edit', id: channel.id })}
                    onOnboard={(what) => {
                      if (what === 'apps') setUserSettings(true)
                      else setServerSettings(true)
                    }}
                    onEdit={editMessage}
                    onReply={setReplyTo}
                    onReact={react}
                    onOpenPicker={(id, at) => setPicker({ target: id, at })}
                    onOpenProfile={(el) => openProfileAt(el, 'right')}
                    onVote={vote}
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
                    onOpenPicker={(at, view) => setPicker({ target: 'composer', at, view })}
                    onPoll={() => setPollModal(true)}
                    onThread={() => {
                      const last = [...thread].reverse().find((m) => !m.type || m.type === 'DEFAULT')
                      if (last) createThread(last, 'thread')
                    }}
                    onApps={() => setAppsPanel(true)}
                    premiumType={premiumType}
                    automod={server?.automod}
                    onGiftNitro={() => {
                      setActiveServer(null)
                      setHomeView('nitro')
                    }}
                    onSchedule={scheduleSend}
                  />
                  </>
                  )}
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
                  <MemberList
                    account={account}
                    onOpenProfile={(el) => openProfileAt(el, 'left')}
                  />
                ) : null}
              </div>
            </>
          ) : null}
          {server && !channel ? (
            /* Discord's own No Text Channels screen, with its own copy */
            <div className="no-channels">
              <EmptyArt kind="no-text-channels" />
              <h3>NO TEXT CHANNELS</h3>
              <p>
                You find yourself in a strange place. You don't have access to any text channels,
                or there are none in this server.
              </p>
            </div>
          ) : null}
        </main>
        )}

        {themePanel ? (
          <ThemePanel
            current={themeId}
            onPick={(t) => setThemeId(t.id)}
            onClose={() => setThemePanel(false)}
          />
        ) : null}
      </div>

      {customStatus ? (
        <CustomStatus
          account={account}
          onClose={() => setCustomStatus(false)}
          onSave={(text, emoji) => {
            setAccount((a) => ({ ...a, customStatus: text || undefined, customEmoji: emoji }))
            setCustomStatus(false)
          }}
        />
      ) : null}

      {channelSettings && server ? (
        <ChannelSettings
          channel={server.channels.find((c) => c.id === channelSettings)!}
          server={server}
          onPatch={(fn, audit) =>
            patchActiveServer(
              (s) => ({ ...s, channels: s.channels.map((c) => (c.id === channelSettings ? fn(c) : c)) }),
              audit,
            )
          }
          onDelete={() => {
            deleteChannel(channelSettings)
            setChannelSettings(null)
          }}
          onClose={() => setChannelSettings(null)}
        />
      ) : null}

      {pollModal ? (
        <CreatePoll
          onClose={() => setPollModal(false)}
          onCreate={(poll) => {
            patchThread((list) => [
              ...list,
              { id: uid('m'), author: account.handle, time: Date.now(), text: '', poll },
            ])
            setPollModal(false)
          }}
        />
      ) : null}

      {userPopout ? (
        <ProfilePopout
          account={account}
          at={userPopout}
          onEdit={() => {
            setUserPopout(null)
            setEditingProfile(true)
          }}
          onStatus={() => setStatusMenu(true)}
          onSwitch={() => setSwitchAccounts(true)}
          onCustomStatus={() => {
            setUserPopout(null)
            setCustomStatus(true)
          }}
          onViewProfile={() => {
            setUserPopout(null)
            setProfileModal(true)
          }}
          onClose={() => setUserPopout(null)}
        />
      ) : null}

      {profileModal ? (
        <ProfileModal
          account={account}
          roles={server?.roles ?? []}
          onClose={() => setProfileModal(false)}
        />
      ) : null}

      {userSettings ? (
        <UserSettings
          account={account}
          servers={servers}
          prefs={prefs}
          themeId={themeId}
          premium={premiumType === PremiumType.TIER_2}
          onAccount={setAccount}
          onPrefs={(p) => setPrefs((old) => ({ ...old, ...p }))}
          onTheme={(t) => setThemeId(t.id)}
          onSignOut={onSignOut}
          onClose={() => setUserSettings(false)}
        />
      ) : null}

      {serverSettings && server ? (
        <ServerSettings
          server={server}
          account={account}
          onPatch={patchActiveServer}
          onDelete={() => {
            const rest = servers.filter((s) => s.id !== server.id)
            setServers(rest)
            setActiveServer(rest[0]?.id ?? null)
            setActiveChannel(rest[0]?.channels.find((c) => c.kind !== 'voice')?.id ?? '')
            setServerSettings(false)
          }}
          onClose={() => setServerSettings(false)}
        />
      ) : null}

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
          view={picker.view}
          server={server}
          onPick={(name) => {
            if (picker.target === 'composer') send(`:${name}:`)
            else react(picker.target, name)
          }}
          onSticker={(id) => sendSticker(id)}
          onClose={() => setPicker(null)}
        />
      ) : null}

      {ctx ? <ContextMenu at={ctx.at} items={ctx.items} onClose={() => setCtx(null)} /> : null}

      {creatingServer ? (
        <CreateServerFlow
          suggestedName={`${account.name}'s server`}
          onClose={() => setCreatingServer(false)}
          onCreate={createServer}
          onJoin={() => setCreatingServer(false)}
        />
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
      {appsPanel ? <AppsPanel onClose={() => setAppsPanel(false)} /> : null}
      {switchAccounts ? (
        <SwitchAccounts
          account={account}
          onSignOut={onSignOut}
          onClose={() => setSwitchAccounts(false)}
        />
      ) : null}
      {statusMenu ? (
        <StatusMenu
          account={account}
          onCustomStatus={() => {
            setStatusMenu(false)
            setPopout(false)
            setCustomStatus(true)
          }}
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
