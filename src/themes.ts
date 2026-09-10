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
  /** floating surfaces — context menus and the composer's plus menu */
  menu: string
  composer: string
  selected: string
  hover: string
  text: string
  muted: string
  strong: string
  border: string
  /** --border-strong, the heavier of Discord's two border tokens */
  borderStrong: string
  titlebar: string
  /** optional decorative wash painted behind the sidebar + chat */
  wash?: string
  scheme: 'dark' | 'light'
}

export type Theme = { id: string; name: string; swatch: string; tokens: Tokens }

/*
 * The four themes, hex for hex out of Discord's own stylesheet.
 *
 * Discord declares each theme as a set of semantic tokens over a primitive
 * ramp — `--background-base-lowest: color-mix(in oklab, var(--neutral-92)
 * 100%, ...)` — so the colour the client paints is two lookups away from the
 * theme block. tools/dtheme.py walks that chain and prints the hex; the
 * comment on each line names the Discord token it came from, and re-running
 * the tool reproduces every value here.
 *
 * The CSS class names are historical: Discord's `theme-dark` is the theme the
 * UI now calls **Ash**, `theme-darker` is **Dark**, and `theme-midnight` is
 * **Onyx**. The Dark set below is also confirmed against all four 1:1
 * captures — rail and sidebar #121214, chat #1a1a1e, composer #222327 — which
 * is how the mapping was pinned down in the first place.
 *
 * Two tokens are deliberately translucent, because Discord's are: a channel
 * row's hover and selected states are a grey overlay laid over whatever is
 * behind them (`--interactive-background-hover`, 12%, and
 * `--interactive-background-selected`, 20%), not opaque fills. Over the Dark
 * sidebar the selected overlay computes to #2d2d31, which is the #2c2c30 the
 * capture shows. `--border-subtle` is the same trick, and is the pane rim.
 */

const dark: Tokens = {
  rail: '#121214', // --background-base-lowest
  side: '#121214', // --background-base-lowest
  chat: '#1a1a1e', // --channel-background-default
  card: '#222327', // --chat-background-default
  menu: '#28282d', // --background-surface-higher
  composer: '#222327', // --chat-background-default
  selected: '#97979f33', // --interactive-background-selected
  hover: '#97979f1f', // --interactive-background-hover
  text: '#efeff1', // --text-default
  muted: '#81828a', // --channels-default
  strong: '#fbfbfb', // --text-strong
  border: '#97979f1f', // --border-subtle
  borderStrong: '#97979f70', // --border-strong
  titlebar: '#121214', // --background-base-lowest
  scheme: 'dark',
}

/** Discord's `theme-dark` — the grey one the UI calls Ash. */
const ash: Tokens = {
  rail: '#2c2d32',
  side: '#2c2d32',
  chat: '#323339',
  card: '#393a41',
  menu: '#3c3d45',
  composer: '#393a41',
  selected: '#97979f33',
  hover: '#97979f1f',
  text: '#f3f3f4',
  muted: '#999aa1',
  strong: '#ffffff',
  border: '#97979f1f',
  borderStrong: '#97979f70', // --border-strong
  titlebar: '#2c2d32',
  scheme: 'dark',
}

/** Discord's `theme-midnight` — every base surface is pure black. */
const onyx: Tokens = {
  rail: '#000000',
  side: '#000000',
  chat: '#000000',
  card: '#101013',
  menu: '#121214',
  composer: '#101013',
  selected: '#97979f3d',
  hover: '#97979f1f',
  text: '#d4d5d8',
  muted: '#7a7b83',
  strong: '#dcdcdf',
  border: '#97979f33',
  borderStrong: '#97979f70', // --border-strong
  titlebar: '#000000',
  scheme: 'dark',
}

/**
 * Discord's `theme-light`. Under the refresh every raised surface is plain
 * white and the separation comes from the border and the overlays, so card,
 * menu and composer really do all land on #ffffff.
 */
const light: Tokens = {
  rail: '#f3f3f4',
  side: '#f3f3f4',
  chat: '#fbfbfb',
  card: '#ffffff',
  menu: '#ffffff',
  composer: '#ffffff',
  selected: '#97979f3d',
  hover: '#97979f1f',
  text: '#2e2e34',
  muted: '#666770',
  strong: '#28282d',
  border: '#97979f47',
  borderStrong: '#97979f85', // --border-strong
  titlebar: '#f3f3f4',
  scheme: 'light',
}

export const defaultThemes: Theme[] = [
  { id: 'light', name: 'Light', swatch: '#ffffff', tokens: light },
  { id: 'ash', name: 'Ash', swatch: '#323339', tokens: ash },
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
      menu: veil(scheme === 'light' ? 0.88 : 0.45),
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
  r.style.setProperty('--menu', k.menu)
  r.style.setProperty('--composer', k.composer)
  r.style.setProperty('--selected', k.selected)
  r.style.setProperty('--hover', k.hover)
  r.style.setProperty('--text', k.text)
  r.style.setProperty('--muted', k.muted)
  r.style.setProperty('--strong', k.strong)
  r.style.setProperty('--border', k.border)
  r.style.setProperty('--border-strong', k.borderStrong)
  r.style.setProperty('--titlebar', k.titlebar)
  r.style.setProperty('--wash', k.wash ?? k.rail)
  r.dataset.scheme = k.scheme
}
