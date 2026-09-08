/** Shots each Server Settings section, so they can be looked at. */
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
const out = process.argv[2]
mkdirSync(out, { recursive: true })
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1558, height: 900 } })
p.on('pageerror', (e) => console.log('pageerror:', String(e).split('\n')[0]))
await p.addInitScript(readFileSync('tools/session.js', 'utf8'))
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(500)
await p.click('.server-tile.srv')
await p.waitForTimeout(300)
await p.click('.server-header')
await p.waitForTimeout(250)
await p.click('text=Server Settings')
await p.waitForTimeout(400)
for (const label of process.argv.slice(3)) {
  await p.click(`.settings-item:has-text("${label}")`)
  await p.waitForTimeout(300)
  await p.screenshot({ path: `${out}/srv-${label.toLowerCase().replace(/\W+/g, '-')}.png` })
}
console.log('ok')
await b.close()
