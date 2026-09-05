# Discord desktop UI

A pixel-measured recreation of the Discord desktop client, built with React +
TypeScript + Vite. Panel boundaries, row heights and type sizes are literal
pixel values measured off the reference frame (a 1558x743 window) rather than
rounded design tokens.

## What is real here

Every section list, enum and menu below was extracted from Discord's own
shipped client bundle rather than reconstructed from memory — see
[`docs/discord-reference.md`](docs/discord-reference.md) for what was pulled and
from where. Where a surface needs Discord's servers, a payment or a device, it
says so on the page instead of faking a control.

### Messages

Discord-flavour markdown (not CommonMark): `**b**` `*i*` `__u__` `~~s~~`
`||spoiler||` `` `code` `` ```` ```lang ```` `> q` `>>> q` `# ## ###`
`-# subtext` `- ` `1. ` `[text](url)` `\` escape, nesting via a recursive
parser, and no tables/images/task lists — which Discord also omits. 178 Twemoji
by `:shortcode:` or character, jumbo when a message is only emoji (capped at 27).

Grouping breaks at 7 minutes · date dividers · gutter timestamps on hover ·
reactions · replies with the elbow spine · inline editing with `(edited)` ·
`↑` to edit your last · pins · click-to-reveal spoilers · image paste and upload
as data URLs · **polls** (up to 10 answers, single or multi, the client's
duration list, live bars, Show results, closed state) · **threads** nested under
their parent · **system messages** using Discord's MessageType values, including
the rotating join lines.

### Screens

| Screen | What's real |
| --- | --- |
| **User Settings** | The client's own 25 sections in its own groups. Appearance drives message display, font scale, group spacing, zoom, saturation and link underlines through live CSS variables — compact mode really is compact. Accessibility drives reduced motion. Streamer Mode really blurs invite codes and email. Keybinds, Language (30 locales), Notifications, Voice & Video, Text & Images, Data & Privacy, Advanced. |
| **Server Settings** | Overview, Roles (a working editor over Discord's real permission list, grouped and worded as the client groups it), Emoji, Members, Invites (Discord-shaped codes), Bans, Audit Log — which is real, written by your own actions — and Delete Server. |
| **Channel Settings** | Name, topic, the real slowmode steps, age restriction; voice channels explain what is missing. |
| **Home** | Friends with the client's Online / All / Pending / Blocked tabs and empty-state copy, Add Friend, the Active Now panel and the DM sidebar. |
| **Profile modal** | Banner, avatar, names, About Me, Member Since, Roles, Note, message box. |
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
Developer Mode adding Copy ID · every channel type in Create Channel.

Everything persists to localStorage.

## What is not here, and why

A page cannot do these, so rather than mock them up they are drawn where they
belong and labelled:

- **Voice and video transport**, screen share, Go Live, soundboard audio — no
  media server, and no microphone permission.
- **Anything with another person** — friends, DMs, mentions from others, the
  member list beyond you. Inventing a cast would be the lie this project is
  trying not to tell.
- **Payments** — Nitro, Server Boost, the shop, gift inventory.
- **Bots, apps, webhooks, AutoMod, integrations** — all server-side.
- **The game overlay and game detection** — desktop-app features.

## Measured geometry (px, window 1558x743)

| Element | Value |
| --- | --- |
| Title bar | 24 tall; centred server mark + name; window actions at the right |
| Server rail | 0-58; 33px tiles on a 39px pitch; separator under the home button |
| Sidebar | 58-305; header 40 tall with its rule at y 63 |
| Rows | 27 tall, 28px pitch, x 65-297, r4; icon at x 72, label at x 95 |
| Selected row | x 65-297, y 205-230 |
| Chat | 305-1558; header 40; toolbar at x 1222/1256/1288/1320; search 198x26 at x 1350 |
| Empty state | 48px glyph at y 510; title y 575; Edit Channel button y 635 |
| Composer | x 311-1552, y 690-738, r8; + at 327; actions from x 1391 |
| User area | x 7-298, y 690-737; 28px avatar; mic / headphones / gear |
| Profile popout | x 6-253, 247 wide, above the user area |

## Assets

Nothing is cropped out of a screenshot.

- **Icons** — one hand-authored modern set in `src/ui/Icons.tsx`, drawn against
  the reference frame. An earlier pass generated these from
  [totallytavi/discord-app-icons](https://github.com/totallytavi/discord-app-icons)
  (`2023/tabs-v1`); auditing every glyph against the reference showed that set
  is a different generation of the design — one-person "members", an inverted
  GIF chip, a solid "add server" disc, four dots for "apps" — so it was retired
  rather than patched. House style follows the reference: solid shapes with the
  detail knocked out, generous weight, rounded terminals, 24x24, `currentColor`.
- **Emoji** — 178 Twemoji from
  [jdecked/twemoji](https://github.com/jdecked/twemoji), bundled by
  `tools/gen-emoji.mjs` as a single `<symbol>` sprite (231KB) rather than 178
  data URIs (~960KB), since the same glyph repeats all over a channel.
- **Artwork** — the profile banner (arches, orbs, sparkles) and the avatars are
  hand-drawn SVG in `src/ui/Art.tsx`.
- **Badges** — from [mezotv/discord-badges](https://github.com/mezotv/discord-badges).
- **Type** — Source Sans 3 (SIL OFL 1.1), self-hosted as base64 so the page makes
  no external requests; it stands in for Discord's proprietary gg sans and fits
  the reference metrics to ~0.3%.

## Develop

```bash
npm install
npm run dev
npm run build                       # single self-contained dist/index.html

node tools/fetch-emoji.mjs          # download the Twemoji in the catalogue
node tools/gen-emoji.mjs            # rebuild src/emoji.ts from them
node tools/screenshot.mjs out.png 1558 743
node tools/shot-popout.mjs pop.png  # same, with the profile popout open
node tools/boxes.mjs '.intro' '.composer'   # layout boxes for a selector
```

```bash
node tools/flow.mjs    # click through every interaction, report pass/fail
node tools/stale.mjs   # load with corrupt / outdated saved data
node tools/smoke.mjs out.png   # console errors on a clean load
```

## Saved state

State lives in localStorage, and the shape of it changed while this was being
built — a value written by an earlier build crashed the app on load, leaving a
white screen the reader had no way to clear, since the only copy of the bad data
was in their own browser. Two defences now:

- **Versioned keys.** `discord-ui:v3:*`. A schema bump orphans the old data
  instead of feeding it to code that can't read it, and keys from earlier
  versions are dropped on the next load.
- **Validated reads.** Every value is checked against the shape the app expects
  (`src/storage.ts`); anything unparseable, mistyped or malformed is discarded
  and the default is used. `tools/stale.mjs` covers ten such cases.

Behind both, an error boundary catches any render that still throws and offers a
**Clear saved data and reload** button, so nothing here can put the page into a
state a reader can't get out of.

## Greys

Discord tints each surface separately, so the icon and placeholder greys are
percentages of `--text` composited over the surface behind them, measured off
the reference: sidebar rows 47%, search placeholder 53.5%, header tools 63.5%,
composer actions 72%, the attach `+` 79%, composer placeholder 35.5%.
