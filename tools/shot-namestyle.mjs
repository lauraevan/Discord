import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1558, height: 950 } })
await p.addInitScript(readFileSync('tools/session.js', 'utf8'))
// a Nitro subscription, so the picker is unlocked
await p.addInitScript(() =>
  localStorage.setItem(
    'discord-ui:v4:subscription',
    JSON.stringify({ premiumType: 2, until: Date.now() + 250 * 864e5, source: 'purchase', interval: 2 }),
  ),
)
p.on('pageerror', (e) => console.log('ERR', String(e).split('\n')[0]))
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(700)
await p.click('[aria-label="User settings"]')
await p.click('.settings-item:has-text("Profiles")')
await p.waitForTimeout(500)
await p.locator('.name-font:has-text("Cherry Bomb One")').click()
await p.locator('.name-effect:has-text("Gradient")').click()
await p.waitForTimeout(300)
await p.locator('.set-field:has-text("DISPLAY NAME STYLE")').scrollIntoViewIfNeeded()
await p.waitForTimeout(300)
await p.screenshot({ path: process.argv[2] })
// and every effect on one strip
const strip = await p.evaluate(() => {
  const wrap = document.createElement('div')
  wrap.id = 'strip'
  wrap.style.cssText =
    'position:fixed;inset:0;z-index:9999;background:#1a1a1e;display:grid;' +
    'grid-template-columns:repeat(4,1fr);align-content:center;gap:22px;padding:40px;' +
    "font:700 30px 'gg sans',sans-serif"
  document.body.append(wrap)
  return wrap.id
})
await p.evaluate(() => {
  const wrap = document.getElementById('strip')
  const names = ['Solid', 'Gradient', 'Neon', 'Toon', 'Pop', 'Glow', 'Prism', 'Gummy']
  for (const n of names) {
    const cell = document.createElement('div')
    cell.style.cssText = 'display:grid;justify-items:center;gap:6px'
    const label = document.createElement('small')
    label.textContent = n
    label.style.cssText = 'font:400 12px sans-serif;color:#85858a'
    cell.append(document.createElement('span'), label)
    wrap.append(cell)
  }
})
await p.waitForTimeout(100)
await b.close()
