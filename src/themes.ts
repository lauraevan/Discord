/**
 * Theme tokens.
 *
 * The four default themes and the Nitro colour themes shown in the reference
 * Appearance / Preview Theme panels. Every surface in the app reads from these
 * custom properties, so switching a theme repaints the whole window.
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
  chat: '#1a191e',
  card: '#222327',
  composer: '#222327',
  selected: '#2c2b30',
  hover: '#1e1d22',
  text: '#e4e4e8',
  muted: '#85858a',
  strong: '#fdfdfe',
  border: '#232228',
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
  { id: 'dark', name: 'Dark', swatch: '#1a191e', tokens: dark },
  { id: 'onyx', name: 'Onyx', swatch: '#000000', tokens: onyx },
]

/** Nitro colour themes: a tinted wash over a light or dark base. */
type ColorSpec = {
  id: string
  name: string
  from: string
  to: string
  scheme: 'light' | 'dark'
}

const colorSpecs: ColorSpec[] = [
  { id: 'mint', name: 'Mint Apple', from: '#c6e7c0', to: '#e9f6e3', scheme: 'light' },
  { id: 'citrus', name: 'Citrus Sherbert', from: '#f8c99a', to: '#fbe3c9', scheme: 'light' },
  { id: 'retro', name: 'Retro Raincloud', from: '#c9d3f2', to: '#e4e9fb', scheme: 'light' },
  { id: 'neon', name: 'Neon Nights', from: '#d9f3c9', to: '#f0fae4', scheme: 'light' },
  { id: 'strawberry', name: 'Strawberry', from: '#f2c9cf', to: '#fbe4e7', scheme: 'light' },
  { id: 'cotton', name: 'Cotton Candy', from: '#f7d4ea', to: '#fdeaf6', scheme: 'light' },
  { id: 'sky', name: 'Sky', from: '#cfe6f7', to: '#e8f3fc', scheme: 'light' },
  { id: 'desert', name: 'Desert Khaki', from: '#f0e6c8', to: '#f9f3e2', scheme: 'light' },
  { id: 'sunrise', name: 'Sunrise', from: '#5b4bb8', to: '#2b2456', scheme: 'dark' },
  { id: 'chroma', name: 'Chroma Glow', from: '#7b2fbe', to: '#2a1140', scheme: 'dark' },
  { id: 'forest', name: 'Forest', from: '#2f5544', to: '#12211b', scheme: 'dark' },
  { id: 'crimson', name: 'Crimson Moon', from: '#6d1f24', to: '#25090c', scheme: 'dark' },
  { id: 'midnight', name: 'Midnight Blurple', from: '#3b3b8f', to: '#141438', scheme: 'dark' },
  { id: 'mars', name: 'Mars', from: '#7a3b2e', to: '#2a120d', scheme: 'dark' },
  { id: 'dusk', name: 'Dusk', from: '#4c5573', to: '#1b1f2c', scheme: 'dark' },
  { id: 'sepia', name: 'Sepia', from: '#6a5433', to: '#241c10', scheme: 'dark' },
  { id: 'hanami', name: 'Hanami', from: '#8f2f63', to: '#2c0c1f', scheme: 'dark' },
  { id: 'lofi', name: 'Lofi Vibes', from: '#2a6a63', to: '#0d2523', scheme: 'dark' },
]

function colorTheme(s: ColorSpec): Theme {
  const base = s.scheme === 'light' ? light : dark
  return {
    id: s.id,
    name: s.name,
    swatch: `linear-gradient(150deg, ${s.from}, ${s.to})`,
    tokens: {
      ...base,
      wash: `linear-gradient(150deg, ${s.from}, ${s.to})`,
      rail: 'transparent',
      side: s.scheme === 'light' ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.34)',
      chat: s.scheme === 'light' ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.22)',
      card: s.scheme === 'light' ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.32)',
      composer: s.scheme === 'light' ? 'rgba(255,255,255,0.62)' : 'rgba(0,0,0,0.32)',
      selected: s.scheme === 'light' ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.13)',
      hover: s.scheme === 'light' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.07)',
      border: s.scheme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
      titlebar: 'transparent',
    },
  }
}

export const colorThemes: Theme[] = colorSpecs.map(colorTheme)

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
