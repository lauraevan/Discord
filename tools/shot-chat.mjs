/** Sends a few messages and shots the list, with the hover toolbar showing. */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
const out = process.argv[2]
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1558, height: 900 } })
p.on('pageerror', (e) => console.log('pageerror:', String(e).split('\n')[0]))
await p.addInitScript(readFileSync('tools/session.js', 'utf8'))
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(500)
await p.click('.server-tile.srv')
await p.waitForTimeout(300)
for (const t of ['first message', 'second one, grouped under it', 'a third']) {
  await p.fill('.composer-input', t)
  await p.press('.composer-input', 'Enter')
  await p.waitForTimeout(150)
}
// reply to the first, so the reference row shows
await p.hover('.group >> nth=0')
await p.waitForTimeout(150)
await p.click('.group >> nth=0 >> .msg-acts button[aria-label="Reply"]')
await p.waitForTimeout(200)
await p.fill('.composer-input', 'replying to the first')
await p.press('.composer-input', 'Enter')
await p.waitForTimeout(300)
await p.hover('.group >> nth=1')
await p.waitForTimeout(200)
await p.screenshot({ path: `${out}/chat.png` })
console.log('ok')
await b.close()
