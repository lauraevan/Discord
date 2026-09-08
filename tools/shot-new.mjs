/**
 * Screenshots the account, server-creation, Nitro, Quests and Shop screens,
 * so each can be looked at rather than assumed.
 *
 *   node tools/shot-new.mjs <outdir>
 */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { mkdirSync } from 'node:fs'

const out = process.argv[2] || '.'
mkdirSync(out, { recursive: true })
const url = 'file://' + process.cwd() + '/dist/index.html'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })

async function page(seeded) {
  const p = await b.newPage({ viewport: { width: 1558, height: 900 }, deviceScaleFactor: 1 })
  p.on('pageerror', (e) => console.log('  pageerror:', String(e).split('\n')[0]))
  if (seeded) await p.addInitScript(readFileSync('tools/session.js', 'utf8'))
  await p.goto(url)
  await p.waitForTimeout(500)
  return p
}

// register + login, with nobody signed in
let p = await page(false)
await p.screenshot({ path: `${out}/register.png` })
await p.click('text=Already have an account?')
await p.waitForTimeout(250)
await p.screenshot({ path: `${out}/login.png` })
await p.close()

// the client, signed in
p = await page(true)
await p.click('.rail-add, .server-tile.add, [aria-label="Add a Server"]').catch(() => {})
await p.waitForTimeout(400)
await p.screenshot({ path: `${out}/create-1.png` })
await p.click('.cs-own').catch(() => {})
await p.waitForTimeout(250)
await p.screenshot({ path: `${out}/create-2.png` })
await p.click('.cs-intent').catch(() => {})
await p.waitForTimeout(250)
await p.screenshot({ path: `${out}/create-3.png` })
await p.keyboard.press('Escape')
await p.waitForTimeout(200)

// home views
await p.click('.rail-home, .server-tile.home, [aria-label="Direct Messages"]').catch(() => {})
await p.waitForTimeout(300)
for (const [label, file] of [['Nitro', 'nitro'], ['Quests', 'quests'], ['Shop', 'shop']]) {
  await p.click(`.dm-nav .row:has-text("${label}")`)
  await p.waitForTimeout(400)
  await p.screenshot({ path: `${out}/${file}.png` })
}

// the Nitro surface, section by section, and the gift dialog
await p.click('.dm-nav .row:has-text("Nitro")')
await p.waitForTimeout(200)
for (const [i, y] of [700, 1500, 2400].entries()) {
  await p.evaluate((y) => document.querySelector('.nitro-body')?.scrollTo(0, y), y)
  await p.waitForTimeout(300)
  await p.screenshot({ path: `${out}/nitro-scroll-${i}.png` })
}
await p.click('.nitro-gift-btn')
await p.waitForTimeout(350)
await p.screenshot({ path: `${out}/gift.png` })
await p.keyboard.press('Escape')

// a quest sheet
await p.click('.dm-nav .row:has-text("Quests")')
await p.waitForTimeout(300)
await p.click('.quest-card')
await p.waitForTimeout(350)
await p.screenshot({ path: `${out}/quest-sheet.png` })

await b.close()
console.log('written to', out)
