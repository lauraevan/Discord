import { useRef, useState } from 'react'
import {
  AutoModAction,
  AutoModTrigger,
  BOOST_TIERS,
  ExplicitFilter,
  KeywordPreset,
  PERMISSION_GROUPS,
  ROLE_COLORS,
  VerificationLevel,
  boostTierOf,
  inviteCode,
  uid,
  type Account,
  type AutoModRule,
  type Role,
  type Server,
} from '../data'
import { EMOJI } from '../emoji'
import { EmojiByName, EmojiGlyph } from '../markdown'
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
  Divider,
  Field,
  Note,
  Radio,
  SettingsLayer,
  Slider,
  Sub,
  Title,
  Toggle,
  Unavailable,
  type NavItem,
} from './SettingsLayer'
import { Avatar } from './UserArea'

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
  onPatch,
  onDelete,
  onClose,
}: {
  server: Server
  account: Account
  onPatch: (fn: (s: Server) => Server, audit?: { action: string; target: string }) => void
  onDelete: () => void
  onClose: () => void
}) {
  const [section, setSection] = useState('overview')
  const [roleId, setRoleId] = useState<string | null>(null)
  const [roleTab, setRoleTab] = useState<'display' | 'permissions' | 'members'>('display')
  const [roleQuery, setRoleQuery] = useState('')
  const [permQuery, setPermQuery] = useState('')
  const [emojiQuery, setEmojiQuery] = useState('')

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

  const role = server.roles.find((r) => r.id === roleId) ?? null

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
    >
      {section === 'overview' ? (
        <>
          <Title>Server Overview</Title>
          <div className="srv-overview">
            <div className="srv-icon" style={{ background: server.color }}>
              {server.initials}
            </div>
            <div className="srv-overview-fields">
              <Field
                label="SERVER NAME"
                value={server.name}
                maxLength={100}
                onChange={(name) =>
                  onPatch((s) => ({ ...s, name, initials: name.slice(0, 2).toUpperCase() }), {
                    action: 'Server name updated',
                    target: name,
                  })
                }
              />
              <div className="set-field">
                <label>ICON COLOUR</label>
                <div className="swatch-row">
                  {ROLE_COLORS.slice(0, 10).map((c) => (
                    <button
                      key={c}
                      className={'swatch' + (c === server.color ? ' on' : '')}
                      style={{ background: c }}
                      aria-label={c}
                      onClick={() =>
                        onPatch((s) => ({ ...s, color: c }), {
                          action: 'Server icon changed',
                          target: server.name,
                        })
                      }
                    >
                      {c === server.color ? <CheckIcon /> : null}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <Field
            label="SERVER DESCRIPTION"
            value={server.description ?? ''}
            maxLength={120}
            textarea
            placeholder="Tell people what your server is about."
            onChange={(description) => onPatch((s) => ({ ...s, description }))}
          />
          <Divider />
          <Sub>Default Notification Settings</Sub>
          <Note>
            This determines whether members who have not explicitly set their notification
            preferences will receive a notification for every message sent in this server.
          </Note>
          <Radio
            value={String(server.notifyLevel) as '0' | '1'}
            onChange={(v) =>
              onPatch((s) => ({ ...s, notifyLevel: Number(v) as 0 | 1 }), {
                action: 'Default notifications changed',
                target: v === '0' ? 'All Messages' : 'Only @mentions',
              })
            }
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
            Use roles to group your server members and assign permissions. Members use the colour of
            the highest role they have.
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
            <span>Roles — {ranked.length}</span>
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
              <span className="role-dot" style={{ background: role.color ?? '#99aab5' }} />
            )}
            <Title>Edit Role — {role.name}</Title>
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
                value={role.name}
                maxLength={100}
                onChange={(name) => patchRole(role.id, (r) => ({ ...r, name }), 'Role renamed')}
              />
              <div className="set-field">
                <label>ROLE COLOUR</label>
                <Note>
                  Members use the colour of the highest role they have that is not the default.
                </Note>
                <div className="swatch-row wrap">
                  <button
                    className={'swatch none' + (role.color === null ? ' on' : '')}
                    aria-label="Default colour"
                    onClick={() =>
                      patchRole(role.id, (r) => ({ ...r, color: null }), 'Role colour changed')
                    }
                  >
                    <CloseIcon />
                  </button>
                  {ROLE_COLORS.map((c) => (
                    <button
                      key={c}
                      className={'swatch' + (c === role.color ? ' on' : '')}
                      style={{ background: c }}
                      aria-label={c}
                      onClick={() =>
                        patchRole(role.id, (r) => ({ ...r, color: c }), 'Role colour changed')
                      }
                    >
                      {c === role.color ? <CheckIcon /> : null}
                    </button>
                  ))}
                </div>
              </div>
              <Divider />
              <Toggle
                label="Display role members separately from online members"
                value={role.hoist}
                onChange={(hoist) => patchRole(role.id, (r) => ({ ...r, hoist }), 'Role hoist changed')}
              />
              <Toggle
                label="Allow anyone to @mention this role"
                value={role.mentionable}
                onChange={(mentionable) =>
                  patchRole(role.id, (r) => ({ ...r, mentionable }), 'Role mentionable changed')
                }
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
                            aria-checked={role.permissions.includes(id)}
                            aria-label={label}
                            className={'switch' + (role.permissions.includes(id) ? ' on' : '')}
                            onClick={() =>
                              patchRole(
                                role.id,
                                (r) => ({
                                  ...r,
                                  permissions: r.permissions.includes(id)
                                    ? r.permissions.filter((p) => p !== id)
                                    : [...r.permissions, id],
                                }),
                                'Role permissions updated',
                              )
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
              <Note>
                Roles are handed out here. This server has one member — you — because there is no
                account server behind the page to hold anybody else.
              </Note>
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
            Add up to 50 custom emoji that anyone can use in this server. Animated GIF emoji may be
            used by members with Nitro. Upload needs a file host, so this picks from the bundled set
            instead.
          </Note>
          <div className="emoji-add">
            <input
              value={emojiQuery}
              placeholder="Search the set to add an emoji"
              aria-label="Search emoji"
              onChange={(e) => setEmojiQuery(e.target.value)}
            />
          </div>
          {emojiQuery.trim() ? (
            <div className="emoji-results">
              {EMOJI.filter((e) => e.name.includes(emojiQuery.trim().toLowerCase()))
                .slice(0, 24)
                .map((e) => (
                  <button
                    key={e.code}
                    className="emoji-result"
                    onClick={() => {
                      onPatch(
                        (s) =>
                          s.emojis.some((x) => x.name === e.name)
                            ? s
                            : {
                                ...s,
                                emojis: [
                                  ...s.emojis,
                                  { id: uid('emo'), name: e.name, code: e.code },
                                ],
                              },
                        { action: 'Emoji added', target: `:${e.name}:` },
                      )
                      setEmojiQuery('')
                    }}
                  >
                    <EmojiGlyph code={e.code} alt={e.name} />
                    <span>:{e.name}:</span>
                  </button>
                ))}
            </div>
          ) : null}
          <div className="emoji-table">
            <div className="emoji-table-head">
              <span>IMAGE</span>
              <span>NAME</span>
              <span>UPLOADED BY</span>
              <span />
            </div>
            {server.emojis.map((e) => (
              <div className="emoji-row" key={e.id}>
                <EmojiGlyph code={e.code} alt={e.name} />
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
          <div className="member-table">
            <div className="member-table-head">
              <span>NAME</span>
              <span>MEMBER SINCE</span>
              <span>JOINED DISCORD</span>
              <span>ROLES</span>
            </div>
            <div className="member-table-row">
              <span className="mt-name">
                <Avatar account={account} size={32} status={false} />
                <b>{account.name}</b>
                <i>{account.handle}</i>
              </span>
              <span>Today</span>
              <span>Today</span>
              <span className="mt-roles">
                {server.roles
                  .filter((r) => r.id === 'everyone' || r.permissions.length)
                  .map((r) => (
                    <span className="role-pill" key={r.id}>
                      <span className="role-dot" style={{ background: r.color ?? '#99aab5' }} />
                      {r.name}
                    </span>
                  ))}
                <button className="role-pill add" aria-label="Add role">
                  <PlusIcon />
                </button>
              </span>
            </div>
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
          <Note>Here is a list of every invite currently active on this server.</Note>
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
                <span>7 days</span>
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
              <div className="table-empty">There are no active invites.</div>
            ) : null}
          </div>
        </>
      ) : null}

      {section === 'bans' ? (
        <>
          <Title>Bans — {server.bans.length}</Title>
          <Note>
            Bans by name. Since you are the only member, this list stays empty unless you add one.
          </Note>
          {!server.bans.length ? <div className="table-empty">No bans.</div> : null}
        </>
      ) : null}

      {section === 'audit_log' ? (
        <>
          <Title>Audit Log</Title>
          <Note>A record of the changes made in this server. Every entry below is a real action you took here.</Note>
          <div className="audit">
            {server.audit.length ? (
              server.audit.map((a) => (
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
              <div className="table-empty">Nothing has happened in this server yet.</div>
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

      {['integrations', 'app_directory', 'discovery', 'partner', 'analytics', 'role_subscriptions', 'guild_products'].includes(
        section,
      ) ? (
        <>
          <Title>{(nav.find((n) => 'id' in n && n.id === section) as { label: string }).label}</Title>
          <Unavailable
            what="Not available in a page"
            why={
              section === 'integrations' || section === 'app_directory'
                ? 'Bots and apps are programs on Discord’s side; there is nothing here for them to connect to.'
                : section === 'role_subscriptions' || section === 'guild_products'
                  ? 'Selling anything needs Discord’s billing systems and a payout account.'
                  : 'Discovery, the partner programme and analytics are decided by Discord about a real server.'
            }
          />
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
  const inCategory = (id: string | null) => server.channels.filter((c) => c.categoryId === id)
  return (
    <>
      <Title>Channels</Title>
      <Note>
        Categories and channels, in the order the sidebar shows them. Dragging is not wired up;
        the arrows move a channel between categories.
      </Note>
      <div className="srv-channels">
        {[null, ...server.categories.map((c) => c.id)].map((catId) => {
          const cat = server.categories.find((c) => c.id === catId)
          const rows = inCategory(catId)
          if (catId !== null && rows.length === 0 && cat == null) return null
          return (
            <section key={catId ?? 'none'} className="srv-cat">
              <h4>{cat ? cat.name : 'No category'}</h4>
              {rows.length === 0 ? (
                <div className="table-empty">Nothing in here.</div>
              ) : (
                <ul>
                  {rows.map((ch) => (
                    <li key={ch.id}>
                      <span className="srv-chan-kind">{ch.kind}</span>
                      <b>{ch.name}</b>
                      <select
                        value={ch.categoryId ?? ''}
                        onChange={(e) =>
                          onPatch(
                            (s) => ({
                              ...s,
                              channels: s.channels.map((c) =>
                                c.id === ch.id
                                  ? { ...c, categoryId: e.target.value || null }
                                  : c,
                              ),
                            }),
                            { action: 'Channel moved', target: ch.name },
                          )
                        }
                      >
                        <option value="">No category</option>
                        {server.categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
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
  const slots = 5 + server.boostTier * 10
  return (
    <>
      <Title>Stickers</Title>
      <Note>
        {stickers.length} of {slots} slots used. A server starts with five and each boost level
        adds ten. Every sticker is filed under an emoji, which is what people search it by.
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
  const slots = 8 + server.boostTier * 8
  return (
    <>
      <Title>Soundboard</Title>
      <Note>
        {sounds.length} of {slots} slots used. Playing one needs an audio file and a voice
        connection, neither of which a page has, so these are the entries rather than the sounds.
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
      <Note>
        Four characters members can wear beside their name, with a badge from one of the packs.
        Discord unlocks the packs per server; all four are offered here.
      </Note>
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
      <Title>Widget</Title>
      <Toggle
        label="Enable server widget"
        note="Lets a website show who is online and offer an invite."
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
        <select
          className="field"
          value={widget.channelId ?? ''}
          onChange={(e) =>
            onPatch((s) => ({
              ...s,
              widget: { ...widget, channelId: e.target.value || null },
            }))
          }
        >
          <option value="">No invite</option>
          {server.channels
            .filter((c) => c.kind === 'text')
            .map((c) => (
              <option key={c.id} value={c.id}>
                #{c.name}
              </option>
            ))}
        </select>
      </div>
      <Sub>Widget endpoints</Sub>
      <pre className="srv-code">
        https://discord.com/api/guilds/{server.id}/widget.json{'\n'}
        https://discord.com/api/guilds/{server.id}/widget.png?style=banner2
      </pre>
      <Note>Both are Discord's own endpoints, and both need a real server behind them.</Note>
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
      <Note>
        The link is the shape Discord mints. It resolves on Discord's side, so it will not open
        anything from here.
      </Note>
    </>
  )
}

/** CUSTOM INVITE LINK — the vanity URL, which Discord gates behind Level 3. */
function Vanity({ server, onPatch }: { server: Server; onPatch: Patch }) {
  const unlocked = server.boostTier >= 3
  return (
    <>
      <Title>Custom Invite Link</Title>
      {unlocked ? null : (
        <Note>
          Level 3 unlocks this. The server is Level {server.boostTier} with{' '}
          {server.boosts ?? 0} boosts — {BOOST_TIERS[3] - (server.boosts ?? 0)} more to go.
        </Note>
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
const BOOST_PERKS: string[][] = [
  ['50 emoji slots', '5 sticker slots', '25MB uploads'],
  ['100 emoji slots', '15 sticker slots', '50MB uploads', 'Animated server icon', '128kbps audio'],
  ['150 emoji slots', '30 sticker slots', '100MB uploads', 'Server banner', '256kbps audio'],
  ['250 emoji slots', '60 sticker slots', '100MB uploads', 'Custom invite link', '384kbps audio'],
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
        A webhook is a URL that posts into a channel. These are minted in Discord's own shape;
        nothing will receive a POST, since there is no server on the other end.
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
        <div className="table-empty">No webhooks.</div>
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
              <select
                value={h.channelId}
                onChange={(e) =>
                  onPatch((s) => ({
                    ...s,
                    webhooks: (s.webhooks ?? []).map((x) =>
                      x.id === h.id ? { ...x, channelId: e.target.value } : x,
                    ),
                  }))
                }
              >
                {server.channels
                  .filter((c) => c.kind === 'text')
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      #{c.name}
                    </option>
                  ))}
              </select>
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
        The trigger and action numbers are Discord's own. A rule that blocks a message really
        blocks it — the composer refuses to send one that matches.
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
function Community({ server, onPatch }: { server: Server; onPatch: Patch }) {
  const community = server.community
  const text = server.channels.filter((c) => c.kind === 'text')
  return (
    <>
      <Title>Enable Community</Title>
      <Note>
        A community server needs a rules channel and a channel for Discord's own updates, and
        Discord requires verification and the content filter turned up before it will switch on.
      </Note>
      <Toggle
        label="Community enabled"
        note="Adds the rules and updates channels, and the Server Guide."
        value={community != null}
        onChange={(on) =>
          onPatch(
            (s) => ({
              ...s,
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
            <select
              className="field"
              value={community.rulesChannelId ?? ''}
              onChange={(e) =>
                onPatch((s) => ({
                  ...s,
                  community: { ...community, rulesChannelId: e.target.value || null },
                }))
              }
            >
              {text.map((c) => (
                <option key={c.id} value={c.id}>
                  #{c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="set-field">
            <label>COMMUNITY UPDATES CHANNEL</label>
            <select
              className="field"
              value={community.updatesChannelId ?? ''}
              onChange={(e) =>
                onPatch((s) => ({
                  ...s,
                  community: { ...community, updatesChannelId: e.target.value || null },
                }))
              }
            >
              {text.map((c) => (
                <option key={c.id} value={c.id}>
                  #{c.name}
                </option>
              ))}
            </select>
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
        Discord requires a community server, a default channel, and questions before onboarding
        can be turned on. The default channels are the ones a new member sees first.
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
        The guide is built out of the server's own channels: the ones to read first, and the ones
        to say hello in.
      </Note>
      <div className="srv-guide">
        <h4>Resources</h4>
        <ul>
          {text.slice(0, 3).map((c) => (
            <li key={c.id}>#{c.name}</li>
          ))}
        </ul>
        <h4>New member todos</h4>
        <ul>
          {text.slice(0, 2).map((c) => (
            <li key={c.id}>Say hello in #{c.name}</li>
          ))}
        </ul>
      </div>
    </>
  )
}
