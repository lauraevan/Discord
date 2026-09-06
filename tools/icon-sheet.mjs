/**
 * Renders extracted icons to a numbered contact sheet so they can be
 * identified by eye and matched to the ones the app needs.
 */
import { chromium } from 'playwright'
import fs from 'node:fs'

const icons = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const from = +(process.argv[4] ?? 0)
const to = +(process.argv[5] ?? icons.length)
const slice = icons.slice(from, to)

const cell = (ic) => {
  const paths = ic.paths
    .map(
      (p) =>
        `<path fill="currentColor"${p.evenodd ? ' fill-rule="evenodd" clip-rule="evenodd"' : ''} d="${p.d}"/>`,
    )
    .join('')
  return `<i><svg viewBox="0 0 24 24" width="30" height="30">${paths}</svg><b>${ic.i}</b></i>`
}

const html = `<style>
body{margin:0;background:#1a1a1e;color:#dbdee1;font:9px monospace}
i{display:inline-flex;flex-direction:column;align-items:center;width:52px;padding:5px 0}
b{opacity:.55;font-weight:400;margin-top:2px}
</style>${slice.map(cell).join('')}`

fs.writeFileSync('/tmp/sheet.html', html)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1092, height: 800 }, deviceScaleFactor: 1 })
await p.goto('file:///tmp/sheet.html')
await p.waitForTimeout(500)
await p.screenshot({ path: process.argv[3], fullPage: true })
await b.close()
console.log(`rendered ${slice.length} icons (${from}..${to})`)
