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


## The icon set

Every icon was hand-drawn from screenshots until the reference frames made it
clear how far off that gets you at 15px: the channel hash was nearly twice the
right stroke weight, Add-a-Server and Discover were rings where Discord fills
them and knocks the glyph out, Browse Channels was missing its magnifier
entirely, and the title bar's third action was a full-screen toggle where
Discord draws crossed tools.

The first fix was to take the geometry from the client: the bundle carries 696
components with a `viewBox="0 0 24 24"` followed by a `<path d>`, and
`tools/icon-match.py` ranked them against a crop from the reference frame by
silhouette — threshold to ink, crop to the ink bbox, scale into a fixed box, so
that size and position are discarded and a 13px crop can be matched against a
64px render. That got most of them, and `tools/icon-verify.py` (crop beside its
top candidates, upscaled) caught the ones it did not: #574 reads as a pencil on
a contact sheet and is actually the italic mark.

But silhouette ranking still leaves the choice between near-identical glyphs to
the eye, which is how the app ended up with a speaker that has no sound wave.
**The bundle names them.** Each icon is its own webpack module that declares its
export before defining it —

```js
n.d(t,{MagnifyingGlassIcon:()=>l}); … viewBox:"0 0 24 24" … d:"M15.62 17.03a9 9 …"
```

— and a barrel module re-exports the set under readable names
(`GlobeEarthIcon:()=>AF.GlobeEarthIcon`, with `AF=n(998445)` in the same
module). So a name and its geometry join through the module graph.
`tools/extract-named-icons.py` walks it and writes 684 named icons to
`tools/discord-named-icons.json`; `tools/gen-icons.py` maps this app's slots to
Discord's names, and `tools/icon-sheet.mjs` renders the result labelled so the
mapping can be checked at a glance.

Two traps in that walk, both found by checking one known-good icon end to end:

- A minified module reuses short variable names across its inner scopes, so a
  module-wide map of `X = n(id)` resolves the wrong require for a barrel with
  hundreds of entries. Take the first binding past the declaration.
- Module ids are not all six digits. The magnifier lives in module `7689`, so a
  `\d{5,7}` boundary pattern folded that module into its neighbour and handed
  the magnifier slot a magic wand.

The channel-type glyphs are not a judgement call either — the client has a
switch from channel type to icon component, and resolving its short exports
through the same graph gives:

| Channel type | Icon |
| --- | --- |
| `GUILD_TEXT` | TextIcon |
| `GUILD_VOICE` | VoiceNormalIcon |
| `GUILD_ANNOUNCEMENT` | AnnouncementsIcon |
| `GUILD_STAGE_VOICE` | StageIcon |
| `GUILD_FORUM` | ForumIcon |
| `GUILD_MEDIA` | ImageIcon |
| `GUILD_CATEGORY` | FolderIcon |
| `GUILD_DIRECTORY` | HubIcon |
| `GUILD_APP` | AppsIcon |
| `PUBLIC_THREAD` | ThreadIcon |
| `PRIVATE_THREAD` | ThreadLockIcon |
| `DM`, `GROUP_DM` | AtIcon |
| Server Guide | SignPostIcon |
| Browse Channels | ChannelListMagnifyingGlassIcon |

Sizes then had to be re-derived: the real paths sit differently inside their
24-grid than the drawn ones did, so `tools/icon-fit.py` reports the reference's
ink box against the app's for each icon, and the box that produces it. Where a
group is right-anchored — the header tools, the composer actions — the buttons
now have a fixed box so a glyph's own size cannot shift the whole row.

## Scoring a frame

`tools/score.py` compares a render against `docs/reference.png`: mean absolute
grey difference over the whole frame, and again over only the regions that can
match. The reference's own avatars, its profile banner and the other server's
rail tile are photographs of an account that does not exist here, so they are a
fixed floor that hides real movement elsewhere. `--blocks N` prints the worst
16x16 cells, which is what says where to look next.

## Accounts

Registration and login are local — there is no account server behind a page —
but the field set, the rules and the errors are Discord's:

- Username: 2-32 characters, lowercase letters, digits, `_` and `.`, no
  consecutive or leading/trailing periods. "Must be between 2 and 32 in
  length." / "Please only use numbers, letters, underscores _ , or periods."
- Display name: optional, up to 32, "This is how others see you. You can use
  special characters and emoji."
- Password: 6-72. "Must be 6 or more in length."
- Date of birth: three selects, and under 13 gives "You need to be older to
  sign up for Discord."
- The opt-in checkbox, the Terms of Service line and "Already have an account?"

The password itself is never stored: `src/auth.ts` keeps a per-account random
salt and the SHA-256 of `salt:password`, and the login form compares against
that.

The login page's QR is a real, scannable QR code carrying a remote-auth URL of
the shape Discord's uses. `src/qr.ts` is a byte-mode encoder — version
selection, Reed-Solomon, all eight data masks scored by the standard's penalty
rules — verified two ways: every one of the 160 version/error-correction
combinations interleaves into blocks whose RS syndromes are zero, and the codes
it produces decode back to their input through OpenCV's detector. Two bugs
worth remembering: with coefficients stored highest-degree-first, multiplying
the generator polynomial by `x` shifts a term *left*, not right; and the
alignment-pattern positions must be inserted at index 1, not unshifted, or
everything from version 2 up is unreadable.

## Creating a server

Discord's flow is three steps, and each is reproduced here: *Create a server*
(Create My Own, or one of Gaming / School Club / Study Group / Friends /
Artists & Creators / Local Community, with "Have an invite already?" below),
*Tell us more about your server* (for me and my friends, or for a club or
community, skippable), and *Customize your server* (icon upload, name, and the
Community Guidelines line). A new server gets exactly `#general` and a
`General` voice channel; a template adds its own categories on top.

## Nitro

From the bundle. Premium types are numbered historically rather than by price —
Nitro Basic was added last and took slot 3, which is why the client calls it
`TIER_0`:

| Plan | `premium_type` | Interval | SKU |
| --- | --- | --- | --- |
| Nitro Basic Monthly | 3 | 1 x month | 978380684370378762 |
| Nitro Basic Yearly | 3 | 1 x year | 978380684370378762 |
| Nitro Monthly | 2 | 1 x month | 521847234246082599 |
| Nitro Yearly | 2 | 1 x year | 521847234246082599 |
| Nitro Three Month | 2 | 3 x month | 521847234246082599 |
| Nitro Six Month | 2 | 6 x month | 521847234246082599 |
| Nitro Classic Monthly | 1 | 1 x month | 521846918637420545 |
| Nitro Classic Yearly | 1 | 1 x year | 521846918637420545 |
| Nitro Classic Yearly (Legacy) | 2 | 1 x year | 521842865731534868 |
| Nitro Monthly (Legacy) | 2 | 1 x month | 521842865731534868 |
| Nitro Squad Monthly | 2 | 1 x month | 521847234246082599 |

Guild boost tiers are `NONE=0, TIER_1=1, TIER_2=2, TIER_3=3`.

The perks are gated on a `PremiumFeatures` flag rather than on the tier
directly: `ANIMATED_AVATAR`, `ANIMATED_EMOJIS`, `APP_ICONS`, `BOOST_DISCOUNT`,
`CLIENT_THEMES`, `CUSTOM_CALL_SOUNDS`, `CUSTOM_DISCRIMINATOR`,
`EMOJIS_EVERYWHERE`, `FREE_BOOSTS`, `INCREASED_FILE_UPLOAD_SIZE`,
`INCREASED_GUILD_LIMIT`, `INCREASED_MESSAGE_LENGTH`,
`INCREASED_VIDEO_UPLOAD_QUALITY`, `INSTALL_PREMIUM_APPLICATIONS`,
`MONTHLY_ORBS`, `MORE_QUEST_ORBS`, `PREMIUM_COLLECTIBLES`,
`PREMIUM_GUILD_MEMBER_PROFILE`, `PREMIUM_VOICE_FILTERS`, `PROFILE_BADGES`,
`PROFILE_PREMIUM_FEATURES`, `SHOP_DISCOUNTS`, `SOUNDBOARD_EVERYWHERE`,
`STICKERS_EVERYWHERE`, `STREAM_HIGH_QUALITY`, `STREAM_MID_QUALITY`,
`VIDEO_FILTER_ASSETS`.

Three of those are wired through to behaviour rather than only listed: the
composer's character counter and its upload cap read
`INCREASED_MESSAGE_LENGTH` and `INCREASED_FILE_UPLOAD_SIZE`, and the Shop
applies `SHOP_DISCOUNTS`.

Brand colours, from the client's colour table:

```
PREMIUM_TIER_2_PURPLE            #b473f5   PREMIUM_TIER_2_PINK        #e292aa
PREMIUM_TIER_2_PURPLE_GRADIENT   #8547c6   ..._PINK_FOR_GRADIENTS     #ab5d8a
PREMIUM_TIER_2_PURPLE_GRADIENT_2 #b845c1   ..._PINK_FOR_GRADIENTS_2   #b73ec1
PREMIUM_TIER_1_BLUE              #738ef5   PREMIUM_TIER_1_PURPLE      #b3aeff
PREMIUM_TIER_0_BLUE              #007cc2   PREMIUM_TIER_0_PURPLE      #5865f2
PREMIUM_TIER_0_HEADER_GRADIENT   #3736bb #4670e8 #8377eb #e782f1 #df90af
```

The Nitro tab is a single route (`NITRO_HOME: "/store"`), and the client
instruments it section by section rather than as tabs — the analytics names are
the page's own structure:

```
premium marketing page banner        premium marketing hero cta
premium marketing nitro home orbs section
premium marketing bento box          premium marketing perk card (+ perk_card_flipped)
premium_marketing_perks_see_all_clicked
premium marketing tier card          premium marketing comparison table
premium marketing tenure rewards section (+ tenure reward card)
premium marketing gift section       premium marketing footer cta
premium marketing floating cta       premium_marketing_what_is_new_card_hovered
```

The perk cards have their own ids, registered in the client:

```
badge  clientThemes  customAppIcons  customSounds  displayNameStyles
earlyAccess  entranceSounds  hdVideo  largeUploads  moreEmojis  permadecos
premiumGroup  profiles  serverBoosts  memberPricing  specialStickers
superReactions  tenureBadge  videoBackgrounds  orbMultiplier
nitroOrbsRewards  monthlyToYearlyUpsell  3p  logitech3PP  callOfDuty3PP
xgppHero  xgppPerk
```

and each is tinted with one of the perk colours:

```
PREMIUM_PERK_BLUE       #80a6ff   PREMIUM_PERK_BLUE_ALT   #9cb8ff
PREMIUM_PERK_DARK_BLUE  #4173da   PREMIUM_PERK_GOLD       #faa61a
PREMIUM_PERK_GREEN      #86dcc5   PREMIUM_PERK_LIGHT_BLUE #aec7ff
PREMIUM_PERK_ORANGE     #fc964b   PREMIUM_PERK_PINK       #ff80f4
PREMIUM_PERK_PURPLE     #d09aff   PREMIUM_PERK_YELLOW     #fed648
```

The tenure badge levels are `PREMIUM_TENURE_{1,3,6,12,24,36,60,72}_MONTH`, and
the sticker/emoji slots a tier carries are 15/100 at TIER_1, 30/150 at TIER_2
and 60/250 at TIER_3.

The heart and Gift Nitro buttons, and the contents of the Send a Gift dialog —
both tiers with their prices and perk lists, the "8D LEFT / Get 5,000 Orbs /
When you gift Nitro" promotion inside the Nitro column and the Patron Badge
strip along the bottom — are from the client.

## Quests

The quest object, as the client parses it:

```
quest      = { id, preview, config, userStatus, targetedContent }
config     = { id, startsAt, expiresAt, features, messages, assets, colors,
               taskConfigV2, rewardsConfig }
messages   = { questName, gameTitle, gamePublisher }
assets     = { hero, heroVideo, questBarHero, questBarHeroVideo, gameTile,
               logotype, logotypeLight, logotypeDark, gameTileLight,
               gameTileDark }
userStatus = { enrolledAt, completedAt, claimedAt, progress }
progress[eventName] = { eventName, value, updatedAt, completedAt,
                        heartbeat: { lastBeatAt, expiresAt } }
```

Task types: `PLAY_ON_DESKTOP`, `PLAY_ON_XBOX`, `PLAY_ON_PLAYSTATION`,
`PLAY_ACTIVITY`, `STREAM_ON_DESKTOP`, `WATCH_VIDEO`, `WATCH_VIDEO_ON_MOBILE`,
`ACHIEVEMENT_IN_GAME`, `ACHIEVEMENT_IN_ACTIVITY`.

Reward types: `REWARD_CODE=1`, `IN_GAME=2`, `COLLECTIBLE=3`,
`VIRTUAL_CURRENCY=4`, `FRACTIONAL_PREMIUM=5`.

Sort orders: `suggested`, `most_recent`, `expiring_soon`,
`recently_enrolled`. Quest colours: `QUESTS_PRIMARY #ca9ef9`,
`QUESTS_SECONDARY #a365e6`, `QUESTS_GRADIENT_START #7d42f2`,
`QUESTS_GRADIENT_END #1d0b24`.

### Quest Home, section by section

The client instruments Quest Home as a set of content locations, and they are
the page's real structure:

```
QUEST_HOME_HERO=50            QUEST_HOME_HERO_SHELF=56
QUEST_HOME_FEATURED_SECTION=59
QUEST_HOME_IN_PROGRESS_SECTION=60
QUEST_HOME_ENDING_SOON_SECTION=61
QUEST_HOME_ORB_SECTION=62
QUEST_HOME_DISCOVERED_SECTION=63
QUEST_HOME_SEARCH_RESULT=64
QUEST_HOME_EXPIRED_SECTION=69
QUEST_HOME_PREVIEW_SECTION=70
QUEST_HOME_SPECIAL_QUESTS_SECTION=72
QUEST_HOME_TAKEOVER=42        QUEST_HOME_ENTRYPOINT=47 (+_THEMED=48)
```

Quests appear well beyond that page: `QUEST_BAR=1` and `QUEST_BAR_V2=10` (the
bar over the chat), `QUEST_INVENTORY_CARD=2`, `QUESTS_EMBED=3`,
`ACTIVITY_PANEL=4`, `MEMBERS_LIST=6`, `QUEST_BADGE=7`, `VIDEO_MODAL=23` with
`VIDEO_MODAL_END_CARD=24` and `VIDEO_MODAL_ICON_END_CARD=57`,
`REWARD_MODAL=25`, `ORBS_ANNOUNCEMENT_MODAL=28`, `ORBS_BALANCE_MENU=29`,
`ORBS_SHOP_HERO_CTA=31`, `QUEST_ENROLLMENT_BLOCKED_MODAL=32`,
`RUNNING_ACTIVITY=40`, `PLAY_QUEST_MODAL=65`, `TROPHY_CASE_CARD=22`,
`NITRO_HOME_PERK_CARD=54`.

### Quest features

`config.features` carries numbers, not names:

```
POST_ENROLLMENT_CTA=1   QUEST_BAR_V2=3   EXCLUDE_RUSSIA=5
IN_HOUSE_CONSOLE_QUEST=6   MOBILE_CONSOLE_QUEST=7   START_QUEST_CTA=8
REWARD_HIGHLIGHTING=9   FRACTIONS_QUEST=10
ADDITIONAL_REDEMPTION_INSTRUCTIONS=11   PACING_V2=12   DISMISSAL_SURVEY=13
MOBILE_QUEST_DOCK=14   QUESTS_CDN=15   PACING_CONTROLLER=16
QUEST_HOME_FORCE_STATIC_IMAGE=17   VIDEO_QUEST_FORCE_HLS_VIDEO=18
VIDEO_QUEST_FORCE_END_CARD_CTA_SWAP=19   EXPERIMENTAL_TARGETING_TRAITS=20
DO_NOT_DISPLAY=21   EXTERNAL_DIALOG=22   MOBILE_ONLY_QUEST_PUSH_TO_MOBILE=23
MANUAL_HEARTBEAT_INITIALIZATION=24   CLOUD_GAMING_ACTIVITY=25
NON_GAMING_PLAY_QUEST=26
```

A quest is `GAMEPLAY` or `VIDEO`; several tasks on one quest join with `and`
or `or`; a quest is `shareable_everywhere` or `not_shareable`.

### The heartbeat, exactly

`QuestsManager` keeps a heartbeat map per task type — `PLAY_ON_DESKTOP`,
`STREAM_ON_DESKTOP`, `PLAY_ACTIVITY` — and schedules each beat with:

```js
let b = +Millis.MINUTE, M = +Millis.SECOND
calculateHeartbeatDurationMs = questId => {
  const { progressSeconds, targetSeconds } = getProgress(quest, DESKTOP)
  const remaining = Math.max(0, (targetSeconds - progressSeconds) * SECOND)
  return remaining <= b ? remaining + M : b
}
```

So: **a beat a minute**, and when less than a minute is left the last beat is
scheduled at exactly the remaining time plus one second, so the quest completes
on a beat. Terminating a task sends a final beat with `terminal: true`. A quest
only beats while it is "actively progressing": not expired, enrolled, and not
yet completed. A `STREAM_ON_DESKTOP` beat additionally requires a live Go Live
and terminates the moment it goes away.

```
POST /quests/{id}/heartbeat
  { stream_key, application_id, terminal, executable_path, executable_fingerprint }
POST /quests/{id}/video-progress   { timestamp }
POST /quests/{id}/enroll           { location, metadata_sealed, traffic_metadata_sealed }
POST /quests/{id}/claim-reward     { platform, location, ... }
     /quests/{id}/console/start    /quests/{id}/console/stop
     /quests/{id}/reward-code      /quests/{id}/preview      /quests/@me
     /quests/@me/claimed
```

Success dispatches `QUESTS_SEND_HEARTBEAT_SUCCESS` with the updated
`userStatus`; failure dispatches `QUESTS_SEND_HEARTBEAT_FAILURE` with the
error, and the client does not retry — the next attempt is the beat already
scheduled. `stream_key` is built as `call:<channelId>:<ownerId>` or
`guild:<guildId>:<channelId>:<ownerId>`.

The current-quests fetch carries `quests`, `excludedQuests`,
`questEnrollmentBlockedUntil` and `questAccessSuspendedUntil` — the client
refuses to start a quest while either is set.

Most quests offer the same job on more than one platform, so picking a task by
a loose prefix picks the wrong one (`"PLAY_ACTIVITY".includes("PLAY")` is true).
Match the exact keys first, take console variants after them, and put
`STREAM_ON_DESKTOP` last: a stream task needs a live Go Live *and* someone else
in the voice channel before Discord will beat at all, so a quest that offers a
stream beside anything else should be driven by the other task. That ordering,
the 60-second cadence and the no-retry behaviour are all corroborated by
[nyxxbit/discord-quest-completer](https://github.com/nyxxbit/discord-quest-completer),
which measured them against live Stable and Canary builds.

The quests on offer are Discord's own Activities, with the application ids the
client uses. Their tasks run on real time: enrolling writes a `userStatus`, and
the task adds elapsed seconds to `progress[eventName].value` on the client's
own 30-second heartbeat, so a fifteen-minute quest takes fifteen minutes and
stops the moment it is paused. `tools/flow3.mjs` verifies the whole loop with a
faked clock rather than a shortcut in the app.

## Client themes (background gradients)

Nitro's background gradients, out of the bundle's own preset table. The ids are
Discord's (`{TWILIGHT:1, PLUM:2, FIRE:3, GOLD_DUST:4, MOSS:5, JADE:6,
OBSIDIAN:7, OCEAN:8, DENIM:9, BLURPLE:10}`), each preset built by a helper that
takes the two stops and the base mix:

```js
_(from, to, baseMix) = { color: from, angle: 0, baseMix,
                         colors: [{ hex: from, stop: 0 }, { hex: to, stop: 100 }] }
```

| Preset | id | dark | light | baseMix |
| --- | --- | --- | --- | --- |
| Twilight | 1 | `#69426A` → `#111731` | `#FA9EFF` → `#5A7EFE` | 100 |
| Denim | 9 | `#5359AD` → `#121238` | `#DBDBFF` → `#6060FF` | 100 |
| Ocean | 8 | `#245B92` → `#141D40` | `#9ADBF7` → `#2D3CCA` | 100 |
| Blurple | 10 | `#533D9E` → `#1A1035` | `#C3BFFF` → `#816BDC` | 100 |
| Obsidian | 7 | `#5E4C85` → `#1E1740` | `#B59DF2` → `#8F89D2` | 100 |
| Plum | 2 | `#8A3F7F` → `#2C0D25` | `#E893FF` → `#FFADDC` | 100 |
| Fire | 3 | `#9B2C2C` → `#2A0C0C` | `#FFEBCA` → `#FF8989` | 50 |
| Gold Dust | 4 | `#6C523D` → `#241912` | `#FFE7DA` → `#FFD89B` | 50 |
| Moss | 5 | `#58694E` → `#222A1C` | `#B7D19F` → `#B1DCA4` | 50 |
| Jade | 6 | `#297071` → `#18203F` | `#C5F0D2` → `#60ADB2` | 50 |

The picker's order is `[TWILIGHT, DENIM, OCEAN, BLURPLE, OBSIDIAN, PLUM, FIRE,
GOLD_DUST, MOSS, JADE]`; the default base mix elsewhere in the client is 74 and
the default accent is `#5865F2`, with the theme's tones clamped to 15–75.
`ClientThemesBackgroundStore` persists only `gradientPresetId`, so the gradient
is a setting alongside the light/dark appearance rather than a theme of its own
— which is why the app applies a preset over whichever base theme is on.

## Collectibles

Discord's collections are products with `styles.background_colors`,
`styles.button_colors` and `styles.confetti_colors` (integers, `'#%06x'`), and
items typed `0` (avatar decoration), `1` (profile effect) and `1000` (bundle).
Prices are keyed by payment tier: `'0'` is the list price, `'4'` the price a
Nitro subscriber pays, both in `prices[key].country_prices.prices[0].amount` as
minor units.

A profile effect carries `staticFrameSrc`, `thumbnailPreviewSrc`,
`reducedMotionSrc` and an `effects[]` list of layers, each with `src`, `loop`,
`width`, `height`, `duration`, `start`, `loopDelay`, `position` and `zIndex` —
an intro layer that plays once, then an idle layer that loops. All of those
`src` values are on `cdn.discordapp.com`.

## Where Discord's own artwork is reachable from

`cdn.discordapp.com` and `discord.com` are both denied by this environment's
egress policy, so none of the web client's images can be fetched directly.
There are two ways in.

The first is other people's copies of the marketing pages.
`aashish-dhiman/discord-clone` rebuilt discord.com's Nitro and home pages and
committed Discord's own SVGs with them, under `src/assets/nitro` and
`src/assets/home` — the Nitro cover (`card4.svg`), the cloud band
(`home/clouds.svg`), the NITRO and NITRO BASIC wordmarks (`nitro2.svg`,
`nitro1.svg`), the sparkles (`star.svg`, `star2.svg`), the MOST POPULAR pill
(`tag.svg`) and twelve perk illustrations (`card1`-`card12`). They are Figma
exports, so they are much heavier than they look — `card7.svg` is 2.8MB — and
worth rendering to WebP at the size they are shown.

The second is the Android client: Wumpus-Central's `Discord-Datamining-Android` unpacks the
APK with apktool and commits the result, and `res/values/public.xml` is a
complete index of every resource name in it — 1,919 drawables — which is how a
name like `images_native_premium_plan_selection_img_wumpus_nitro` is found
without guessing. apktool files each drawable under whichever density the APK
shipped it at, so a resource that is missing from `drawable-xxhdpi` is usually
in `drawable-mdpi`.

Names worth knowing:

```
images_native_premium_plan_selection_img_wumpus_nitro          the helmet Wumpus
images_native_premium_plan_selection_img_wumpus_nitro_classic  Nitro Classic
images_native_premium_plan_selection_img_wumpus_nitro_tier_0   Nitro Basic
images_native_premium_plan_selection_img_boost                 the boost gem
images_native_premium_plan_selection_img_wumpus_nitro_boost    Wumpus on a boost
images_native_premium_plan_selection_yearly_upsell_wumpus      the yearly scene
images_native_gifting_standard_{box_idle,chest_active,cake_idle,coffee_idle}
images_native_avatars_default_avatar_0..5                      the real defaults
images_native_empties_empty_channel_no_text_channels_{dark,light}
images_native_empties_search_empty_state_dark
images_native_icons_activenow{dark,light}2x
images_native_icons_ic_file_small_*                            attachment icons
images_platforms_img_account_sync_*                            connection logos
modules_messages_images_noresults
modules_auth_native_images_welcomesplashart
modules_user_profile_images_banner_sample_banner
images_native_img_nsfw_dark_theme                              the NSFW mark
modules_age_gate_native_images_nsfw_gate                       the age gate
images_native_forum_channels_channel_settings_{grid,list}_view_example_post
modules_guild_boosting_native_images_top_perk_{streaming_quality,vanity_url}
images_native_wumpus_wumpus{ash,link,luigi,mario,pikachu,wizard,wump}
modules_voice_panel_native_images_background
images_native_super_reaction_coachmark
images_native_gradient_overlays_chat_{dark,medium,light}
modules_nuf_channels_native_images_{amanda,mallow,star_blue,star_green,star_pink,star_purple}
```

`tools/fetch-android-art.py` pulls the ones this build uses. Two things worth
recording so they are not chased again:

- `res/values/strings.xml` in that repo is the Android **framework's** strings,
  not Discord's. Discord's own copy is behind hashed intl keys (`i.t.cS889N`)
  in the web bundle, so exact wording is not recoverable from either. The one
  readable table is the Mana design system's `i18n` defaults, which is where
  `AUTOCOMPLETE_NO_RESULTS_HEADER: "Nope!"` and
  `AUTOCOMPLETE_NO_RESULTS_BODY: "Did you make a typo?"` — the quick switcher's
  empty state — come from.
- **Profile-effect artwork has no home on GitHub.** The collectibles archive
  (`Infinitay/discord-collectibles-archive`) commits the catalogue as JSON but
  no images; the two scrapers that do handle effects
  (`JulesZYTB/discord-collectibles-downloader`,
  `dev-rick-c137/Discord-Asset-Scraper`) `.gitignore` what they download. The
  layers stay on `cdn.discordapp.com`, which is denied here, so the Shop shows
  a collection's real `confetti_colors` for an effect instead.

## Motion

Discord does not animate with durations and beziers. It animates with
react-spring, and every surface carries its own `tension` and `friction`, which
means a duration is an *output* of the spring rather than something chosen.
Those configs are in the shipped bundle. `tools/gen-springs.py` solves each one
the way react-spring's frame loop does — 1ms Euler substeps,
`springForce = -tension * 1e-6 * x`, `dampingForce = -friction * 1e-3 * v`, both
over `mass`, stopping when react-spring itself would call it at rest — and
writes them into `src/springs.css` as `linear()` easings with the duration each
one really takes.

| what | config | from → to | settles | overshoot |
| --- | --- | --- | --- | --- |
| modal / layer opening | t1000 f48, **delayed 64ms** | `scale(0.9)`, opacity 0 | 256ms | 2.3% |
| modal / layer closing | t1200 f80 | → `scale(0.9)`, opacity 0 | 371ms | none (overdamped) |
| the scrim behind it | t1000 f48 | opacity 0 | 256ms | — |
| tooltip and popout | t2400 f52 | `scale(0.95)`, opacity 0 | 197ms | 13.5% |
| a select's menu | **220ms is a duration, not a spring** — Floating UI, `ease` | `scaleY(0.96)`, opacity 0.5, origin top centre | 100ms | — |
| a reaction landing | t450 f20 clamped, ×3 | `1 → 0.8 → 1.1 → 1` | 3 × 110ms | to 1.1 by design |
| a button's contents changing | t700 f26 | `scale(0.6)`, opacity 0 | 357ms | 16.7% |
| a notice sliding up | react-spring's default, t170 f26 | `y: 80`, opacity 0 | 711ms | none |
| a count rolling | duration 220ms, clamped, linear | `translate3d(0, 107%, 0)`, opacity 0 | 220ms | — |
| a toast | t120 f14 | `translateY(120%)`, opacity 0 | 633ms | 7.2% |
| the success toast | t500 f18 clamped, delayed 200ms | `translateY(16px)`, opacity 0 | 97ms | — |
| a stepped modal | t300 f28 clamped | slides `left/right: 100%`, opacity `1 - abs(v)`, **and the shell's own width and height on the same spring** | 247ms | — |
| a form error dropping in | t250, friction defaulted to 26, clamped | `height: 0`, `marginTop: 0`, `translate3d(0, -100%, 0)`, opacity 0 → `marginTop: 8` | 282ms | — |
| the animated scroller | t200 f35 **mass 2** clamped | — | 540ms | — |
| react-spring's `stiff`, asked for by name | t210 f20 | — | 510ms | 4.9% |

The typing indicator is worth recording even though this build has nobody to
type: three dots on a triangle wave, `A(x) = x % 2 > 1 ? 2 - (x % 2) : x % 2`,
driven by a `dotCycle` that advances **4 units every 2400ms** linearly — so one
bounce per dot per 1200ms — with each dot offset 0.25 units (150ms) from the
last. `A` maps `[0, .4, .8, 1]` to a `cy` of `[0.8r, 0.8r, r, r]` and an opacity
of `[.3, .3, 1, 1]`, so a dot lifts by a fifth of its radius and dims to 0.3 at
the top of its arc. Showing and hiding the whole group is a separate t900/f50
spring that collapses the three dots into one.

The scroller is the one that cannot be CSS: a scroll position has to be driven
frame by frame, so `src/motion.ts` runs the same integrator in JS and
Jump to Message rides it instead of `behavior: 'smooth'`.

**Reduced motion** is not "turn the animations off". The client keeps the fade
and drops the movement, and it does it per surface:
`scale(0.9)` → `scale(1)` on a modal, `scale(0.95)` → `scale(1)` on a
popout or tooltip, `y: 80` → `y: 0` on a notice. Each of those is literally a
`reducedMotion.enabled ? … : …` in the bundle.

**Strings.** Almost all of Discord's copy is behind hashed intl keys, but the
Mana design system ships its `i18n` defaults in the clear, which is where the
quick switcher's empty state comes from: `AUTOCOMPLETE_NO_RESULTS_HEADER:
"Nope!"`, `AUTOCOMPLETE_NO_RESULTS_BODY: "Did you make a typo?"`.

## Presence, and the avatar it is cut into

A status indicator is not a coloured dot. The client draws one coloured square
per status and puts an SVG mask over it, and the mask is the whole shape:

| status | mask, in `objectBoundingBox` units |
| --- | --- |
| online | `circle(.5, .5, .5)` |
| idle | that circle minus `circle(.25, .25, .375)` — a crescent |
| dnd | minus `rect(x .125, y .375, w .75, h .25, r .125)` — a bar |
| offline / invisible | minus `circle(.5, .5, .25)` — a ring |
| streaming | minus `polygon(0.35,0.25 0.78301275,0.5 0.35,0.75)` — a play triangle |
| typing | `rect(1 × 1, rx .2, ry .5)` |

The gap around it is a **hole cut out of the avatar**, not a ring drawn over
one, which is what lets the crescent and the ring show whatever is behind. The
hole is a second mask: `circle(.5, .5, .5)` minus a circle at
`(1 - corner, 1 - corner)` with radius `corner + 0.05`, where
`corner = (status / 2 + offset) / size`. So the avatar has to sit inside an SVG
the mask can apply to, which is how the client builds it and how
`src/ui/Status.tsx` builds it here.

None of the numbers are proportions. Discord's avatar table:

| size | 16 | 20 | 24 | 32 | 40 | 44 | 48 | 56 | 72 | 80 | 96 | 120 | 152 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| status | 6 | 6 | 8 | 10 | 12 | 12 | 12 | 14 | 16 | 16 | 20 | 24 | 30 |
| stroke | 2 | 2 | 3 | 3 | 4 | 4 | 4 | 4 | 6 | 6 | 8 | 8 | 10 |
| offset | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 4 | 4 | 6 | 8 | 10 |

**Where presence appears.** The member list, the DM list, the account card, a
profile, a voice tile. Never on an avatar in the message feed, and never in
pins, search results, forum posts or a settings member row.

## Nameplates

The newest collectible: a strip painted behind a member's name in the member
list and the DM list, and behind the name on a profile. The client stores only
`{ sku_id, asset, label, palette }` and **derives the gradient from the artwork
itself** — it fetches the nameplate's `static.png`, keeps its dominant colours,
and desaturates them by the user's own saturation setting.

The artwork lives at
`cdn.discordapp.com/assets/collectibles/nameplates/nameplates/<name>/{static.png,asset.webm}`,
which is denied here, and **no repository commits those files**: Safauri/nameplates
and Dev-Rick-C137/Discord-Shop-Assets fetch at runtime or park the results on
Google Drive, and both collectibles archives (Infinitay's and
happyendermangit/discarchives) predate the feature — every item in them is type
0 (decoration) or 1 (effect), never a nameplate.

So the artwork came in as an archive instead, and
`tools/import-nameplates.mjs` turns it into something a single-file build can
carry. Discord ships each plate as a looping VP9 video **with alpha**, 672x126
or 448x84 — 5.33:1, which is the member row at 3x or 2x. There is no ffmpeg
here, so the frame is pulled the way the page itself would: a `<video>` seeked
to the middle of its loop and drawn onto a canvas, which does the WebP encoding
too. Two things to know if that ever needs re-running:

- a `file://` page gets an **opaque origin**, so `getImageData` on a canvas the
  video was drawn into throws `SecurityError` unless Chromium is launched with
  `--allow-file-access-from-files`;
- 236 animated files is 25MB inlined. 236 stills at 288x54 is about a megabyte,
  which is what ships.

**The asset carries its own fade.** Each plate is authored transparent at the
left and solid at the right, so it is drawn edge to edge with nothing over it —
a CSS mask or a colour wash on top fades it twice.

Discord previews one in the Shop as **three member rows with the plate on the
middle one**, not as a swatch, which is what makes it read as the thing you are
buying.

## Attachments: Discord's file-class table

The client picks an attachment's badge with an ordered list of rules, the first
match winning, checking the MIME type where it has one and the file name
otherwise. Lifted verbatim out of the bundle and carried in `src/files.ts`:

| rule | class |
| --- | --- |
| `^image/vnd.adobe.photoshop` | photoshop (`ic_file_small_ps`) |
| `^image/svg\+xml` | webcode |
| `^image/` | image |
| `^video/` | video |
| `.pdf` | acrobat |
| `.ae` | ae |
| `.sketch` | sketch |
| `.ai` | ai |
| `.rar .zip .7z .tar .tar.gz` | archive |
| `.c++ .cpp .cc .c .h .hpp .mm .m .json .js .ts .rb .rake .py .asm .fs .pyc .dtd .cgi .bat .rss .java .graphml .idb .lua .o .gml .prl .sls .conf .cmake .make .sln .vbe .cxx .wbf .vbs .r .wml .php .bash .applescript .fcgi .yaml .ex .exs .sh .ml .actionscript` | code |
| `.txt .rtf .doc .docx .md .pages .ppt .pptx .pptm .key .log` | document |
| `.xls .xlsx .numbers .csv` | spreadsheet |
| `.html .xhtml .htm .xml .xsd .css .styl` | webcode |
| `.mp3 .ogg .opus .wav .aiff .flac` | audio |
| anything else | unknown |

## Connections

The services the client's `ConnectionService` list carries, by the id Discord
uses in its API — note `twitter` survived the rename to X, and `riotgames` and
`leagueoflegends` are separate services:

```
battlenet  bluesky  bungie  crunchyroll  domain  ebay  epicgames  facebook
github  instagram  leagueoflegends  mastodon  paypal  playstation  reddit
riotgames  roblox  samsung  skype  spotify  steam  tiktok  twitch  twitter
xbox  youtube
```

Only some of them take options: Spotify can drive your status
(`show_activity`), Facebook and Steam can sync friends (`friend_sync`), and
every one of them can be shown or hidden on your profile (`visibility`).

## Forum channels

`default_forum_layout`: `0` NOT_SET, `1` LIST_VIEW, `2` GALLERY_VIEW.
`default_sort_order`: `0` LATEST_ACTIVITY, `1` CREATION_DATE. Both are per
channel and both are only defaults — a member's own choice overrides them for
themselves.

## Server Settings

The client's own `GuildSettingsSections`, which is what the sidebar is built
from:

```
OVERVIEW  ONBOARDING  MEMBERS  MEMBER_EDIT  MEMBER_TIMEOUT  MEMBER_KICK
MEMBER_BAN  CHANNELS  ROLES  ROLE_EDIT  ROLE_PERMISSIONS  BANS
INSTANT_INVITES  GUILD_TEMPLATES  INTEGRATIONS  INTEGRATION_SETTINGS
SECURITY  VANITY_URL  EMOJI  AUDIT_LOG  AUDIT_LOG_FILTER  MODERATION
DELETE  ACCESS  DISCOVERY_LANDING_PAGE  ANALYTICS  COMMUNITY
COMMUNITY_WELCOME  MEMBER_VERIFICATION  STICKERS  ROLE_SUBSCRIPTIONS
GUILD_PRODUCTS  SOUNDBOARD  APP_DIRECTORY  GUILD_AUTOMOD  SAFETY
OFFICIAL_MESSAGES  PROFILE  TAG  TAG_CUSTOMIZE  GUILD_THEME  ENGAGEMENT
INVITES  BOOST_PERKS  WEBHOOKS  EDIT_WEBHOOK  INTEGRATION_PLATFORM
LOBBIES_LINKED  CHANNELS_FOLLOWED  COMMUNITY_INTRO
```

Channel settings have their own list: `OVERVIEW PERMISSIONS INSTANT_INVITES
INTEGRATIONS DELETE DEFAULT_FORUM_LAYOUT NOTIFICATIONS PINNED_MESSAGES
PINNED_CHAT NEW_PERMISSION PERMISSION_OVERRIDES CHANGE_CATEGORY WEBHOOKS
CHANNELS_FOLLOWED EDIT_WEBHOOK CHANGE_RTC_REGION EDIT_FORUM_TAG`.

### The enums those sections set

```
GuildVerificationLevel      NONE=0 LOW=1 MEDIUM=2 HIGH=3 VERY_HIGH=4
GuildExplicitContentFilter  DISABLED=0 MEMBERS_WITHOUT_ROLES=1 ALL_MEMBERS=2
SystemChannelFlags          SUPPRESS_JOIN_NOTIFICATIONS:1
                            SUPPRESS_PREMIUM_SUBSCRIPTIONS:2
                            SUPPRESS_GUILD_REMINDER_NOTIFICATIONS:4
                            SUPPRESS_JOIN_NOTIFICATION_REPLIES:8
AutoModerationTriggerType   KEYWORD=1 SPAM_LINK=2 ML_SPAM=3
                            DEFAULT_KEYWORD_LIST=4 MENTION_SPAM=5
                            USER_PROFILE=6 SERVER_POLICY=7
AutoModerationActionType    BLOCK_MESSAGE=1 FLAG_TO_CHANNEL=2
                            USER_COMMUNICATION_DISABLED=3 QUARANTINE_USER=4
KeywordPresetType           PROFANITY=1 SEXUAL_CONTENT=2 SLURS=3
```

Server tags are worn with a badge from a pack the server has unlocked, and the
packs are guild features with their own badge ids:
`GUILD_TAGS_BADGE_PACK_PETS` 21-25, `..._FLEX` 26-30, `..._PLANT` 31-35,
`..._CREEPY_CRAWLIES` 36-40.
