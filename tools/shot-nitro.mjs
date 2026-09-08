/** Shots the Nitro surface top to bottom, and again with a subscription. */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
const out = process.argv[2]
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1558, height: 900 } })
p.on('pageerror', (e) => console.log('pageerror:', String(e).split('\n')[0]))
await p.addInitScript(readFileSync('tools/session.js', 'utf8'))
// pass "subscribed" to shoot the page as a subscriber sees it
if (process.argv[3] === 'subscribed')
  await p.addInitScript(() => {
    localStorage.setItem(
      'discord-ui:v4:subscription',
      JSON.stringify({
        premiumType: 2,
        until: Date.now() + 250 * 864e5,
        source: 'purchase',
        interval: 2,
      }),
    )
  })
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(500)
await p.click('.rail-home, .server-tile.home, [aria-label="Direct Messages"]').catch(() => {})
await p.waitForTimeout(300)
await p.click('.dm-nav .row:has-text("Nitro")')
await p.waitForTimeout(400)
for (const [i, y] of [0, 640, 1280, 1920, 2560].entries()) {
  await p.evaluate((y) => document.querySelector('.nitro-body').scrollTo(0, y), y)
  await p.waitForTimeout(250)
  await p.screenshot({ path: `${out}/nitro-${i}.png` })
}
await b.close()
