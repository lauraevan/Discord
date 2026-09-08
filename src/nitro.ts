/**
 * Nitro — Discord's real premium model.
 *
 * Everything named here is lifted from Discord's shipped client bundle
 * (Discord-Datamining/current.js) rather than invented: the premium type
 * numbers, the SKU ids and billing intervals of every plan Discord sells, the
 * feature flags the client gates perks on, and the brand hexes the Nitro
 * surfaces are painted with. Prices and perk copy are Discord's own, as shown
 * on the Nitro tab and in the Send a Gift dialog.
 *
 * See docs/discord-reference.md for how these were extracted.
 */

/* ------------------------------------------------------------ premium type */

/**
 * `PremiumTypes` in the client. The numbering is historical, not ordered by
 * price — Nitro Basic was added last and took the free slot 3, which is why
 * the client calls it TIER_0 while sending premium_type 3.
 */
export const PremiumType = {
  NONE: 0,
  /** Nitro Classic — grandfathered, no longer sold */
  TIER_1: 1,
  /** Nitro */
  TIER_2: 2,
  /** Nitro Basic */
  TIER_0: 3,
} as const
export type PremiumTypeValue = (typeof PremiumType)[keyof typeof PremiumType]

/** `PremiumGuildTiers` — a server's boost level. */
export const BoostTier = { NONE: 0, TIER_1: 1, TIER_2: 2, TIER_3: 3 } as const

/* ------------------------------------------------------------ brand colour */

/**
 * `PREMIUM_TIER_*` from the client's colour table. TIER_2 is Nitro's
 * purple/pink, TIER_0 is Nitro Basic's blue/blurple.
 */
export const NITRO_COLORS = {
  tier2Purple: '#b473f5',
  tier2PurpleGradient: '#8547c6',
  tier2PurpleGradient2: '#b845c1',
  tier2Pink: '#e292aa',
  tier2PinkGradient: '#ab5d8a',
  tier2PinkGradient2: '#b73ec1',
  tier1Blue: '#738ef5',
  tier1BlueGradient: '#5865f2',
  tier1DarkBlueGradient: '#3442d9',
  tier1Purple: '#b3aeff',
  tier0Blue: '#007cc2',
  tier0BlueGradient2: '#1776cf',
  tier0Purple: '#5865f2',
  /** the five stops of the Nitro tab's header wash */
  header: ['#3736bb', '#4670e8', '#8377eb', '#e782f1', '#df90af'],
} as const

/* ------------------------------------------------------------------- plans */

export type Plan = {
  /** the client's own plan label */
  label: string
  /** `premium_type` sent by the API */
  premiumType: PremiumTypeValue
  /** SKU id of the subscription this plan belongs to */
  skuId: string
  /** interval 1 = month, 2 = year; count is how many of them */
  interval: 1 | 2
  intervalCount: number
  /** shown price in USD */
  price: number
}

/**
 * The full plan table from the bundle. Only the four rows marked `sold` are
 * purchasable today; Classic and the legacy rows exist so grandfathered
 * subscriptions still resolve to a plan.
 */
export const PLANS: (Plan & { sold: boolean })[] = [
  { label: 'Nitro Basic Monthly', premiumType: 3, skuId: '978380684370378762', interval: 1, intervalCount: 1, price: 2.99, sold: true },
  { label: 'Nitro Basic Yearly', premiumType: 3, skuId: '978380684370378762', interval: 2, intervalCount: 1, price: 29.99, sold: true },
  { label: 'Nitro Monthly', premiumType: 2, skuId: '521847234246082599', interval: 1, intervalCount: 1, price: 9.99, sold: true },
  { label: 'Nitro Yearly', premiumType: 2, skuId: '521847234246082599', interval: 2, intervalCount: 1, price: 99.99, sold: true },
  { label: 'Nitro Three Month', premiumType: 2, skuId: '521847234246082599', interval: 1, intervalCount: 3, price: 29.97, sold: false },
  { label: 'Nitro Six Month', premiumType: 2, skuId: '521847234246082599', interval: 1, intervalCount: 6, price: 59.94, sold: false },
  { label: 'Nitro Classic Monthly', premiumType: 1, skuId: '521846918637420545', interval: 1, intervalCount: 1, price: 4.99, sold: false },
  { label: 'Nitro Classic Yearly', premiumType: 1, skuId: '521846918637420545', interval: 2, intervalCount: 1, price: 49.99, sold: false },
  { label: 'Nitro Classic Yearly (Legacy)', premiumType: 2, skuId: '521842865731534868', interval: 2, intervalCount: 1, price: 49.99, sold: false },
  { label: 'Nitro Monthly (Legacy)', premiumType: 2, skuId: '521842865731534868', interval: 1, intervalCount: 1, price: 4.99, sold: false },
  { label: 'Nitro Squad Monthly', premiumType: 2, skuId: '521847234246082599', interval: 1, intervalCount: 1, price: 9.99, sold: false },
]

export const planFor = (premiumType: PremiumTypeValue, interval: 1 | 2) =>
  PLANS.find((p) => p.sold && p.premiumType === premiumType && p.interval === interval)!

/** A Server Boost costs this much a month; Nitro takes 30% off. */
export const BOOST_PRICE = 4.99
export const BOOST_DISCOUNT = 0.3

/* ---------------------------------------------------------------- features */

/**
 * `PremiumFeatures` — the flags `canUserUse` checks before unlocking a perk.
 * The tier lists mirror the client's own `Object.freeze({[TIER_0]: …})` table.
 */
export const PremiumFeature = {
  ANIMATED_AVATAR: 'ANIMATED_AVATAR',
  ANIMATED_EMOJIS: 'ANIMATED_EMOJIS',
  APP_ICONS: 'APP_ICONS',
  BOOST_DISCOUNT: 'BOOST_DISCOUNT',
  CLIENT_THEMES: 'CLIENT_THEMES',
  CUSTOM_CALL_SOUNDS: 'CUSTOM_CALL_SOUNDS',
  CUSTOM_DISCRIMINATOR: 'CUSTOM_DISCRIMINATOR',
  EMOJIS_EVERYWHERE: 'EMOJIS_EVERYWHERE',
  FREE_BOOSTS: 'FREE_BOOSTS',
  INCREASED_FILE_UPLOAD_SIZE: 'INCREASED_FILE_UPLOAD_SIZE',
  INCREASED_GUILD_LIMIT: 'INCREASED_GUILD_LIMIT',
  INCREASED_MESSAGE_LENGTH: 'INCREASED_MESSAGE_LENGTH',
  INCREASED_VIDEO_UPLOAD_QUALITY: 'INCREASED_VIDEO_UPLOAD_QUALITY',
  INSTALL_PREMIUM_APPLICATIONS: 'INSTALL_PREMIUM_APPLICATIONS',
  MONTHLY_ORBS: 'MONTHLY_ORBS',
  MORE_QUEST_ORBS: 'MORE_QUEST_ORBS',
  PREMIUM_COLLECTIBLES: 'PREMIUM_COLLECTIBLES',
  PREMIUM_GUILD_MEMBER_PROFILE: 'PREMIUM_GUILD_MEMBER_PROFILE',
  PREMIUM_VOICE_FILTERS: 'PREMIUM_VOICE_FILTERS',
  PROFILE_BADGES: 'PROFILE_BADGES',
  PROFILE_PREMIUM_FEATURES: 'PROFILE_PREMIUM_FEATURES',
  SHOP_DISCOUNTS: 'SHOP_DISCOUNTS',
  SOUNDBOARD_EVERYWHERE: 'SOUNDBOARD_EVERYWHERE',
  STICKERS_EVERYWHERE: 'STICKERS_EVERYWHERE',
  STREAM_HIGH_QUALITY: 'STREAM_HIGH_QUALITY',
  STREAM_MID_QUALITY: 'STREAM_MID_QUALITY',
  VIDEO_FILTER_ASSETS: 'VIDEO_FILTER_ASSETS',
} as const
export type PremiumFeatureName = (typeof PremiumFeature)[keyof typeof PremiumFeature]

const F = PremiumFeature

/** Nitro Basic (TIER_0) — the client's own short list. */
const TIER_0_FEATURES: PremiumFeatureName[] = [
  F.EMOJIS_EVERYWHERE,
  F.STICKERS_EVERYWHERE,
  F.ANIMATED_EMOJIS,
  F.PROFILE_BADGES,
  F.VIDEO_FILTER_ASSETS,
  F.INCREASED_VIDEO_UPLOAD_QUALITY,
  F.INCREASED_FILE_UPLOAD_SIZE,
  F.APP_ICONS,
]

/** Nitro (TIER_2) — everything Basic has, plus the rest. */
const TIER_2_FEATURES: PremiumFeatureName[] = [
  ...TIER_0_FEATURES,
  F.ANIMATED_AVATAR,
  F.BOOST_DISCOUNT,
  F.CLIENT_THEMES,
  F.CUSTOM_CALL_SOUNDS,
  F.CUSTOM_DISCRIMINATOR,
  F.FREE_BOOSTS,
  F.INCREASED_GUILD_LIMIT,
  F.INCREASED_MESSAGE_LENGTH,
  F.INSTALL_PREMIUM_APPLICATIONS,
  F.MONTHLY_ORBS,
  F.MORE_QUEST_ORBS,
  F.PREMIUM_COLLECTIBLES,
  F.PREMIUM_GUILD_MEMBER_PROFILE,
  F.PREMIUM_VOICE_FILTERS,
  F.PROFILE_PREMIUM_FEATURES,
  F.SHOP_DISCOUNTS,
  F.SOUNDBOARD_EVERYWHERE,
  F.STREAM_HIGH_QUALITY,
  F.STREAM_MID_QUALITY,
]

const BY_TIER: Record<number, PremiumFeatureName[]> = {
  [PremiumType.NONE]: [],
  [PremiumType.TIER_0]: TIER_0_FEATURES,
  [PremiumType.TIER_1]: TIER_0_FEATURES,
  [PremiumType.TIER_2]: TIER_2_FEATURES,
}

/** The client's `canUserUse(feature)`. */
export const canUse = (premiumType: PremiumTypeValue, feature: PremiumFeatureName) =>
  BY_TIER[premiumType].includes(feature)

/** Upload cap in MiB, which is what INCREASED_FILE_UPLOAD_SIZE actually buys. */
export const uploadLimitMb = (premiumType: PremiumTypeValue) =>
  premiumType === PremiumType.TIER_2 ? 500 : premiumType === PremiumType.NONE ? 10 : 50

/** Message length cap. */
export const messageLimit = (premiumType: PremiumTypeValue) =>
  canUse(premiumType, F.INCREASED_MESSAGE_LENGTH) ? 4000 : 2000

/** Nitro hands out two boosts and a discount on the rest. */
export const includedBoosts = (premiumType: PremiumTypeValue) =>
  canUse(premiumType, F.FREE_BOOSTS) ? 2 : 0

/* ------------------------------------------------------------------- perks */

export type Tier = { key: 'basic' | 'nitro'; name: string; premiumType: PremiumTypeValue; monthly: number; yearly: number; perks: string[] }

/**
 * The two tiers as the Send a Gift dialog presents them — same order, same
 * wording, same prices.
 */
export const TIERS: Tier[] = [
  {
    key: 'nitro',
    name: 'Nitro',
    premiumType: PremiumType.TIER_2,
    monthly: 9.99,
    yearly: 99.99,
    perks: [
      '500MB uploads',
      'Custom emoji anywhere',
      'Unlimited Super Reactions',
      'HD video streaming',
      '2 Server Boosts',
      'Custom profiles and more!',
    ],
  },
  {
    key: 'basic',
    name: 'Nitro Basic',
    premiumType: PremiumType.TIER_0,
    monthly: 2.99,
    yearly: 29.99,
    perks: [
      '50MB uploads',
      'Custom emoji anywhere',
      'Unlimited Super Reactions',
      'Special Nitro badge on your profile',
    ],
  },
]

/**
 * The perk colours, out of the client's own colour table
 * (`unsafe_rawColors.PREMIUM_PERK_*`). Every perk card is tinted with one.
 */
export const PERK_COLORS = {
  blue: '#80a6ff',
  blueAlt: '#9cb8ff',
  darkBlue: '#4173da',
  gold: '#faa61a',
  green: '#86dcc5',
  lightBlue: '#aec7ff',
  orange: '#fc964b',
  pink: '#ff80f4',
  purple: '#d09aff',
  yellow: '#fed648',
} as const

export type Perk = {
  /** the client's own perk-card id */
  id: string
  title: string
  body: string
  /** the back of the card, which the client flips to */
  detail: string
  color: string
  icon: string
}

/**
 * The perk cards.
 *
 * The set and the ids are Discord's: the client registers exactly these card
 * ids for the Nitro page — badge, clientThemes, customAppIcons, customSounds,
 * displayNameStyles, earlyAccess, entranceSounds, hdVideo, largeUploads,
 * moreEmojis, permadecos, profiles, serverBoosts, memberPricing,
 * specialStickers, superReactions, tenureBadge, videoBackgrounds,
 * orbMultiplier and nitroOrbsRewards. The numbers on them are the client's own
 * limits (see PLANS and the limits table), and each is tinted with one of the
 * PREMIUM_PERK colours above.
 */
export const PERKS: Perk[] = [
  {
    id: 'largeUploads',
    title: 'Bigger uploads',
    body: 'Send files up to 500MB.',
    detail: 'Free accounts stop at 10MB, so a clip goes up as a link. Nitro sends the file.',
    color: PERK_COLORS.orange,
    icon: 'FileUpIcon',
  },
  {
    id: 'moreEmojis',
    title: 'Custom emoji anywhere',
    body: 'Every emoji from every server, everywhere.',
    detail: 'Use any custom emoji you can see in any server and in DMs, animated ones included.',
    color: PERK_COLORS.purple,
    icon: 'SmileyIcon',
  },
  {
    id: 'hdVideo',
    title: 'HD video streaming',
    body: 'Stream and screen share up to 4K at 60fps.',
    detail: 'Go live at a resolution people can actually read code in.',
    color: PERK_COLORS.green,
    icon: 'VideoIcon',
  },
  {
    id: 'profiles',
    title: 'Custom profiles',
    body: 'Animated avatar, banner, and a look per server.',
    detail: 'A profile theme, an About Me, and a different profile in every server you are in.',
    color: PERK_COLORS.pink,
    icon: 'UserIcon',
  },
  {
    id: 'serverBoosts',
    title: '2 Server Boosts',
    body: 'Plus 30% off every extra boost.',
    detail: 'Two boosts to give away each month, and the rest at $2.49 instead of $4.99.',
    color: PERK_COLORS.purple,
    icon: 'BoostIcon',
  },
  {
    id: 'superReactions',
    title: 'Unlimited Super Reactions',
    body: 'React with a burst, as often as you like.',
    detail: 'Free accounts get a handful a week. Nitro takes the cap off.',
    color: PERK_COLORS.yellow,
    icon: 'StarShootingIcon',
  },
  {
    id: 'clientThemes',
    title: 'App themes',
    body: 'Paint the whole client.',
    detail: 'Ten background gradients over Light or Dark — Twilight, Denim, Ocean, and the rest.',
    color: PERK_COLORS.blue,
    icon: 'PaintPaletteIcon',
  },
  {
    id: 'customSounds',
    title: 'Soundboard sounds',
    body: 'Use any server\u2019s soundboard, in every server.',
    detail: 'And upload your own for the servers you are in.',
    color: PERK_COLORS.lightBlue,
    icon: 'SoundboardIcon',
  },
  {
    id: 'entranceSounds',
    title: 'Entrance sounds',
    body: 'Pick what plays when you join a voice channel.',
    detail: 'One sound, yours, on every channel you drop into.',
    color: PERK_COLORS.blueAlt,
    icon: 'WaveformIcon',
  },
  {
    id: 'videoBackgrounds',
    title: 'Video backgrounds',
    body: 'Custom backgrounds on camera.',
    detail: 'Blur, an image, or one of Discord\u2019s own, without a second app running.',
    color: PERK_COLORS.darkBlue,
    icon: 'ImageSparkleIcon',
  },
  {
    id: 'displayNameStyles',
    title: 'Display name styles',
    body: 'Give your name a gradient.',
    detail: 'A styled display name that shows wherever your name does.',
    color: PERK_COLORS.pink,
    icon: 'TextStyleIcon',
  },
  {
    id: 'customAppIcons',
    title: 'Custom app icons',
    body: 'Change the icon on your desktop.',
    detail: 'Swap the Discord icon for one of the alternates, on desktop and mobile.',
    color: PERK_COLORS.gold,
    icon: 'AppsIcon',
  },
  {
    id: 'specialStickers',
    title: 'Custom stickers anywhere',
    body: 'Every sticker, in every server.',
    detail: 'Nitro carries 30 sticker slots and 150 emoji slots of your own.',
    color: PERK_COLORS.purple,
    icon: 'StickerIcon',
  },
  {
    id: 'badge',
    title: 'Nitro badge',
    body: 'A badge on your profile.',
    detail: 'It shows from the day you subscribe.',
    color: PERK_COLORS.blue,
    icon: 'BadgeIcon',
  },
  {
    id: 'tenureBadge',
    title: 'Tenure badge',
    body: 'It levels up the longer you stay.',
    detail: 'One month, three, six, a year, two, three, five, six — the badge changes at each.',
    color: PERK_COLORS.gold,
    icon: 'MedalIcon',
  },
  {
    id: 'permadecos',
    title: 'Keep your collectibles',
    body: 'Decorations you buy stay yours.',
    detail: 'Bought collectibles are permanent, and Nitro takes 15% off them in the Shop.',
    color: PERK_COLORS.green,
    icon: 'CrownIcon',
  },
  {
    id: 'nitroOrbsRewards',
    title: 'Bonus Orbs',
    body: 'Orbs every month, to spend in the Shop.',
    detail: 'They land with each renewal and never expire while the subscription runs.',
    color: PERK_COLORS.purple,
    icon: 'OrbsIcon',
  },
  {
    id: 'orbMultiplier',
    title: 'Quest Orb multiplier',
    body: 'Every Quest pays more.',
    detail: 'The multiplier applies the moment a Quest is claimed.',
    color: PERK_COLORS.yellow,
    icon: 'QuestsIcon',
  },
  {
    id: 'earlyAccess',
    title: 'Early access',
    body: 'New features before everyone else.',
    detail: 'Subscribers get features while they are still rolling out.',
    color: PERK_COLORS.lightBlue,
    icon: 'BeakerIcon',
  },
  {
    id: 'memberPricing',
    title: 'Member pricing',
    body: 'Discounts made for subscribers.',
    detail: 'Lower prices on collectibles, boosts and gifts while the subscription is active.',
    color: PERK_COLORS.orange,
    icon: 'TicketIcon',
  },
]

/**
 * The tenure ladder.
 *
 * The client's badge levels are exactly these month counts
 * (`PREMIUM_TENURE_{1,3,6,12,24,36,60,72}_MONTH`), and the badge changes at
 * each one.
 */
export const TENURE_MONTHS = [1, 3, 6, 12, 24, 36, 60, 72]

export const tenureLabel = (m: number) =>
  m < 12 ? `${m} mo` : m === 12 ? '1 yr' : `${m / 12} yrs`

/**
 * The Compare tab's table. `null` means the tier does not get the row at all;
 * a string is what that tier gets.
 */
export const COMPARISON: { feature: string; free: string | null; basic: string | null; nitro: string | null }[] = [
  { feature: 'Upload size limit', free: '10MB', basic: '50MB', nitro: '500MB' },
  { feature: 'Custom emoji anywhere', free: null, basic: 'yes', nitro: 'yes' },
  { feature: 'Custom stickers anywhere', free: null, basic: 'yes', nitro: 'yes' },
  { feature: 'Super Reactions', free: 'Limited', basic: 'Unlimited', nitro: 'Unlimited' },
  { feature: 'Custom app icons', free: null, basic: 'yes', nitro: 'yes' },
  { feature: 'Nitro profile badge', free: null, basic: 'yes', nitro: 'yes' },
  { feature: 'Soundboard in every server', free: null, basic: null, nitro: 'yes' },
  { feature: 'HD video streaming', free: null, basic: null, nitro: 'Up to 4K, 60fps' },
  { feature: 'Custom profile & banner', free: null, basic: null, nitro: 'yes' },
  { feature: 'Animated avatar', free: null, basic: null, nitro: 'yes' },
  { feature: 'Message length', free: '2,000', basic: '2,000', nitro: '4,000' },
  { feature: 'Server limit', free: '100', basic: '100', nitro: '200' },
  { feature: 'Server Boosts included', free: null, basic: null, nitro: '2, plus 30% off' },
  { feature: 'Bonus Orbs every month', free: null, basic: null, nitro: 'yes' },
]

/** The What's New tab — Nitro's shipped perks, newest first. */
export const WHATS_NEW: { tag: string; title: string; body: string }[] = [
  { tag: 'New', title: 'Orbs', body: 'Nitro members earn bonus Orbs every month and a multiplier on every Quest, then spend them in the Shop.' },
  { tag: 'New', title: 'Client Themes', body: 'Paint the whole app — Nitro unlocks the full theme set and custom gradients.' },
  { tag: 'Updated', title: 'Voice Filters', body: 'Change how you sound in voice with premium filters, live.' },
  { tag: 'Updated', title: 'Custom Call Sounds', body: 'Pick the sound your friends hear when you ring them.' },
  { tag: 'Updated', title: 'Collectibles', body: 'Avatar decorations and profile effects, with a Nitro discount in the Shop.' },
]

/* -------------------------------------------------------------------- gift */

/** Gift lengths Discord sells, per tier. */
export const GIFT_LENGTHS: { interval: 1 | 2; label: string }[] = [
  { interval: 1, label: '1 Month' },
  { interval: 2, label: '1 Year' },
]

/**
 * A redeemable gift code. Discord's are 16 characters of base62 on the
 * `discord.gift/` host.
 */
export const GIFT_HOST = 'discord.gift'
const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
export function giftCode() {
  let out = ''
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length]
  return out
}

export type Gift = {
  code: string
  tier: 'basic' | 'nitro'
  interval: 1 | 2
  createdAt: number
  redeemedAt?: number
}

/** Gifting Nitro currently comes with an Orb bonus; the promo runs on a clock. */
export const GIFT_PROMO = { orbs: 5000, endsInDays: 8 }

/** The subscription a redeemed gift grants, in milliseconds. */
export const giftLength = (interval: 1 | 2) =>
  interval === 2 ? 365 * 24 * 3600e3 : 30 * 24 * 3600e3

export type Subscription = {
  premiumType: PremiumTypeValue
  /** epoch ms; the subscription lapses here */
  until: number
  /** how it was acquired, which is what the Subscriptions page shows */
  source: 'purchase' | 'gift'
  interval: 1 | 2
}

export const isActive = (s: Subscription | null): s is Subscription =>
  s != null && s.until > Date.now()

export const currentType = (s: Subscription | null): PremiumTypeValue =>
  isActive(s) ? s.premiumType : PremiumType.NONE

export const money = (n: number) =>
  '$' + n.toFixed(2)
