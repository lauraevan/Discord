import { useMemo, useRef, useState } from 'react'
import {
  AutoModAction,
  AutoModTrigger,
  BOOST_TIERS,
  ExplicitFilter,
  KeywordPreset,
  PERMISSION_GROUPS,
  CAPS,
  SystemChannelFlags,
  ROLE_COLORS,
  SERVER_CAPS,
  VerificationLevel,
  boostTierOf,
  inviteCode,
  uid,
  type Account,
  type AutoModRule,
  type Role,
  type Server,
} from '../data'
import { EmojiByName, GuildEmojiGlyph } from '../markdown'
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  MembersIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  UserIcon,
} from '../ui/Icons'
import {
  Check,
  Divider,
  Field,
  Note,
  Radio,
  Select,
  SettingsLayer,
  Slider,
  Sub,
  Title,
  SaveBar,
  Toggle,
  Unavailable,
  useDraft,
  type NavItem,
} from './SettingsLayer'
import { Select as Dropdown } from '../ui/Select'
import { Avatar } from './UserArea'
import { DISCOVERY_CATEGORIES } from './Discover'
import { LOCALES } from '../prefs'

/**
 * What Discord's Invites table puts in the Expires column: the time left on
 * the link, or "Never" for one with no max age.
 */
function expiresIn(i: { createdAt: number; maxAge: number }) {
  if (!i.maxAge) return 'Never'
  const left = i.createdAt + i.maxAge * 1000 - Date.now()
  if (left <= 0) return 'Expired'
  const h = Math.round(left / 36e5)
  if (h >= 48) return `${Math.round(h / 24)} days`
  if (h >= 1) return `${h} hours`
  return `${Math.max(1, Math.round(left / 6e4))} minutes`
}

/** A stable stand-in so the role draft has something to hold with no role open. */
const NO_ROLE = {
  name: '',
  color: null as string | null,
  hoist: false,
  mentionable: false,
  permissions: [] as string[],
}

/**
 * The only five inactive timeouts Discord's client offers, in seconds — its
 * own AFK_TIMEOUTS.
 */
const AFK_TIMEOUTS = [
  ['60', '1 Minute'],
  ['300', '5 Minutes'],
  ['900', '15 Minutes'],
  ['1800', '30 Minutes'],
  ['3600', '1 Hour'],
] as const

/**
 * The four system messages, each paired with the SystemChannelFlags bit that
 * *suppresses* it. The wording is Discord's own.
 */
const SYSTEM_MESSAGES = [
  [
    SystemChannelFlags.SUPPRESS_JOIN_NOTIFICATIONS,
    'Send a random welcome message when someone joins this server.',
  ],
  [
    SystemChannelFlags.SUPPRESS_JOIN_NOTIFICATION_REPLIES,
    'Prompt members to reply to welcome messages with a sticker.',
  ],
  [
    SystemChannelFlags.SUPPRESS_PREMIUM_SUBSCRIPTIONS,
    'Send a message when someone boosts this server.',
  ],
  [
    SystemChannelFlags.SUPPRESS_GUILD_REMINDER_NOTIFICATIONS,
    'Send helpful tips for server setup.',
  ],
] as const

/**
 * Server Settings.
 *
 * Sections follow the client's own GuildSettingsSections list (see
 * docs/discord-reference.md); the ones a page can actually run — Overview,
 * Roles, Emoji, Members, Invites, Bans, Audit Log, Delete — are wired up.
 */
export function ServerSettings({
  server,
  account,
  open = 'overview',
  onPatch,
  onDelete,
  onClose,
}: {
  server: Server
  account: Account
  /** the section to land on — the sidebar's Members and Server Boosts rows
      open Server Settings straight onto their own pane, as Discord does */
  open?: string
  onPatch: (fn: (s: Server) => Server, audit?: { action: string; target: string }) => void
  onDelete: () => void
  onClose: () => void
}) {
  const [section, setSection] = useState(open)
  const [roleId, setRoleId] = useState<string | null>(null)
  const [roleTab, setRoleTab] = useState<'display' | 'permissions' | 'members'>('display')
  const [roleQuery, setRoleQuery] = useState('')
  const [permQuery, setPermQuery] = useState('')
  const [emojiError, setEmojiError] = useState('')
  const [addRoleOpen, setAddRoleOpen] = useState(false)
  const [memberQuery, setMemberQuery] = useState('')
  const [banQuery, setBanQuery] = useState('')
  const [auditWho, setAuditWho] = useState('')
  const [auditWhat, setAuditWhat] = useState('')
  const iconFile = useRef<HTMLInputElement>(null)

  /**
   * Overview's draft. Discord does not commit a settings field as you type it
   * — the pane buffers every change and the save bar carries them over
   * together. Only the fields Overview owns are drafted, so that an emoji
   * upload or an invite minted in another pane does not throw the draft away.
   */
  const source = useMemo(
    () => ({
      name: server.name,
      color: server.color,
      icon: server.icon,
      description: server.description ?? '',
      afkChannelId: server.afkChannelId ?? null,
      afkTimeout: server.afkTimeout ?? 300,
      systemChannelId: server.systemChannelId ?? null,
      systemFlags: server.systemFlags ?? 0,
      notifyLevel: server.notifyLevel,
    }),
    [server],
  )
  const ov = useDraft(source)
  const saveOverview = () =>
    onPatch(
      (sv) => ({
        ...sv,
        ...ov.draft,
        initials: ov.draft.name.slice(0, 2).toUpperCase(),
      }),
      { action: 'Server settings updated', target: ov.draft.name },
    )

  const emojiFile = useRef<HTMLInputElement>(null)

  /**
   * Upload an emoji. Discord's rules, checked in its own order: the slot
   * count, then the 256 KB ceiling, then the name — which it derives from the
   * file name, lower-cased, with anything but a letter, digit or underscore
   * dropped, and which has to survive that at two characters or more.
   */
  const addEmoji = (f: File | undefined) => {
    if (!f) return
    setEmojiError('')
    if (server.emojis.length >= SERVER_CAPS.emoji[server.boostTier]) {
      setEmojiError('Maximum number of emojis reached (' + SERVER_CAPS.emoji[server.boostTier] + ')')
      return
    }
    if (f.size > CAPS.emojiKb * 1024) {
      setEmojiError(`Emoji must be under ${CAPS.emojiKb} KB in size.`)
      return
    }
    const name = f.name
      .replace(/\.[^.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
    if (name.length < 2) {
      setEmojiError('Name must be at least 2 characters long')
      return
    }
    const r = new FileReader()
    r.onload = () =>
      onPatch(
        (sv) => ({ ...sv, emojis: [...sv.emojis, { id: uid('emo'), name, url: String(r.result) }] }),
        { action: 'Emoji added', target: `:${name}:` },
      )
    r.readAsDataURL(f)
  }

  /** Overview's icon picker takes an image and keeps it as a data URL. */
  const pickIcon = (f: File | undefined) => {
    if (!f) return
    const r = new FileReader()
    r.onload = () => ov.patch((d) => ({ ...d, icon: String(r.result) }))
    r.readAsDataURL(f)
  }

  /**
   * The audit rows the pane shows. Discord keeps 45 days of audit log
   * ("Audit log retention 45 days" — its caps table), so anything older than
   * that is gone rather than merely hidden, and the two filters narrow what is
   * left. Newest first, which is the order Discord lists them in.
   */
  const auditRows = server.audit
    .filter((a) => Date.now() - a.time < CAPS.auditLogDays * 864e5)
    .filter((a) => !auditWhat || a.action === auditWhat)
    .filter(() => !auditWho || auditWho === account.handle)
    .slice()
    .sort((a, b) => b.time - a.time)

  const nav: NavItem[] = [
    { head: server.name },
    { id: 'overview', label: 'Overview' },
    { id: 'channels', label: 'Channels' },
    { id: 'roles', label: 'Roles' },
    { id: 'emoji', label: 'Emoji' },
    { id: 'stickers', label: 'Stickers' },
    { id: 'soundboard', label: 'Soundboard' },
    { id: 'tag', label: 'Server Tag' },
    { id: 'widget', label: 'Widget' },
    { id: 'templates', label: 'Server Template' },
    { id: 'vanity_url', label: 'Custom Invite Link' },
    { id: 'boost_status', label: 'Server Boost Status' },
    { sep: true },
    { head: 'Apps' },
    { id: 'integrations', label: 'Integrations' },
    { id: 'app_directory', label: 'App Directory' },
    { id: 'webhooks', label: 'Webhooks' },
    { sep: true },
    { head: 'Moderation' },
    { id: 'safety', label: 'Safety Setup' },
    { id: 'automod', label: 'AutoMod' },
    { id: 'audit_log', label: 'Audit Log' },
    { id: 'bans', label: 'Bans' },
    { sep: true },
    { head: 'Community' },
    { id: 'community', label: 'Enable Community' },
    { id: 'onboarding', label: 'Onboarding' },
    { id: 'engagement', label: 'Server Guide' },
    { id: 'discovery', label: 'Discovery' },
    { id: 'partner', label: 'Partner Program' },
    { id: 'analytics', label: 'Analytics' },
    { sep: true },
    { head: 'Monetization' },
    { id: 'role_subscriptions', label: 'Server Subscriptions' },
    { id: 'guild_products', label: 'Server Shop' },
    { sep: true },
    { head: 'User Management' },
    { id: 'members', label: 'Members' },
    { id: 'invites', label: 'Invites' },
    { sep: true },
    { id: 'delete', label: 'Delete Server', danger: true },
  ]

  const bans = server.bans.filter((b) =>
    [b.id, b.name].some((t) => t.toLowerCase().includes(banQuery.trim().toLowerCase())),
  )

  const role = server.roles.find((r) => r.id === roleId) ?? null

  /**
   * The role editor's draft. Discord's Edit Role is the other pane the help
   * centre shows the save bar on — "Press Save Changes to confirm your
   * selection" — and it covers Display and Permissions together, so switching
   * tabs keeps what you have not saved. Manage Members is not in it: handing a
   * role out takes effect at once there, as it does in the client.
   */
  const roleSource = useMemo(
    () =>
      role
        ? {
            name: role.name,
            color: role.color,
            hoist: role.hoist,
            mentionable: role.mentionable,
            permissions: role.permissions,
          }
        : NO_ROLE,
    [role],
  )
  const rd = useDraft(roleSource)
  const saveRole = () => {
    if (role) patchRole(role.id, (r) => ({ ...r, ...rd.draft }), 'Role updated')
  }

  // @everyone is the floor and always sits last, however the others are ordered
  const ranked = [
    ...server.roles.filter((r) => r.id !== 'everyone'),
    ...server.roles.filter((r) => r.id === 'everyone'),
  ]

  /** Moves a role one place up or down the list, which is its rank. */
  const move = (id: string, by: number) =>
    onPatch(
      (s) => {
        const rest = s.roles.filter((r) => r.id !== 'everyone')
        const i = rest.findIndex((r) => r.id === id)
        const j = i + by
        if (i < 0 || j < 0 || j >= rest.length) return s
        const next = [...rest]
        ;[next[i], next[j]] = [next[j], next[i]]
        return { ...s, roles: [...next, ...s.roles.filter((r) => r.id === 'everyone')] }
      },
      { action: 'Role order changed', target: server.roles.find((r) => r.id === id)?.name ?? id },
    )

  const memberHas = (id: string) => (server.memberRoles ?? []).includes(id)

  const toggleMember = (id: string) =>
    onPatch(
      (s) => {
        const held = s.memberRoles ?? []
        return {
          ...s,
          memberRoles: held.includes(id) ? held.filter((x) => x !== id) : [...held, id],
        }
      },
      {
        action: memberHas(id) ? 'Role removed from member' : 'Role given to member',
        target: server.roles.find((r) => r.id === id)?.name ?? id,
      },
    )

  const patchRole = (id: string, fn: (r: Role) => Role, action: string) =>
    onPatch(
      (s) => ({ ...s, roles: s.roles.map((r) => (r.id === id ? fn(r) : r)) }),
      { action, target: server.roles.find((r) => r.id === id)?.name ?? id },
    )

  return (
    <SettingsLayer
      nav={nav}
      section={section}
      onSection={(s) => {
        setSection(s)
        setRoleId(null)
      }}
      onClose={onClose}
      notice={
        <SaveBar
          open={
            (section === 'overview' && ov.dirty) || (section === 'roles' && !!role && rd.dirty)
          }
          onReset={section === 'overview' ? ov.reset : rd.reset}
          onSave={section === 'overview' ? saveOverview : saveRole}
        />
      }
    >
      {section === 'overview' ? (
        <>
          <Title>Server Overview</Title>
          <div className="srv-overview">
            {/* Discord's icon block: the preview, the minimum-size note, an
                Upload Image button, and Remove once there is one to remove. */}
            <div className="srv-icon-col">
              <button
                className={'srv-icon' + (ov.draft.icon ? ' has-icon' : '')}
                style={ov.draft.icon ? undefined : { background: ov.draft.color }}
                onClick={() => iconFile.current?.click()}
                aria-label="Upload a server icon"
              >
                {ov.draft.icon ? (
                  <img src={ov.draft.icon} alt="" />
                ) : (
                  ov.draft.name.slice(0, 2).toUpperCase()
                )}
              </button>
              <input
                ref={iconFile}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => pickIcon(e.target.files?.[0])}
              />
              <div className="srv-icon-note">
                Minimum Size: <b>128x128</b>
              </div>
              <button className="srv-icon-upload" onClick={() => iconFile.current?.click()}>
                Upload Image
              </button>
              {ov.draft.icon ? (
                <button
                  className="srv-icon-remove"
                  onClick={() => ov.patch((d) => ({ ...d, icon: undefined }))}
                >
                  Remove
                </button>
              ) : null}
            </div>
            <div className="srv-overview-fields">
              <Field
                label="SERVER NAME"
                value={ov.draft.name}
                maxLength={100}
                onChange={(name) => ov.patch((d) => ({ ...d, name }))}
              />
              <div className="set-field">
                <label>ICON COLOR</label>
                <div className="swatch-row">
                  {ROLE_COLORS.slice(0, 10).map((c) => (
                    <button
                      key={c}
                      className={'swatch' + (c === ov.draft.color ? ' on' : '')}
                      style={{ background: c }}
                      aria-label={c}
                      onClick={() => ov.patch((d) => ({ ...d, color: c }))}
                    >
                      {c === ov.draft.color ? <CheckIcon /> : null}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <Field
            label="SERVER DESCRIPTION"
            value={ov.draft.description}
            maxLength={120}
            textarea
            placeholder="Tell people what your server is about."
            onChange={(description) => ov.patch((d) => ({ ...d, description }))}
          />
          <Divider />
          {/* Discord's AFK pair. The note is its own, and the five timeouts
              are the only values the client offers. */}
          <Select
            label="Inactive Channel"
            value={ov.draft.afkChannelId ?? ''}
            options={[
              ['', 'No Inactive Channel'] as const,
              ...server.channels
                .filter((c) => c.kind === 'voice')
                .map((c) => [c.id, c.name] as const),
            ]}
            onChange={(id) => ov.patch((d) => ({ ...d, afkChannelId: id || null }))}
          />
          <Select
            label="Inactive Timeout"
            value={String(ov.draft.afkTimeout)}
            note="Automatically move members to this channel and mute them when they have been idle for longer than the inactive timeout. This does not affect browsers."
            options={AFK_TIMEOUTS}
            onChange={(v) => ov.patch((d) => ({ ...d, afkTimeout: Number(v) }))}
          />

          <Divider />
          {/* System messages: the channel, then the four suppression bits.
              Discord stores them inverted — a set bit *suppresses* — so the
              checkbox is on when the bit is clear. */}
          <Select
            label="System Messages Channel"
            value={ov.draft.systemChannelId ?? ''}
            options={[
              ['', 'No System Messages'] as const,
              ...server.channels
                .filter((c) => c.kind === 'text' || c.kind === 'announcement')
                .map((c) => [c.id, `#${c.name}`] as const),
            ]}
            onChange={(id) => ov.patch((d) => ({ ...d, systemChannelId: id || null }))}
          />
          {SYSTEM_MESSAGES.map(([bit, label]) => (
            <Check
              key={bit}
              label={label}
              value={(ov.draft.systemFlags & bit) === 0}
              onChange={(on) =>
                ov.patch((d) => ({
                  ...d,
                  systemFlags: on ? d.systemFlags & ~bit : d.systemFlags | bit,
                }))
              }
            />
          ))}

          <Divider />
          <Sub>Default Notification Settings</Sub>
          <Note>
            This determines whether members who have not explicitly set their notification
            preferences will receive a notification for every message sent in this server.
          </Note>
          <Radio
            value={String(ov.draft.notifyLevel) as '0' | '1'}
            onChange={(v) => ov.patch((d) => ({ ...d, notifyLevel: Number(v) as 0 | 1 }))}
            options={[
              ['0', 'All Messages'],
              ['1', 'Only @mentions'],
            ]}
          />
        </>
      ) : null}

      {section === 'roles' && !role ? (
        <>
          <Title>Roles</Title>
          <Note>
            Use roles to group your server members and assign permissions. Members use the color of
            the highest role they have on this list. Drag roles to reorder them.
          </Note>

          {/* Discord leads the pane with @everyone on its own, because it is
              not a role you order or delete — it is the floor everyone stands
              on — and it opens straight onto its permissions */}
          <div className="role-default">
            <span className="role-default-art">
              <MembersIcon />
            </span>
            <span className="role-default-body">
              <b>Default Permissions</b>
              <span>@everyone · applies to all server members</span>
            </span>
            <button
              className="role-default-go"
              aria-label="Default Permissions"
              onClick={() => {
                setRoleId('everyone')
                setRoleTab('permissions')
              }}
            >
              <ChevronRightIcon />
            </button>
          </div>

          <div className="role-bar">
            <div className="role-search">
              <SearchIcon />
              <input
                value={roleQuery}
                placeholder="Search Roles"
                aria-label="Search roles"
                onChange={(e) => setRoleQuery(e.target.value)}
              />
            </div>
            <button
              className="btn-primary"
              /* "Roles 250" — Discord's caps table, and the same at every level */
              disabled={server.roles.length >= CAPS.roles}
              title={server.roles.length >= CAPS.roles ? 'A server can have 250 roles' : undefined}
              onClick={() => {
                const r: Role = {
                  id: uid('role'),
                  name: 'new role',
                  color: null,
                  hoist: false,
                  mentionable: false,
                  permissions: [],
                }
                onPatch((s) => ({ ...s, roles: [r, ...s.roles] }), {
                  action: 'Role created',
                  target: r.name,
                })
                setRoleId(r.id)
                setRoleTab('display')
              }}
            >
              Create Role
            </button>
          </div>

          <div className="role-table-head">
            <span>
              Roles — {ranked.length} of {CAPS.roles}
            </span>
            <span>Members</span>
          </div>
          <div className="role-list">
            {ranked
              .filter((r) => r.name.toLowerCase().includes(roleQuery.trim().toLowerCase()))
              .map((r, i, list) => (
                <div className="role-row" key={r.id}>
                  {/* ordering is what a role's rank is, so the handles move it
                      rather than just decorating the row. @everyone has no
                      rank to move — it is always the floor — so it has none. */}
                  {r.id === 'everyone' ? (
                    <span className="role-grip-gap" />
                  ) : (
                    <span className="role-grip">
                      <button
                        aria-label={`Move ${r.name} up`}
                        disabled={i === 0}
                        onClick={() => move(r.id, -1)}
                      >
                        <ChevronDownIcon />
                      </button>
                      <button
                        aria-label={`Move ${r.name} down`}
                        disabled={i === list.length - 2}
                        onClick={() => move(r.id, 1)}
                      >
                        <ChevronDownIcon />
                      </button>
                    </span>
                  )}
                  <span className="role-dot" style={{ background: r.color ?? '#99aab5' }} />
                  <button
                    className="role-name"
                    onClick={() => {
                      setRoleId(r.id)
                      setRoleTab(r.id === 'everyone' ? 'permissions' : 'display')
                    }}
                  >
                    {r.name}
                  </button>
                  <span className="role-count">
                    {r.id === 'everyone' ? 1 : 0}
                    <UserIcon />
                  </span>
                  {r.id !== 'everyone' ? (
                    <button
                      className="role-del"
                      aria-label={`Delete ${r.name}`}
                      onClick={() =>
                        onPatch((s) => ({ ...s, roles: s.roles.filter((x) => x.id !== r.id) }), {
                          action: 'Role deleted',
                          target: r.name,
                        })
                      }
                    >
                      <TrashIcon />
                    </button>
                  ) : (
                    <span className="role-del-gap" />
                  )}
                </div>
              ))}
          </div>
        </>
      ) : null}

      {role ? (
        <>
          <button className="back-link" onClick={() => setRoleId(null)}>
            <ChevronLeftIcon />
            Back
          </button>
          <div className="role-edit-head">
            {role.id === 'everyone' ? null : (
              <span className="role-dot" style={{ background: rd.draft.color ?? '#99aab5' }} />
            )}
            {/* the header previews the draft, so the name and colour you are
                picking are the ones you see */}
            <Title>Edit Role — {rd.draft.name}</Title>
          </div>

          {/* Discord splits the editor in three. @everyone has no display of
              its own — it cannot be coloured, hoisted or mentioned as a role —
              so it gets the permissions tab alone. */}
          <div className="role-tabs" role="tablist">
            {(role.id === 'everyone'
              ? ([['permissions', 'Permissions']] as const)
              : ([
                  ['display', 'Display'],
                  ['permissions', 'Permissions'],
                  ['members', 'Manage Members'],
                ] as const)
            ).map(([id, label]) => (
              <button
                key={id}
                role="tab"
                aria-selected={roleTab === id}
                className={'role-tab' + (roleTab === id ? ' on' : '')}
                onClick={() => setRoleTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          {roleTab === 'display' && role.id !== 'everyone' ? (
            <>
              <Field
                label="ROLE NAME"
                value={rd.draft.name}
                maxLength={CAPS.roleNameChars}
                onChange={(name) => rd.patch((d) => ({ ...d, name }))}
              />
              <div className="set-field">
                <label>ROLE COLOR</label>
                <Note>
                  Members use the color of the highest role they have that is not the default.
                </Note>
                <div className="swatch-row wrap">
                  <button
                    className={'swatch none' + (rd.draft.color === null ? ' on' : '')}
                    aria-label="Default Color"
                    onClick={() => rd.patch((d) => ({ ...d, color: null }))}
                  >
                    <CloseIcon />
                  </button>
                  {ROLE_COLORS.map((c) => (
                    <button
                      key={c}
                      className={'swatch' + (c === rd.draft.color ? ' on' : '')}
                      style={{ background: c }}
                      aria-label={c}
                      onClick={() => rd.patch((d) => ({ ...d, color: c }))}
                    >
                      {c === rd.draft.color ? <CheckIcon /> : null}
                    </button>
                  ))}
                </div>
              </div>
              <Divider />
              <Toggle
                label="Display role members separately from online members"
                value={rd.draft.hoist}
                onChange={(hoist) => rd.patch((d) => ({ ...d, hoist }))}
              />
              <Toggle
                label="Allow anyone to @mention this role"
                value={rd.draft.mentionable}
                onChange={(mentionable) => rd.patch((d) => ({ ...d, mentionable }))}
              />
            </>
          ) : null}

          {roleTab === 'permissions' ? (
            <>
              <div className="role-search wide">
                <SearchIcon />
                <input
                  value={permQuery}
                  placeholder="Search Permissions"
                  aria-label="Search permissions"
                  onChange={(e) => setPermQuery(e.target.value)}
                />
              </div>
              {PERMISSION_GROUPS.map(([group, perms]) => {
                const q = permQuery.trim().toLowerCase()
                const hits = q
                  ? perms.filter(([, label, note]) =>
                      (label + ' ' + note).toLowerCase().includes(q),
                    )
                  : perms
                if (!hits.length) return null
                return (
                  <div key={group} className="perm-group">
                    <div className="perm-head">{group}</div>
                    {hits.map(([id, label, note]) => (
                      <div className="perm" key={id}>
                        <div className="set-row">
                          <div className="set-row-main">
                            <div className="set-row-label">{label}</div>
                            <div className="set-row-note">{note}</div>
                          </div>
                          <button
                            role="switch"
                            aria-checked={rd.draft.permissions.includes(id)}
                            aria-label={label}
                            className={'switch' + (rd.draft.permissions.includes(id) ? ' on' : '')}
                            onClick={() =>
                              rd.patch((d) => ({
                                ...d,
                                permissions: d.permissions.includes(id)
                                  ? d.permissions.filter((pp) => pp !== id)
                                  : [...d.permissions, id],
                              }))
                            }
                          >
                            <span />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </>
          ) : null}

          {roleTab === 'members' && role.id !== 'everyone' ? (
            <>
              <div className="role-members">
                <div className="member-table-row">
                  <Avatar account={account} size={32} status={false} />
                  <span className="role-member-name">
                    {account.name}
                    <span>{account.handle}</span>
                  </span>
                  <button
                    className={'btn-secondary' + (memberHas(role.id) ? ' on' : '')}
                    onClick={() => toggleMember(role.id)}
                  >
                    {memberHas(role.id) ? 'Remove' : 'Add'}
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </>
      ) : null}

      {section === 'emoji' ? (
        <>
          <Title>Emoji</Title>
          <Note>
            Add up to {SERVER_CAPS.emoji[server.boostTier]} custom emoji that anyone can use in
            this server. Animated GIF emoji may be used by members with Discord Nitro. Emoji names
            must be at least 2 characters long and can only contain alphanumeric characters and
            underscores. Emoji must be under {CAPS.emojiKb} KB in size.
          </Note>
          <button
            className="set-upload"
            disabled={server.emojis.length >= SERVER_CAPS.emoji[server.boostTier]}
            onClick={() => emojiFile.current?.click()}
          >
            Upload Emoji
          </button>
          <input
            ref={emojiFile}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp,image/avif"
            hidden
            onChange={(e) => addEmoji(e.target.files?.[0])}
          />
          {emojiError ? <div className="set-error">{emojiError}</div> : null}
          {/* Discord's own requirements list, under the button */}
          <ul className="set-reqs">
            <li>File type: JPEG, PNG, GIF, WEBP, AVIF</li>
            <li>Recommended file size: {CAPS.emojiKb} KB</li>
            <li>Recommended dimensions: 128x128</li>
            <li>
              Naming: Emoji names must be at least 2 characters long and can only contain
              alphanumeric characters and underscores
            </li>
          </ul>
          <div className="emoji-table">
            <div className="emoji-table-head">
              <span>IMAGE</span>
              <span>NAME</span>
              <span>UPLOADED BY</span>
              <span />
            </div>
            {server.emojis.map((e) => (
              <div className="emoji-row" key={e.id}>
                <GuildEmojiGlyph emoji={e} />
                <span className="emoji-name">:{e.name}:</span>
                <span className="emoji-by">
                  <Avatar account={account} size={20} status={false} />
                  {account.name}
                </span>
                <button
                  aria-label={`Delete ${e.name}`}
                  onClick={() =>
                    onPatch((s) => ({ ...s, emojis: s.emojis.filter((x) => x.id !== e.id) }), {
                      action: 'Emoji deleted',
                      target: `:${e.name}:`,
                    })
                  }
                >
                  <CloseIcon />
                </button>
              </div>
            ))}
            {!server.emojis.length ? (
              <div className="table-empty">No custom emoji yet.</div>
            ) : null}
          </div>
        </>
      ) : null}

      {section === 'members' ? (
        <>
          <Title>Members — 1</Title>
          <div className="member-search">
            <SearchIcon />
            <input
              value={memberQuery}
              placeholder="Search Members"
              aria-label="Search Members"
              onChange={(e) => setMemberQuery(e.target.value)}
            />
          </div>
          <div className="member-table">
            <div className="member-table-head">
              <span>NAME</span>
              <span>MEMBER SINCE</span>
              <span>JOINED DISCORD</span>
              <span>ROLES</span>
            </div>
            {[account.name, account.handle].some((t) =>
              t.toLowerCase().includes(memberQuery.trim().toLowerCase()),
            ) ? (
            <div className="member-table-row">
              <span className="mt-name">
                <Avatar account={account} size={32} status={false} />
                <b>{account.name}</b>
                <i>{account.handle}</i>
              </span>
              <span>Today</span>
              <span>Today</span>
              {/* Discord lists the roles the member actually holds — @everyone
                  and whatever has been given — each with an x, and a + that
                  opens the rest. Listing every role in the server was wrong. */}
              <span className="mt-roles">
                {server.roles
                  .filter((r) => r.id === 'everyone' || memberHas(r.id))
                  .map((r) => (
                    <span className="role-pill" key={r.id}>
                      <span className="role-dot" style={{ background: r.color ?? '#99aab5' }} />
                      {r.name}
                      {r.id === 'everyone' ? null : (
                        <button
                          className="role-pill-x"
                          aria-label={`Remove ${r.name}`}
                          onClick={() => toggleMember(r.id)}
                        >
                          <CloseIcon />
                        </button>
                      )}
                    </span>
                  ))}
                <span className="role-add-wrap">
                  <button
                    className="role-pill add"
                    aria-label="Add role"
                    aria-expanded={addRoleOpen}
                    onClick={() => setAddRoleOpen((v) => !v)}
                  >
                    <PlusIcon />
                  </button>
                  {addRoleOpen ? (
                    <div className="ctx role-add-menu" role="menu">
                      {server.roles.filter((r) => r.id !== 'everyone' && !memberHas(r.id))
                        .length ? (
                        server.roles
                          .filter((r) => r.id !== 'everyone' && !memberHas(r.id))
                          .map((r) => (
                            <button
                              key={r.id}
                              className="ctx-item"
                              onClick={() => {
                                toggleMember(r.id)
                                setAddRoleOpen(false)
                              }}
                            >
                              <span
                                className="role-dot"
                                style={{ background: r.color ?? '#99aab5' }}
                              />
                              {r.name}
                            </button>
                          ))
                      ) : (
                        <span className="ctx-item" aria-disabled>
                          No roles to add
                        </span>
                      )}
                    </div>
                  ) : null}
                </span>
              </span>
            </div>
            ) : (
              <div className="table-empty">No members matched.</div>
            )}
          </div>
        </>
      ) : null}

      {section === 'invites' ? (
        <>
          <div className="set-head-row">
            <Title>Invites</Title>
            <button
              className="btn-primary"
              onClick={() =>
                onPatch(
                  (s) => ({
                    ...s,
                    invites: [
                      { code: inviteCode(), createdAt: Date.now(), uses: 0, maxUses: 0, maxAge: 604800 },
                      ...s.invites,
                    ],
                  }),
                  { action: 'Invite created', target: server.name },
                )
              }
            >
              Create Invite
            </button>
          </div>
          <Note>Here's a list of all active invite links. You can revoke any one.</Note>
          <div className="invite-table">
            <div className="invite-head">
              <span>INVITER</span>
              <span>INVITE CODE</span>
              <span>USES</span>
              <span>EXPIRES</span>
              <span />
            </div>
            {server.invites.map((i) => (
              <div className="invite-row" key={i.code}>
                <span className="mt-name">
                  <Avatar account={account} size={24} status={false} />
                  {account.name}
                </span>
                <code>discord.gg/{i.code}</code>
                <span>
                  {i.uses} / {i.maxUses || '∞'}
                </span>
                <span>{expiresIn(i)}</span>
                <button
                  aria-label="Revoke invite"
                  onClick={() =>
                    onPatch((s) => ({ ...s, invites: s.invites.filter((x) => x.code !== i.code) }), {
                      action: 'Invite revoked',
                      target: i.code,
                    })
                  }
                >
                  <CloseIcon />
                </button>
              </div>
            ))}
            {!server.invites.length ? (
              <div className="table-empty">No invites yet</div>
            ) : null}
          </div>
        </>
      ) : null}

      {section === 'bans' ? (
        <>
          {/* Discord's title is a plural rule, not a count beside a word:
              "No Bans" at zero, "1 Ban", then "{n} Bans". */}
          <Title>
            {server.bans.length === 0
              ? 'No Bans'
              : server.bans.length === 1
                ? '1 Ban'
                : `${server.bans.length} Bans`}
          </Title>
          <Note>
            Bans by default are by account and IP. A user can circumvent an IP ban by using a
            proxy. Ban circumvention can be made very hard by enabling phone verification in{' '}
            <button className="md-link" onClick={() => setSection('safety')}>
              Safety Setup
            </button>
            .
          </Note>
          <div className="member-search">
            <SearchIcon />
            <input
              value={banQuery}
              placeholder="Search Bans by User Id or Username"
              aria-label="Search Bans"
              onChange={(e) => setBanQuery(e.target.value)}
            />
          </div>
          {bans.length ? (
            <div className="member-table">
              {bans.map((b) => (
                <div className="ban-row" key={b.id}>
                  <span className="mt-name">
                    <b>{b.name}</b>
                    <i>{b.reason}</i>
                  </span>
                  <button
                    className="btn-secondary"
                    onClick={() =>
                      onPatch((sv) => ({ ...sv, bans: sv.bans.filter((x) => x.id !== b.id) }), {
                        action: 'Ban revoked',
                        target: b.name,
                      })
                    }
                  >
                    Revoke Ban
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="table-empty">
              {banQuery.trim()
                ? 'We looked as hard as we could, but no banned users were found matching that search.'
                : 'No Bans'}
            </div>
          )}
        </>
      ) : null}

      {section === 'audit_log' ? (
        <>
          <Title>Audit Log</Title>
          {/* Discord's two filters, by member and by action type. Its page
              carries no description under the title — just these. */}
          <div className="audit-filters">
            <label className="audit-filter">
              <span>Filter by User</span>
              <Dropdown
                aria-label="Filter by User"
                value={auditWho}
                options={[
                  { value: '', label: 'All Users' },
                  { value: account.handle, label: account.name },
                ]}
                onChange={setAuditWho}
              />
            </label>
            <label className="audit-filter">
              <span>Filter by Action</span>
              <Dropdown
                aria-label="Filter by Action"
                value={auditWhat}
                options={[
                  { value: '', label: 'All Actions' },
                  ...[...new Set(server.audit.map((a) => a.action))]
                    .sort()
                    .map((act) => ({ value: act, label: act })),
                ]}
                onChange={setAuditWhat}
              />
            </label>
          </div>
          <div className="audit">
            {auditRows.length ? (
              auditRows.map((a) => (
                <div className="audit-row" key={a.id}>
                  <Avatar account={account} size={32} status={false} />
                  <span className="audit-text">
                    <b>{account.name}</b> {a.action.toLowerCase()} <b>{a.target}</b>
                  </span>
                  <span className="audit-time">
                    {new Date(a.time).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))
            ) : (
              <div className="table-empty">
                {server.audit.length ? 'No results found' : 'No Logs Yet'}
              </div>
            )}
          </div>
        </>
      ) : null}

      {section === 'delete' ? (
        <>
          <Title>Delete Server</Title>
          <Note>
            This cannot be undone. Deleting <b>{server.name}</b> removes its channels and every
            message in them.
          </Note>
          <button className="btn-danger" onClick={onDelete}>
            Delete Server
          </button>
        </>
      ) : null}

      {section === 'channels' ? <Channels server={server} onPatch={onPatch} /> : null}
      {section === 'stickers' ? <Stickers server={server} onPatch={onPatch} /> : null}
      {section === 'soundboard' ? <Soundboard server={server} onPatch={onPatch} /> : null}
      {section === 'tag' ? <ServerTagSection server={server} onPatch={onPatch} /> : null}
      {section === 'widget' ? <Widget server={server} onPatch={onPatch} /> : null}
      {section === 'templates' ? <Template server={server} /> : null}
      {section === 'vanity_url' ? <Vanity server={server} onPatch={onPatch} /> : null}
      {section === 'boost_status' ? <BoostStatus server={server} onPatch={onPatch} /> : null}
      {section === 'webhooks' ? <Webhooks server={server} onPatch={onPatch} /> : null}
      {section === 'safety' ? <Safety server={server} onPatch={onPatch} /> : null}
      {section === 'automod' ? <AutoMod server={server} onPatch={onPatch} /> : null}
      {section === 'community' ? <Community server={server} onPatch={onPatch} /> : null}
      {section === 'onboarding' ? <Onboarding server={server} onPatch={onPatch} /> : null}
      {section === 'engagement' ? <ServerGuide server={server} /> : null}

      {section === 'discovery' ? <Discovery server={server} onPatch={onPatch} /> : null}

      {['integrations', 'app_directory', 'partner', 'analytics', 'role_subscriptions', 'guild_products'].includes(
        section,
      ) ? (
        <>
          <Title>{(nav.find((n) => 'id' in n && n.id === section) as { label: string }).label}</Title>
          {/* Apps are the one of these where Discord's own empty state is
              simply true of this page, so it gets that rather than a card
              explaining the page. The rest need billing or a decision Discord
              makes about a real server, and say so. */}
          {section === 'integrations' || section === 'app_directory' ? (
            <div className="table-empty tall">No apps have been installed in this server yet</div>
          ) : (
            <Unavailable
              what="Not available in a page"
              why={
                section === 'role_subscriptions' || section === 'guild_products'
                  ? 'Selling anything needs Discord’s billing systems and a payout account.'
                  : 'The partner programme and analytics are decided by Discord about a real server.'
              }
            />
          )}
        </>
      ) : null}
    </SettingsLayer>
  )
}

/* -------------------------------------------------------------- the sections
 *
 * Each of these is a section the client's own GuildSettingsSections enum
 * names, built so it does the thing it says rather than describing it. What
 * the server stores for them lives on the Server object in src/data.ts.
 */

type Patch = (fn: (s: Server) => Server, audit?: { action: string; target: string }) => void

/** CHANNELS — the list, with the categories and the ordering. */
function Channels({ server, onPatch }: { server: Server; onPatch: Patch }) {
  const [name, setName] = useState('')
  // the id lives in a ref as well as in state: dragover and drop can arrive in
  // the same tick as dragstart, before React has flushed the state
  const held = useRef<string | null>(null)
  const [drag, setDrag] = useState<string | null>(null)
  const [over, setOver] = useState<string | null>(null)
  const inCategory = (id: string | null) => server.channels.filter((c) => c.categoryId === id)

  /**
   * Drop a channel. `before` is the channel it lands above, or null to put it
   * at the end of that category's run. The sidebar reads its order straight
   * off this array, so moving a channel here is a splice.
   */
  const drop = (dragId: string, categoryId: string | null, before: string | null) => {
    const moving = server.channels.find((c) => c.id === dragId)
    if (!moving || dragId === before) return
    onPatch(
      (s) => {
        const held = s.channels.find((c) => c.id === dragId)
        if (!held) return s
        const rest = s.channels.filter((c) => c.id !== dragId)
        const next = { ...held, categoryId }
        if (before) rest.splice(rest.findIndex((c) => c.id === before), 0, next)
        else {
          let last = -1
          rest.forEach((c, i) => {
            if (c.categoryId === categoryId) last = i
          })
          rest.splice(last + 1, 0, next)
        }
        return { ...s, channels: rest }
      },
      { action: 'Channel moved', target: moving.name },
    )
  }

  return (
    <>
      <Title>Channels</Title>
      <Note>Categories and channels, in the order the sidebar shows them. Drag to reorder.</Note>
      <div className="srv-channels">
        {[null, ...server.categories.map((c) => c.id)].map((catId) => {
          const cat = server.categories.find((c) => c.id === catId)
          const rows = inCategory(catId)
          if (catId !== null && rows.length === 0 && cat == null) return null
          return (
            <section
              key={catId ?? 'none'}
              className={'srv-cat' + (over === (catId ?? 'none') ? ' drop' : '')}
              onDragOver={(e) => {
                if (!held.current) return
                e.preventDefault()
                setOver(catId ?? 'none')
              }}
              onDragLeave={() => setOver((o) => (o === (catId ?? 'none') ? null : o))}
              onDrop={(e) => {
                e.preventDefault()
                if (held.current) drop(held.current, catId, null)
                held.current = null
                setDrag(null)
                setOver(null)
              }}
            >
              <h4>{cat ? cat.name : 'No category'}</h4>
              {rows.length === 0 ? (
                <div className="table-empty">Nothing in here.</div>
              ) : (
                <ul>
                  {rows.map((ch) => (
                    <li
                      key={ch.id}
                      draggable
                      className={
                        (drag === ch.id ? 'dragging' : '') + (over === ch.id ? ' drop-before' : '')
                      }
                      onDragStart={(e) => {
                        held.current = ch.id
                        setDrag(ch.id)
                        e.dataTransfer.effectAllowed = 'move'
                        // Firefox refuses to start a drag with no payload
                        e.dataTransfer.setData('text/plain', ch.id)
                      }}
                      onDragEnd={() => {
                        held.current = null
                        setDrag(null)
                        setOver(null)
                      }}
                      onDragOver={(e) => {
                        if (!held.current || held.current === ch.id) return
                        e.preventDefault()
                        e.stopPropagation()
                        setOver(ch.id)
                      }}
                      onDrop={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (held.current) drop(held.current, catId, ch.id)
                        held.current = null
                        setDrag(null)
                        setOver(null)
                      }}
                    >
                      <span className="srv-chan-kind">{ch.kind}</span>
                      <b>{ch.name}</b>
                      {/* the select is the same move without a mouse */}
                      <Dropdown
                        className="srv-chan-cat"
                        aria-label={`Category for ${ch.name}`}
                        value={ch.categoryId ?? ''}
                        options={[
                          { value: '', label: 'No category' },
                          ...server.categories.map((c) => ({ value: c.id, label: c.name })),
                        ]}
                        onChange={(v) => drop(ch.id, v || null, null)}
                      />
                      <button
                        className="icon-btn"
                        aria-label={`Delete ${ch.name}`}
                        onClick={() =>
                          onPatch(
                            (s) => ({ ...s, channels: s.channels.filter((c) => c.id !== ch.id) }),
                            { action: 'Channel deleted', target: ch.name },
                          )
                        }
                      >
                        <TrashIcon size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )
        })}
      </div>
      <Divider />
      <Sub>New category</Sub>
      <div className="set-row-add">
        <input
          className="field"
          value={name}
          placeholder="Category name"
          onChange={(e) => setName(e.target.value)}
        />
        <button
          className="btn-primary"
          disabled={!name.trim()}
          onClick={() => {
            onPatch(
              (s) => ({
                ...s,
                categories: [...s.categories, { id: uid('cat'), name: name.trim().toUpperCase() }],
              }),
              { action: 'Category created', target: name.trim() },
            )
            setName('')
          }}
        >
          Create
        </button>
      </div>
    </>
  )
}

/** STICKERS — five slots before boosts, each filed under an emoji. */
function Stickers({ server, onPatch }: { server: Server; onPatch: Patch }) {
  const [name, setName] = useState('')
  const [related, setRelated] = useState('joy')
  // Discord takes a 320x320 PNG or APNG; the picture stays in the browser as a
  // data URL the same way an avatar does
  const [url, setUrl] = useState<string | undefined>(undefined)
  const file = useRef<HTMLInputElement>(null)
  const stickers = server.stickers ?? []
  const slots = SERVER_CAPS.stickers[server.boostTier]
  return (
    <>
      <Title>Stickers</Title>
      <Note>
        {stickers.length} of {slots} slots used. Stickers can be static (JPG, PNG) or animated
        (APNG, GIF). Stickers must be exactly 320 x 320 pixels and no larger than 512 KB.
      </Note>
      <div className="set-row-add">
        <input
          ref={file}
          type="file"
          accept="image/*"
          hidden
          aria-hidden="true"
          onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (!f) return
            const r = new FileReader()
            r.onload = () => setUrl(String(r.result))
            r.readAsDataURL(f)
          }}
        />
        <button
          className={'sticker-drop' + (url ? ' on' : '')}
          aria-label="Choose a sticker image"
          onClick={() => file.current?.click()}
        >
          {url ? <img src={url} alt="" /> : <PlusIcon />}
        </button>
        <input
          className="field"
          value={name}
          maxLength={30}
          placeholder="Sticker name"
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="field short"
          value={related}
          maxLength={32}
          placeholder="Related emoji"
          onChange={(e) => setRelated(e.target.value.replace(/[^a-z0-9_]/g, ''))}
        />
        <button
          className="btn-primary"
          disabled={!name.trim() || stickers.length >= slots}
          onClick={() => {
            onPatch(
              (s) => ({
                ...s,
                stickers: [
                  ...(s.stickers ?? []),
                  {
                    id: uid('stk'),
                    name: name.trim(),
                    description: '',
                    related: related || 'joy',
                    ...(url ? { url } : {}),
                  },
                ],
              }),
              { action: 'Sticker uploaded', target: name.trim() },
            )
            setName('')
            setUrl(undefined)
          }}
        >
          Upload
        </button>
      </div>
      {stickers.length === 0 ? (
        <div className="table-empty">No stickers yet.</div>
      ) : (
        <ul className="srv-stickers">
          {stickers.map((st) => (
            <li key={st.id}>
              <span className="srv-sticker-art">
                {st.url ? <img src={st.url} alt="" /> : <EmojiByName name={st.related} />}
              </span>
              <b>{st.name}</b>
              <span className="srv-sticker-related">:{st.related}:</span>
              <button
                className="icon-btn"
                aria-label={`Delete ${st.name}`}
                onClick={() =>
                  onPatch(
                    (s) => ({ ...s, stickers: (s.stickers ?? []).filter((x) => x.id !== st.id) }),
                    { action: 'Sticker deleted', target: st.name },
                  )
                }
              >
                <TrashIcon size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

/** SOUNDBOARD — eight slots before boosts, each with an emoji and a volume. */
function Soundboard({ server, onPatch }: { server: Server; onPatch: Patch }) {
  const [name, setName] = useState('')
  const sounds = server.sounds ?? []
  const slots = SERVER_CAPS.soundboard[server.boostTier]
  return (
    <>
      <Title>Soundboard</Title>
      <Note>
        {sounds.length} of {slots} slots used.
      </Note>
      <div className="set-row-add">
        <input
          className="field"
          value={name}
          maxLength={32}
          placeholder="Sound name"
          onChange={(e) => setName(e.target.value)}
        />
        <button
          className="btn-primary"
          disabled={!name.trim() || sounds.length >= slots}
          onClick={() => {
            onPatch(
              (s) => ({
                ...s,
                sounds: [
                  ...(s.sounds ?? []),
                  { id: uid('snd'), name: name.trim(), emoji: 'loud_sound', volume: 1 },
                ],
              }),
              { action: 'Sound added', target: name.trim() },
            )
            setName('')
          }}
        >
          Upload
        </button>
      </div>
      {sounds.length === 0 ? (
        <div className="table-empty">No sounds yet.</div>
      ) : (
        <ul className="srv-sounds">
          {sounds.map((sd) => (
            <li key={sd.id}>
              <EmojiByName name={sd.emoji} />
              <b>{sd.name}</b>
              <Slider
                label="Volume"
                value={Math.round(sd.volume * 100)}
                min={0}
                max={100}
                step={5}
                suffix="%"
                onChange={(v: number) =>
                  onPatch((s) => ({
                    ...s,
                    sounds: (s.sounds ?? []).map((x) =>
                      x.id === sd.id ? { ...x, volume: v / 100 } : x,
                    ),
                  }))
                }
              />
              <button
                className="icon-btn"
                aria-label={`Delete ${sd.name}`}
                onClick={() =>
                  onPatch(
                    (s) => ({ ...s, sounds: (s.sounds ?? []).filter((x) => x.id !== sd.id) }),
                    { action: 'Sound deleted', target: sd.name },
                  )
                }
              >
                <TrashIcon size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

/**
 * SERVER TAG — four characters and a badge, worn beside a member's name.
 *
 * The badge packs are the client's own features, and their badge ids are its
 * numbering: Pets 21-25, Flex 26-30, Plant 31-35, Creepy Crawlies 36-40.
 */
const BADGE_PACKS: { name: string; ids: number[]; emoji: string[] }[] = [
  { name: 'Pets', ids: [21, 22, 23, 24, 25], emoji: ['dog', 'cat', 'rabbit', 'hamster', 'bird'] },
  { name: 'Flex', ids: [26, 27, 28, 29, 30], emoji: ['crown', 'gem', 'trophy', 'fire', 'star'] },
  { name: 'Plant', ids: [31, 32, 33, 34, 35], emoji: ['seedling', 'herb', 'cactus', 'maple_leaf', 'sunflower'] },
  {
    name: 'Creepy Crawlies',
    ids: [36, 37, 38, 39, 40],
    emoji: ['spider', 'bug', 'ant', 'honeybee', 'snail'],
  },
]

function ServerTagSection({ server, onPatch }: { server: Server; onPatch: Patch }) {
  const tag = server.tag
  return (
    <>
      <Title>Server Tag</Title>
      <Note>You may use max 4 characters, alphabet (A-Z) and numbers.</Note>
      <div className="srv-tag-row">
        <Field
          label="TAG"
          value={tag?.text ?? ''}
          maxLength={4}
          placeholder="ABCD"
          onChange={(text) =>
            onPatch(
              (s) => ({
                ...s,
                tag: { text: text.toUpperCase().slice(0, 4), badge: s.tag?.badge ?? 21 },
              }),
              { action: 'Server tag updated', target: text.toUpperCase() },
            )
          }
        />
        <div className="srv-tag-preview">
          <span className="set-row-label">PREVIEW</span>
          <span className="srv-tag-chip">
            <EmojiByName
                name={
                  BADGE_PACKS.flatMap((p) => p.emoji)[
                  BADGE_PACKS.flatMap((p) => p.ids).indexOf(tag?.badge ?? 21)
                ] ?? 'dog'
                }
                />
            {tag?.text || 'TAG'}
          </span>
        </div>
      </div>
      {BADGE_PACKS.map((pack) => (
        <div key={pack.name} className="set-field">
          <label>{pack.name.toUpperCase()}</label>
          <div className="srv-badges">
            {pack.ids.map((id, i) => (
              <button
                key={id}
                className={'srv-badge' + (tag?.badge === id ? ' on' : '')}
                aria-label={`${pack.name} badge ${i + 1}`}
                onClick={() =>
                  onPatch((s) => ({ ...s, tag: { text: s.tag?.text ?? '', badge: id } }))
                }
              >
                <EmojiByName name={pack.emoji[i]} />
              </button>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}

/** WIDGET — the embeddable widget, its invite channel and its JSON endpoint. */
function Widget({ server, onPatch }: { server: Server; onPatch: Patch }) {
  const widget = server.widget ?? { enabled: false, channelId: null }
  return (
    <>
      <Title>Server Widget</Title>
      <Toggle
        label="Enable Server Widget"
        note="Embed an HTML widget on your website to display your online members, voice channels, and invite link."
        value={widget.enabled}
        onChange={(enabled) =>
          onPatch((s) => ({ ...s, widget: { ...widget, enabled } }), {
            action: enabled ? 'Widget enabled' : 'Widget disabled',
            target: server.name,
          })
        }
      />
      <div className="set-field">
        <label>INVITE CHANNEL</label>
        <Dropdown
          aria-label="Invite Channel"
          value={widget.channelId ?? ''}
          options={[
            { value: '', label: 'No invite' },
            ...server.channels
              .filter((c) => c.kind === 'text')
              .map((c) => ({ value: c.id, label: `#${c.name}` })),
          ]}
          onChange={(v) =>
            onPatch((s) => ({ ...s, widget: { ...widget, channelId: v || null } }))
          }
        />
      </div>
      <Sub>JSON API</Sub>
      <pre className="srv-code">
        https://discord.com/api/guilds/{server.id}/widget.json
      </pre>
      <Sub>Premade Widget</Sub>
      <pre className="srv-code">
        https://discord.com/api/guilds/{server.id}/widget.png?style=banner2
      </pre>
    </>
  )
}

/** SERVER TEMPLATE — a template is the channels and roles, minus the content. */
function Template({ server }: { server: Server }) {
  const [code] = useState(() => inviteCode())
  return (
    <>
      <Title>Server Template</Title>
      <Note>
        A template copies this server's channels, categories, roles and settings — not its
        messages, members or invites.
      </Note>
      <div className="srv-template">
        <b>{server.name}</b>
        <span>
          {server.categories.length} categories · {server.channels.length} channels ·{' '}
          {server.roles.length} roles
        </span>
        <code>https://discord.new/{code}</code>
      </div>
    </>
  )
}

/** CUSTOM INVITE LINK — the vanity URL, which Discord gates behind Level 3. */
function Vanity({ server, onPatch }: { server: Server; onPatch: Patch }) {
  const unlocked = server.boostTier >= 3
  return (
    <>
      <Title>Custom Invite Link</Title>
      <Note>
        Bring others to your server easily with your own customized invite link. Heads up though,
        anyone with the link can join and you'll need at least one text channel that is open to
        all server members.
      </Note>
      {/* Discord gates the vanity URL behind Level 3, and says how far off it
          is on the perks list rather than in a paragraph here. */}
      {unlocked ? null : (
        <div className="set-locked">
          Boost this server to Level 3 to unlock a custom invite link —{' '}
          {BOOST_TIERS[3] - (server.boosts ?? 0)} more Boosts to go.
        </div>
      )}
      <div className="srv-vanity">
        <span>discord.gg/</span>
        <input
          className="field"
          value={server.vanity ?? ''}
          maxLength={32}
          disabled={!unlocked}
          placeholder="your-link"
          onChange={(e) =>
            onPatch(
              (s) => ({ ...s, vanity: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }),
              { action: 'Custom invite link set', target: e.target.value },
            )
          }
        />
      </div>
    </>
  )
}

/** SERVER BOOST STATUS — the tier ladder and what each level unlocks. */
/*
 * What each level unlocks, from Discord's own caps table: the uploads it lists
 * as "10MB | Same | 50MB for all members | 100MB for all members", which this
 * had a tier early, and the slot counts in SERVER_CAPS.
 */
const BOOST_PERKS: string[][] = [
  ['50 emoji slots', '5 sticker slots', '8 soundboard slots', '10MB uploads', '96kbps audio'],
  ['100 emoji slots', '15 sticker slots', '24 soundboard slots', 'Animated server icon', '128kbps audio'],
  ['150 emoji slots', '30 sticker slots', '36 soundboard slots', '50MB uploads', 'Server banner', '256kbps audio'],
  ['250 emoji slots', '60 sticker slots', '48 soundboard slots', '100MB uploads', 'Vanity URL', '384kbps audio'],
]

/** The two perks Discord puts artwork behind, and the level each arrives at. */
const TOP_PERKS: [string, string, number, string][] = [
  ['perk-streaming', 'Better streaming', 2, '1080p 60fps screen share for everyone in voice.'],
  ['perk-vanity', 'Custom invite link', 3, 'A discord.gg link with the server’s own name on it.'],
]

const BOOST_ART = import.meta.glob('../assets/boost/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

function BoostStatus({ server, onPatch }: { server: Server; onPatch: Patch }) {
  const boosts = server.boosts ?? 0
  const tier = boostTierOf(boosts)
  const next = BOOST_TIERS[tier + 1]
  const pct = next ? Math.min(100, (boosts / next) * 100) : 100
  return (
    <>
      <Title>Server Boost Status</Title>
      {/* the two perks Discord itself illustrates on this page, with its own
          artwork out of the mobile client's guild-boosting module */}
      <div className="srv-boost-top">
        {TOP_PERKS.map(([slug, name, at, blurb]) => (
          <div className={'srv-top-perk' + (tier >= at ? ' on' : '')} key={slug}>
            <img src={BOOST_ART[`../assets/boost/${slug}.webp`]} alt="" draggable={false} />
            <div>
              <b>{name}</b>
              <span>{blurb}</span>
              <em>{tier >= at ? 'Unlocked' : `Level ${at}`}</em>
            </div>
          </div>
        ))}
      </div>
      <div className="srv-boost">
        <div className="srv-boost-head">
          <b>Level {tier}</b>
          <span>
            {boosts} {boosts === 1 ? 'boost' : 'boosts'}
            {next ? ` · ${next - boosts} to Level ${tier + 1}` : ' · top level'}
          </span>
        </div>
        <span className="srv-boost-bar">
          <i style={{ width: `${pct}%` }} />
        </span>
        <div className="srv-boost-ladder">
          {[1, 2, 3].map((t) => (
            <div key={t} className={'srv-boost-tier' + (tier >= t ? ' on' : '')}>
              <b>Level {t}</b>
              <span>{BOOST_TIERS[t]} boosts</span>
              <ul>
                {BOOST_PERKS[t].map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <button
          className="btn-primary"
          onClick={() =>
            onPatch(
              (s) => {
                const n = (s.boosts ?? 0) + 1
                return { ...s, boosts: n, boostTier: boostTierOf(n) }
              },
              { action: 'Server boosted', target: server.name },
            )
          }
        >
          Boost this server
        </button>
      </div>
    </>
  )
}

/** WEBHOOKS — real rows with real tokens, since a webhook is just a URL. */
function Webhooks({ server, onPatch }: { server: Server; onPatch: Patch }) {
  const [name, setName] = useState('')
  const hooks = server.webhooks ?? []
  const first = server.channels.find((c) => c.kind === 'text')
  return (
    <>
      <Title>Webhooks</Title>
      <Note>
        Webhooks are a simple way to post messages from other apps and websites into Discord using
        internet magic.
      </Note>
      <div className="set-row-add">
        <input
          className="field"
          value={name}
          maxLength={80}
          placeholder="Webhook name"
          onChange={(e) => setName(e.target.value)}
        />
        <button
          className="btn-primary"
          disabled={!name.trim() || first == null}
          onClick={() => {
            onPatch(
              (s) => ({
                ...s,
                webhooks: [
                  ...(s.webhooks ?? []),
                  {
                    id: uid('wh'),
                    name: name.trim(),
                    channelId: first!.id,
                    token: inviteCode() + inviteCode(),
                    createdAt: Date.now(),
                  },
                ],
              }),
              { action: 'Webhook created', target: name.trim() },
            )
            setName('')
          }}
        >
          New Webhook
        </button>
      </div>
      {hooks.length === 0 ? (
        <div className="table-empty">No Webhooks</div>
      ) : (
        <ul className="srv-hooks">
          {hooks.map((h) => (
            <li key={h.id}>
              <div>
                <b>{h.name}</b>
                <span className="mono">
                  https://discord.com/api/webhooks/{h.id}/{h.token}
                </span>
              </div>
              <Dropdown
                className="webhook-channel"
                aria-label={`Channel for ${h.name}`}
                value={h.channelId}
                options={server.channels
                  .filter((c) => c.kind === 'text')
                  .map((c) => ({ value: c.id, label: `#${c.name}` }))}
                onChange={(v) =>
                  onPatch((s) => ({
                    ...s,
                    webhooks: (s.webhooks ?? []).map((x) =>
                      x.id === h.id ? { ...x, channelId: v } : x,
                    ),
                  }))
                }
              />
              <button
                className="icon-btn"
                aria-label={`Delete ${h.name}`}
                onClick={() =>
                  onPatch(
                    (s) => ({ ...s, webhooks: (s.webhooks ?? []).filter((x) => x.id !== h.id) }),
                    { action: 'Webhook deleted', target: h.name },
                  )
                }
              >
                <TrashIcon size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

/** SAFETY SETUP — the verification level and the content filter, as Discord has them. */
function Safety({ server, onPatch }: { server: Server; onPatch: Patch }) {
  return (
    <>
      <Title>Safety Setup</Title>
      <Sub>Verification level</Sub>
      <Radio
        value={String(server.verificationLevel ?? VerificationLevel.NONE)}
        onChange={(v) =>
          onPatch((s) => ({ ...s, verificationLevel: Number(v) }), {
            action: 'Verification level changed',
            target: server.name,
          })
        }
        options={[
          [String(VerificationLevel.NONE), 'None', 'Anyone can send a message.'],
          [String(VerificationLevel.LOW), 'Low', 'Must have a verified email.'],
          [String(VerificationLevel.MEDIUM), 'Medium', 'Registered on Discord for longer than 5 minutes.'],
          [String(VerificationLevel.HIGH), 'High', 'A member of this server for longer than 10 minutes.'],
          [String(VerificationLevel.VERY_HIGH), 'Highest', 'Must have a verified phone number.'],
        ]}
      />
      <Divider />
      <Sub>Explicit media content filter</Sub>
      <Radio
        value={String(server.explicitFilter ?? ExplicitFilter.MEMBERS_WITHOUT_ROLES)}
        onChange={(v) =>
          onPatch((s) => ({ ...s, explicitFilter: Number(v) }), {
            action: 'Content filter changed',
            target: server.name,
          })
        }
        options={[
          [String(ExplicitFilter.DISABLED), 'Do not scan', 'Nothing is scanned.'],
          [
            String(ExplicitFilter.MEMBERS_WITHOUT_ROLES),
            'Scan media from members without a role',
            'The default.',
          ],
          [String(ExplicitFilter.ALL_MEMBERS), 'Scan media from all members', 'Recommended.'],
        ]}
      />
    </>
  )
}

/**
 * AUTOMOD — rules that really run.
 *
 * The trigger and action numbers are Discord's own
 * (`AutoModerationTriggerType`, `AutoModerationActionType`), and a rule with
 * BLOCK_MESSAGE is enforced in the composer, so a blocked word is actually
 * blocked rather than described.
 */
const PRESET_WORDS: Record<number, string[]> = {
  [KeywordPreset.PROFANITY]: ['damn', 'crap', 'hell'],
  [KeywordPreset.SEXUAL_CONTENT]: ['nsfw'],
  [KeywordPreset.SLURS]: ['slur'],
}

export function autoModHit(rules: AutoModRule[] | undefined, text: string) {
  for (const rule of rules ?? []) {
    if (!rule.enabled) continue
    const lower = text.toLowerCase()
    if (rule.trigger === AutoModTrigger.KEYWORD) {
      const hit = rule.keywords.find((k) => k && lower.includes(k.toLowerCase()))
      if (hit != null) return { rule, hit }
    }
    if (rule.trigger === AutoModTrigger.DEFAULT_KEYWORD_LIST) {
      for (const preset of rule.presets) {
        const hit = (PRESET_WORDS[preset] ?? []).find((k) => lower.includes(k))
        if (hit != null) return { rule, hit }
      }
    }
    if (rule.trigger === AutoModTrigger.SPAM_LINK && /https?:\/\//i.test(text)) {
      return { rule, hit: 'a link' }
    }
    if (rule.trigger === AutoModTrigger.MENTION_SPAM) {
      const mentions = text.match(/@\w+/g)?.length ?? 0
      if (mentions > (rule.mentionLimit ?? 5)) return { rule, hit: `${mentions} mentions` }
    }
  }
  return null
}

const TRIGGER_LABEL: Record<number, string> = {
  [AutoModTrigger.KEYWORD]: 'Custom words',
  [AutoModTrigger.SPAM_LINK]: 'Suspicious links',
  [AutoModTrigger.ML_SPAM]: 'Spam content',
  [AutoModTrigger.DEFAULT_KEYWORD_LIST]: 'Commonly flagged words',
  [AutoModTrigger.MENTION_SPAM]: 'Mention spam',
}

function AutoMod({ server, onPatch }: { server: Server; onPatch: Patch }) {
  const rules = server.automod ?? []
  const add = (trigger: number, name: string) =>
    onPatch(
      (s) => ({
        ...s,
        automod: [
          ...(s.automod ?? []),
          {
            id: uid('am'),
            name,
            trigger: trigger as AutoModRule['trigger'],
            enabled: true,
            keywords: [],
            presets: trigger === AutoModTrigger.DEFAULT_KEYWORD_LIST ? [KeywordPreset.PROFANITY] : [],
            mentionLimit: trigger === AutoModTrigger.MENTION_SPAM ? 5 : undefined,
            actions: [AutoModAction.BLOCK_MESSAGE],
          },
        ],
      }),
      { action: 'AutoMod rule created', target: name },
    )

  const patchRule = (id: string, fn: (r: AutoModRule) => AutoModRule) =>
    onPatch((s) => ({
      ...s,
      automod: (s.automod ?? []).map((r) => (r.id === id ? fn(r) : r)),
    }))

  return (
    <>
      <Title>AutoMod</Title>
      <Note>
        Set up rules for moderation in your server to automatically filter content and post
        alerts to keep your server safe around the clock. Users with Admin permissions will be
        ignored from AutoMod rules.
      </Note>
      <div className="srv-automod-add">
        {Object.entries(TRIGGER_LABEL).map(([t, label]) => (
          <button
            key={t}
            className="btn-secondary"
            disabled={Number(t) === AutoModTrigger.ML_SPAM}
            onClick={() => add(Number(t), label)}
          >
            <PlusIcon size={14} />
            {label}
          </button>
        ))}
      </div>
      {rules.length === 0 ? (
        <div className="table-empty">No rules yet.</div>
      ) : (
        <ul className="srv-rules">
          {rules.map((r) => (
            <li key={r.id}>
              <div className="srv-rule-head">
                <b>{r.name}</b>
                <span className="srv-rule-trigger">{TRIGGER_LABEL[r.trigger]}</span>
                <Toggle
                  label=""
                  value={r.enabled}
                  onChange={(enabled) => patchRule(r.id, (x) => ({ ...x, enabled }))}
                />
                <button
                  className="icon-btn"
                  aria-label={`Delete ${r.name}`}
                  onClick={() =>
                    onPatch(
                      (s) => ({ ...s, automod: (s.automod ?? []).filter((x) => x.id !== r.id) }),
                      { action: 'AutoMod rule deleted', target: r.name },
                    )
                  }
                >
                  <TrashIcon size={16} />
                </button>
              </div>

              {r.trigger === AutoModTrigger.KEYWORD ? (
                <input
                  className="field"
                  value={r.keywords.join(', ')}
                  placeholder="Words to block, comma separated"
                  onChange={(e) =>
                    patchRule(r.id, (x) => ({
                      ...x,
                      keywords: e.target.value
                        .split(',')
                        .map((k) => k.trim())
                        .filter(Boolean),
                    }))
                  }
                />
              ) : null}

              {r.trigger === AutoModTrigger.DEFAULT_KEYWORD_LIST ? (
                <div className="srv-presets">
                  {Object.entries(KeywordPreset).map(([label, value]) => (
                    <label key={label}>
                      <input
                        type="checkbox"
                        checked={r.presets.includes(value)}
                        onChange={(e) =>
                          patchRule(r.id, (x) => ({
                            ...x,
                            presets: e.target.checked
                              ? [...x.presets, value]
                              : x.presets.filter((p) => p !== value),
                          }))
                        }
                      />
                      {label.replace('_', ' ').toLowerCase()}
                    </label>
                  ))}
                </div>
              ) : null}

              {r.trigger === AutoModTrigger.MENTION_SPAM ? (
                <Slider
                  label="Mention limit"
                  value={r.mentionLimit ?? 5}
                  min={1}
                  max={50}
                  step={1}
                  onChange={(v) => patchRule(r.id, (x) => ({ ...x, mentionLimit: v }))}
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

/** ENABLE COMMUNITY — the two channels a community server must name. */
/**
 * Server Settings > Discovery.
 *
 * Discord gates the listing behind a checklist and then asks for the listing
 * itself. The checklist is its own — Community on, a healthy server, five
 * hundred members, eight weeks old, a description, verification at medium or
 * higher, and the media filter on for everyone — and every row here is
 * answered from what this server actually is rather than ticked for show. The
 * form below is what /guilds/:id/discovery-metadata stores: a primary
 * category, up to four more, the language it is in, and up to ten search
 * terms.
 */
function Discovery({ server, onPatch }: { server: Server; onPatch: Patch }) {
  const [term, setTerm] = useState('')
  const d = server.discovery
  const weeks = server.createdAt ? (Date.now() - server.createdAt) / 6048e5 : 0
  const members = 1

  const checks: [boolean, string, string][] = [
    [
      server.community != null,
      'Community enabled',
      'Discovery is only open to Community servers.',
    ],
    [true, 'Healthy server', 'No rule violations in the last 30 days.'],
    [
      members >= 500,
      '500 or more members',
      `This server has ${members}.`,
    ],
    [
      weeks >= 8,
      'At least 8 weeks old',
      weeks >= 8
        ? 'Old enough.'
        : `This one is ${weeks < 1 ? 'less than a week' : `${Math.floor(weeks)} week${Math.floor(weeks) === 1 ? '' : 's'}`} old.`,
    ],
    [
      !!server.description?.trim(),
      'Server description',
      'Set one under Overview so people know what they are joining.',
    ],
    [
      (server.verificationLevel ?? 0) >= 2,
      'Verification level at Medium or higher',
      'Set it under Moderation.',
    ],
    [
      (server.explicitFilter ?? 0) === 2,
      'Media content filter on for all members',
      'Set it under Moderation.',
    ],
  ]
  const passed = checks.filter(([ok]) => ok).length

  const patchDiscovery = (fn: (v: NonNullable<Server['discovery']>) => NonNullable<Server['discovery']>) =>
    onPatch((s) => ({
      ...s,
      discovery: fn(
        s.discovery ?? { primaryCategory: null, categories: [], language: 'en-US', keywords: [] },
      ),
    }))

  const extra = d?.categories ?? []
  const keywords = d?.keywords ?? []

  return (
    <>
      <Title>Discovery</Title>
      <Note>
        Discovery puts this server in the directory the compass opens, where anyone can find and
        join it. Discord checks the server against the list below before it will list it.
      </Note>

      <div className="discovery-checklist">
        <div className="discovery-checkhead">
          Requirements — {passed} of {checks.length} met
        </div>
        {checks.map(([ok, label, note]) => (
          <div className={'discovery-check' + (ok ? ' ok' : '')} key={label}>
            <span className="discovery-tick">{ok ? <CheckIcon /> : <CloseIcon />}</span>
            <span className="discovery-check-body">
              <b>{label}</b>
              <span>{note}</span>
            </span>
          </div>
        ))}
      </div>

      <Divider />
      <Sub>Listing</Sub>
      <Note>
        What the directory would show. It is kept whether or not the checklist passes, the way
        Discord keeps a draft listing.
      </Note>

      <div className="set-field">
        <label htmlFor="disc-primary">PRIMARY CATEGORY</label>
        <Dropdown
          id="disc-primary"
          aria-label="Primary Category"
          value={d?.primaryCategory ?? ''}
          options={[
            { value: '', label: 'Pick a category' },
            ...DISCOVERY_CATEGORIES.map((c) => ({ value: c, label: c })),
          ]}
          onChange={(v) => patchDiscovery((x) => ({ ...x, primaryCategory: v || null }))}
        />
      </div>

      <div className="set-field">
        <label>ADDITIONAL CATEGORIES</label>
        <Note>Up to four more, on top of the primary one.</Note>
        <div className="discovery-cats">
          {DISCOVERY_CATEGORIES.filter((c) => c !== d?.primaryCategory).map((c) => {
            const on = extra.includes(c)
            return (
              <button
                key={c}
                className={'discovery-pick' + (on ? ' on' : '')}
                aria-pressed={on}
                disabled={!on && extra.length >= 4}
                onClick={() =>
                  patchDiscovery((v) => ({
                    ...v,
                    categories: on ? v.categories.filter((x) => x !== c) : [...v.categories, c],
                  }))
                }
              >
                {c}
              </button>
            )
          })}
        </div>
      </div>

      <div className="set-field">
        <label htmlFor="disc-lang">PREFERRED LANGUAGE</label>
        <Dropdown
          id="disc-lang"
          aria-label="Preferred Language"
          value={d?.language ?? 'en-US'}
          options={LOCALES.map(([id, native, english]) => ({
            value: id,
            label: native === english ? native : `${native} — ${english}`,
          }))}
          onChange={(v) => patchDiscovery((x) => ({ ...x, language: v }))}
        />
      </div>

      <div className="set-field">
        <label htmlFor="disc-term">SEARCH TERMS</label>
        <Note>Up to ten words people might search for. {keywords.length} of 10 used.</Note>
        <div className="discovery-terms">
          {keywords.map((k) => (
            <span className="discovery-term" key={k}>
              {k}
              <button
                aria-label={`Remove ${k}`}
                onClick={() =>
                  patchDiscovery((v) => ({ ...v, keywords: v.keywords.filter((x) => x !== k) }))
                }
              >
                <CloseIcon />
              </button>
            </span>
          ))}
        </div>
        <input
          id="disc-term"
          className="field"
          value={term}
          maxLength={24}
          placeholder={keywords.length >= 10 ? 'Ten is the limit' : 'Add a term and press enter'}
          disabled={keywords.length >= 10}
          onChange={(e) => setTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            const t = term.trim().toLowerCase()
            if (!t || keywords.includes(t)) return
            patchDiscovery((v) => ({ ...v, keywords: [...v.keywords, t] }))
            setTerm('')
          }}
        />
      </div>
    </>
  )
}

function Community({ server, onPatch }: { server: Server; onPatch: Patch }) {
  const community = server.community
  const text = server.channels.filter((c) => c.kind === 'text')
  return (
    <>
      <Title>Enable Community</Title>
      <Note>
        Community Servers are larger spaces built around shared interests. Enabling Community
        requires setting up safety settings, Rules and Updates channels, and moderation
        settings.
      </Note>
      <Toggle
        label="Community enabled"
        note="Community Servers are required to have a rules channel and a Community Updates channel where Discord can send important community server updates."
        value={community != null}
        onChange={(on) =>
          onPatch(
            (s) => ({
              ...s,
              // Community is a guild feature, and Discovery reads it back
              features: on
                ? [...new Set([...(s.features ?? []), 'COMMUNITY' as const])]
                : (s.features ?? []).filter((f) => f !== 'COMMUNITY'),
              community: on
                ? {
                    rulesChannelId: text[0]?.id ?? null,
                    updatesChannelId: text[0]?.id ?? null,
                  }
                : undefined,
            }),
            { action: on ? 'Community enabled' : 'Community disabled', target: server.name },
          )
        }
      />
      {community ? (
        <>
          <div className="set-field">
            <label>RULES OR GUIDELINES CHANNEL</label>
            <Dropdown
              aria-label="Rules or Guidelines Channel"
              value={community.rulesChannelId ?? ''}
              options={text.map((c) => ({ value: c.id, label: `#${c.name}` }))}
              onChange={(v) =>
                onPatch((s) => ({
                  ...s,
                  community: { ...community, rulesChannelId: v || null },
                }))
              }
            />
          </div>
          <div className="set-field">
            <label>COMMUNITY UPDATES CHANNEL</label>
            <Dropdown
              aria-label="Community Updates Channel"
              value={community.updatesChannelId ?? ''}
              options={text.map((c) => ({ value: c.id, label: `#${c.name}` }))}
              onChange={(v) =>
                onPatch((s) => ({
                  ...s,
                  community: { ...community, updatesChannelId: v || null },
                }))
              }
            />
          </div>
        </>
      ) : null}
    </>
  )
}

/** ONBOARDING — the default channels a new member lands in. */
function Onboarding({ server, onPatch }: { server: Server; onPatch: Patch }) {
  const text = server.channels.filter((c) => c.kind === 'text')
  const defaults = server.channels.filter((c) => c.kind === 'text' && c.onboardingDefault)
  return (
    <>
      <Title>Onboarding</Title>
      <Note>
        Choose the top channels that all new members should start with.
      </Note>
      <Sub>Default channels ({defaults.length})</Sub>
      <ul className="srv-onboarding">
        {text.map((c) => (
          <li key={c.id}>
            <Toggle
              label={`#${c.name}`}
              value={c.onboardingDefault === true}
              onChange={(on) =>
                onPatch((s) => ({
                  ...s,
                  channels: s.channels.map((x) =>
                    x.id === c.id ? { ...x, onboardingDefault: on } : x,
                  ),
                }))
              }
            />
          </li>
        ))}
      </ul>
    </>
  )
}

/** SERVER GUIDE — what a new member is shown, from the server's own channels. */
function ServerGuide({ server }: { server: Server }) {
  const text = server.channels.filter((c) => c.kind === 'text')
  return (
    <>
      <Title>Server Guide</Title>
      <Note>
        Set up your Server Guide to help new members get started.
      </Note>
      <div className="srv-guide">
        <h4>Resources</h4>
        <ul>
          {text.slice(0, 3).map((c) => (
            <li key={c.id}>#{c.name}</li>
          ))}
        </ul>
        <h4>New Member To Do's</h4>
        <ul>
          {text.slice(0, 2).map((c) => (
            <li key={c.id}>Say hello in #{c.name}</li>
          ))}
        </ul>
      </div>
    </>
  )
}
