/** Shots the Profiles pane, with collectibles owned so the pickers have art. */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
const out = process.argv[2]
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1558, height: 900 } })
p.on('pageerror', (e) => console.log('pageerror:', String(e).split('\n')[0]))
await p.addInitScript(readFileSync('tools/session.js', 'utf8'))
await p.addInitScript(() => {
  const raw = localStorage.getItem('discord-ui:v4:account')
  const a = raw ? JSON.parse(raw) : {}
  a.collectibles = ['cozy-cat', 'fire', 'stardust', 'study-spot', 'all-nighter']
  a.decoration = 'cozy-cat'
  localStorage.setItem('discord-ui:v4:account', JSON.stringify(a))
  localStorage.setItem(
    'discord-ui:v4:subscription',
    JSON.stringify({ premiumType: 2, until: Date.now() + 30 * 864e5, source: 'purchase', interval: 1 }),
  )
})
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(500)
await p.click('.user-card .acts button[aria-label="User settings"]')
await p.waitForTimeout(400)
await p.click('.settings-item:has-text("Profiles")')
await p.waitForTimeout(400)
await p.screenshot({ path: `${out}/profiles.png` })
await p.evaluate(() => document.querySelector('.settings-content')?.scrollTo(0, 700))
await p.waitForTimeout(250)
await p.screenshot({ path: `${out}/profiles-2.png` })
await p.click('.profile-tab:has-text("Server Profiles")')
await p.waitForTimeout(300)
await p.screenshot({ path: `${out}/profiles-server.png` })
console.log('ok')
await b.close()
