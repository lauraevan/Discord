import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1558, height: 900 } })
await p.addInitScript(readFileSync('tools/session.js', 'utf8'))
p.on('pageerror', (e) => console.log('ERR', String(e).split('\n')[0]))
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(700)
await p.click('.server-tile.srv')
await p.waitForTimeout(400)
// two messages, each turned into a thread from its own menu
for (const t of ['ideas for the weekend', 'bug in the build']) {
  await p.click('.composer-input')
  await p.fill('.composer-input', t)
  await p.press('.composer-input', 'Enter')
  await p.waitForTimeout(250)
  await p.locator('.group').last().hover()
  await p.locator('.group').last().locator('[aria-label="More"]').click()
  await p.waitForSelector('.ctx-item', { timeout: 3000 })
  const item = p.locator('.ctx-item:has-text("Thread")')
  if (await item.count()) await item.first().click()
  else await p.keyboard.press('Escape')
  await p.waitForTimeout(300)
  // come back to the parent channel
  await p.click('.row:has-text("general")')
  await p.waitForTimeout(250)
}
await p.click('[aria-label="Threads"]')
await p.waitForTimeout(400)
console.log('threads listed:', await p.locator('.thread-card').count())
await p.screenshot({ path: process.argv[2] })
await b.close()
