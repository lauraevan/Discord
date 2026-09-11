import { useMemo, useState } from 'react'
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
  SaveBar,
  SettingsLayer,
  Sub,
  Title,
  Toggle,
  Unavailable,
  useDraft,
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

  /**
   * Overview's draft. Discord's channel Overview carries the same
   * unsaved-changes bar Server Settings does: the fields write here and Save
   * Changes carries them over together.
   */
  const source = useMemo(
    () => ({
      name: channel.name,
      topic: channel.topic ?? '',
      slowmode: channel.slowmode ?? 0,
      nsfw: !!channel.nsfw,
      forumLayout: channel.forumLayout ?? ForumLayout.LIST,
      forumSort: channel.forumSort ?? ForumSort.LATEST_ACTIVITY,
    }),
    [channel],
  )
  const ov = useDraft(source)
  const save = () =>
    onPatch((c) => ({ ...c, ...ov.draft }), { action: 'Channel updated', target: ov.draft.name })

  const nav: NavItem[] = [
    { head: channel.name },
    { id: 'overview', label: 'Overview' },
    { id: 'permissions', label: 'Permissions' },
    { id: 'invites', label: 'Invites' },
    { sep: true },
    { id: 'delete', label: 'Delete Channel', danger: true },
  ]

  return (
    <SettingsLayer
      nav={nav}
      section={section}
      onSection={setSection}
      onClose={onClose}
      notice={
        <SaveBar open={section === 'overview' && ov.dirty} onReset={ov.reset} onSave={save} />
      }
    >
      {section === 'overview' ? (
        <>
          <Title>Overview</Title>
          <Field
            label="CHANNEL NAME"
            value={ov.draft.name}
            maxLength={100}
            onChange={(name) =>
              ov.patch((d) => ({ ...d, name: name.toLowerCase().replace(/\s+/g, '-') }))
            }
          />
          {!voice ? (
            <>
              <Field
                label="CHANNEL TOPIC"
                value={ov.draft.topic}
                maxLength={1024}
                textarea
                placeholder="Let everyone know how to use this channel!"
                onChange={(topic) => ov.patch((d) => ({ ...d, topic }))}
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
                  value={Math.max(0, SLOWMODE_STEPS.indexOf(ov.draft.slowmode))}
                  aria-label="Slowmode"
                  onChange={(e) =>
                    ov.patch((d) => ({ ...d, slowmode: SLOWMODE_STEPS[Number(e.target.value)] }))
                  }
                />
                <span>{slowmodeLabel(ov.draft.slowmode)}</span>
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
                          (ov.draft.forumLayout === value ? ' on' : '')
                        }
                        onClick={() => ov.patch((d) => ({ ...d, forumLayout: value }))}
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
                    value={String(ov.draft.forumSort)}
                    options={[
                      [String(ForumSort.LATEST_ACTIVITY), 'Latest Activity'],
                      [String(ForumSort.CREATION_DATE), 'Date Posted'],
                    ]}
                    onChange={(v) => ov.patch((d) => ({ ...d, forumSort: Number(v) as ForumSort }))}
                  />
                </>
              ) : null}
              <Divider />
              <Toggle
                label="Age-Restricted Channel"
                note="Users will need to confirm they are of over legal age to view in the content in this channel."
                value={ov.draft.nsfw}
                onChange={(nsfw) => ov.patch((d) => ({ ...d, nsfw }))}
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
