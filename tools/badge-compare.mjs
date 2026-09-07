/**
 * Renders each badge candidate at the size and background the reference uses,
 * so they can be scored against the frame rather than chosen by provenance.
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { readFileSync as __readSession } from 'node:fs'

const rows = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const CELL = 18
const cell = (f) => {
  const ext = path.extname(f).slice(1)
  const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`
  const b = fs.readFileSync(f).toString('base64')
  return `<i style="background-image:url(data:${mime};base64,${b})"></i>`
}
const html = `<style>
body{margin:0;background:#cfddce}
i{display:block;float:left;width:${CELL}px;height:${CELL}px;
  background-size:14px 14px;background-position:center;background-repeat:no-repeat}
div{clear:both;height:${CELL}px}
</style>${rows.map((r) => `<div>${r.files.map(cell).join('')}</div>`).join('')}`
fs.writeFileSync('/tmp/badgecmp.html', html)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: CELL * 6, height: 800 }, deviceScaleFactor: 1 })
await p.addInitScript(__readSession('tools/session.js', 'utf8'))
await p.goto('file:///tmp/badgecmp.html')
await p.waitForTimeout(900)
await p.screenshot({ path: process.argv[3], fullPage: true })
await b.close()
console.log('rendered', rows.length, 'rows')
