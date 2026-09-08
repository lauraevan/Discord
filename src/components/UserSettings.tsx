import { useState } from 'react'
import {
  bannerColorOf,
  statusLabel,
  type Account,
  type Server,
  type ServerProfile,
  type Status,
} from '../data'
import { KEYBINDS, LOCALES, type Prefs } from '../prefs'
import { GRADIENTS, allThemes, colorThemes, defaultThemes, type Theme } from '../themes'
import { CheckIcon, CloseIcon, LockIcon } from '../ui/Icons'
import { BADGES } from '../badges'
import { COLLECTIONS } from '../shop'
import { NAMEPLATES } from '../nameplates'
import { NAME_FONTS } from '../namefonts'
import {
  colorCount,
  NAME_EFFECTS,
  NameEffect,
  nameStyleCss,
  type NameStyle,
} from '../namestyles'
import { DisplayName } from '../ui/DisplayName'
import { Nameplate } from '../ui/Nameplate'
import { DECORATIONS, Decoration } from '../ui/Decorations'
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
import { DEFAULT_AVATAR_COLORS, DefaultAvatar, defaultAvatarIndex } from '../ui/Art'
import { SERVICES, connect, logoOf, serviceOf, type Connection } from '../connections'
import { StatusGlyph } from '../ui/Status'

/**
 * User Settings.
 *
 * The sidebar is the client's own section list, in the client's order and
 * groups — see docs/discord-reference.md. Panes that need a server, a payment
 * or a device the page cannot reach say so rather than faking a control.
 */
export function UserSettings({
  account,
  servers,
  prefs,
  themeId,
  premium,
  onAccount,
  onPrefs,
  onTheme,
  onClose,
  onSignOut,
}: {
  account: Account
  /** the servers the account is in, for its per-server profiles */
  servers: Server[]
  prefs: Prefs
  themeId: string
  /** Nitro subscribers get the background gradients, as they do in the client */
  premium: boolean
  onAccount: (a: Account) => void
  onPrefs: (p: Partial<Prefs>) => void
  onTheme: (t: Theme) => void
  onClose: () => void
  onSignOut: () => void
}) {
  const [section, setSection] = useState('account')
  // the gradients follow the base appearance, the way the client's do
  const scheme = allThemes.find((t) => t.id === themeId)?.tokens.scheme ?? 'dark'
  const gradients = colorThemes.filter((t) => t.tokens.scheme === scheme)
  const set = <K extends keyof Prefs>(k: K, v: Prefs[K]) => onPrefs({ [k]: v } as Partial<Prefs>)

  const nav: NavItem[] = [
    { head: 'User Settings' },
    { id: 'account', label: 'My Account' },
    { id: 'profiles', label: 'Profiles' },
    { id: 'content_social', label: 'Content & Social' },
    { id: 'data_privacy', label: 'Data & Privacy' },
    { id: 'family_center', label: 'Family Center' },
    { id: 'authorized_apps', label: 'Authorized Apps' },
    { id: 'sessions', label: 'Devices' },
    { id: 'connections', label: 'Connections' },
    { id: 'clips', label: 'Clips' },
    { id: 'friend_requests', label: 'Friend Requests' },
    { sep: true },
    { head: 'Billing Settings' },
    { id: 'premium', label: 'Nitro' },
    { id: 'guild_boosting', label: 'Server Boost' },
    { id: 'subscriptions', label: 'Subscriptions' },
    { id: 'inventory', label: 'Gift Inventory' },
    { id: 'billing', label: 'Billing' },
    { sep: true },
    { head: 'App Settings' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'accessibility', label: 'Accessibility' },
    { id: 'voice', label: 'Voice & Video' },
    { id: 'text', label: 'Text & Images' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'keybinds', label: 'Keybinds' },
    { id: 'locale', label: 'Language' },
    { id: 'streamer_mode', label: 'Streamer Mode' },
    { id: 'advanced', label: 'Advanced' },
    { sep: true },
    { head: 'Activity Settings' },
    { id: 'activity_privacy', label: 'Activity Privacy' },
    { id: 'registered_games', label: 'Registered Games' },
    { id: 'overlay', label: 'Game Overlay' },
    { sep: true },
    { id: 'changelog', label: "What's New" },
    { id: 'logout', label: 'Log Out', danger: true },
  ]

  return (
    <SettingsLayer nav={nav} section={section} onSection={setSection} onClose={onClose}>
      {section === 'account' ? (
        <>
          <Title>My Account</Title>
          <div className="acct-card">
            <div className="acct-banner" style={{ background: bannerColorOf(account) }} />
            <div className="acct-body">
              <span className="acct-avatar">
                <Avatar account={account} size={80} />
              </span>
              <div className="acct-names">
                <b>{account.name}</b>
                <span>{account.handle}</span>
              </div>
              <button className="btn-primary" onClick={() => setSection('profiles')}>
                Edit User Profile
              </button>
            </div>
            <div className="acct-fields">
              {[
                ['Display Name', account.name],
                ['Username', account.handle],
                ['Email', '••••••••••@••••••.com'],
                ['Phone Number', "You haven't added a phone number yet."],
              ].map(([k, v]) => (
                <div className="acct-field" key={k}>
                  <div>
                    <span>{k}</span>
                    <b>{v}</b>
                  </div>
                  <button className="btn-secondary" onClick={() => setSection('profiles')}>
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </div>
          <Divider />
          <Sub>Password and Authentication</Sub>
          <button className="btn-primary">Change Password</button>
          <Note>
            Two-factor authentication, backup codes and security keys need an account server, so
            they are not wired up here.
          </Note>
          <Divider />
          <Sub>Account Removal</Sub>
          <Note>Disabling your account means you can recover it at any time after taking this action.</Note>
          <div className="btn-row">
            <button className="btn-danger">Disable Account</button>
            <button className="btn-danger-outline">Delete Account</button>
          </div>
        </>
      ) : null}

      {section === 'profiles' ? (
        <Profiles
          account={account}
          servers={servers}
          premium={premium}
          onAccount={onAccount}
        />
      ) : null}

      {section === 'appearance' ? (
        <>
          <Title>Appearance</Title>
          <Sub>Theme</Sub>
          <Toggle
            label="Sync with computer"
            note="Follow your system's light or dark setting."
            value={prefs.syncWithComputer}
            onChange={(v) => set('syncWithComputer', v)}
          />
          <div className="theme-grid big">
            {defaultThemes.map((t) => (
              <button
                key={t.id}
                className={'theme-card' + (t.id === themeId ? ' on' : '')}
                onClick={() => onTheme(t)}
              >
                <span className="theme-chip" style={{ background: t.swatch }} />
                {t.name}
              </button>
            ))}
          </div>
          <Sub>Colours</Sub>
          <div className="theme-grid">
            {gradients.map((t) => (
              <button
                key={t.id}
                className={
                  'theme-swatch' + (t.id === themeId ? ' on' : '') + (premium ? '' : ' locked')
                }
                style={{ background: t.swatch }}
                title={t.name}
                aria-label={t.name}
                disabled={!premium}
                onClick={() => onTheme(t)}
              >
                {t.id === themeId ? <CheckIcon /> : null}
                {premium ? null : <LockIcon size={14} />}
              </button>
            ))}
          </div>
          {premium ? null : (
            <p className="theme-note">
              Nitro unlocks these background gradients, and they follow whichever of Light
              or Dark you are on.
            </p>
          )}
          <Divider />
          <Sub>Message Display</Sub>
          <Radio
            value={prefs.messageDisplay}
            onChange={(v) => set('messageDisplay', v)}
            options={[
              ['cozy', 'Cozy', 'Modern, beautiful, and default.'],
              ['compact', 'Compact', 'Fit more messages on screen at one time.'],
            ]}
          />
          <Divider />
          <Slider
            label="Chat Font Scaling"
            value={prefs.fontScale}
            min={12}
            max={24}
            suffix="px"
            onChange={(v) => set('fontScale', v)}
          />
          <Slider
            label="Space Between Message Groups"
            value={prefs.spaceBetween}
            min={0}
            max={24}
            onChange={(v) => set('spaceBetween', v)}
          />
          <Slider
            label="Zoom Level"
            value={prefs.zoom}
            min={50}
            max={200}
            step={10}
            suffix="%"
            onChange={(v) => set('zoom', v)}
          />
          <Slider
            label="Saturation"
            value={prefs.saturation}
            min={0}
            max={100}
            suffix="%"
            onChange={(v) => set('saturation', v)}
          />
          <Toggle
            label="Always underline links"
            value={prefs.underlineLinks}
            onChange={(v) => set('underlineLinks', v)}
          />
        </>
      ) : null}

      {section === 'accessibility' ? (
        <>
          <Title>Accessibility</Title>
          <Sub>Motion</Sub>
          <Toggle
            label="Reduced Motion"
            note="Cuts down the animations in the app."
            value={prefs.reducedMotion}
            onChange={(v) => set('reducedMotion', v)}
          />
          <Toggle
            label="Play animated emoji"
            value={prefs.playGifs}
            onChange={(v) => set('playGifs', v)}
          />
          <Sub>Sticker Animation</Sub>
          <Radio
            value={prefs.stickerAnimation}
            onChange={(v) => set('stickerAnimation', v)}
            options={[
              ['always', 'Always animate'],
              ['interaction', 'Animate on interaction', 'Animate when you hover or focus.'],
              ['never', 'Never animate'],
            ]}
          />
          <Divider />
          <Sub>Text-to-Speech</Sub>
          <Toggle
            label="Allow playback and usage of /tts command"
            value={prefs.tts}
            onChange={(v) => set('tts', v)}
          />
          <Divider />
          <Sub>Chat Input</Sub>
          <Toggle
            label="Show send message button"
            value={prefs.showSendButton}
            onChange={(v) => set('showSendButton', v)}
          />
          <Slider
            label="Saturation"
            value={prefs.saturation}
            min={0}
            max={100}
            suffix="%"
            onChange={(v) => set('saturation', v)}
          />
        </>
      ) : null}

      {section === 'text' ? (
        <>
          <Title>Text &amp; Images</Title>
          <Sub>Embeds and Link Previews</Sub>
          <Toggle
            label="Show embeds and preview website links pasted into chat"
            value={prefs.previewLinks}
            onChange={(v) => set('previewLinks', v)}
          />
          <Toggle
            label="Show images, videos, and lolcats when posted as links to chat"
            value={prefs.inlineMedia}
            onChange={(v) => set('inlineMedia', v)}
          />
          <Toggle
            label="When posted as links to chat"
            value={prefs.inlineEmbedMedia}
            onChange={(v) => set('inlineEmbedMedia', v)}
          />
          <Divider />
          <Sub>Emoji</Sub>
          <Toggle
            label="Automatically convert emoticons in your messages to emoji"
            note=":-) becomes 🙂"
            value={prefs.convertEmoticons}
            onChange={(v) => set('convertEmoticons', v)}
          />
          <Toggle
            label="Show emoji reactions on messages"
            value={prefs.showEmojiReactions}
            onChange={(v) => set('showEmojiReactions', v)}
          />
          <Divider />
          <Sub>Show spoiler content</Sub>
          <Radio
            value={prefs.renderSpoilers}
            onChange={(v) => set('renderSpoilers', v)}
            options={[
              ['on_click', 'On click'],
              ['owned', 'On servers I moderate'],
              ['always', 'Always'],
            ]}
          />
        </>
      ) : null}

      {section === 'notifications' ? (
        <>
          <Title>Notifications</Title>
          <Toggle
            label="Enable Desktop Notifications"
            value={prefs.desktopNotifications}
            onChange={(v) => set('desktopNotifications', v)}
          />
          <Toggle
            label="Enable Unread Message Badge"
            note="Shows a red badge on the app icon when you have unread messages."
            value={prefs.unreadBadge}
            onChange={(v) => set('unreadBadge', v)}
          />
          <Toggle
            label="Enable Taskbar Flashing"
            value={prefs.taskbarFlash}
            onChange={(v) => set('taskbarFlash', v)}
          />
          <Divider />
          <Sub>Text-to-Speech Notifications</Sub>
          <Radio
            value={prefs.ttsNotifications}
            onChange={(v) => set('ttsNotifications', v)}
            options={[
              ['never', 'Never'],
              ['current', 'For the currently selected channel'],
              ['all', 'For all channels'],
            ]}
          />
          <Divider />
          <Sub>Sounds</Sub>
          <Toggle
            label="Disable all sounds"
            value={prefs.disableSounds}
            onChange={(v) => set('disableSounds', v)}
          />
        </>
      ) : null}

      {section === 'voice' ? (
        <>
          <Title>Voice &amp; Video</Title>
          <Unavailable
            what="Devices"
            why="Input and output device selection needs microphone access and a voice server; this page has neither."
          />
          <Sub>Input Mode</Sub>
          <Radio
            value={prefs.inputMode}
            onChange={(v) => set('inputMode', v)}
            options={[
              ['voice', 'Voice Activity'],
              ['ptt', 'Push to Talk'],
            ]}
          />
          <Slider
            label="Input Volume"
            value={prefs.inputVolume}
            min={0}
            max={200}
            suffix="%"
            onChange={(v) => set('inputVolume', v)}
          />
          <Slider
            label="Output Volume"
            value={prefs.outputVolume}
            min={0}
            max={200}
            suffix="%"
            onChange={(v) => set('outputVolume', v)}
          />
          <Divider />
          <Sub>Voice Processing</Sub>
          <Toggle
            label="Echo Cancellation"
            value={prefs.echoCancellation}
            onChange={(v) => set('echoCancellation', v)}
          />
          <Toggle
            label="Noise Suppression"
            value={prefs.noiseSuppression}
            onChange={(v) => set('noiseSuppression', v)}
          />
          <Toggle
            label="Automatic Gain Control"
            value={prefs.automaticGainControl}
            onChange={(v) => set('automaticGainControl', v)}
          />
          <Toggle
            label="Enable Quality of Service High Packet Priority"
            value={prefs.qos}
            onChange={(v) => set('qos', v)}
          />
        </>
      ) : null}

      {section === 'keybinds' ? (
        <>
          <Title>Keybinds</Title>
          <Note>
            The shortcuts this app honours. Discord's client lists 86 actions; the rest need a
            desktop app — global hotkeys, push-to-talk and the overlay cannot be bound from a page.
          </Note>
          <div className="keybinds">
            {KEYBINDS.map(([id, label, combo]) => (
              <div className="keybind" key={id}>
                <span>{label}</span>
                <kbd>{combo}</kbd>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {section === 'locale' ? (
        <>
          <Title>Language</Title>
          <Note>Choosing a language here changes the label only — the app itself is English.</Note>
          <div className="locales">
            {LOCALES.map(([code, native, english]) => (
              <button
                key={code}
                className={'locale' + (code === prefs.locale ? ' on' : '')}
                onClick={() => set('locale', code)}
              >
                <span className="locale-code">{code.slice(0, 2).toUpperCase()}</span>
                <span className="locale-names">
                  <b>{native}</b>
                  <i>{english}</i>
                </span>
                {code === prefs.locale ? <CheckIcon /> : null}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {section === 'streamer_mode' ? (
        <>
          <Title>Streamer Mode</Title>
          <Toggle
            label="Enable Streamer Mode"
            value={prefs.streamerMode}
            onChange={(v) => set('streamerMode', v)}
          />
          <Divider />
          <Sub>Streamer Mode Options</Sub>
          <Toggle
            label="Hide Personal Information"
            note="Hides your email, connected accounts and note."
            value={prefs.hidePersonalInfo}
            onChange={(v) => set('hidePersonalInfo', v)}
          />
          <Toggle
            label="Hide Invite Links"
            value={prefs.hideInvites}
            onChange={(v) => set('hideInvites', v)}
          />
          <Toggle
            label="Disable Sounds"
            value={prefs.disableSounds}
            onChange={(v) => set('disableSounds', v)}
          />
          <Toggle
            label="Enable Automatically"
            note="Turns on when a streaming program is detected."
            value={prefs.streamerAutoEnable}
            onChange={(v) => set('streamerAutoEnable', v)}
          />
        </>
      ) : null}

      {section === 'advanced' ? (
        <>
          <Title>Advanced</Title>
          <Toggle
            label="Developer Mode"
            note="Adds Copy ID to right-click menus."
            value={prefs.developerMode}
            onChange={(v) => set('developerMode', v)}
          />
          <Toggle
            label="Hardware Acceleration"
            note="Uses your GPU to make Discord smoother."
            value={prefs.hardwareAcceleration}
            onChange={(v) => set('hardwareAcceleration', v)}
          />
        </>
      ) : null}

      {section === 'data_privacy' ? (
        <>
          <Title>Data &amp; Privacy</Title>
          <Sub>Safe Direct Messaging</Sub>
          <Radio
            value={String(prefs.dmScanLevel) as '0' | '1' | '2'}
            onChange={(v) => set('dmScanLevel', Number(v) as 0 | 1 | 2)}
            options={[
              ['0', 'Keep me safe', 'Scan direct messages from everyone.'],
              ['1', 'My friends are nice', 'Scan direct messages from everyone except friends.'],
              ['2', 'Do not scan', 'Direct messages will not be scanned.'],
            ]}
          />
          <Divider />
          <Sub>Server Privacy Defaults</Sub>
          <Toggle
            label="Allow direct messages from server members"
            value={prefs.allowDmsFromServerMembers}
            onChange={(v) => set('allowDmsFromServerMembers', v)}
          />
          <Divider />
          <Sub>Who Can Add You As A Friend</Sub>
          <Radio
            value={prefs.friendRequests}
            onChange={(v) => set('friendRequests', v)}
            options={[
              ['everyone', 'Everyone'],
              ['friends_of_friends', 'Friends of Friends'],
              ['server_members', 'Server Members'],
              ['none', 'No one'],
            ]}
          />
          <Divider />
          <Sub>Request Your Data</Sub>
          <Note>Everything this app stores is in your browser's localStorage, under `discord-ui:v3:*`.</Note>
        </>
      ) : null}

      {section === 'activity_privacy' ? (
        <>
          <Title>Activity Privacy</Title>
          <Toggle
            label="Share your detected activities with others"
            value={prefs.activityStatus}
            onChange={(v) => set('activityStatus', v)}
          />
          <Note>Game detection needs the desktop app, so nothing will ever be detected here.</Note>
        </>
      ) : null}

      {[
        'content_social',
        'family_center',
        'authorized_apps',
        'sessions',
        'clips',
        'friend_requests',
        'premium',
        'guild_boosting',
        'subscriptions',
        'inventory',
        'billing',
        'registered_games',
        'overlay',
      ].includes(section) ? (
        <>
          <Title>{nav.find((n) => 'id' in n && n.id === section && 'label' in n)?.['label' as never]}</Title>
          <Unavailable
            what="Not available in a page"
            why={
              section === 'premium' || section === 'guild_boosting' || section === 'subscriptions' || section === 'billing' || section === 'inventory'
                ? 'Nitro, boosts and the gift inventory are purchases, which need Discord’s billing systems.'
                : section === 'overlay' || section === 'registered_games'
                  ? 'The game overlay and game detection are desktop-app features.'
                  : 'This section needs Discord’s account servers — sessions, connections, authorized apps and friend data all live there.'
            }
          />
        </>
      ) : null}


      {section === 'connections' ? (
        <Connections account={account} onAccount={onAccount} />
      ) : null}

      {section === 'changelog' ? (
        <>
          <Title>What's New</Title>
          <Note>
            This build's changes are in the repository's commit log rather than a changelog pane.
          </Note>
        </>
      ) : null}

      {section === 'logout' ? (
        <>
          <Title>Log Out</Title>
          <Note>
            You will be returned to the login screen. Your servers, messages and Nitro stay in
            this browser and come back when you sign in again.
          </Note>
          <button className="btn-danger" onClick={onSignOut}>
            Log Out
          </button>
        </>
      ) : null}
    </SettingsLayer>
  )
}

/* --------------------------------------------------------------- connections
 *
 * Discord's Connections pane: a grid of platform tiles across the top, and
 * under it the accounts you have linked, each with the toggles that platform
 * supports. Linking really needs the platform's OAuth, which is not something
 * a page can do on its own, so the tile asks for the username instead of
 * bouncing through a login — everything after that is the real pane.
 */

function Connections({
  account,
  onAccount,
}: {
  account: Account
  onAccount: (a: Account) => void
}) {
  const linked = account.connections ?? []
  const [adding, setAdding] = useState<string | null>(null)
  const [handle, setHandle] = useState('')

  const set = (next: Connection[]) => onAccount({ ...account, connections: next })
  const patch = (service: string, part: Partial<Connection>) =>
    set(linked.map((c) => (c.service === service ? { ...c, ...part } : c)))

  const add = () => {
    const name = handle.trim()
    if (!adding || !name) return
    set([...linked.filter((c) => c.service !== adding), connect(adding, name)])
    setAdding(null)
    setHandle('')
  }

  return (
    <>
      <Title>Connections</Title>
      <div className="conn-grid">
        {SERVICES.map((s) => {
          const on = linked.some((c) => c.service === s.id)
          return (
            <button
              key={s.id}
              className={'conn-tile' + (on ? ' on' : '')}
              style={{ '--brand': s.color } as React.CSSProperties}
              aria-label={s.name}
              title={s.name}
              disabled={on}
              onClick={() => {
                setAdding(s.id)
                setHandle('')
              }}
            >
              <img src={logoOf(s.id)} alt="" draggable={false} />
            </button>
          )
        })}
      </div>

      {adding ? (
        <div className="conn-add">
          <label htmlFor="conn-handle">
            Your {serviceOf(adding)?.name} username
          </label>
          <div className="conn-add-row">
            <input
              id="conn-handle"
              value={handle}
              autoFocus
              placeholder={serviceOf(adding)?.name}
              onChange={(e) => setHandle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') add()
                if (e.key === 'Escape') setAdding(null)
              }}
            />
            <button className="btn-primary" disabled={!handle.trim()} onClick={add}>
              Connect
            </button>
            <button className="btn-quiet" onClick={() => setAdding(null)}>
              Cancel
            </button>
          </div>
          <p className="theme-note">
            Discord sends you to {serviceOf(adding)?.name} to sign in; a page with no
            server of its own has nowhere to send the token back to, so it takes the
            name directly.
          </p>
        </div>
      ) : null}

      <Divider />

      {linked.length === 0 ? (
        <Note>
          Nothing connected yet. A connected account shows on your profile, and some
          of them can find your friends or set your status for you.
        </Note>
      ) : (
        <div className="conn-list">
          {linked.map((c) => {
            const s = serviceOf(c.service)
            if (!s) return null
            return (
              <div className="conn-card" key={c.service}>
                <div className="conn-head">
                  <img className="conn-logo" src={logoOf(c.service)} alt="" draggable={false} />
                  <span className="conn-name">{c.name}</span>
                  {c.verified ? (
                    <span className="conn-verified" title="Verified">
                      <CheckIcon />
                    </span>
                  ) : null}
                  <button
                    className="conn-remove"
                    aria-label={`Disconnect ${s.name}`}
                    onClick={() => set(linked.filter((x) => x.service !== c.service))}
                  >
                    ×
                  </button>
                </div>
                <div className="conn-opts">
                  {s.status ? (
                    <Toggle
                      label={`Display ${s.name} as your status`}
                      value={c.showActivity}
                      onChange={(v) => patch(c.service, { showActivity: v })}
                    />
                  ) : null}
                  {s.friendSync ? (
                    <Toggle
                      label="Sync friends"
                      value={c.syncFriends}
                      onChange={(v) => patch(c.service, { syncFriends: v })}
                    />
                  ) : null}
                  <Toggle
                    label="Display on profile"
                    value={c.onProfile}
                    onChange={(v) => patch(c.service, { onProfile: v })}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ profiles
 *
 * Discord's Profiles pane, which this used to have a sketch of: two tabs —
 * your profile, and the one you wear in a particular server — a column of
 * controls on the left and a live profile card on the right that every control
 * paints into. Everything that can be worn here is something the account
 * actually owns: a decoration is one of the collectibles bought in the Shop, a
 * profile effect likewise, and the themes are Nitro's own gradients.
 */

function Profiles({
  account,
  servers,
  premium,
  onAccount,
}: {
  account: Account
  servers: Server[]
  premium: boolean
  onAccount: (a: Account) => void
}) {
  const [tab, setTab] = useState<'user' | 'server'>('user')
  const [serverId, setServerId] = useState(servers[0]?.id ?? '')
  const owned = account.collectibles ?? []
  const decorations = DECORATIONS.filter((d) => owned.includes(d.id))
  const plates = NAMEPLATES.filter((n) => owned.includes(n.id))
  const styleOf: NameStyle = account.nameStyle ?? {
    fontId: 11,
    effectId: NameEffect.SOLID,
    colors: ['#5865f2'],
  }
  const setStyle = (part: Partial<NameStyle>) =>
    onAccount({ ...account, nameStyle: { ...styleOf, ...part } })
  const effects = COLLECTIONS.flatMap((c) =>
    c.effects.filter((e) => owned.includes(e.id)).map((e) => ({ ...e, colors: c.confetti })),
  )
  const profile: ServerProfile = account.serverProfiles?.[serverId] ?? {}

  const patchProfile = (p: Partial<ServerProfile>) =>
    onAccount({
      ...account,
      serverProfiles: {
        ...(account.serverProfiles ?? {}),
        [serverId]: { ...profile, ...p },
      },
    })

  /** the account as this pane's preview should paint it */
  const shown: Account =
    tab === 'server'
      ? {
          ...account,
          name: profile.nick || account.name,
          color: profile.color ?? account.color,
          pronouns: profile.pronouns ?? account.pronouns,
          bio: profile.bio ?? account.bio,
        }
      : account

  return (
    <>
      <Title>Profiles</Title>
      <nav className="profile-tabs">
        <button
          className={'profile-tab' + (tab === 'user' ? ' on' : '')}
          onClick={() => setTab('user')}
        >
          User Profile
        </button>
        <button
          className={'profile-tab' + (tab === 'server' ? ' on' : '')}
          onClick={() => setTab('server')}
          disabled={servers.length === 0}
        >
          Server Profiles
        </button>
      </nav>

      <div className="profile-edit">
        <div className="profile-edit-form">
          {tab === 'server' ? (
            <div className="set-field">
              <label>SERVER</label>
              <select
                className="field"
                value={serverId}
                onChange={(e) => setServerId(e.target.value)}
              >
                {servers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <Field
            label={tab === 'server' ? 'SERVER NICKNAME' : 'DISPLAY NAME'}
            value={tab === 'server' ? (profile.nick ?? '') : account.name}
            maxLength={32}
            placeholder={tab === 'server' ? account.name : undefined}
            onChange={(v) =>
              tab === 'server' ? patchProfile({ nick: v }) : onAccount({ ...account, name: v })
            }
          />
          {tab === 'user' ? (
            <Field
              label="USERNAME"
              value={account.handle}
              maxLength={32}
              onChange={(handle) =>
                onAccount({ ...account, handle: handle.toLowerCase().replace(/[^a-z0-9._]/g, '') })
              }
            />
          ) : null}
          <Field
            label="PRONOUNS"
            value={tab === 'server' ? (profile.pronouns ?? '') : account.pronouns}
            maxLength={40}
            placeholder={tab === 'server' ? account.pronouns : undefined}
            onChange={(v) =>
              tab === 'server'
                ? patchProfile({ pronouns: v })
                : onAccount({ ...account, pronouns: v })
            }
          />
          <Field
            label="ABOUT ME"
            value={tab === 'server' ? (profile.bio ?? '') : account.bio}
            maxLength={190}
            textarea
            placeholder={tab === 'server' ? account.bio : undefined}
            onChange={(v) =>
              tab === 'server' ? patchProfile({ bio: v }) : onAccount({ ...account, bio: v })
            }
          />

          {/* Discord ships exactly six default avatars and hands you one; this
              picks between the same six files rather than tinting a drawing */}
          <div className="set-field">
            <label>DEFAULT AVATAR</label>
            <div className="avatar-row">
              {DEFAULT_AVATAR_COLORS.map((c) => {
                const chosen = tab === 'server' ? (profile.color ?? account.color) : account.color
                const on = defaultAvatarIndex(chosen) === defaultAvatarIndex(c)
                return (
                  <button
                    key={c}
                    className={'avatar-pick' + (on ? ' on' : '')}
                    aria-label={`Default avatar ${c}`}
                    onClick={() =>
                      tab === 'server'
                        ? patchProfile({ color: c })
                        : onAccount({ ...account, color: c })
                    }
                  >
                    <DefaultAvatar color={c} />
                  </button>
                )
              })}
            </div>
          </div>

          {tab === 'user' ? (
            <div className="set-field">
              <label>BANNER COLOUR</label>
              <div className="swatch-row">
                {[
                  '#5865f2', '#3ba55d', '#faa81a', '#ed4245', '#eb459e',
                  '#9b59b6', '#1abc9c', '#e67e22', '#607d8b', '#f47fff',
                ].map((c) => {
                  const on = bannerColorOf(account) === c
                  return (
                    <button
                      key={c}
                      className={'swatch' + (on ? ' on' : '')}
                      style={{ background: c }}
                      aria-label={c}
                      onClick={() => onAccount({ ...account, bannerColor: c })}
                    >
                      {on ? <CheckIcon /> : null}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          {tab === 'user' ? (
            <>
              <div className="set-field">
                <label>AVATAR DECORATION</label>
                {decorations.length === 0 ? (
                  <p className="theme-note">
                    None owned yet — the Shop sells them, and Quests pay the Orbs for one.
                  </p>
                ) : (
                  <div className="profile-picker">
                    <button
                      className={'profile-pick' + (account.decoration ? '' : ' on')}
                      onClick={() => onAccount({ ...account, decoration: undefined })}
                    >
                      <span className="profile-pick-none" />
                      None
                    </button>
                    {decorations.map((d) => (
                      <button
                        key={d.id}
                        className={'profile-pick' + (account.decoration === d.id ? ' on' : '')}
                        onClick={() => onAccount({ ...account, decoration: d.id })}
                      >
                        <span className="profile-pick-art">
                          <Decoration id={d.id} size={52} />
                        </span>
                        {d.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Nitro letters a display name: a font, an effect and the
                  colours the effect takes. Free accounts see it locked, which
                  is what the client does rather than hiding it. */}
              <div className="set-field">
                <label>DISPLAY NAME STYLE</label>
                {!premium ? (
                  <p className="theme-note">
                    <LockIcon /> Nitro letters your name in one of Discord's own
                    typefaces, in the colours you pick.
                  </p>
                ) : (
                  <>
                    <div className="name-preview">
                      <DisplayName account={account} />
                    </div>
                    <div className="name-fonts">
                      {NAME_FONTS.map((f) => (
                        <button
                          key={f.id}
                          className={'name-font' + (styleOf.fontId === f.id ? ' on' : '')}
                          style={f.family === 'inherit' ? undefined : { fontFamily: f.family }}
                          onClick={() => setStyle({ fontId: f.id })}
                        >
                          {f.name}
                        </button>
                      ))}
                    </div>
                    <div className="name-effects">
                      {NAME_EFFECTS.map((e) => (
                        <button
                          key={e.id}
                          className={'name-effect' + (styleOf.effectId === e.id ? ' on' : '')}
                          onClick={() => setStyle({ effectId: e.id })}
                        >
                          <span
                            style={nameStyleCss({ ...styleOf, effectId: e.id })}
                          >
                            {e.name}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="swatch-row wrap">
                      {[
                        '#5865f2', '#3ba55d', '#faa81a', '#ed4245', '#eb459e',
                        '#9b59b6', '#1abc9c', '#e67e22', '#607d8b', '#f47fff',
                      ].map((c) => (
                        <button
                          key={c}
                          className={'swatch' + (styleOf.colors[0] === c ? ' on' : '')}
                          style={{ background: c }}
                          aria-label={c}
                          onClick={() => setStyle({ colors: [c] })}
                        >
                          {styleOf.colors[0] === c ? <CheckIcon /> : null}
                        </button>
                      ))}
                      <button
                        className="swatch none"
                        aria-label="No style"
                        onClick={() => onAccount({ ...account, nameStyle: undefined })}
                      >
                        <CloseIcon />
                      </button>
                    </div>
                    <p className="theme-note">
                      {colorCount(styleOf.effectId) > 1
                        ? `${NAME_EFFECTS.find((e) => e.id === styleOf.effectId)?.name} takes ${colorCount(styleOf.effectId)} colours — Discord fills the rest in from the one you pick.`
                        : 'Neo Castel and Sinistre are missing: Discord licensed those two and no public mirror carries them.'}
                    </p>
                  </>
                )}
              </div>

              {/* Discord's Profiles pane picks the nameplate here too, from
                  the ones the account owns */}
              <div className="set-field">
                <label>NAMEPLATE</label>
                {plates.length === 0 ? (
                  <p className="theme-note">
                    None owned yet — the Shop sells them beside the decorations.
                  </p>
                ) : (
                  <div className="plate-picker">
                    <button
                      className={'plate-pick' + (account.nameplate ? '' : ' on')}
                      onClick={() => onAccount({ ...account, nameplate: undefined })}
                    >
                      None
                    </button>
                    {plates.map((n) => (
                      <button
                        key={n.id}
                        className={'plate-pick' + (account.nameplate === n.id ? ' on' : '')}
                        onClick={() => onAccount({ ...account, nameplate: n.id })}
                      >
                        <Nameplate id={n.id} />
                        <span>{n.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="set-field">
                <label>PROFILE EFFECT</label>
                {effects.length === 0 ? (
                  <p className="theme-note">
                    None owned yet. Profile effects are sold in the Shop, beside the decorations.
                  </p>
                ) : (
                  <div className="profile-picker">
                    <button
                      className={'profile-pick' + (account.effect ? '' : ' on')}
                      onClick={() => onAccount({ ...account, effect: undefined })}
                    >
                      <span className="profile-pick-none" />
                      None
                    </button>
                    {effects.map((e) => (
                      <button
                        key={e.id}
                        className={'profile-pick' + (account.effect === e.id ? ' on' : '')}
                        onClick={() => onAccount({ ...account, effect: e.id })}
                      >
                        <span className="profile-pick-art">
                          <span className="shop-effect">
                            {(e.colors.length ? e.colors : ['#ca9ef9']).slice(0, 4).map((c, i) => (
                              <i key={i} style={{ background: c, animationDelay: `${i * 0.4}s` }} />
                            ))}
                          </span>
                        </span>
                        {e.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="set-field">
                <label>PROFILE THEME</label>
                <div className="swatch-row">
                  <button
                    className={'swatch none' + (account.profileTheme ? '' : ' on')}
                    aria-label="No profile theme"
                    onClick={() => onAccount({ ...account, profileTheme: undefined })}
                  >
                    {account.profileTheme ? null : <CheckIcon />}
                  </button>
                  {GRADIENTS.map((g) => {
                    const on =
                      account.profileTheme?.[0] === g.light[0] &&
                      account.profileTheme?.[1] === g.light[1]
                    return (
                      <button
                        key={g.key}
                        className={'swatch' + (on ? ' on' : '') + (premium ? '' : ' locked')}
                        style={{
                          background: `linear-gradient(160deg, ${g.light[0]}, ${g.light[1]})`,
                        }}
                        aria-label={g.name}
                        title={g.name}
                        disabled={!premium}
                        onClick={() =>
                          onAccount({ ...account, profileTheme: [g.light[0], g.light[1]] })
                        }
                      >
                        {on ? <CheckIcon /> : null}
                        {premium ? null : <LockIcon size={12} />}
                      </button>
                    )
                  })}
                </div>
                {premium ? null : <p className="theme-note">Nitro unlocks profile themes.</p>}
              </div>

              <div className="set-field">
                <label>STATUS</label>
                <div className="status-row">
                  {(['online', 'idle', 'dnd', 'invisible'] as Status[]).map((s) => (
                    <button
                      key={s}
                      className={'status-pick' + (s === account.status ? ' on' : '')}
                      onClick={() => onAccount({ ...account, status: s })}
                    >
                      <StatusGlyph status={s} size={10} />
                      {statusLabel[s]}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>

        <div className="profile-preview">
          <div className="set-row-label">PREVIEW</div>
          <ProfileCard account={shown} />
        </div>
      </div>
    </>
  )
}

/** The preview: the profile as the popout paints it, with what is worn on it. */
function ProfileCard({ account }: { account: Account }) {
  const themed = account.profileTheme
  const badges = BADGES.filter((b) => (account.badges ?? []).includes(b.id))
  const effect = COLLECTIONS.flatMap((c) =>
    c.effects.filter((e) => e.id === account.effect).map(() => c.confetti),
  )[0]
  return (
    <div
      className={'preview-card' + (themed ? ' themed' : '')}
      style={
        themed
          ? { background: `linear-gradient(180deg, ${themed[0]}, ${themed[1]})` }
          : undefined
      }
    >
      <div className="preview-banner" style={{ background: themed?.[0] ?? account.color }}>
        {effect ? (
          <span className="shop-effect preview-effect">
            {effect.slice(0, 6).map((c, i) => (
              <i key={i} style={{ background: c, animationDelay: `${i * 0.42}s` }} />
            ))}
          </span>
        ) : null}
      </div>
      <span className="preview-avatar">
        <Avatar account={account} size={72} />
      </span>
      <div className="preview-body">
        <b>{account.name}</b>
        <span>
          {account.handle}
          {account.pronouns ? ` • ${account.pronouns}` : ''}
        </span>
        {badges.length ? (
          <div className="preview-badges">
            {badges.map((b) => (
              <img key={b.id} src={b.src} alt={b.label} title={b.label} />
            ))}
          </div>
        ) : null}
        {account.bio ? <p>{account.bio}</p> : null}
      </div>
    </div>
  )
}
