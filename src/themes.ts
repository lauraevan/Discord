/**
 * Theme tokens.
 *
 * The four default themes, and the ten background gradients Nitro unlocks —
 * Discord's own presets, hex for hex, out of its shipped bundle. Every surface
 * in the app reads from these custom properties, so switching a theme repaints
 * the whole window.
 */

export type Tokens = {
  rail: string
  side: string
  chat: string
  card: string
  composer: string
  selected: string
  hover: string
  text: string
  muted: string
  strong: string
  border: string
  titlebar: string
  /** optional decorative wash painted behind the sidebar + chat */
  wash?: string
  scheme: 'dark' | 'light'
}

export type Theme = { id: string; name: string; swatch: string; tokens: Tokens }

const dark: Tokens = {
  rail: '#121214',
  side: '#121214',
  chat: '#1a1a1e',
  card: '#222327',
  composer: '#222327',
  selected: '#2c2c30',
  hover: '#1e1e22',
  text: '#e4e4e8',
  muted: '#85858a',
  strong: '#fdfdfe',
  border: '#232328',
  titlebar: '#121214',
  scheme: 'dark',
}

const ash: Tokens = {
  rail: '#1e1f22',
  side: '#2b2d31',
  chat: '#313338',
  card: '#383a40',
  composer: '#383a40',
  selected: '#404249',
  hover: '#35373c',
  text: '#dbdee1',
  muted: '#949ba4',
  strong: '#f2f3f5',
  border: '#3f4147',
  titlebar: '#1e1f22',
  scheme: 'dark',
}

const onyx: Tokens = {
  rail: '#000000',
  side: '#000000',
  chat: '#050506',
  card: '#131316',
  composer: '#131316',
  selected: '#1c1c20',
  hover: '#111114',
  text: '#e4e4e8',
  muted: '#7c7c82',
  strong: '#ffffff',
  border: '#17171a',
  titlebar: '#000000',
  scheme: 'dark',
}

const light: Tokens = {
  rail: '#e3e5e8',
  side: '#f2f3f5',
  chat: '#ffffff',
  card: '#ffffff',
  composer: '#ebedef',
  selected: '#d7d9dd',
  hover: '#e6e8eb',
  text: '#313338',
  muted: '#5c5e66',
  strong: '#060607',
  border: '#e0e1e5',
  titlebar: '#f2f3f5',
  scheme: 'light',
}

export const defaultThemes: Theme[] = [
  { id: 'light', name: 'Light', swatch: '#ffffff', tokens: light },
  { id: 'ash', name: 'Ash', swatch: '#313338', tokens: ash },
  { id: 'dark', name: 'Dark', swatch: '#1a1a1e', tokens: dark },
  { id: 'onyx', name: 'Onyx', swatch: '#000000', tokens: onyx },
]

/**
 * Discord's own background gradient presets.
 *
 * These are the client themes Nitro unlocks, taken out of Discord's shipped
 * bundle rather than eyeballed: the ids, the picker's order, both appearances
 * and the base mix are exactly the table the client carries
 * (`{TWILIGHT:1, PLUM:2, ...}`, each preset built as
 * `{color, angle:0, baseMix, colors:[{hex, stop:0},{hex, stop:100}]}`).
 */
export type Gradient = {
  /** Discord's own preset id */
  id: number
  key: string
  name: string
  /** [start, end], the two stops of the dark appearance */
  dark: [string, string]
  light: [string, string]
  /**
   * How far Discord mixes the chassis toward the gradient. 100 leaves the
   * surfaces barely tinted glass; 50 keeps them half solid.
   */
  baseMix: number
}

export const GRADIENTS: Gradient[] = [
  { id: 1, key: 'twilight', name: 'Twilight', dark: ['#69426A', '#111731'], light: ['#FA9EFF', '#5A7EFE'], baseMix: 100 },
  { id: 9, key: 'denim', name: 'Denim', dark: ['#5359AD', '#121238'], light: ['#DBDBFF', '#6060FF'], baseMix: 100 },
  { id: 8, key: 'ocean', name: 'Ocean', dark: ['#245B92', '#141D40'], light: ['#9ADBF7', '#2D3CCA'], baseMix: 100 },
  { id: 10, key: 'blurple', name: 'Blurple', dark: ['#533D9E', '#1A1035'], light: ['#C3BFFF', '#816BDC'], baseMix: 100 },
  { id: 7, key: 'obsidian', name: 'Obsidian', dark: ['#5E4C85', '#1E1740'], light: ['#B59DF2', '#8F89D2'], baseMix: 100 },
  { id: 2, key: 'plum', name: 'Plum', dark: ['#8A3F7F', '#2C0D25'], light: ['#E893FF', '#FFADDC'], baseMix: 100 },
  { id: 3, key: 'fire', name: 'Fire', dark: ['#9B2C2C', '#2A0C0C'], light: ['#FFEBCA', '#FF8989'], baseMix: 50 },
  { id: 4, key: 'gold-dust', name: 'Gold Dust', dark: ['#6C523D', '#241912'], light: ['#FFE7DA', '#FFD89B'], baseMix: 50 },
  { id: 5, key: 'moss', name: 'Moss', dark: ['#58694E', '#222A1C'], light: ['#B7D19F', '#B1DCA4'], baseMix: 50 },
  { id: 6, key: 'jade', name: 'Jade', dark: ['#297071', '#18203F'], light: ['#C5F0D2', '#60ADB2'], baseMix: 50 },
]

/** The gradient itself, at the angle Discord stores (0deg, bottom to top). */
export const gradientCss = (g: Gradient, scheme: 'light' | 'dark') => {
  const [from, to] = scheme === 'light' ? g.light : g.dark
  return `linear-gradient(0deg, ${from} 0%, ${to} 100%)`
}

/**
 * A gradient preset as a theme.
 *
 * Discord does not swap the palette for a client theme — it paints the
 * gradient behind the whole window and turns every surface into glass over it,
 * mixed toward the gradient by the preset's own baseMix. A preset that mixes
 * only halfway keeps more of the base theme showing, so the veils over it are
 * correspondingly more opaque.
 */
function colorTheme(g: Gradient, scheme: 'light' | 'dark'): Theme {
  const base = scheme === 'light' ? light : dark
  const wash = gradientCss(g, scheme)
  // 1 at a full mix, 1.5 at a half one
  const m = 1 + (100 - g.baseMix) / 100
  const veil = (a: number) =>
    scheme === 'light'
      ? `rgba(255,255,255,${Math.min(0.9, +(a * m).toFixed(3))})`
      : `rgba(0,0,0,${Math.min(0.85, +(a * m).toFixed(3))})`
  const lift = (a: number) => `rgba(255,255,255,${+(a / m).toFixed(3)})`
  return {
    id: `${g.key}-${scheme}`,
    name: g.name,
    swatch: wash,
    tokens: {
      ...base,
      wash,
      rail: 'transparent',
      side: veil(scheme === 'light' ? 0.28 : 0.34),
      chat: veil(scheme === 'light' ? 0.55 : 0.22),
      card: veil(scheme === 'light' ? 0.75 : 0.32),
      composer: veil(scheme === 'light' ? 0.62 : 0.32),
      selected: scheme === 'light' ? veil(0.85) : lift(0.13),
      hover: scheme === 'light' ? veil(0.5) : lift(0.07),
      border: scheme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
      titlebar: 'transparent',
    },
  }
}

export const colorThemes: Theme[] = GRADIENTS.flatMap((g) => [
  colorTheme(g, 'dark'),
  colorTheme(g, 'light'),
])

export const allThemes = [...defaultThemes, ...colorThemes]

export function applyTheme(t: Theme) {
  const r = document.documentElement
  const k = t.tokens
  r.style.setProperty('--rail', k.rail)
  r.style.setProperty('--side', k.side)
  r.style.setProperty('--chat', k.chat)
  r.style.setProperty('--card', k.card)
  r.style.setProperty('--composer', k.composer)
  r.style.setProperty('--selected', k.selected)
  r.style.setProperty('--hover', k.hover)
  r.style.setProperty('--text', k.text)
  r.style.setProperty('--muted', k.muted)
  r.style.setProperty('--strong', k.strong)
  r.style.setProperty('--border', k.border)
  r.style.setProperty('--titlebar', k.titlebar)
  r.style.setProperty('--wash', k.wash ?? k.rail)
  r.dataset.scheme = k.scheme
}
