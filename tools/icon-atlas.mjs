/**
 * Renders every extracted icon into a fixed-cell atlas so they can be
 * template-matched against the reference frames.
 */
import { chromium } from 'playwright'
import fs from 'node:fs'

const icons = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const CELL = 64
const COLS = 20
const cell = (ic) =>
  `<i><svg viewBox="0 0 24 24" width="${CELL}" height="${CELL}">${ic.paths
    .map(
      (p) =>
        `<path fill="#fff"${p.evenodd ? ' fill-rule="evenodd" clip-rule="evenodd"' : ''} d="${p.d}"/>`,
    )
    .join('')}</svg></i>`

const html = `<style>
body{margin:0;background:#000;font-size:0}
i{display:inline-block;width:${CELL}px;height:${CELL}px;line-height:0}
</style><div style="width:${CELL * COLS}px">${icons.map(cell).join('')}</div>`
fs.writeFileSync('/tmp/atlas.html', html)

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: CELL * COLS, height: 800 }, deviceScaleFactor: 1 })
await p.goto('file:///tmp/atlas.html')
await p.waitForTimeout(600)
await p.screenshot({ path: process.argv[3], fullPage: true })
await b.close()
console.log(`atlas ${icons.length} icons, ${COLS} cols, cell ${CELL}`)
