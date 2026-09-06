/**
 * Profile badges.
 *
 * The twelve on the reference account, identified by rendering every glyph in
 * mezotv/discord-badges at 14px and template-matching each against the frame —
 * not by eye. Order is Discord's own: staff, partner, HypeSquad, bug hunters,
 * developer programmes, then the paid ones last.
 */
import staff from './assets/badges/discord-staff.svg'
import partner from './assets/badges/discord-partner.svg'
import hypeEvents from './assets/badges/hype-squad-events.svg'
import bugGreen from './assets/badges/discord-bug-hunter-green.svg'
import bravery from './assets/badges/hype-squad-bravery.svg'
import earlySupporter from './assets/badges/discord-early-supporter.svg'
import bugGold from './assets/badges/discord-bug-hunter-gold.svg'
import botDev from './assets/badges/discord-bot-dev.svg'
import mod from './assets/badges/discord-mod.svg'
import activeDev from './assets/badges/active-developer.svg'
import nitro from './assets/badges/discord-nitro.svg'
import boost9 from './assets/badges/discord-boost-9.svg'

export type Badge = { id: string; label: string; src: string }

export const BADGES: Badge[] = [
  { id: 'staff', label: 'Discord Staff', src: staff },
  { id: 'partner', label: 'Partnered Server Owner', src: partner },
  { id: 'hypesquad', label: 'HypeSquad Events', src: hypeEvents },
  { id: 'bug_hunter', label: 'Discord Bug Hunter', src: bugGreen },
  { id: 'bravery', label: 'HypeSquad Bravery', src: bravery },
  { id: 'early_supporter', label: 'Early Supporter', src: earlySupporter },
  { id: 'bug_hunter_gold', label: 'Discord Bug Hunter', src: bugGold },
  { id: 'verified_developer', label: 'Early Verified Bot Developer', src: botDev },
  { id: 'mod_alumni', label: 'Moderator Programs Alumni', src: mod },
  { id: 'active_developer', label: 'Active Developer', src: activeDev },
  { id: 'nitro', label: 'Subscriber since 22 Mar 2017', src: nitro },
  { id: 'boost', label: 'Server boosting since 12 Feb 2019', src: boost9 },
]
