import { useState } from 'react'
import {
  inviteCode,
  PERMISSION_GROUPS,
  ROLE_COLORS,
  uid,
  type Account,
  type Role,
  type Server,
} from '../data'
import { EMOJI } from '../emoji'
import { EmojiGlyph } from '../markdown'
import { CheckIcon, CloseIcon, PlusIcon, TrashIcon } from '../ui/Icons'
import {
  Divider,
  Field,
  Note,
  Radio,
  SettingsLayer,
  Sub,
  Title,
  Toggle,
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
  const [emojiQuery, setEmojiQuery] = useState('')

  const nav: NavItem[] = [
    { head: server.name },
    { id: 'overview', label: 'Overview' },
    { id: 'roles', label: 'Roles' },
    { id: 'emoji', label: 'Emoji' },
    { id: 'stickers', label: 'Stickers' },
    { id: 'soundboard', label: 'Soundboard' },
    { id: 'widget', label: 'Widget' },
    { id: 'templates', label: 'Server Template' },
    { id: 'vanity_url', label: 'Custom Invite Link' },
    { sep: true },
    { head: 'Community' },
    { id: 'community', label: 'Enable Community' },
    { id: 'onboarding', label: 'Onboarding' },
    { sep: true },
    { head: 'Apps' },
    { id: 'integrations', label: 'Integrations' },
    { id: 'app_directory', label: 'App Directory' },
    { sep: true },
    { head: 'Moderation' },
    { id: 'safety', label: 'Safety Setup' },
    { id: 'automod', label: 'AutoMod' },
    { id: 'audit_log', label: 'Audit Log' },
    { id: 'bans', label: 'Bans' },
    { sep: true },
    { head: 'User Management' },
    { id: 'members', label: 'Members' },
    { id: 'invites', label: 'Invites' },
    { sep: true },
    { id: 'delete', label: 'Delete Server', danger: true },
  ]

  const role = server.roles.find((r) => r.id === roleId) ?? null

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
          <div className="set-head-row">
            <Title>Roles</Title>
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
              }}
            >
              Create Role
            </button>
          </div>
          <Note>
            Use roles to group your server members and assign permissions. Members use the colour of
            the highest role they have.
          </Note>
          <div className="role-list">
            {server.roles.map((r) => (
              <div className="role-row" key={r.id}>
                <span className="role-dot" style={{ background: r.color ?? '#99aab5' }} />
                <button className="role-name" onClick={() => setRoleId(r.id)}>
                  {r.name}
                </button>
                <span className="role-count">{r.id === 'everyone' ? 1 : 0} member</span>
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
                ) : null}
              </div>
            ))}
          </div>
        </>
      ) : null}

      {role ? (
        <>
          <button className="back-link" onClick={() => setRoleId(null)}>
            ← Back to roles
          </button>
          <Title>Edit Role — {role.name}</Title>
          {role.id !== 'everyone' ? (
            <>
              <Field
                label="ROLE NAME"
                value={role.name}
                maxLength={100}
                onChange={(name) => patchRole(role.id, (r) => ({ ...r, name }), 'Role renamed')}
              />
              <div className="set-field">
                <label>ROLE COLOUR</label>
                <div className="swatch-row wrap">
                  <button
                    className={'swatch none' + (role.color === null ? ' on' : '')}
                    aria-label="Default colour"
                    onClick={() => patchRole(role.id, (r) => ({ ...r, color: null }), 'Role colour changed')}
                  >
                    <CloseIcon />
                  </button>
                  {ROLE_COLORS.map((c) => (
                    <button
                      key={c}
                      className={'swatch' + (c === role.color ? ' on' : '')}
                      style={{ background: c }}
                      aria-label={c}
                      onClick={() => patchRole(role.id, (r) => ({ ...r, color: c }), 'Role colour changed')}
                    >
                      {c === role.color ? <CheckIcon /> : null}
                    </button>
                  ))}
                </div>
              </div>
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
              <Divider />
            </>
          ) : null}
          <Sub>Permissions</Sub>
          {PERMISSION_GROUPS.map(([group, perms]) => (
            <div key={group} className="perm-group">
              <div className="perm-head">{group}</div>
              {perms.map(([id, label, note]) => (
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
          ))}
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
                  <Avatar account={account} size={20} />
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
                <Avatar account={account} size={32} />
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
                  <Avatar account={account} size={24} />
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
                  <Avatar account={account} size={32} />
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

      {['stickers', 'soundboard', 'widget', 'templates', 'vanity_url', 'community', 'onboarding', 'integrations', 'app_directory', 'safety', 'automod'].includes(
        section,
      ) ? (
        <>
          <Title>{(nav.find((n) => 'id' in n && n.id === section) as { label: string }).label}</Title>
          <div className="set-unavailable">
            <b>Needs Discord's servers</b>
            <span>
              {section === 'stickers' || section === 'soundboard'
                ? 'Stickers and soundboard sounds are uploaded files served from Discord’s CDN.'
                : section === 'integrations' || section === 'app_directory' || section === 'automod'
                  ? 'Webhooks, bots and AutoMod rules all run server-side.'
                  : 'This section configures how the server appears to other people, which needs a real server.'}
            </span>
          </div>
        </>
      ) : null}
    </SettingsLayer>
  )
}
