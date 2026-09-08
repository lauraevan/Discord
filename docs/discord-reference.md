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
```
