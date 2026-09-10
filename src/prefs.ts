/**
 * The client-side preferences Discord keeps in User Settings.
 *
 * Field names and value sets follow the client: message display is cozy or
 * compact, notification level is ALL_MESSAGES / ONLY_MENTIONS / NO_MESSAGES,
 * and so on. See docs/discord-reference.md.
 */

export type MessageDisplay = 'cozy' | 'compact'
export type NotifyLevel = 0 | 1 | 2

export type Prefs = {
  /* Appearance */
  messageDisplay: MessageDisplay
  fontScale: number
  spaceBetween: number
  zoom: number
  saturation: number
  underlineLinks: boolean
  syncWithComputer: boolean

  /* Accessibility */
  reducedMotion: boolean
  playGifs: boolean
  stickerAnimation: 'always' | 'interaction' | 'never'
  tts: boolean
  showSendButton: boolean

  /* Text & Images */
  inlineMedia: boolean
  inlineEmbedMedia: boolean
  autoPlayGifs: boolean
  previewLinks: boolean
  showEmojiReactions: boolean
  convertEmoticons: boolean
  renderSpoilers: 'always' | 'on_click' | 'owned'

  /* Notifications */
  desktopNotifications: boolean
  unreadBadge: boolean
  ttsNotifications: 'never' | 'current' | 'all'
  taskbarFlash: boolean

  /* Voice & Video */
  inputMode: 'voice' | 'ptt'
  inputVolume: number
  outputVolume: number
  echoCancellation: boolean
  noiseSuppression: boolean
  automaticGainControl: boolean
  qos: boolean

  /* Advanced / privacy / activity */
  developerMode: boolean
  hardwareAcceleration: boolean
  streamerMode: boolean
  streamerAutoEnable: boolean
  hidePersonalInfo: boolean
  hideInvites: boolean
  disableSounds: boolean
  activityStatus: boolean
  dmScanLevel: 0 | 1 | 2
  allowDmsFromServerMembers: boolean
  /**
   * Discord asks this as three switches rather than one choice, because they
   * stack: Everyone turns the other two on and holds them there.
   */
  friendRequests: {
    everyone: boolean
    friendsOfFriends: boolean
    serverMembers: boolean
  }
  /** how sensitive media is treated: 0 blur, 1 show, 2 block */
  sensitiveDms: 0 | 1 | 2
  sensitiveServers: 0 | 1 | 2
  /** whether activity may be used to recommend servers */
  recommendations: boolean

  /* Clips */
  clipsEnabled: boolean
  /** how far back a clip reaches, in seconds — Discord's own five lengths */
  clipLength: 30 | 60 | 120 | 180 | 300

  /* Misc */
  locale: string
  hideMutedChannels: boolean
}

export const defaultPrefs: Prefs = {
  messageDisplay: 'cozy',
  fontScale: 16,
  spaceBetween: 16,
  zoom: 100,
  saturation: 100,
  underlineLinks: false,
  syncWithComputer: false,

  reducedMotion: false,
  playGifs: true,
  stickerAnimation: 'always',
  tts: false,
  showSendButton: false,

  inlineMedia: true,
  inlineEmbedMedia: true,
  autoPlayGifs: true,
  previewLinks: true,
  showEmojiReactions: true,
  convertEmoticons: true,
  renderSpoilers: 'on_click',

  desktopNotifications: true,
  unreadBadge: true,
  ttsNotifications: 'never',
  taskbarFlash: true,

  inputMode: 'voice',
  inputVolume: 100,
  outputVolume: 100,
  echoCancellation: true,
  noiseSuppression: true,
  automaticGainControl: true,
  qos: true,

  developerMode: false,
  hardwareAcceleration: true,
  streamerMode: false,
  streamerAutoEnable: true,
  hidePersonalInfo: true,
  hideInvites: true,
  disableSounds: true,
  activityStatus: true,
  dmScanLevel: 1,
  allowDmsFromServerMembers: true,
  friendRequests: { everyone: true, friendsOfFriends: true, serverMembers: true },
  sensitiveDms: 0,
  sensitiveServers: 0,
  recommendations: true,
  clipsEnabled: false,
  clipLength: 30,

  locale: 'en-US',
  hideMutedChannels: false,
}

/** Discord's language list, as the Language pane shows it. */
export const LOCALES: [string, string, string][] = [
  ['da', 'Dansk', 'Danish'],
  ['de', 'Deutsch', 'German'],
  ['en-GB', 'English, UK', 'English, UK'],
  ['en-US', 'English, US', 'English, US'],
  ['es-ES', 'Español', 'Spanish'],
  ['fr', 'Français', 'French'],
  ['hr', 'Hrvatski', 'Croatian'],
  ['it', 'Italiano', 'Italian'],
  ['lt', 'Lietuviškai', 'Lithuanian'],
  ['hu', 'Magyar', 'Hungarian'],
  ['nl', 'Nederlands', 'Dutch'],
  ['no', 'Norsk', 'Norwegian'],
  ['pl', 'Polski', 'Polish'],
  ['pt-BR', 'Português do Brasil', 'Portuguese, Brazilian'],
  ['ro', 'Română', 'Romanian'],
  ['fi', 'Suomi', 'Finnish'],
  ['sv-SE', 'Svenska', 'Swedish'],
  ['vi', 'Tiếng Việt', 'Vietnamese'],
  ['tr', 'Türkçe', 'Turkish'],
  ['cs', 'Čeština', 'Czech'],
  ['el', 'Ελληνικά', 'Greek'],
  ['bg', 'български', 'Bulgarian'],
  ['ru', 'Pусский', 'Russian'],
  ['uk', 'Українська', 'Ukrainian'],
  ['hi', 'हिन्दी', 'Hindi'],
  ['th', 'ไทย', 'Thai'],
  ['zh-CN', '中文', 'Chinese, China'],
  ['ja', '日本語', 'Japanese'],
  ['zh-TW', '繁體中文', 'Chinese, Taiwan'],
  ['ko', '한국어', 'Korean'],
]

/**
 * The keybind actions the client lists that a browser can actually honour.
 * Names are Discord's own action ids.
 */
/**
 * Discord's keybind table, ids and all. Every one of these is bound in
 * src/App.tsx except Navigate Back and Navigate Forward, which need a route
 * history this page does not keep — tools/keys.mjs covers the rest.
 */
export const KEYBINDS: [string, string, string][] = [
  ['QUICKSWITCHER_SHOW', 'Quick Switcher', 'Ctrl + K'],
  ['TOGGLE_MUTE', 'Toggle Mute', 'Ctrl + Shift + M'],
  ['TOGGLE_DEAFEN', 'Toggle Deafen', 'Ctrl + Shift + D'],
  ['MARK_CHANNEL_READ', 'Mark Channel Read', 'Esc'],
  ['MARK_SERVER_READ', 'Mark Server Read', 'Shift + Esc'],
  ['JUMP_TO_FIRST_UNREAD', 'Jump to First Unread Message', 'Shift + Page Up'],
  ['EDIT_LAST_MESSAGE', 'Edit Previous Message', '↑'],
  ['FOCUS_SEARCH', 'Focus Search', 'Ctrl + F'],
  ['TEXTAREA_FOCUS', 'Focus Text Area', 'Tab'],
  ['NAVIGATE_BACK', 'Navigate Back', 'Alt + ←'],
  ['NAVIGATE_FORWARD', 'Navigate Forward', 'Alt + →'],
  ['SEARCH_EMOJIS', 'Search Emoji', 'Ctrl + E'],
  ['TOGGLE_STREAMER_MODE', 'Toggle Streamer Mode', 'Ctrl + Shift + S'],
  ['CREATE_GUILD', 'Create Server', 'Ctrl + Shift + N'],
  ['UPLOAD_FILE', 'Upload a File', 'Ctrl + Shift + U'],
  ['POP_LAYER', 'Close Current Modal', 'Esc'],
]
