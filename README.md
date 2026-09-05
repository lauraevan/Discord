# Discord desktop UI

A pixel-measured recreation of the Discord desktop client, built with React +
TypeScript + Vite. Every panel boundary, row height and type size is a literal
pixel value measured off the reference frame (a 1595x1180 window interior) —
not a rounded design token.

Landmarks land within ~1-2px of the reference across the whole window: rail
tiles, channel rows, threads, voice participants, the chat header toolbar and
search field, message pitch, the composer icon row and the user card.

## What is where

```
src/
  App.tsx                  app shell + state (server, channel, messages, theme)
  styles.css               every measured value lives here
  themes.ts                Light / Ash / Dark / Onyx + 18 colour themes
  fonts.css                self-hosted Source Sans 3 (base64 woff2)
  data.ts                  the cast, channels, threads, voice, transcript
  ui/Icons.tsx             the Discord-style SVG icon set
  ui/Art.tsx               hand-drawn character avatars + object server tiles
  ui/Tooltip.tsx           portal tooltips
  components/
    TitleBar.tsx           traffic lights, title, window controls
    ServerRail.tsx         servers, badges, unread pills, folders, add/discover
    ChannelSidebar.tsx     header, events/browse, channels, threads, voice
    UserCard.tsx           floating user panel spanning rail + sidebar
    Chat.tsx               channel header, toolbar, search, feed, messages
    Composer.tsx           composer + gift/GIF/sticker/emoji/apps/send, typing
    ThemePanel.tsx         the Preview Theme side panel
    CreateServerModal.tsx  server creation
tools/screenshot.mjs       renders dist/index.html at 1595x1180
```

## Measured geometry (px, window interior 1595x1180)

| Element | Value |
| --- | --- |
| Title bar | 37 tall; traffic lights 14px at x 13/36/59; title group at x 749 |
| Server rail | 0-83; 48px tiles at x 17.5 on a 60px pitch; separator at y 217 |
| Channel sidebar | 84-432; header 65 tall with a 1px rule at y 102 |
| Rows | 36 tall, 38px pitch, x 93-422, r8; icon at x 103, label at x 134 |
| Selected row | x 93-422, y 298-334 |
| Chat | 432-1595; header 65; tools on a 41.4px pitch; search 278x35 at x 1307 |
| Messages | 48px avatar at x 449, text at x 514, 64.3px pitch |
| Composer | x 440-1589, y 1087-1153, r10; + at 461; actions from x 1301 |
| User card | x 9-423, y 1106-1171, r12 |
| Type | 19px body, 15px category, 14px timestamps |

## Themes

Four default themes (Light, Ash, Dark, Onyx) and eighteen colour themes, driven
by CSS custom properties in `themes.ts`. The gear in the user card opens the
Preview Theme panel; the choice persists to localStorage.

## Assets

Nothing is cropped out of a screenshot.

- **Badges** — from [mezotv/discord-badges](https://github.com/mezotv/discord-badges).
- **Emoji** — Twemoji SVGs from [jdecked/twemoji](https://github.com/jdecked/twemoji).
- **Type** — Source Sans 3 (SIL OFL 1.1), self-hosted as base64 so the page makes
  no external requests. Its metrics fit the reference to ~0.3%, standing in for
  Discord's proprietary gg sans.
- **Icons / avatars / server art** — drawn by hand as SVG in `src/ui`.
- Conventions cross-checked against
  [AzaanUllah-Khan/Discord-UI-Clone](https://github.com/AzaanUllah-Khan/Discord-UI-Clone).

## Develop

```bash
npm install
npm run dev
npm run build                       # single self-contained dist/index.html
node tools/screenshot.mjs out.png   # renders at 1595x1180
```
