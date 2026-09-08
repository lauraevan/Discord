import { useState } from 'react'
import {
  ForumLayout,
  ForumSort,
  slowmodeLabel,
  SLOWMODE_STEPS,
  type Channel,
  type Server,
} from '../data'
import {
  Divider,
  Field,
  Note,
  Radio,
  SettingsLayer,
  Sub,
  Title,
  Toggle,
  Unavailable,
  type NavItem,
} from './SettingsLayer'

/** The layout previews Discord ships with its own forum settings. */
const LAYOUT_ART = import.meta.glob('../assets/forum/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

/**
 * Channel Settings.
 *
 * Sections and editable fields come from the client's own
 * ChannelSettingsSections and CHANNEL_SETTINGS_UPDATE payload — name, topic,
 * nsfw, rateLimitPerUser and the rest. See docs/discord-reference.md.
 */
export function ChannelSettings({
  channel,
  server,
  onPatch,
  onDelete,
  onClose,
}: {
  channel: Channel
  server: Server
  onPatch: (fn: (c: Channel) => Channel, audit?: { action: string; target: string }) => void
  onDelete: () => void
  onClose: () => void
}) {
  const [section, setSection] = useState('overview')
  const voice = channel.kind === 'voice'
  const forum = channel.kind === 'forum' || channel.kind === 'media'

  const nav: NavItem[] = [
    { head: channel.name },
    { id: 'overview', label: 'Overview' },
    { id: 'permissions', label: 'Permissions' },
    { id: 'invites', label: 'Invites' },
    { sep: true },
    { id: 'delete', label: 'Delete Channel', danger: true },
  ]

  return (
    <SettingsLayer nav={nav} section={section} onSection={setSection} onClose={onClose}>
      {section === 'overview' ? (
        <>
          <Title>Overview</Title>
          <Field
            label="CHANNEL NAME"
            value={channel.name}
            maxLength={100}
            onChange={(name) =>
              onPatch((c) => ({ ...c, name: name.toLowerCase().replace(/\s+/g, '-') }), {
                action: 'Channel renamed',
                target: name,
              })
            }
          />
          {!voice ? (
            <>
              <Field
                label="CHANNEL TOPIC"
                value={channel.topic ?? ''}
                maxLength={1024}
                textarea
                placeholder="Let everyone know how to use this channel!"
                onChange={(topic) => onPatch((c) => ({ ...c, topic }))}
              />
              <Divider />
              <Sub>Slowmode</Sub>
              <Note>
                Members will be restricted to sending one message and creating one thread per
                interval, unless they have Manage Channel or Manage Messages permissions.
              </Note>
              <div className="slowmode">
                <input
                  type="range"
                  min={0}
                  max={SLOWMODE_STEPS.length - 1}
                  value={Math.max(0, SLOWMODE_STEPS.indexOf(channel.slowmode ?? 0))}
                  aria-label="Slowmode"
                  onChange={(e) =>
                    onPatch(
                      (c) => ({ ...c, slowmode: SLOWMODE_STEPS[Number(e.target.value)] }),
                      { action: 'Slowmode changed', target: channel.name },
                    )
                  }
                />
                <span>{slowmodeLabel(channel.slowmode ?? 0)}</span>
              </div>
              {forum ? (
                <>
                  <Divider />
                  <Sub>Default Layout</Sub>
                  <Note>
                    Choose how posts are shown by default. Members can still switch to the other
                    view for themselves.
                  </Note>
                  <div className="layout-picks">
                    {(
                      [
                        [ForumLayout.LIST, 'List View', 'list-view'],
                        [ForumLayout.GALLERY, 'Gallery View', 'grid-view'],
                      ] as const
                    ).map(([value, label, art]) => (
                      <button
                        key={value}
                        className={
                          'layout-pick' +
                          ((channel.forumLayout ?? ForumLayout.LIST) === value ? ' on' : '')
                        }
                        onClick={() =>
                          onPatch((c) => ({ ...c, forumLayout: value }), {
                            action: 'Forum layout changed',
                            target: label,
                          })
                        }
                      >
                        <img src={LAYOUT_ART[`../assets/forum/${art}.webp`]} alt="" draggable={false} />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>

                  <Divider />
                  <Sub>Default Sort Order</Sub>
                  <Note>Choose the order posts are shown in by default.</Note>
                  <Radio
                    value={String(channel.forumSort ?? ForumSort.LATEST_ACTIVITY)}
                    options={[
                      [String(ForumSort.LATEST_ACTIVITY), 'Latest Activity'],
                      [String(ForumSort.CREATION_DATE), 'Date Posted'],
                    ]}
                    onChange={(v) =>
                      onPatch((c) => ({ ...c, forumSort: Number(v) as ForumSort }), {
                        action: 'Forum sort changed',
                        target: channel.name,
                      })
                    }
                  />
                </>
              ) : null}
              <Divider />
              <Toggle
                label="Age-Restricted Channel"
                note="Users will need to confirm they are of over legal age to view in the content in this channel."
                value={!!channel.nsfw}
                onChange={(nsfw) =>
                  onPatch((c) => ({ ...c, nsfw }), {
                    action: nsfw ? 'Channel marked age-restricted' : 'Age restriction removed',
                    target: channel.name,
                  })
                }
              />
            </>
          ) : (
            <Unavailable
              what="Bitrate, user limit and region"
              why="Voice quality settings only mean something with a voice server behind them."
            />
          )}
        </>
      ) : null}

      {section === 'permissions' ? (
        <>
          <Title>Permissions</Title>
          <Note>
            Use permissions to customise who can do what in this channel. Channel overrides layer on
            top of the server roles.
          </Note>
          <div className="role-list">
            {server.roles.map((r) => (
              <div className="role-row" key={r.id}>
                <span className="role-dot" style={{ background: r.color ?? '#99aab5' }} />
                <span className="role-name">{r.name}</span>
                <span className="role-count">inherits server permissions</span>
              </div>
            ))}
          </div>
          <Note>
            Per-channel overrides are stored server-side in Discord; this page only models the
            server-level roles, which you can edit in Server Settings → Roles.
          </Note>
        </>
      ) : null}

      {section === 'invites' ? (
        <>
          <Title>Invites</Title>
          <Note>Invites for this channel are listed under Server Settings → Invites.</Note>
        </>
      ) : null}

      {section === 'delete' ? (
        <>
          <Title>Delete Channel</Title>
          <Note>
            Are you sure you want to delete <b>#{channel.name}</b>? This cannot be undone.
          </Note>
          <button className="btn-danger" onClick={onDelete}>
            Delete Channel
          </button>
        </>
      ) : null}
    </SettingsLayer>
  )
}
