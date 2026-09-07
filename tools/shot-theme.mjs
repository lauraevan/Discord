/** Screenshots the Appearance pane and the app under a gradient theme. */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
const out = process.argv[2]
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1558, height: 900 } })
p.on('pageerror', (e) => console.log('pageerror:', String(e).split('\n')[0]))
await p.addInitScript(readFileSync('tools/session.js', 'utf8'))
// a Nitro subscription, so the gradients are not locked
await p.addInitScript(() => {
  localStorage.setItem(
    'discord-ui:v4:subscription',
    JSON.stringify({ premiumType: 2, until: Date.now() + 30 * 864e5, source: 'purchase', interval: 1 }),
  )
})
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(500)
await p.click('.user-card .acts button[aria-label="User settings"]')
await p.waitForTimeout(400)
await p.click('.settings-item:has-text("Appearance")')
await p.waitForTimeout(300)
await p.screenshot({ path: `${out}/appearance.png` })
await p.click('.theme-grid .theme-swatch >> nth=0')
await p.waitForTimeout(300)
await p.screenshot({ path: `${out}/appearance-twilight.png` })
await p.keyboard.press('Escape')
await p.waitForTimeout(400)
await p.screenshot({ path: `${out}/app-twilight.png` })
await b.close()
