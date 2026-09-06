/**
 * Profile badges.
 *
 * The twelve on the reference account, and for each of them the closer of two
 * sources: Discord's own PNG, mirrored in Debuggingss/discord-badges, and
 * mezotv/discord-badges, whose SVGs are redraws of the current designs. Neither
 * wins outright — Discord has redrawn six of these since that PNG mirror was
 * taken, and kept the other six — so each was rendered at the reference's own
 * 14px on the reference's own background and scored against the frame with a
 * +/-2px offset search. Six .png, six .svg, and the winner is noted on each.
 *
 * Order is Discord's own: staff, partner, HypeSquad, bug hunters, developer
 * programmes, then the paid ones last.
 */
import staff from './assets/badges/discord-staff.png'
import partner from './assets/badges/discord-partner.svg'
import hypeEvents from './assets/badges/hype-squad-events.png'
import bugGreen from './assets/badges/discord-bug-hunter-green.svg'
import bravery from './assets/badges/hype-squad-bravery.svg'
import earlySupporter from './assets/badges/discord-early-supporter.svg'
import bugGold from './assets/badges/discord-bug-hunter-gold.png'
import botDev from './assets/badges/discord-bot-dev.png'
import mod from './assets/badges/discord-mod.svg'
import activeDev from './assets/badges/active-developer.svg'
import nitro from './assets/badges/discord-nitro.svg'
import boost9 from './assets/badges/discord-boost-9.svg'

export type Badge = { id: string; label: string; src: string }

export const BADGES: Badge[] = [
  // 11.6, Discord PNG
  { id: 'staff', label: 'Discord Staff', src: staff },
  // 12.2, redraw
  { id: 'partner', label: 'Partnered Server Owner', src: partner },
  // 8.6, Discord PNG
  { id: 'hypesquad', label: 'HypeSquad Events', src: hypeEvents },
  // 10.8, redraw
  { id: 'bug_hunter', label: 'Discord Bug Hunter', src: bugGreen },
  // 13.4, redraw
  { id: 'bravery', label: 'HypeSquad Bravery', src: bravery },
  // 13.1, redraw
  { id: 'early_supporter', label: 'Early Supporter', src: earlySupporter },
  // 5.7, Discord PNG
  { id: 'bug_hunter_gold', label: 'Discord Bug Hunter', src: bugGold },
  // 19.7, Discord PNG
  { id: 'verified_developer', label: 'Early Verified Bot Developer', src: botDev },
  // 14.8, redraw
  { id: 'mod_alumni', label: 'Moderator Programs Alumni', src: mod },
  // 10.6, redraw
  { id: 'active_developer', label: 'Active Developer', src: activeDev },
  // 21.8, redraw
  { id: 'nitro', label: 'Subscriber since 22 Mar 2017', src: nitro },
  // 10.6, redraw
  { id: 'boost', label: 'Server boosting since 12 Feb 2019', src: boost9 },
]
