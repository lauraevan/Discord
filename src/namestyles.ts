/**
 * Nitro's display-name styles.
 *
 * A style is a font, an effect and a list of colours — the client's own
 * `DisplayNameStyles` proto is exactly `{ font_id, effect_id, colors }`. The
 * effect decides how many colours it takes and how they are drawn, and every
 * shade it draws with is derived from the colour rather than stored: the
 * functions below are the client's own, lifted out of the bundle.
 */

import { nameFontById } from './namefonts'

/** The client's DisplayNameEffect enum. */
export const NameEffect = {
  SOLID: 1,
  GRADIENT: 2,
  NEON: 3,
  TOON: 4,
  POP: 5,
  GLOW: 6,
  PRISM: 7,
  GUMMY: 8,
} as const
export type NameEffectId = (typeof NameEffect)[keyof typeof NameEffect]

export const NAME_EFFECTS: { id: NameEffectId; name: string }[] = [
  { id: NameEffect.SOLID, name: 'Solid' },
  { id: NameEffect.GRADIENT, name: 'Gradient' },
  { id: NameEffect.NEON, name: 'Neon' },
  { id: NameEffect.TOON, name: 'Toon' },
  { id: NameEffect.POP, name: 'Pop' },
  { id: NameEffect.GLOW, name: 'Glow' },
  { id: NameEffect.PRISM, name: 'Prism' },
  { id: NameEffect.GUMMY, name: 'Gummy' },
]

export type NameStyle = { fontId: number; effectId: number; colors: string[] }

/** How many colours an effect takes — the client's own switch. */
export function colorCount(effect: number) {
  switch (effect) {
    case NameEffect.GRADIENT:
      return 2
    case NameEffect.GUMMY:
      return 4
    case NameEffect.PRISM:
      return 5
    default:
      return 1
  }
}

/* ------------------------------------------------------------- colour maths */

const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n))

export function toHsl(hex: string): [number, number, number] {
  const v = hex.replace('#', '')
  const n = parseInt(
    v.length === 3
      ? v
          .split('')
          .map((c) => c + c)
          .join('')
      : v,
    16,
  )
  const r = ((n >> 16) & 255) / 255
  const g = ((n >> 8) & 255) / 255
  const b = (n & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h =
    max === r
      ? ((g - b) / d + (g < b ? 6 : 0)) * 60
      : max === g
        ? ((b - r) / d + 2) * 60
        : ((r - g) / d + 4) * 60
  return [h, s, l]
}

export function fromHsl(h: number, s: number, l: number) {
  const hue = ((h % 360) + 360) % 360
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = l - c / 2
  const [r, g, b] =
    hue < 60
      ? [c, x, 0]
      : hue < 120
        ? [x, c, 0]
        : hue < 180
          ? [0, c, x]
          : hue < 240
            ? [0, x, c]
            : hue < 300
              ? [x, 0, c]
              : [c, 0, x]
  const hex = (v: number) =>
    Math.round(clamp(v + m) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${hex(r)}${hex(g)}${hex(b)}`
}

/**
 * The shades an effect draws a colour with. Verbatim from the client: a
 * lighter and a much lighter, a darker and a much darker, the stroke Toon
 * outlines with, and the one Neon glows with.
 */
export function shades(hex: string) {
  const [h, s, l] = toHsl(hex)
  return {
    main: hex,
    light1: fromHsl(h, s, Math.min(1, 1.2 * l)),
    light2: fromHsl(h, s, Math.min(1, 1.6 * l)),
    dark1: fromHsl(h, s, Math.max(0, 0.6 * l)),
    dark2: fromHsl(h, s, Math.max(0, 0.2 * l)),
    toonStroke: fromHsl(h, s, Math.max(0.12, 0.4 * l)),
    neonStroke: fromHsl(h, Math.min(1, 1.2 * s), Math.min(0.6, l + 0.1)),
  }
}

/**
 * The four-stop palette a single colour generates, which is how the client
 * fills in the extra colours Gummy and Prism want from one pick.
 */
const SPREAD = [
  { hueShift: -18, saturation: 0.54, lightness: 0.72 },
  { hueShift: -5, saturation: 0.66, lightness: 0.6 },
  { hueShift: 9, saturation: 0.56, lightness: 0.68 },
  { hueShift: 22, saturation: 0.6, lightness: 0.63 },
]

export function spread(hex: string) {
  const [h] = toHsl(hex)
  return SPREAD.map((s) => fromHsl(h + s.hueShift, s.saturation, s.lightness))
}

/** The colours an effect ends up with, filled out from what the user picked. */
export function colorsFor(style: NameStyle) {
  const want = colorCount(style.effectId)
  const picked = style.colors.filter(Boolean)
  if (picked.length >= want) return picked.slice(0, want)
  const base = picked[0] ?? '#5865f2'
  const filled = [base, ...spread(base)]
  return Array.from({ length: want }, (_, i) => picked[i] ?? filled[i % filled.length])
}

/* ---------------------------------------------------------------- rendering */

/**
 * The style a name is drawn with, as inline CSS. Gradient, Prism and Gummy
 * paint the text with a background and clip it; the rest colour the glyphs and
 * add a stroke or a shadow.
 */
export function nameStyleCss(style: NameStyle | undefined): React.CSSProperties | undefined {
  if (!style) return undefined
  const font = nameFontById(style.fontId)
  const cs = colorsFor(style)
  const sh = shades(cs[0])
  const base: React.CSSProperties = {
    fontFamily: font.family === 'inherit' ? undefined : font.family,
  }
  const clipped = (bg: string): React.CSSProperties => ({
    ...base,
    backgroundImage: bg,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
  })

  switch (style.effectId) {
    case NameEffect.GRADIENT:
      return clipped(`linear-gradient(90deg, ${cs[0]}, ${cs[1]})`)
    case NameEffect.PRISM:
      return {
        ...clipped(`linear-gradient(90deg, ${cs.join(', ')}, ${cs[0]})`),
        backgroundSize: '200% 100%',
        animation: 'name-prism 4s linear infinite',
      }
    case NameEffect.GUMMY:
      return {
        ...clipped(`linear-gradient(180deg, ${cs.join(', ')})`),
        filter: `drop-shadow(0 1px 0 ${sh.dark1})`,
      }
    case NameEffect.NEON:
      return {
        ...base,
        color: sh.light2,
        textShadow: `0 0 4px ${sh.neonStroke}, 0 0 10px ${sh.neonStroke}`,
      }
    case NameEffect.TOON:
      return {
        ...base,
        color: sh.main,
        WebkitTextStroke: `1px ${sh.toonStroke}`,
        paintOrder: 'stroke fill',
      }
    case NameEffect.POP:
      return { ...base, color: sh.main, textShadow: `2px 2px 0 ${sh.dark2}` }
    case NameEffect.GLOW:
      return { ...base, color: sh.main, textShadow: `0 0 8px ${sh.light1}` }
    default:
      return { ...base, color: sh.main }
  }
}
