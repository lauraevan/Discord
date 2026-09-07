# Discord desktop UI

A pixel-measured recreation of the Discord desktop client, built with React +
TypeScript + Vite. Panel boundaries, row heights, type sizes and icon greys are
literal values measured off a reference frame rather than rounded design
tokens, and `npm run build` emits one self-contained `dist/index.html`.

## What is real here

Every enum, section list, menu, plan table and icon below was pulled out of
Discord's own shipped client bundle rather than reconstructed from memory. See
[`docs/discord-reference.md`](docs/discord-reference.md) for what was extracted
and how. Where a surface genuinely needs Discord's servers, a payment or a
device, it says so on the page instead of faking a control.

### Accounts

Register and login screens with Discord's field set, hint text and errors —
username 2-32 lowercase with `_` and `.`, *"Must be between 2 and 32 in
length."*, *"You need to be older to sign up for Discord."* — and a real gate:
nothing renders until somebody is signed in, and the client is keyed on the
username so logging out and back in remounts it. There is no account server, so
accounts live in localStorage, but the password never does: a per-account random
salt and the SHA-256 of `salt:password` is all that is kept.

The login page's QR is a real, scannable QR code carrying a remote-auth URL of
the shape Discord's uses — `src/qr.ts` is a byte-mode encoder with version
selection, Reed-Solomon and all eight data masks scored by the standard's
penalty rules, verified against an independent decoder.

### Servers

Discord's three-step create flow — *Create a server* (Create My Own, or one of
Gaming / School Club / Study Group / Friends / Artists & Creators / Local
Community), *Tell us more about your server* (friends, or a club or community,
skippable), *Customize your server* (icon upload, name, guidelines line) — plus
Join a Server. A new server gets exactly `#general` and a `General` voice
channel; a template adds its own categories on top.

### Nitro

The eleven plans Discord bills, with their `premium_type` numbers, billing
intervals and SKU ids; the `PremiumFeatures` flags the client gates perks on;
the brand hexes from its colour table. Five tabs (Home, What's New, Best of
Nitro, Plans, Compare), the heart and Gift Nitro buttons, and the Send a Gift
dialog with both tiers, the Orbs promotion and the Patron Badge strip.

Subscribing is not cosmetic. It grants the Nitro badge, moves the composer's
character counter from 2,000 to 4,000 and its upload cap from 10MB to 500MB, and
turns on the Shop discount and the Quest orb multiplier. Gifts mint a real
`discord.gift` code that can be copied or redeemed.

### Quests

The client's own quest object — `config` / `messages` / `assets` / `colors` /
`taskConfigV2` / `rewardsConfig`, and a `userStatus` whose
`progress[eventName]` carries a heartbeat — with its task types, reward types,
sort orders and colours. The quests are Discord's first-party Activities, with
the application ids the client uses.

The tasks run on real time: enrolling writes a `userStatus`, and the task adds
elapsed seconds on the client's own 30-second heartbeat, so a fifteen-minute
quest takes fifteen minutes and stops the moment it is paused. Nothing is
skipped forward.

### Shop

Orbs earned from Quests buy avatar decorations, discounted by Nitro's
`SHOP_DISCOUNTS` perk, and a bought decoration is worn on the real avatar
everywhere in the app.

### Messages

Discord-flavour markdown (not CommonMark): `**b**` `*i*` `__u__` `~~s~~`
`||spoiler||` `` `code` `` ```` ```lang ```` `> q` `>>> q` `# ## ###`
`-# subtext` `- ` `1. ` `[text](url)` `\` escape, nesting via a recursive
parser, and no tables/images/task lists — which Discord also omits. 178 Twemoji
by `:shortcode:` or character, jumbo when a message is only emoji (capped at 27).

Grouping breaks at 7 minutes · date dividers · gutter timestamps on hover ·
reactions · replies with the elbow spine · inline editing with `(edited)` ·
`↑` to edit your last · pins · click-to-reveal spoilers · **uploads that wait in
the composer** with Discord's spoiler / rename / remove toolbar and send with the
message · **polls** (up to 10 answers, single or multi, the client's duration
list, live bars, Show results, closed state) · **threads** nested under their
parent · **system messages** using Discord's MessageType values.

### Screens

| Screen | What's real |
| --- | --- |
| **User Settings** | The client's own 25 sections in its own groups. Appearance drives message display, font scale, group spacing, zoom, saturation and link underlines through live CSS variables — compact mode really is compact. Accessibility drives reduced motion. Streamer Mode really blurs invite codes and email. Keybinds, Language (30 locales), Notifications, Voice & Video, Text & Images, Data & Privacy, Advanced, Log Out. |
| **Server Settings** | Overview, Roles (a working editor over Discord's real permission list, grouped and worded as the client groups it), Emoji, Members, Invites (Discord-shaped codes), Bans, Audit Log — which is real, written by your own actions — and Delete Server. |
| **Channel Settings** | Name, topic, the real slowmode steps, age restriction; voice channels explain what is missing. |
| **Home** | Friends with the client's Online / All / Pending / Blocked tabs and empty-state copy, Add Friend, the Active Now panel, the DM sidebar, and the Nitro / Shop / Quests rows. |
| **Profile popout & modal** | Themed and unthemed profiles, the status bubble with Discord's rotating prompt, twelve badges, About Me, Member Since, Roles, Note. |
| **Forum channels** | Post cards, New Post composer, sort by Latest Activity or Date Posted. |
| **Voice channels** | Join, participant tile, the control tray (camera, screen, activities, soundboard, mute, deafen, disconnect) and the Voice Connected strip. |
| **Inbox** | Unreads / For You / Mentions with mark-all-as-read. |

### Getting around

Quick switcher (`Ctrl`/`⌘`+`K`) · autocomplete on `#` `@` `:` `/` · `/shrug`
`/tableflip` `/unflip` `/me` `/spoiler` · search with Discord's filters
(`from:` `mentions:` `has:` `before:` `during:` `after:` `in:` `pinned:`) and
the SEARCH OPTIONS list · unread pips, the red NEW divider, `Esc` to mark a
channel read and `Shift`+`Esc` the server · member list · nested right-click
menus, including Mute Channel with the client's six durations · custom status ·
Schedule Message · Developer Mode adding Copy ID · every channel type in Create
Channel.

Everything persists to localStorage.

## What is not here, and why

A page cannot do these, so rather than mock them up they are drawn where they
belong and labelled:

- **Voice and video transport**, screen share, Go Live, soundboard audio — no
  media server, and no microphone permission.
- **Anything with another person** — friends, DMs, mentions from others, the
  member list beyond you. Inventing a cast would be the lie this project is
  trying not to tell.
- **Real payments.** Nitro, gifts and Shop purchases are modelled and applied
  in full, but nothing is charged and no card is asked for.
- **Bots, apps, webhooks, AutoMod, integrations** — all server-side.
- **The game overlay and game detection** — desktop-app features.

## Assets

Nothing is cropped out of a screenshot.

- **Icons** — Discord's own, taken *by name*. Each icon in the bundle is its own
  webpack module that declares its export before defining it, and a barrel
  re-exports the set under readable names, so `tools/extract-named-icons.py`
  joins name to geometry through the module graph and writes 684 of them;
  `tools/gen-icons.py` maps this app's slots onto Discord's names and generates
  `src/ui/Icons.tsx`. The channel-type glyphs come from the client's own
  channel-type switch rather than a judgement call.
- **Emoji** — 178 Twemoji from
  [jdecked/twemoji](https://github.com/jdecked/twemoji), bundled by
  `tools/gen-emoji.mjs` as a single `<symbol>` sprite (231KB) rather than 178
  data URIs (~960KB), since the same glyph repeats all over a channel.
- **Badges** — twelve, each taken from whichever source scored closest against
  the reference at its own 14px: four are Discord's own PNGs mirrored in
  [Debuggingss/discord-badges](https://github.com/Debuggingss/discord-badges),
  eight are redraws from
  [mezotv/discord-badges](https://github.com/mezotv/discord-badges).
- **Artwork** — the Nitro hero and perk scenes, the quest key art, the Shop's
  avatar decorations, the profile banner, the avatars, the onboarding sprites
  and the empty-state character are all drawn here, in `src/ui/`. None of it is
  Discord's own illustration and none of it pretends to be: their art is served
  from a CDN this page cannot reach, the GitHub mirror that carried their
  avatar decorations was taken down by Discord, and Decor — the obvious
  alternative — bans re-uploads of Discord's decorations outright. What *is*
  theirs and is used exactly: the geometry, the gradient stops from the client's
  own colour table, the copy, and the icons.
- **Type** — Figtree (SIL OFL 1.1), self-hosted as base64 so the page makes no
  external requests. It stands in for Discord's proprietary gg sans, and it was
  chosen by measurement: twenty candidate families rendered at the size that
  puts their ink at the reference's exact width, scored against the frame with a
  ±3px alignment search on four strings at four weights.

## Measuring against the reference

`docs/reference.png` is the lossless frame everything is fitted to;
`docs/refs/` holds four more from a second session.

```bash
node tools/ref.mjs shot.png popout   # reproduce the reference state exactly
python3 tools/score.py shot.png --blocks 12
```

`score.py` prints the mean absolute grey difference over the whole frame, and
again over only the regions that *can* match — the reference's own avatars,
its profile banner and the other server's rail tile are photographs of an
account that does not exist here, so they are a fixed floor that would hide real
movement elsewhere. `--blocks N` lists the worst 16×16 cells, which is what says
where to look next.

The loop that produced the current numbers: reproduce the state, score, look at
the worst blocks, zoom the region, measure it (ink bbox, DOM box, text width, or
a region sweep with `tools/tune.mjs`), apply, re-score.

**Current: 1.823 whole frame, 1.155 matchable.** Everything outside the welcome
heading is under 45 per block; the heading is the font standing in for gg sans.

## Develop

```bash
npm install
npm run dev
npm run build                       # single self-contained dist/index.html
npm run lint
```

```bash
node tools/flow.mjs     # markdown, polls, threads, menus, search — 24 checks
node tools/flow2.mjs    # settings, roles, emoji, invites, status — 19 checks
node tools/flow3.mjs    # accounts, server creation, Nitro, Quests, uploads
node tools/stale.mjs    # load with corrupt / outdated saved data
node tools/smoke.mjs    # console errors on a clean load
```

```bash
node tools/icon-sheet.mjs icons.png          # every icon the app uses, labelled
node tools/icon-candidates.mjs c.png 14 …    # candidates for a reference crop
node tools/boxes.mjs '.intro' '.composer'    # layout boxes for a selector
node tools/ref2.mjs shot.png popout          # the second reference set's state
```

## Saved state

State lives in localStorage, and the shape of it changed while this was being
built — a value written by an earlier build crashed the app on load, leaving a
white screen the reader had no way to clear, since the only copy of the bad data
was in their own browser. Two defences now:

- **Versioned keys.** `discord-ui:v4:*`. A schema bump orphans the old data
  instead of feeding it to code that can't read it, and keys from earlier
  versions are dropped on the next load.
- **Validated reads.** Every value is checked against the shape the app expects
  (`src/storage.ts`); anything unparseable, mistyped or malformed is discarded
  and the default is used. `tools/stale.mjs` covers fourteen such cases,
  including credentials that fail validation and a session naming an account
  that is gone.

Behind both, an error boundary catches any render that still throws and offers a
**Clear saved data and reload** button, so nothing here can put the page into a
state a reader can't get out of.

## Greys

Discord tints each surface separately, so the icon and placeholder greys are
percentages of `--text` composited over the surface behind them, measured off
the reference: sidebar rows 47%, search glyph 66%, header tools 62%, composer
actions 68%, the attach `+` 62%, the user card's controls 68%, composer
placeholder 35.5%.
