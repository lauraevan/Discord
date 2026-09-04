# Discord desktop UI

A pixel-measured recreation of the Discord desktop client shell, built with
React + TypeScript + Vite. The target is a **1536 × 993** viewport: panel
boundaries, row heights, type sizes and colours are literal pixel values taken
from the reference frame rather than rounded design tokens.

The app starts empty — no seeded servers, no seeded messages. Create a server
from the `+` button in the rail and it gets its own channels, chat and
persisted history.

## What is where

```
src/
  App.tsx                  app shell + state (servers, channels, messages)
  styles.css               every measured value lives here
  fonts.css                self-hosted Source Sans 3 (base64 woff2)
  data.ts                  types, starter channel set, emoji lookup
  ui/Icons.tsx             the Discord-style SVG icon set
  ui/Art.tsx               hand-drawn SVG artwork (avatar, promo gem)
  ui/Tooltip.tsx           portal tooltips
  components/
    TopBar.tsx             thin title strip
    ServerRail.tsx         server rail, pills, badges, add/discover
    ChannelSidebar.tsx     server header, boost goal, categories, channels
    Dock.tsx               reward banner + user panel (mute/deafen/settings)
    ChannelHeader.tsx      channel title, toolbar, search box
    Chat.tsx               feed, date dividers, messages, badges
    MessageComposer.tsx    composer (disabled in read-only channels)
    CreateServerModal.tsx  server creation
tools/screenshot.mjs       renders dist/index.html at 1536x993
```

## Measured geometry (css px @ 1536×993)

| Element | Value |
| --- | --- |
| Top bar | 34px tall, `#121214` |
| Server rail | 0–81, 45px tiles on a 54px pitch |
| Channel sidebar | 81–422, `#121214` |
| Chat | 422–1536, `#1a191e` |
| Channel header | 34–89 (55px), search box 274.4 × 35.9 ending at x=1527 |
| Channel rows | 36px tall, 38.6px pitch, first row at y=263 |
| Boost goal card | 94.5–416, y 107.9–137.2, r14.6 |
| Bottom dock | x 9–412.7, y 841–984, r9 |
| Composer | x 430.7–1527, y 918.7–983.9, r8 |
| Message text | 18px / 24.7px, timestamps 13.5px, embed body 16px |

## Assets

Nothing is cropped out of the reference screenshot.

- **Badges** — `special/verified-app.svg` and `server/boost-0.svg` from
  [mezotv/discord-badges](https://github.com/mezotv/discord-badges).
- **Emoji** — Twemoji SVGs from
  [jdecked/twemoji](https://github.com/jdecked/twemoji) (what Discord renders).
- **Type** — Source Sans 3 (SIL OFL 1.1), self-hosted as base64 so the page has
  no external requests. Its metrics fit the reference frame to ~0.3%, standing
  in for Discord's proprietary gg sans.
- **Icons / artwork** — drawn by hand as SVG in `src/ui`.
- Structure and conventions cross-checked against
  [AzaanUllah-Khan/Discord-UI-Clone](https://github.com/AzaanUllah-Khan/Discord-UI-Clone)
  (dark theme throughout — the reference is never light mode).

## Develop

```bash
npm install
npm run dev      # vite dev server
npm run build    # single self-contained dist/index.html
node tools/screenshot.mjs out.png
```

`vite-plugin-singlefile` inlines the JS, CSS, font and emoji into one
`dist/index.html`, so the build can be served directly from a static host.
