/**
 * Imports Discord's nameplate artwork from an archive of its .webm assets.
 *
 * A nameplate is the strip Discord paints behind a member's name. Its art is
 * served from `cdn.discordapp.com/assets/collectibles/nameplates/nameplates/`,
 * which this environment cannot reach, and no repository commits it — so the
 * files come in as an archive instead, and this turns them into something a
 * single-file build can carry.
 *
 * Discord ships each plate as a looping VP9 video with alpha, 672x126 or
 * 448x84 — five and a third times as wide as it is tall, which is the row it
 * sits behind at 2x or 3x. There is no ffmpeg here, so the frame is pulled the
 * way the page itself would: a <video> seeked to the middle of its loop and
 * drawn onto a canvas, which also does the WebP encoding. 236 animated files
 * would be 25MB inlined; 236 stills are about a megabyte.
 *
 *   node tools/import-nameplates.mjs <dir of .webm files>
 *
 * Writes src/assets/nameplates/*.webp and regenerates src/nameplates.ts.
 */
import { chromium } from 'playwright'
import { readdirSync, writeFileSync, mkdirSync, rmSync, existsSync, statSync } from 'node:fs'
import { join, basename } from 'node:path'

const SRC = process.argv[2]
if (!SRC || !existsSync(SRC)) {
  console.error('usage: node tools/import-nameplates.mjs <dir of .webm files>')
  process.exit(1)
}

const OUT = 'src/assets/nameplates'
const TS = 'src/nameplates.ts'

/**
 * The strip is drawn about 224x42, so this is one and a half times that: sharp
 * on a retina panel without paying for the full 2x, which for 236 of them is
 * the difference between a megabyte and two and a half.
 */
const W = 288
const H = 54
const QUALITY = 0.7

/** Discord charges more for the licensed ones; the Shop screenshot shows these */
const PRICE_OVERRIDES = { yuji_itadori: 7.99, symbiote: 8.99 }
const PRICE = 5.99

/** names the mechanical title-case gets wrong */
const NAME_OVERRIDES = {
  bb_8: 'BB-8',
  d20_roll: 'D20 Roll',
  'k_heart_(base)': 'K Heart (Base)',
  'k_heart_(dark)': 'K Heart (Dark)',
  'c.america_&_caribbean': 'C. America & Caribbean',
  uk: 'UK',
  usa: 'USA',
  uae: 'UAE',
  dna: 'DNA',
}

const title = (slug) =>
  NAME_OVERRIDES[slug] ??
  slug
    .split('_')
    .map((w) =>
      w.length && /[a-z]/.test(w[0]) ? w[0].toUpperCase() + w.slice(1) : w,
    )
    .join(' ')
    .replace(/\(([a-z])/g, (_, c) => `(${c.toUpperCase()}`)

const files = readdirSync(SRC)
  .filter((f) => f.endsWith('.webm'))
  .sort()
console.log(`${files.length} nameplates in ${SRC}`)

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

// the video has to be same-origin with the page for the canvas to stay clean,
// and a file:// page gets an opaque origin unless Chromium is told otherwise —
// without the flag every readback fails with a SecurityError
const page = join(SRC, '_import.html')
writeFileSync(page, '<!doctype html><title>import</title>')

const b = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--allow-file-access-from-files'],
})
const p = await b.newPage()
await p.goto('file://' + page)

const rows = []
let failed = 0
for (const file of files) {
  const slug = basename(file, '.webm')
  const got = await p
    .evaluate(
      async ([src, w, h, q]) => {
        const v = document.createElement('video')
        v.src = src
        v.muted = true
        v.playsInline = true
        document.body.append(v)
        await new Promise((res, rej) => {
          v.onloadeddata = res
          v.onerror = () => rej(new Error('load'))
          setTimeout(() => rej(new Error('timeout')), 15000)
        })
        // the middle of the loop, where the animation is at full expression
        await new Promise((res, rej) => {
          v.onseeked = res
          v.onerror = () => rej(new Error('seek'))
          v.currentTime = Math.min(v.duration * 0.5, Math.max(0, v.duration - 0.05))
          setTimeout(res, 4000)
        })
        const c = document.createElement('canvas')
        c.width = w
        c.height = h
        const ctx = c.getContext('2d')
        ctx.drawImage(v, 0, 0, w, h)
        // the two colours Discord derives from the artwork, sampled the way it
        // samples them: the dominant hues, ignoring what is transparent
        const { data } = ctx.getImageData(0, 0, w, h)
        const bins = new Map()
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3]
          if (a < 140) continue
          const r = data[i] >> 4
          const g = data[i + 1] >> 4
          const bl = data[i + 2] >> 4
          const key = (r << 8) | (g << 4) | bl
          const e = bins.get(key) ?? [0, 0, 0, 0]
          e[0] += data[i]
          e[1] += data[i + 1]
          e[2] += data[i + 2]
          e[3] += 1
          bins.set(key, e)
        }
        const hex = (n) => n.toString(16).padStart(2, '0')
        const ranked = [...bins.values()]
          .sort((x, y) => y[3] - x[3])
          .map((e) => [
            Math.round(e[0] / e[3]),
            Math.round(e[1] / e[3]),
            Math.round(e[2] / e[3]),
          ])
          .filter(([r, g, bl]) => !(r > 238 && g > 238 && bl > 238) && r + g + bl > 40)
        const pick = (ranked.length ? ranked : [[78, 80, 88]]).slice(0, 2)
        while (pick.length < 2) pick.push(pick[0])
        v.remove()
        return {
          url: c.toDataURL('image/webp', q),
          palette: pick.map(([r, g, bl]) => `#${hex(r)}${hex(g)}${hex(bl)}`),
        }
      },
      [file, W, H, QUALITY],
    )
    .catch((e) => ({ error: String(e).split('\n')[0].slice(0, 60) }))

  if (got.error || !got.url?.startsWith('data:image/webp')) {
    console.log(`  SKIP ${slug}: ${got.error ?? 'no webp encoder'}`)
    failed += 1
    continue
  }
  const out = join(OUT, `${slug}.webp`)
  writeFileSync(out, Buffer.from(got.url.split(',')[1], 'base64'))
  rows.push({ slug, name: title(slug), palette: got.palette })
}
await b.close()
rmSync(page, { force: true })

const total = rows.reduce((n, r) => n + statSync(join(OUT, `${r.slug}.webp`)).size, 0)
console.log(
  `\n${rows.length} imported, ${failed} skipped, ${Math.round(total / 1024)}KB total ` +
    `(${Math.round(total / rows.length)}B each)`,
)

const orbs = (usd) => Math.round((usd * 200) / 25) * 25
const lines = [
  '/**',
  ' * Nameplates.',
  ' *',
  " * The strip Discord paints behind a member's name, and the newest thing its",
  ' * Shop sells. Generated by tools/import-nameplates.mjs — edit that, not this.',
  ' *',
  " * Discord ships each one as a looping video with alpha; these are a frame out",
  ' * of the middle of each loop, at the size the strip is drawn times two. The',
  " * palette under each is sampled from its own artwork, which is how the client",
  ' * gets a nameplate\'s colours too — it reads the image rather than storing them.',
  ' */',
  '',
  "const art = import.meta.glob('./assets/nameplates/*.webp', {",
  '  eager: true,',
  "  query: '?url',",
  "  import: 'default',",
  '}) as Record<string, string>',
  '',
  'export type Nameplate = {',
  '  id: string',
  '  name: string',
  '  /** the two colours Discord would derive from the artwork */',
  '  palette: [string, string]',
  '  /** what Discord charges for it */',
  '  price: number',
  "  /** what it costs in Orbs here, on the Shop's own conversion */",
  '  orbs: number',
  '}',
  '',
  'export const NAMEPLATES: Nameplate[] = [',
]
for (const r of rows) {
  const usd = PRICE_OVERRIDES[r.slug] ?? PRICE
  lines.push(
    `  { id: ${JSON.stringify(r.slug)}, name: ${JSON.stringify(r.name)},` +
      ` palette: ['${r.palette[0]}', '${r.palette[1]}'], price: ${usd}, orbs: ${orbs(usd)} },`,
  )
}
lines.push(
  ']',
  '',
  'export const nameplateById = (id: string | undefined) =>',
  '  id == null ? undefined : NAMEPLATES.find((n) => n.id === id)',
  '',
  '/** The strip artwork for a nameplate, as a URL. */',
  'export const nameplateArt = (id: string) => art[`./assets/nameplates/${id}.webp`]',
  '',
  '/**',
  ' * The wash Discord lays under the artwork.',
  ' *',
  " * The client derives a nameplate's gradient from the artwork's own colours and",
  ' * runs it left to right under the row, with the art itself sitting at the',
  ' * trailing edge and fading out.',
  ' */',
  'export const nameplateWash = (n: Nameplate) =>',
  '  `linear-gradient(to right, transparent 0%, ${n.palette[0]}33 45%, ${n.palette[1]}66 100%)`',
  '',
)
writeFileSync(TS, lines.join('\n'))
console.log(`-> ${TS}`)
