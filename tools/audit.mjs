/** Shoots every major surface into a folder, for looking at all at once. */
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

const shot = async (name, fn) => {
  try {
    await fn()
    await p.screenshot({ path: `${out}/${name}.png` })
  } catch (e) {
    console.log(`skip ${name}: ${String(e).split('\n')[0].slice(0, 70)}`)
  }
}

const home = async () => {
  await p.click('.server-tile.home, [aria-label="Direct Messages"]').catch(() => {})
  await p.waitForTimeout(300)
}

await shot('01-server', async () => {
  await p.click('.server-tile.srv')
  await p.waitForTimeout(400)
  await p.click('.composer-input')
  await p.fill('.composer-input', 'hey **there** :joy: https://discord.com')
  await p.press('.composer-input', 'Enter')
  await p.waitForTimeout(300)
})
await shot('02-members', async () => {
  await p.click('[aria-label="Toggle member list"]')
  await p.waitForTimeout(300)
})
await shot('03-friends', async () => {
  await home()
})
await shot('04-nitro', async () => {
  await p.click('.dm-nav .row:has-text("Nitro")')
  await p.waitForTimeout(500)
})
await shot('05-quests', async () => {
  await p.click('.dm-nav .row:has-text("Quests")')
  await p.waitForTimeout(500)
})
await shot('06-shop', async () => {
  await p.click('.dm-nav .row:has-text("Shop")')
  await p.waitForTimeout(500)
})
await shot('07-settings', async () => {
  await p.click('[aria-label="User settings"]')
  await p.waitForTimeout(500)
})
await shot('08-profiles', async () => {
  await p.click('.settings-item:has-text("Profiles")')
  await p.waitForTimeout(500)
})
await shot('09-appearance', async () => {
  await p.click('.settings-item:has-text("Appearance")')
  await p.waitForTimeout(400)
})
await shot('10-srvsettings', async () => {
  await p.keyboard.press('Escape')
  await p.waitForTimeout(300)
  await p.click('.server-tile.srv')
  await p.waitForTimeout(300)
  await p.click('.server-header')
  await p.waitForTimeout(300)
  await p.click('.ctx-item:has-text("Server Settings")')
  await p.waitForTimeout(500)
})
await shot('11-roles', async () => {
  await p.click('.settings-item:has-text("Roles")')
  await p.waitForTimeout(400)
})
await shot('12-voice', async () => {
  await p.keyboard.press('Escape')
  await p.waitForTimeout(300)
  await p.click('.row:has-text("General") >> nth=-1')
  await p.waitForTimeout(600)
})
await b.close()
console.log('done')
