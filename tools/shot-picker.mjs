import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
const out = process.argv[2]
mkdirSync(out, { recursive: true })
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1558, height: 900 } })
await p.addInitScript(readFileSync('tools/session.js', 'utf8'))
p.on('pageerror', (e) => console.log('ERR', String(e).split('\n')[0]))
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(700)
await p.click('.server-tile.srv')
await p.waitForTimeout(400)
for (const [label, name] of [['GIF', 'gif'], ['Sticker', 'sticker'], ['Emoji', 'emoji']]) {
  await p.keyboard.press('Escape')
  await p.waitForTimeout(150)
  await p.click(`[aria-label="${label}"]`)
  await p.waitForSelector('.picker', { timeout: 3000 })
  await p.waitForTimeout(350)
  await p.screenshot({ path: `${out}/pick-${name}.png` })
}
console.log('tabs:', await p.locator('.picker-tabs button').count())
await b.close()
