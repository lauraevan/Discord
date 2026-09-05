# Discord desktop UI

A pixel-measured recreation of the Discord desktop client, built with React +
TypeScript + Vite. Panel boundaries, row heights and type sizes are literal
pixel values measured off the reference frame (a 1558x743 window) rather than
rounded design tokens.

## What is real here

No invented cast and no invented servers — the realism is in the behaviour. The
app opens on your own empty server, and everything below actually works.

### Messages

| Feature | Detail |
| --- | --- |
| Discord-flavour markdown | `**b**` `*i*` `__u__` `~~s~~` `\|\|spoiler\|\|` `` `code` `` ```` ```lang ```` `> q` `>>> q` `# ## ###` `-# subtext` `- ` `1. ` `[text](url)` `\` escape — and no tables, images or task lists, which Discord also omits |
| Nesting | `***__~~x~~__***` stacks, because it is a recursive parser rather than a regex pass |
| Emoji | 178 Twemoji, by `:shortcode:` or by character; a message that is only emoji renders jumbo, capped at 27 as in the client |
| Grouping | consecutive messages from one author merge, and the group breaks after 7 minutes |
| Timestamps | date dividers, "Today at 4:32 PM", and the gutter time that appears on a grouped message on hover |
| Reactions | add from the picker or the hover bar, click to toggle, your own are highlighted |
| Replies | reply bar in the composer, the quoted line above the message, and the elbow spine |
| Editing | inline, with escape/enter hints and the `(edited)` tag; `↑` in an empty composer edits your last message |
| Pins | pin from the hover bar, pinned messages get a highlight, and the header's pin button opens the popover |
| Spoilers | click to reveal |

### Getting around

| Feature | Detail |
| --- | --- |
| Quick switcher | `Ctrl`/`⌘`+`K` — servers and channels together, prefix matches ranked first |
| Autocomplete | `#` channels, `@` members, `:` emoji, `/` commands; arrows to move, tab or enter to accept |
| Slash commands | `/shrug` `/tableflip` `/unflip` `/me` `/spoiler` expand client-side, as they do in Discord |
| Search | filters the whole server and shows hits in the right panel with Jump |
| Unread | bold channel names with a pip, the red NEW divider, `Esc` marks the channel read, `Shift`+`Esc` the server |
| Member list | hoisted-role layout with the status dot and role colour; toggled from the header |
| Context menus | right-click a message or a channel |
| Voice | click a voice channel to join; the user area grows a Voice Connected strip |
| Emoji picker | search, category rail, sticky headings, and the hovered shortcode in the footer |
| Shortcuts | `Ctrl`+`K`, `Esc`, `Shift`+`Esc`, `Ctrl`+`Shift`+`M`, `↑` |

### Server and profile

| Feature | Where |
| --- | --- |
| Create a server | `+` in the rail |
| Create a channel | `+` on a category header |
| Edit / delete a channel | gear on the row, right-click, or **Edit Channel** in the empty state |
| Profile popout | click your name in the user area |
| Edit profile | popout -> Edit Profile (name, username, pronouns, bio, colour) |
| Set status | popout -> status row (online / idle / dnd / invisible) |
| Appearance | gear in the user area — 4 default themes + 18 colour themes |
| Mute / deafen | user area toggles |

Everything persists to localStorage.

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
