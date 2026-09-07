/**
 * A QR Code encoder (ISO/IEC 18004), byte mode.
 *
 * Discord's login page shows a QR that carries a remote-auth URL, which the
 * mobile app scans to hand a session over. Drawing a decorative grid of
 * squares there would be exactly the "looks like Discord" shortcut this
 * project is trying to avoid, so this generates a real, scannable code:
 * proper version selection, Reed-Solomon error correction, all eight data
 * masks scored by the standard's penalty rules, and the format/version bits.
 */

export type Ecc = 'L' | 'M' | 'Q' | 'H'
/** The two format bits each level is written as — not the order they read in. */
const ECC_FORMAT_BITS: Record<Ecc, number> = { L: 1, M: 0, Q: 3, H: 2 }

// Per-version, per-ECC: [ec codewords per block, group1 blocks, group2 blocks]
// Table 13-22 of the spec, versions 1-40.
const ECC_CODEWORDS_PER_BLOCK: Record<Ecc, number[]> = {
  L: [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  M: [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  Q: [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  H: [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
}
const NUM_ERROR_CORRECTION_BLOCKS: Record<Ecc, number[]> = {
  L: [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  M: [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  Q: [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  H: [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
}

const size = (version: number) => version * 4 + 17

/** Total data modules, minus function patterns, divided into codewords. */
function rawCodewords(version: number) {
  let result = (16 * version + 128) * version + 64
  if (version >= 2) {
    const numAlign = Math.floor(version / 7) + 2
    result -= (25 * numAlign - 10) * numAlign - 55
    if (version >= 7) result -= 36
  }
  return Math.floor(result / 8)
}

const dataCodewords = (version: number, ecc: Ecc) =>
  rawCodewords(version) -
  ECC_CODEWORDS_PER_BLOCK[ecc][version] * NUM_ERROR_CORRECTION_BLOCKS[ecc][version]

/* ------------------------------------------------------- GF(256) arithmetic */

const EXP = new Uint8Array(512)
const LOG = new Uint8Array(256)
{
  let x = 1
  for (let i = 0; i < 255; i++) {
    EXP[i] = x
    LOG[x] = i
    x <<= 1
    if (x & 0x100) x ^= 0x11d
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]
}
const mul = (a: number, b: number) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]])

function rsGenerator(degree: number) {
  let poly = [1]
  for (let i = 0; i < degree; i++) {
    const next = new Array<number>(poly.length + 1).fill(0)
    for (let j = 0; j < poly.length; j++) {
      // coefficients are stored highest-degree first, so multiplying by x
      // shifts a term one slot left and the constant term one slot right
      next[j] ^= poly[j]
      next[j + 1] ^= mul(poly[j], EXP[i])
    }
    poly = next
  }
  return poly
}

function rsRemainder(data: number[], degree: number) {
  const gen = rsGenerator(degree)
  const out = new Array<number>(degree).fill(0)
  for (const b of data) {
    const factor = b ^ out.shift()!
    out.push(0)
    for (let i = 0; i < degree; i++) out[i] ^= mul(gen[i + 1], factor)
  }
  return out
}

/* ---------------------------------------------------------------- encoding */

function bitStream(text: string, version: number, ecc: Ecc) {
  const bytes = new TextEncoder().encode(text)
  const bits: number[] = []
  const push = (value: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((value >>> i) & 1)
  }
  push(0b0100, 4) // byte mode
  push(bytes.length, version < 10 ? 8 : 16)
  for (const b of bytes) push(b, 8)

  const capacity = dataCodewords(version, ecc) * 8
  push(0, Math.min(4, capacity - bits.length))
  while (bits.length % 8 !== 0) bits.push(0)

  const words: number[] = []
  for (let i = 0; i < bits.length; i += 8) {
    let v = 0
    for (let j = 0; j < 8; j++) v = (v << 1) | bits[i + j]
    words.push(v)
  }
  for (let pad = 0xec; words.length < dataCodewords(version, ecc); pad ^= 0xec ^ 0x11) words.push(pad)
  return words
}

function interleave(data: number[], version: number, ecc: Ecc) {
  const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[ecc][version]
  const eccLen = ECC_CODEWORDS_PER_BLOCK[ecc][version]
  const raw = rawCodewords(version)
  const shortBlockLen = Math.floor(raw / numBlocks)
  const numShort = numBlocks - (raw % numBlocks)

  const blocks: number[][] = []
  const eccBlocks: number[][] = []
  let k = 0
  for (let i = 0; i < numBlocks; i++) {
    const len = shortBlockLen - eccLen + (i < numShort ? 0 : 1)
    const block = data.slice(k, k + len)
    k += len
    blocks.push(block)
    eccBlocks.push(rsRemainder(block, eccLen))
  }

  const out: number[] = []
  for (let i = 0; i < shortBlockLen - eccLen + 1; i++)
    for (let b = 0; b < numBlocks; b++) if (i < blocks[b].length) out.push(blocks[b][i])
  for (let i = 0; i < eccLen; i++) for (let b = 0; b < numBlocks; b++) out.push(eccBlocks[b][i])
  return out
}

/* ------------------------------------------------------------------ matrix */

const ALIGN_POSITIONS = (version: number) => {
  if (version === 1) return []
  const n = Math.floor(version / 7) + 2
  const step = version === 32 ? 26 : Math.ceil((version * 4 + 4) / (n * 2 - 2)) * 2
  const out = [6]
  for (let pos = size(version) - 7; out.length < n; pos -= step) out.splice(1, 0, pos)
  return out
}

type Grid = { m: boolean[][]; fn: boolean[][]; n: number }

function blank(version: number): Grid {
  const n = size(version)
  return {
    n,
    m: Array.from({ length: n }, () => new Array<boolean>(n).fill(false)),
    fn: Array.from({ length: n }, () => new Array<boolean>(n).fill(false)),
  }
}

function setFn(g: Grid, x: number, y: number, dark: boolean) {
  if (x < 0 || y < 0 || x >= g.n || y >= g.n) return
  g.m[y][x] = dark
  g.fn[y][x] = true
}

function drawFunctions(g: Grid, version: number, ecc: Ecc) {
  for (let i = 0; i < g.n; i++) {
    setFn(g, 6, i, i % 2 === 0)
    setFn(g, i, 6, i % 2 === 0)
  }
  for (const [cx, cy] of [[3, 3], [g.n - 4, 3], [3, g.n - 4]]) {
    for (let dy = -4; dy <= 4; dy++)
      for (let dx = -4; dx <= 4; dx++) {
        const d = Math.max(Math.abs(dx), Math.abs(dy))
        setFn(g, cx + dx, cy + dy, d !== 2 && d !== 4)
      }
  }
  const align = ALIGN_POSITIONS(version)
  for (let i = 0; i < align.length; i++)
    for (let j = 0; j < align.length; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === align.length - 1) || (i === align.length - 1 && j === 0))
        continue
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++)
          setFn(g, align[j] + dx, align[i] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1)
    }
  // format information is written per-mask; reserve it now
  drawFormat(g, ecc, 0)
  if (version >= 7) {
    let rem = version
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25)
    const bits = (version << 12) | rem
    for (let i = 0; i < 18; i++) {
      const bit = ((bits >>> i) & 1) === 1
      const a = g.n - 11 + (i % 3)
      const b = Math.floor(i / 3)
      setFn(g, a, b, bit)
      setFn(g, b, a, bit)
    }
  }
}

function drawFormat(g: Grid, ecc: Ecc, mask: number) {
  const data = (ECC_FORMAT_BITS[ecc] << 3) | mask
  let rem = data
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537)
  const bits = ((data << 10) | rem) ^ 0x5412
  const at = (i: number) => ((bits >>> i) & 1) === 1
  for (let i = 0; i <= 5; i++) setFn(g, 8, i, at(i))
  setFn(g, 8, 7, at(6))
  setFn(g, 8, 8, at(7))
  setFn(g, 7, 8, at(8))
  for (let i = 9; i < 15; i++) setFn(g, 14 - i, 8, at(i))
  for (let i = 0; i < 8; i++) setFn(g, g.n - 1 - i, 8, at(i))
  for (let i = 8; i < 15; i++) setFn(g, 8, g.n - 15 + i, at(i))
  setFn(g, 8, g.n - 8, true)
}

function drawCodewords(g: Grid, words: number[]) {
  let i = 0
  for (let right = g.n - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5
    for (let v = 0; v < g.n; v++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j
        const upward = ((right + 1) & 2) === 0
        const y = upward ? g.n - 1 - v : v
        if (!g.fn[y][x] && i < words.length * 8) {
          g.m[y][x] = ((words[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0
          i++
        }
      }
    }
  }
}

const MASKS: ((x: number, y: number) => boolean)[] = [
  (x, y) => (x + y) % 2 === 0,
  (_x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
]

function applyMask(g: Grid, mask: number) {
  for (let y = 0; y < g.n; y++)
    for (let x = 0; x < g.n; x++)
      if (!g.fn[y][x] && MASKS[mask](x, y)) g.m[y][x] = !g.m[y][x]
}

/** The four penalty rules of §8.8.2. */
function penalty(g: Grid) {
  let score = 0
  const n = g.n
  const run = (get: (i: number) => boolean) => {
    let colour = get(0)
    let len = 1
    let history = [0, 0, 0, 0, 0, 0, 0]
    let total = 0
    const finish = (l: number, dark: boolean) => {
      if (l >= 5) total += 3 + (l - 5)
      history = [l, ...history].slice(0, 7)
      // finder-like 1:1:3:1:1 patterns
      if (!dark && history[1] >= 1) {
        const h = history
        if (h[2] === h[4] && h[2] === h[6] && h[3] === h[2] * 3 && Math.max(h[1], h[5]) >= h[2] * 4)
          total += 40
      }
    }
    for (let i = 1; i < n; i++) {
      if (get(i) === colour) len++
      else {
        finish(len, colour)
        colour = get(i)
        len = 1
      }
    }
    finish(len, colour)
    return total
  }
  for (let y = 0; y < n; y++) score += run((x) => g.m[y][x])
  for (let x = 0; x < n; x++) score += run((y) => g.m[y][x])
  for (let y = 0; y < n - 1; y++)
    for (let x = 0; x < n - 1; x++) {
      const c = g.m[y][x]
      if (c === g.m[y][x + 1] && c === g.m[y + 1][x] && c === g.m[y + 1][x + 1]) score += 3
    }
  let dark = 0
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (g.m[y][x]) dark++
  const ratio = (dark * 100) / (n * n)
  score += Math.floor(Math.abs(ratio - 50) / 5) * 10
  return score
}

/* ------------------------------------------------------------------- entry */

/** Encode `text` and return a square matrix of booleans (true = dark). */
export function encodeQr(text: string, ecc: Ecc = 'M'): boolean[][] {
  const bytes = new TextEncoder().encode(text).length
  let version = 1
  for (; version <= 40; version++) {
    const cap = dataCodewords(version, ecc)
    const header = 4 + (version < 10 ? 8 : 16)
    if (cap * 8 >= header + bytes * 8) break
  }
  if (version > 40) throw new Error('too long for a QR code')

  const words = interleave(bitStream(text, version, ecc), version, ecc)

  let best: Grid | null = null
  let bestScore = Infinity
  for (let mask = 0; mask < 8; mask++) {
    const g = blank(version)
    drawFunctions(g, version, ecc)
    drawCodewords(g, words)
    drawFormat(g, ecc, mask)
    applyMask(g, mask)
    const s = penalty(g)
    if (s < bestScore) {
      bestScore = s
      best = g
    }
  }
  return best!.m
}
