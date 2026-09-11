# Ground truth

Everything the app reproduces is checked against Discord's own shipped client
rather than reconstructed from memory. The client bundle is mirrored daily at
[Discord-Datamining/Discord-Datamining](https://github.com/Discord-Datamining/Discord-Datamining)
(`current.js`, ~12MB); the lists below were extracted from it, so the section
names, enums and orderings here are Discord's, verbatim.

The reference frame — the screenshot the geometry is measured from — is the
second source of truth, for anything visual.

## The vendored sources

Three files under `docs/sources/` are Discord's own, mirrored verbatim, and
between them they answer most questions that used to be answered by squinting
at a screenshot. Each has a tool that queries it.

| file | what it is | tool |
| --- | --- | --- |
| `discord-strings.json` | Discord's shipped client string table — 27,325 entries of the exact English the client renders, keyed by Discord's own hashes. From [Wumpus-Central/discrapper-canary](https://github.com/Wumpus-Central/discrapper-canary) `data/strings.json`. | `tools/strings.py` |
| `discord-css.css.gz` | every CSS chunk the canary client ships, concatenated — 8.9 MB, ~8,100 class names. Discord builds with CSS modules and keeps the source name in front of the hash, so `.messageContent__abc12` is still legible. Same repo, `css/*.css`. | `tools/dcss.py`, `tools/dtheme.py` |
| — | Discord's Zendesk help centre as Markdown, hourly, on the `data` branch of [Wumpus-Central/blog-tracker](https://github.com/Wumpus-Central/blog-tracker) at `support/{id}.md`. Not vendored; fetched when needed. `state.json` indexes 512 articles. | — |

`tools/strings.py has "..."` is the one to reach for first, with one asymmetry
that matters: a hit proves the string is Discord's, verbatim, while a miss
proves nothing. The table is what the scraper found in the chunks it had, not
Discord's whole en-US catalogue — plainly real labels like "My Account" and
"Password and Authentication" are simply not in it. Confirm with a hit, explore
with `near`, and never treat MISSING as a defect to fix. `tools/dcss.py
rule <name>` prints what Discord actually wrote for a component, and
`tools/dtheme.py` resolves a theme token through Discord's `color-mix` chain to
the hex the client paints.

### What the stylesheet settled

Discord's layout variables, read straight off `:root`, agree with what had been
measured off the captures — which is the best possible check on both:

    --space-md: 16px
    --guildbar-avatar-size: 40px
    --custom-guild-list-width: calc(40px + 16px*2)   = 72px, our rail
    --custom-message-avatar-size: 40px
    --custom-message-margin-horizontal: var(--space-md)          = 16px
    --custom-message-margin-left-content-cozy: 40 + 16 + 16      = 72px
    --custom-channel-header-height: 49px             = our 48px + its 1px rule
    --custom-member-list-width: 264px  (268px under .density-cozy)

And it settled the pane rim, which had been reverse-engineered as "1px lighter,
1–12% of the text colour". Discord calls it `--border-subtle` and defines it as
`hsl(240 4% 60.784% / 0.1216)` — 12%, exactly.

### The themes are Discord's, hex for hex

`src/themes.ts` is now generated from `tools/dtheme.py` rather than tuned. The
CSS class names are historical, and the mapping is worth writing down because it
is not the obvious one: Discord's `theme-dark` is the theme the UI calls **Ash**,
`theme-darker` is **Dark**, `theme-midnight` is **Onyx**. Ash and Onyx had been
carrying the 2023 palette (`#1e1f22`/`#2b2d31`/`#313338`) and are now the
refresh's.

Two tokens are translucent because Discord's are: a channel row's hover and
selected states are grey overlays (`--interactive-background-hover` at 12%,
`--interactive-background-selected` at 20%), not opaque fills. Over the Dark
sidebar the selected overlay computes to `#2d2d31`, and the capture reads
`#2c2b30` — which is how the whole mapping was confirmed.

### What else the stylesheet corrected

Surfaces neither reference frame shows had drifted furthest, because nothing
was holding them to anything:

| | was | Discord's |
| --- | --- | --- |
| elevation | fifteen hand-made shadows, 20–40px blur at 0.4–0.55 | three tokens, `--shadow-high` at 24px/0.24 |
| menu hover | blurple fill, red on destructive rows | `--background-mod-subtle`, label unchanged |
| scrollbar | 8/16px, thumb `#101012` | 14px and 8px, thumbs `#666770` / `#5f606a` |
| tooltip | black pill, 12px/600, 5px radius, no pointer | `--background-surface-highest` card, 14px/500, 8px radius, 5px pointer |
| buttons | 34–38px tall, 3px radius, hover *brightens* | 40px, 8px radius, hover **darkens** to `#4452bb` |
| inputs | `var(--rail)` fill, 4px radius | `--input-background-default` wash, 8px radius, 44px |
| modal | 420px unscaled, no border, popout shadow | 442px, `--border-normal`, `--shadow-medium` |
| scrim | flat 0.6 black | `#000000b8` dark / `#00000085` light |
| member list | 240px, sidebar grey | 264px, chat colour, 1px left border |

The blurple menu hover is the one worth naming: that is the pre-refresh client,
and no amount of measuring would have caught it, because both reference frames
are static and nothing in them is hovered.

### The one place the scorers are wrong, again

`--text-default` for Dark is `#efeff1`. The app had `#e4e4e8`, and **both
scorers prefer `#e4e4e8`** — by 0.015 on the frame and 0.023 on the capture. They
are both wrong, for the reason recorded under *Scoring a frame*: our headless
render lays down ~48% more measurable ink than the JPEG, so a darker text colour
flatters a metric that is really comparing ink.

The unbiased measurement is the glyph core, where antialiasing cannot reach.
Taking the mean of the brightest 1% of a message-body band, past the edges:

| | top 1% | top 0.1% |
| --- | --- | --- |
| real capture | `#f0eff4` | `#f5f4f9` |
| ours at `#e4e4e8` | `#e5e5e9` | `#f1f1f2` |
| ours at `#efeff1` | `#f0f0f2` | `#f5f6f6` |

`#efeff1` lands on the capture; `#e4e4e8` is ~11 too dark. Discord's declared
value and the unbiased measurement agree, so the scores were paid: frame 1.361 →
1.376, capture 2.771 → 2.788. Do not "fix" this by chasing the score.

### The elevation scale

Discord has exactly three drop shadows and no others, and every floating
surface in the client — menu, popout, modal — is `--shadow-border` plus
`--shadow-high`:

    --shadow-low:    0 1px 4px 0 rgb(0 0 0 / 0.14)
    --shadow-medium: 0 4px 8px 0 rgb(0 0 0 / 0.16)
    --shadow-high:   0 12px 24px 0 rgb(0 0 0 / 0.24)
    --shadow-border: 0 0 0 1px var(--border-strong)

The app had fifteen different hand-made shadows, 20–40px of blur at 0.4–0.55
alpha — two to four times Discord's weight, and the most obvious kind of
"themed, not exact". They are all tokens now. Note that the stylesheet is
written in frame units, so the tokens carry `* var(--u)` like every other
length; writing them in Discord's raw px makes every shadow 25% too large.

This costs the frame 0.014 (1.376 → 1.390), and it is worth understanding why
before anyone reverts it. `.profilePopout` is declared, verbatim,
`box-shadow: var(--shadow-border), var(--shadow-high)`, so there is no question
what Discord does. Diffing *only* the shadow band beside the popout against the
frame gives 1.037 for Discord's shadow and 0.819 for the old hand-fitted one —
a difference of 0.2 in 255, which is nothing. The score metric is amplifying a
soft gradient it cannot resolve. The right band is the measurement; the
aggregate is not.

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

`tools/capscore.py` is the same metric against `docs/refs/febf1f6c.jpg`, and
`tools/cap.mjs` puts the app into that capture's own frame at its 2x device
scale. Two scorers, because the two references are not the same kind of
evidence and neither settles everything on its own.

### The two references, and which one wins

`docs/reference.png` is Discord captured at 80% — a downscale. `docs/refs/*.jpg`
are native screenshots at 1:1. That difference decides which to believe:

- **Sub-pixel edges: the captures.** A downscale kernel spreads an edge past
  where it geometrically is, so the frame reads the composer and the account
  card about 1.4 real px taller than they are. The composer is 58 real px, not
  58.75, because 116 device rows of an unresampled screenshot say so.
- **Layout at whole-pixel scale: either.** They agree on the rail, the row
  pitch, the icon sizes, the type, the message row and the header.
- **Three things they genuinely disagree on**, all on the right-hand side and
  all resolved for the captures, which outnumber the frame four to one and are
  the client as it ships today:
  - the channel list's right edge — the selected plate 1.25 real px short of
    the pane in the captures against 9.75 in the frame, a uniform 9.5 across
    the plate, the heading and its plus, which is what a reserved scrollbar
    gutter looks like and nothing else does;
  - the composer's right-hand glyphs — 8 real px in from the box's edge in all
    four captures against 21 in the frame, with the group's own pitch and glyph
    sizes agreeing everywhere else;
  - the title bar's third button — the frame's account carries a Support Tools
    button and the captures' does not, which is an account difference rather
    than a version one. The app followed the frame here and kept it, which made
    this the one disagreement decided the other way; it is now dropped like the
    rest. Four captures to one frame, and the frame's extra button pushes the
    two the captures do have out of place, which is what the headers region was
    charging for.

The frame charges for every one of these, and it should: a kernel that spreads
a 40px block's edges reads it as 41.25, and one that spreads a 1px line reads
it dimmer than it is. Running tally, frame cost against capture gain:

| decision | frame | capture |
| --- | --- | --- |
| channel list's right edge | +0.031 | -0.018 |
| composer's right-hand glyphs | +0.101 | -0.130 |
| pane rim and rounded corner | +0.012 | +0.015 |
| rail: 40px tile on a 48px pitch | +0.045 | -0.021 |
| header rules at 7.6% rather than 4.5% | +0.005 | +0.002 |
| title bar 30 and headers 48, rail 72 | +0.056 | -0.116 |
| no Support Tools button in the title bar | +0.008 | -0.020 |
| chat header's right group: both ends on the capture | +0.060 | -0.105 |

The chat header's right-hand group is the newest of these and the clearest:
every length in it had been fitted to the frame, and against the captures the
whole group sat left — its right-most ink on 1348 where the capture has 1351,
its left-most on 950.5 where the capture has 956.5. Moving it 3 right, taking
the search box to Discord's own `max-width: 244px` and closing the four gaps by
1 real px each puts all three ends on the capture exactly and takes the headers
region from 4.965 to 4.015.

The frame is at 1.45 where it could be 1.10, and the capture at 2.64 where it
started at 4.59. Eighteen of the twenty landmarks in `tools/landmarks.mjs` —
whose expectations are read off the captures, not remembered — now measure
exactly zero, against fourteen before.

### The rim

Discord draws a 1px rim, one to eight per cent of the text colour over
whatever is under it, on nearly every raised or floating surface. It is small
enough to miss and structural enough that missing it is what makes a copy read
as a theme. Measured so far, all off the 1:1 captures:

| surface | fill | rim |
| --- | --- | --- |
| panes right of the rail | — | rgb(34,33,38), top and rail seam, 11px round on the corner |
| composer | rgb(35,34,39) | rgb(39,38,43) — 2% |
| onboarding checklist card | rgb(36,35,40) | rgb(50,49,54) — 8% |
| plus menu, context menus | rgb(40,39,44) | rgb(55,54,60) — 8% |
| staged upload card | rgb(36,35,40) | 12% |

### Comparing ink between a render and a capture

A headless render at deviceScaleFactor 2 lays down about half again as much
measurable ink as the same type in `docs/refs/*.jpg` — 1638 pixels over 140
against 1112 for one line of message body, 1034 against 698 for the channel
name in the header. The render carries subpixel fringes the capture does not,
and greyscale conversion turns those into ink.

So an ink or stem-width comparison between the two is only meaningful as a
*ratio against a string whose weight is already known to match*. The channel
name in the chat header reads 48% heavy against the capture and looks bolder
under magnification, and it is not: the message body under it, which is
Discord's 400 at 16px and verified, reads 47% heavy by the same measure.

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

### Where the rules come from

Discord's help centre is mirrored as Markdown, hourly, in
[Wumpus-Central/blog-tracker](https://github.com/Wumpus-Central/blog-tracker)
on its `data` branch — `data/support/{id}.md` — which is reachable where
support.discord.com is not. The rules the Quests tab enforces are quoted from
there rather than remembered, and each quote sits in `src/quests.ts` beside the
constant it sets:

| article | id | what it settles |
| --- | --- | --- |
| Discord Quests FAQ | 22225719947543 | the two accept labels, "Claim Reward", the 13-to-17 daily cap of three and its 24-hour timer, "Hide This", the video quest pausing when you switch windows |
| Discord Orbs FAQ | 30593690165783 | Nitro's Orbs multiplier — **1.2x**, where this had 2 |
| Nitro Quest Perk | 29790581779735 | Quest avatar decorations last two months, and Nitro extends them |
| Discord Cloud Play Quests | 35372187686295 | the Cloud Play quest type and its "Try Game" |

`tools/quests.mjs` asserts them.

### What is not here

The quests themselves. Real Discord quests are game-publisher promotions and
Discord publishes no list of them; no GitHub archive carries one, and every
quest tracker that does is a site the egress policy blocks. The quests on the
tab are Discord's own first-party Activities, which are real products with real
names, and the tab's *behaviour* is Discord's. Inventing "Play <real game> for
15 minutes" would be inventing a quest.

### Profile effects

Not implemented, and deliberately. `Infinitay/discord-collectibles-archive`
carries Discord's real effect definitions — `discord-data/profile-effects/*.json`
and `discord-data/raw/user-profile-effects.json`, with every effect's name,
description, accessibility label, animation type and per-layer sprite with its
duration, loop, position and z-index — but every layer's `src` is on
cdn.discordapp.com, which is blocked. Checked and rejected: Dev-Rick-C137/
Discord-Shop-Assets (Google Drive, effects not published), CustomEffects/
CustomEffects with its DefaultEffects and db repos (community art, not
Discord's), DTACat's themes (they link Discord's CDN), uhidontkno/
DiscordAvatarDecorations (decorations only), the npm registry, and archive.org
(blocked). Names without artwork is what the Shop already does; drawing them
would be worse.


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

## Nitro: display-name styles

A styled name is the client's `DisplayNameStyles` proto — `{ font_id,
effect_id, colors }` — and both enums are in the bundle.

**DisplayNameFont**: `1` BANGERS, `2` BIO_RHYME, `3` CHERRY_BOMB, `4` CHICLE,
`5` COMPAGNON, `6` MUSEO_MODERNO, `7` NEO_CASTEL, `8` PIXELIFY, `9` RIBES,
`10` SINISTRE, `11` DEFAULT, `12` ZILLA_SLAB, `13` PLAYPEN_SANS, `14` ORBITRON,
`15` NEW_ROCKER, `16` KALAM. The set the client actually maps to a face is
DEFAULT plus CHERRY_BOMB, CHICLE, MUSEO_MODERNO, NEO_CASTEL, PIXELIFY,
SINISTRE, ZILLA_SLAB, PLAYPEN_SANS, ORBITRON, NEW_ROCKER, KALAM — the other
four are in the enum but unshipped.

All but two are Google Fonts, and `google/fonts` carries them under the OFL
where `fonts.gstatic.com` is denied, so `tools/fetch-name-fonts.py` vendors the
real faces — subset to the characters a display name can hold and pinned to one
weight, which takes 3MB of TTF down to 175KB of WOFF2. **Neo Castel and
Sinistre are Discord-licensed and on no public mirror**, so they are absent
rather than approximated.

**DisplayNameEffect**: `1` SOLID, `2` GRADIENT, `3` NEON, `4` TOON, `5` POP,
`6` GLOW, `7` PRISM, `8` GUMMY. How many colours each takes is the client's own
switch — GRADIENT 2, GUMMY 4, PRISM 5, everything else 1 — and every shade an
effect draws with is derived rather than stored:

```
main       the colour itself
light1     l * 1.2          light2   l * 1.6
dark1      l * 0.6          dark2    l * 0.2
toonStroke l * 0.4, floored at 0.12
neonStroke s * 1.2, l + 0.1 capped at 0.6
```

and where an effect wants more colours than were picked, they come off a
four-stop spread of the first: hue shifts of `-18, -5, +9, +22` at saturations
`.54 .66 .56 .60` and lightnesses `.72 .60 .68 .63`.

## GIFs

Discord's GIF tab is a Tenor search. That route is closed twice over:
`tenor.googleapis.com` answers but refuses an unregistered caller, and every
media host it would hand back (`media.tenor.com`, `c.tenor.com`) is denied by
this environment's egress policy, as are Giphy's. So the tab needed real GIFs
from somewhere else.

**`fonts.gstatic.com` is reachable**, and Google publishes Noto Animated Emoji
there as actual GIFs — `/s/e/notoemoji/latest/<codepoint>/512.gif` — under
CC BY 4.0. They are also the kind of thing people react with, which is what the
tab is for. `tools/fetch-gifs.py` pulls 40 of them across six categories and
re-encodes each to an animated WebP: they arrive as 512px, 50-frame,
one-megabyte files, and a ladder drops resolution, then frames, then quality
until each fits 24KB, the same shape as tools/fetch-decorations.py.

**Favourites are the other half**, and entirely local: a GIF in the feed is
badged and carries a star, starring it puts it at the top of the picker, and an
Add button takes one off disk.

## The expression picker

Every button on the right of the composer opens **one** popover, not a picker
each. The client's own enum names its views:

```
emoji  gif  sticker  soundboard
```

and the button that opened it only chooses which view to start on
(`expression-picker-chat-input-button`); the switching happens inside the
picker. Two of those views have nothing behind them here and say so rather than
pretending: GIFs are a Tenor search, which is a request to somebody else's
server, and a soundboard sound needs the voice server it would go out over.

A **sticker is its own message.** Discord sends it with no text at all — the
message carries `sticker_items` — and draws it at 160px with no bubble. The
sticker itself is a 320x320 PNG or APNG uploaded in Server Settings, filed
under an emoji, which is what people search it by.

## Threads

The channel header's threads button drops a panel listing the threads hanging
off that channel, split **Active** and **Archived**, each row carrying the
thread's name, how many messages are in it and the last line. Picking one opens
it. A thread is a channel with a `parentId` and a `rootMessageId`, which is how
Discord models one too — it lives under its parent in the sidebar rather than
in the channel list proper.

## Timestamps

The stamp on a group's first message is not the bare time: today is
"Today at 5:42 PM", yesterday is "Yesterday at 5:42 PM", and anything older is
the short date and then the time. Compact mode is the exception — it prints the
time alone in the gutter, which is the point of it.

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
