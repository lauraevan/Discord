/**
 * Prints the on-screen rectangle of every element matching a selector list.
 *
 * Pixel measurement tells you where the ink is; this tells you where the box
 * is, which is what the CSS actually controls. Much faster than inferring one
 * from the other.
 */
import { chromium } from 'playwright'
import fs from 'node:fs'

const seedArg = process.argv.find((a) => a.endsWith('.js'))
const SEED = fs.readFileSync(seedArg ?? 'tools/seed.js', 'utf8')
const idx = seedArg ? 0 : 1
const dims = process.argv.find((a) => /^\d+x\d+$/.test(a))
const [VW, VH] = dims ? dims.split('x').map(Number) : [1558, 743]
const sels = process.argv.slice(2).filter((a) => a !== seedArg && a !== dims)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1 })
await p.addInitScript(SEED)
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(700)
await p.evaluate((idx) => {
  ;[...document.querySelectorAll('.server-tile.srv')][idx]?.dispatchEvent(
    new MouseEvent('click', { bubbles: true }),
  )
}, idx)
await p.waitForTimeout(300)
if (!seedArg) await p.evaluate(() => document.querySelector('.user-card .id')?.click())
await p.waitForTimeout(400)
const out = await p.evaluate((sels) => {
  const rows = []
  for (const s of sels) {
    for (const el of document.querySelectorAll(s)) {
      const r = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      rows.push({
        sel: s,
        x: +r.x.toFixed(1), y: +r.y.toFixed(1),
        w: +r.width.toFixed(1), h: +r.height.toFixed(1),
        font: `${cs.fontSize}/${cs.fontWeight}`,
        text: (el.textContent || '').slice(0, 18),
      })
    }
  }
  return rows
}, sels)
for (const r of out) {
  console.log(
    `${r.sel.padEnd(18)} x${String(r.x).padStart(6)} y${String(r.y).padStart(6)} ` +
      `w${String(r.w).padStart(6)} h${String(r.h).padStart(6)}  ${r.font.padEnd(10)} ${r.text}`,
  )
}
await b.close()
