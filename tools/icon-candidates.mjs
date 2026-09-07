/**
 * Renders a set of named icons at one size on the app's own row background, so
 * a crop from a reference frame can be matched against them.
 *
 *   node tools/icon-candidates.mjs out.png 14 GroupPlusIcon UserPlusIcon …
 */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

const named = JSON.parse(readFileSync('tools/discord-named-icons.json', 'utf8'))
const [out, sizeArg, ...names] = process.argv.slice(2)
const size = Number(sizeArg)
const CELL = 26

const cells = names
  .map((n) => {
    const g = named[n]
    if (!g) throw new Error('no such icon: ' + n)
    const box = g.size[0]
    const paths = g.paths
      .map(([d, eo]) => `<path fill="#fdfdfe" fill-rule="${eo ? 'evenodd' : 'nonzero'}" d="${d}"/>`)
      .join('')
    return `<span class="c"><svg viewBox="0 0 ${box} ${box}" width="${size}" height="${size}">${paths}</svg></span>`
  })
  .join('')

const html = `<style>body{margin:0;background:#2c2c30;display:flex}
.c{width:${CELL}px;height:${CELL}px;display:grid;place-items:center}</style>${cells}`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: CELL * names.length, height: CELL }, deviceScaleFactor: 1 })
await p.setContent(html)
await p.screenshot({ path: out })
await b.close()
console.log(names.map((n, i) => `${i * CELL}..${(i + 1) * CELL}  ${n}`).join('\n'))
