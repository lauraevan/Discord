# Discord desktop UI

A pixel-measured recreation of the Discord desktop client, built with React +
TypeScript + Vite. Panel boundaries, row heights and type sizes are literal
pixel values measured off the reference frame (a 1558x743 window) rather than
rounded design tokens.

There is no invented cast and no invented servers. The app opens on **your own
empty server** with real channels, and every list is something you can change:
create servers and channels, rename or delete a channel, edit your profile, set
your status, switch themes.

## What is real here

| Feature | Where |
| --- | --- |
| Create a server | `+` in the rail |
| Create a channel | `+` on a category header |
| Edit / delete a channel | gear on the channel row, or **Edit Channel** in the empty state |
| Profile popout | click your name in the user area |
| Edit profile | popout -> Edit Profile (name, username, pronouns, bio, colour) |
| Set status | popout -> status row (online / idle / dnd / invisible) |
| Appearance | gear in the user area — 4 default themes + 18 colour themes |
| Mute / deafen | user area toggles |
| Send a message | the composer; history persists per channel |

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

- **Icons** — Discord's own UI glyphs, taken verbatim from
  [totallytavi/discord-app-icons](https://github.com/totallytavi/discord-app-icons)
  (`2023/tabs-v1`). `tools/gen-icons.mjs` reads each SVG, keeps its `viewBox`
  and inner markup byte-for-byte, and re-emits it as a React component whose
  only addition is a wrapper that takes size and `currentColor` from CSS —
  the output is `src/ui/DiscordIcons.tsx`, which is generated, not edited.
- **Two glyphs are drawn by hand** in `src/ui/Icons.tsx`, because the reference
  frame is a 2025 client and that set is from 2023: the channel header's
  **Threads** icon (a four-bar comb tilted 45°, where the 2023 set has the older
  hash-and-speech-bubble) and **Browse Channels** (a stack of rules with a
  magnifier, where the 2023 set has a hash and a magnifier). Both were fitted
  numerically to the reference — bar lengths, thickness and spacing measured off
  the 17px and 15px glyphs.
- **Artwork** — the profile banner (arches, orbs, sparkles) and the avatars are
  hand-drawn SVG in `src/ui/Art.tsx`.
- **Badges** — from [mezotv/discord-badges](https://github.com/mezotv/discord-badges).
- **Emoji** — Twemoji SVGs from [jdecked/twemoji](https://github.com/jdecked/twemoji),
  rendered as images in message text exactly as Discord does.
- **Type** — Source Sans 3 (SIL OFL 1.1), self-hosted as base64 so the page makes
  no external requests; it stands in for Discord's proprietary gg sans and fits
  the reference metrics to ~0.3%.

## Develop

```bash
npm install
npm run dev
npm run build                       # single self-contained dist/index.html

node tools/gen-icons.mjs            # regenerate src/ui/DiscordIcons.tsx
node tools/screenshot.mjs out.png 1558 743
node tools/shot-popout.mjs pop.png  # same, with the profile popout open
node tools/boxes.mjs '.intro' '.composer'   # layout boxes for a selector
```

`gen-icons.mjs` expects a checkout of `totallytavi/discord-app-icons` — set
`SRC` at the top of the file to point at its `2023/tabs-v1` directory.

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
