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
| Sidebar | 58-305; header 39 tall with a rule at y 63 |
| Rows | 27 tall, 28px pitch, x 65-297, r4; icon at x 72, label at x 95 |
| Selected row | x 65-297, y 205-230 |
| Chat | 305-1558; header 39; toolbar on a 32.3px pitch; search 198x24 at x 1350 |
| Empty state | 48px glyph at y 510; title y 575; Edit Channel button y 635 |
| Composer | x 311-1552, y 690-738, r8; + at 327; actions from x 1391 |
| User area | x 7-298, y 690-737; 28px avatar; mic / headphones / gear |
| Profile popout | x 6-253, 247 wide, above the user area |

## Assets

Nothing is cropped out of a screenshot.

- **Artwork** — the profile banner (arches, orbs, sparkles), avatars and every
  icon are hand-drawn SVG in `src/ui`.
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
node tools/screenshot.mjs out.png 1558 743
```
