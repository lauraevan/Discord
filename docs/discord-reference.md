# Ground truth

Everything the app reproduces is checked against Discord's own shipped client
rather than reconstructed from memory. The client bundle is mirrored daily at
[Discord-Datamining/Discord-Datamining](https://github.com/Discord-Datamining/Discord-Datamining)
(`current.js`, ~12MB); the lists below were extracted from it, so the section
names, enums and orderings here are Discord's, verbatim.

The reference frame — the screenshot the geometry is measured from — is the
second source of truth, for anything visual.

## User Settings sections

Extracted from the client's page-name map. Sidebar groups follow the client.

**User Settings** — My Account · Profiles · Content & Social · Data & Privacy ·
Family Center · Authorized Apps · Devices · Connections · Clips · Friend Requests

**Billing Settings** — Nitro · Server Boost · Subscriptions · Gift Inventory · Billing

**App Settings** — Appearance · Accessibility · Voice & Video · Text & Images ·
Notifications · Keybinds · Language · Streamer Mode · Advanced

**Activity Settings** — Activity Privacy · Registered Games · Game Overlay

Then What's New, and Log Out.

Slugs the client routes on: `account`, `profile_customization`,
`privacy_and_safety`, `sessions`, `connections`, `clips`, `premium`,
`subscriptions`, `inventory`, `appearance`, `accessibility`, `voice`, `text`,
`notifications`, `keybinds`, `locale`, `streamer_mode`, `advanced`, `overlay`,
`changelog`.

## Server Settings sections

`LANDING, OVERVIEW, ONBOARDING, MEMBERS, MEMBER_EDIT, MEMBER_TIMEOUT,
MEMBER_KICK, MEMBER_BAN, CHANNELS, ROLES, ROLE_EDIT, ROLE_PERMISSIONS, BANS,
INSTANT_INVITES, GUILD_TEMPLATES, INTEGRATIONS, INTEGRATION_SETTINGS, SECURITY,
VANITY_URL, EMOJI, AUDIT_LOG, AUDIT_LOG_FILTER, MODERATION, DELETE, ACCESS,
DISCOVERY_LANDING_PAGE, ANALYTICS, COMMUNITY, COMMUNITY_WELCOME,
MEMBER_VERIFICATION, STICKERS, ROLE_SUBSCRIPTIONS, GUILD_PRODUCTS, SOUNDBOARD,
APP_DIRECTORY, GUILD_AUTOMOD, SAFETY, OFFICIAL_MESSAGES, PROFILE, TAG,
GUILD_THEME, ENGAGEMENT, INVITES, BOOST_PERKS, WEBHOOKS, EDIT_WEBHOOK,
CHANNELS_FOLLOWED`

## Channel Settings sections

`OVERVIEW, PERMISSIONS, INSTANT_INVITES, INTEGRATIONS, DELETE,
DEFAULT_FORUM_LAYOUT, NOTIFICATIONS, PINNED_MESSAGES, PERMISSION_OVERRIDES,
CHANGE_CATEGORY, WEBHOOKS, CHANNELS_FOLLOWED`

Editable channel fields the client dispatches: `name, type, topic, bitrate,
userLimit, nsfw, flags, rateLimitPerUser, defaultThreadRateLimitPerUser,
defaultAutoArchiveDuration, defaultReactionEmoji, rtcRegion, videoQualityMode,
autoArchiveDuration, locked, invitable, availableTags, defaultSortOrder,
defaultForumLayout, iconEmoji, themeColor`.

## Channel types

```
GUILD_TEXT 0   DM 1              GUILD_VOICE 2      GROUP_DM 3
GUILD_CATEGORY 4                 GUILD_ANNOUNCEMENT 5
ANNOUNCEMENT_THREAD 10           PUBLIC_THREAD 11   PRIVATE_THREAD 12
GUILD_STAGE_VOICE 13             GUILD_DIRECTORY 14 GUILD_FORUM 15
GUILD_MEDIA 16
```

## Message types

The system messages a channel can contain:

```
DEFAULT 0   RECIPIENT_ADD 1   RECIPIENT_REMOVE 2   CALL 3
CHANNEL_NAME_CHANGE 4   CHANNEL_ICON_CHANGE 5   CHANNEL_PINNED_MESSAGE 6
USER_JOIN 7   GUILD_BOOST 8   GUILD_BOOST_TIER_1/2/3 9-11
CHANNEL_FOLLOW_ADD 12   THREAD_CREATED 18   REPLY 19
CHAT_INPUT_COMMAND 20   THREAD_STARTER_MESSAGE 21   GUILD_INVITE_REMINDER 22
AUTO_MODERATION_ACTION 24   STAGE_START 27 … STAGE_TOPIC 31
POLL_RESULT 46
```

`USER_JOIN` picks one of Discord's rotating join lines, keyed off the message
timestamp.

## Notification settings

`ALL_MESSAGES 0 · ONLY_MENTIONS 1 · NO_MESSAGES 2 · NULL 3` (NULL = inherit).

## Presence

`online · idle · dnd · invisible · offline · streaming`

## Keybind actions

86 in the client. The ones a browser can honour:

`TOGGLE_MUTE, TOGGLE_DEAFEN, QUICKSWITCHER_SHOW, MARK_CHANNEL_READ,
MARK_SERVER_READ, JUMP_TO_FIRST_UNREAD, EDIT_LAST_MESSAGE, FOCUS_SEARCH,
TEXTAREA_FOCUS, NAVIGATE_BACK, NAVIGATE_FORWARD, SCROLL_UP, SCROLL_DOWN,
TOGGLE_STREAMER_MODE, MENTION_NEXT, MENTION_PREV, CREATE_GUILD, UPLOAD_FILE,
SEARCH_EMOJIS, SEARCH_GIFS, SEARCH_STICKERS, POP_LAYER, SUBMIT`

## Markdown

Discord's own spoiler matcher is `/^\|\|([\s\S]+?)\|\|/`, which is the
non-greedy pairing this app's parser uses. The `<id:...>` link form the client
recognises is `home | browse | customize | guide | linked-roles`.

## Out of reach in a static page

Real voice/video transport, screen share and Go Live; bots, apps and slash
commands that hit an API; payments (Nitro, boosts, the shop); the game overlay
and game detection; anything requiring another human. Those surfaces are drawn
where they are part of the UI, and say what they are.
