import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1558, height: 900 } })
const errs = []
p.on('pageerror', (e) => errs.push(String(e).split('\n')[0]))
await p.addInitScript(readFileSync('tools/session.js', 'utf8'))
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(600)
await p.click('.server-tile.srv'); await p.waitForTimeout(300)
await p.locator('.sidebar-scroll .row:not(.nav)').first().hover()
await p.locator('.sidebar-scroll .row:not(.nav)').first().locator('[aria-label="Edit channel"]').click()
await p.waitForSelector('.settings-layer'); await p.waitForTimeout(500)
const dir = process.argv[2]
const labels = await p.locator('.settings-item').allInnerTexts()
for (const label of labels) {
  if (/Delete/.test(label)) continue
  await p.locator(`.settings-item:text-is("${label}")`).first().click()
  await p.waitForTimeout(250)
  await p.screenshot({ path: `${dir}/ch-${label.toLowerCase().replace(/\W+/g, '-')}.png` })
}
console.log(labels.join(' | '), '| errors:', errs.length ? errs : 'none')
await b.close()
