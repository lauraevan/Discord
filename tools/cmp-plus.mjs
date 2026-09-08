/** Opens the composer's + menu, at the size docs/refs uses. */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1366, height: 884 }, deviceScaleFactor: 2 })
await p.addInitScript(readFileSync('tools/session.js', 'utf8'))
p.on('pageerror', (e) => console.log('ERR', String(e).split('\n')[0]))
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(700)
await p.click('.server-tile.srv'); await p.waitForTimeout(250)
await p.click(".composer .plus")
await p.waitForTimeout(400)
await p.screenshot({ path: process.argv[2] })
console.log(await p.evaluate(() =>
  [...document.querySelectorAll('.ctx-item, .menu-item')].map((e) => e.textContent)))
await b.close()
