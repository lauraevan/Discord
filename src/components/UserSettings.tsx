import { useState } from 'react'
import { statusColor, statusLabel, type Account, type Status } from '../data'
import { KEYBINDS, LOCALES, type Prefs } from '../prefs'
import { colorThemes, defaultThemes, type Theme } from '../themes'
import { CheckIcon } from '../ui/Icons'
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
 * User Settings.
 *
 * The sidebar is the client's own section list, in the client's order and
 * groups — see docs/discord-reference.md. Panes that need a server, a payment
 * or a device the page cannot reach say so rather than faking a control.
 */
export function UserSettings({
  account,
  prefs,
  themeId,
  onAccount,
  onPrefs,
  onTheme,
  onClose,
}: {
  account: Account
  prefs: Prefs
  themeId: string
  onAccount: (a: Account) => void
  onPrefs: (p: Partial<Prefs>) => void
  onTheme: (t: Theme) => void
  onClose: () => void
}) {
  const [section, setSection] = useState('account')
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
            <div className="acct-banner" style={{ background: account.color }} />
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
        <>
          <Title>Profiles</Title>
          <div className="profile-edit">
            <div className="profile-edit-form">
              <Field
                label="DISPLAY NAME"
                value={account.name}
                maxLength={32}
                onChange={(name) => onAccount({ ...account, name })}
              />
              <Field
                label="USERNAME"
                value={account.handle}
                maxLength={32}
                onChange={(handle) =>
                  onAccount({ ...account, handle: handle.toLowerCase().replace(/[^a-z0-9._]/g, '') })
                }
              />
              <Field
                label="PRONOUNS"
                value={account.pronouns}
                maxLength={40}
                onChange={(pronouns) => onAccount({ ...account, pronouns })}
              />
              <Field
                label="ABOUT ME"
                value={account.bio}
                maxLength={190}
                textarea
                onChange={(bio) => onAccount({ ...account, bio })}
              />
              <div className="set-field">
                <label>AVATAR &amp; BANNER COLOUR</label>
                <div className="swatch-row">
                  {[
                    '#5865f2', '#3ba55d', '#faa81a', '#ed4245', '#eb459e',
                    '#9b59b6', '#1abc9c', '#e67e22', '#607d8b', '#f47fff',
                  ].map((c) => (
                    <button
                      key={c}
                      className={'swatch' + (c === account.color ? ' on' : '')}
                      style={{ background: c }}
                      aria-label={c}
                      onClick={() => onAccount({ ...account, color: c })}
                    >
                      {c === account.color ? <CheckIcon /> : null}
                    </button>
                  ))}
                </div>
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
                      <span className="p-dot" style={{ background: statusColor[s] }} />
                      {statusLabel[s]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="profile-preview">
              <div className="set-row-label">PREVIEW</div>
              <div className="preview-card">
                <div className="preview-banner" style={{ background: account.color }} />
                <span className="preview-avatar">
                  <Avatar account={account} size={72} />
                </span>
                <div className="preview-body">
                  <b>{account.name}</b>
                  <span>
                    {account.handle}
                    {account.pronouns ? ` • ${account.pronouns}` : ''}
                  </span>
                  {account.bio ? <p>{account.bio}</p> : null}
                </div>
              </div>
            </div>
          </div>
        </>
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
            {colorThemes.map((t) => (
              <button
                key={t.id}
                className={'theme-swatch' + (t.id === themeId ? ' on' : '')}
                style={{ background: t.swatch }}
                title={t.name}
                aria-label={t.name}
                onClick={() => onTheme(t)}
              >
                {t.id === themeId ? <CheckIcon /> : null}
              </button>
            ))}
          </div>
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
        'connections',
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
          <Note>There is no account to log out of — everything lives in this browser.</Note>
        </>
      ) : null}
    </SettingsLayer>
  )
}
