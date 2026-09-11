/** Every Server Settings section, one PNG each, for eyeballing. */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1558, height: 900 } })
const errs = []
p.on('pageerror', (e) => errs.push(String(e).split('\n')[0]))
await p.addInitScript(readFileSync('tools/session.js', 'utf8'))
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(600)
await p.click('.server-tile.srv')
await p.waitForTimeout(300)
await p.click('.server-header')
await p.waitForSelector('.ctx-item', { timeout: 3000 })
await p.click('.ctx-item:has-text("Server Settings")')
await p.waitForSelector('.settings-layer', { timeout: 3000 })
await p.waitForTimeout(500)
const dir = process.argv[2]
const labels = await p.locator('.settings-item').allInnerTexts()
for (const label of labels) {
  if (label === 'Delete Server') continue
  const it = p.locator(`.settings-item:text-is("${label}")`).first()
  await it.scrollIntoViewIfNeeded()
  await it.click()
  await p.waitForTimeout(300)
  const slug = label.toLowerCase().replace(/\W+/g, '-')
  await p.screenshot({ path: `${dir}/${slug}.png` })
}
console.log(labels.length, 'sections;', 'errors:', errs.length ? errs : 'none')
await b.close()
