/**
 * Vendors Discord's own Nitro marketing artwork into src/assets/nitro/.
 *
 * The Nitro tab's cover art is served from discord.com, which this
 * environment's egress policy denies. aashish-dhiman/discord-clone rebuilt
 * discord.com's Nitro page and committed the artwork it uses — Discord's own
 * SVGs, straight off that page: the cover, the NITRO and NITRO BASIC
 * wordmarks, the sparkles, the MOST POPULAR tag and the perk illustrations —
 * and raw.githubusercontent.com serves those.
 *
 * They arrive as Figma exports, which are far heavier than they look (one perk
 * card is 2.8MB of paths), so anything that is not flat line work is rendered
 * in the browser at the size the UI actually shows it and written as WebP. The
 * wordmarks and sparkles stay SVG, where they are both smaller and crisper.
 *
 *   node tools/fetch-nitro-web-art.mjs
 */
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync, readFileSync, rmSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'

const REPO =
  'https://raw.githubusercontent.com/aashish-dhiman/discord-clone/main/src/assets'
const OUT = 'src/assets/nitro'
const TMP = '/tmp/nitro-art'

/** kept as SVG: flat, small, and wanted at any size */
const VECTOR = {
  'wordmark-nitro': 'nitro/nitro2.svg',
  'wordmark-basic': 'nitro/nitro1.svg',
  'sparkles-pink': 'nitro/star.svg',
  'sparkles-green': 'nitro/star2.svg',
  'tag-popular': 'nitro/tag.svg',
}

/** rendered to WebP at the width the page shows them */
const RASTER = {
  // the cover: a gradient sky with the winged gem, a castle and a windmill
  cover: ['nitro/card4.svg', 1600],
  // the cloud band Discord runs under its heroes
  clouds: ['home/clouds.svg', 1600],
  // the bento illustrations, each the real card off the Nitro page
  'bento-uploads': ['nitro/card1.svg', 720],
  'bento-emoji': ['nitro/card3.svg', 720],
  'bento-profile': ['nitro/card2.svg', 720],
  'bento-collectibles': ['nitro/card6.svg', 720],
}

const get = async (path) => {
  const r = await fetch(`${REPO}/${path}`)
  if (!r.ok) throw new Error(`${r.status} ${path}`)
  return await r.text()
}

const kb = (p) => Math.round(statSync(p).size / 1024)

mkdirSync(OUT, { recursive: true })
mkdirSync(TMP, { recursive: true })

for (const [slug, path] of Object.entries(VECTOR)) {
  const svg = await get(path)
  writeFileSync(join(OUT, `${slug}.svg`), svg)
  console.log(`${slug.padEnd(20)} svg   ${kb(join(OUT, `${slug}.svg`))}KB`)
}

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
for (const [slug, [path, width]] of Object.entries(RASTER)) {
  const svg = await get(path)
  // the intrinsic size decides the height, so the render keeps the artwork's
  // own aspect rather than a guessed one
  const [, w, h] = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/) ?? []
  const height = Math.round((width * Number(h)) / Number(w))
  const p = await b.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
  await p.setContent(
    `<style>html,body{margin:0;background:transparent}
     svg{display:block;width:${width}px;height:${height}px}</style>${svg}`,
  )
  await p.waitForTimeout(120)
  const png = join(TMP, `${slug}.png`)
  await p.screenshot({ path: png, omitBackground: true })
  await p.close()

  execFileSync('python3', [
    '-c',
    'import sys;from PIL import Image;im=Image.open(sys.argv[1]).convert("RGBA");' +
      'im.save(sys.argv[2], format="WEBP", quality=86, method=6)',
    png,
    join(OUT, `${slug}.webp`),
  ])
  console.log(
    `${slug.padEnd(20)} webp  ${width}x${height}  ${Math.round(svg.length / 1024)}KB -> ${kb(join(OUT, `${slug}.webp`))}KB`,
  )
}
await b.close()
rmSync(TMP, { recursive: true, force: true })
console.log(`\n${Object.keys(VECTOR).length + Object.keys(RASTER).length} files -> ${OUT}`)
