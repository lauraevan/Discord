/**
 * Discord's settings panes do not commit as you type: a field writes to a
 * draft, the unsaved-changes bar comes up, and only Save Changes carries it
 * over. Reset throws the draft away. This drives that on Server Overview.
 */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1558, height: 900 } })
const errs = []
p.on('pageerror', (e) => errs.push(String(e).split('\n')[0]))
await p.addInitScript(readFileSync('tools/session.js', 'utf8'))
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(600)

let fails = 0
const ok = (c, what) => {
  if (!c) {
    fails++
    console.log('FAIL', what)
  }
}

const open = async () => {
  await p.click('.server-header')
  await p.waitForSelector('.ctx-item', { timeout: 3000 })
  await p.click('.ctx-item:has-text("Server Settings")')
  await p.waitForSelector('.settings-layer', { timeout: 3000 })
  await p.waitForTimeout(300)
}

await p.click('.server-tile.srv')
await p.waitForTimeout(300)
await open()

ok(!(await p.locator('.save-bar').count()), 'the bar is down on an untouched pane')

const was = await p.getByLabel('SERVER NAME').inputValue()
await p.getByLabel('SERVER NAME').fill('Renamed server')
await p.waitForSelector('.save-bar', { timeout: 2000 })
ok(
  (await p.locator('.save-bar-text').innerText()) === 'Careful — you have unsaved changes!',
  "the bar carries Discord's own wording",
)
ok(
  (await p.locator('.server-header').innerText()).includes(was),
  'the header still shows the old name — nothing is committed yet',
)

await p.click('.save-reset')
await p.waitForTimeout(200)
ok(!(await p.locator('.save-bar').count()), 'Reset puts the bar back down')
ok((await p.getByLabel('SERVER NAME').inputValue()) === was, 'Reset restores the field')

// now change several fields at once and save them together
await p.getByLabel('SERVER NAME').fill('Renamed server')
await p.locator('.set-radio:has-text("All Messages")').click()
await p.locator('.set-check').first().click()
await p.waitForSelector('.save-bar')
await p.click('.save-go')
await p.waitForTimeout(300)
ok(!(await p.locator('.save-bar').count()), 'saving puts the bar back down')
ok(
  (await p.locator('.server-header').innerText()).includes('Renamed server'),
  'the rename reached the app',
)
const saved = await p.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('discord-ui:v4:servers') ?? '[]')
  const sv = s.find((x) => x.name === 'Renamed server')
  return sv && { notifyLevel: sv.notifyLevel, systemFlags: sv.systemFlags }
})
ok(saved?.notifyLevel === 0, `the radio saved too (got ${JSON.stringify(saved)})`)
ok(saved?.systemFlags === 1, `the checkbox saved as its suppression bit (got ${saved?.systemFlags})`)

// the bar belongs to Overview, not to every pane
await p.getByLabel('SERVER NAME').fill('dirty again')
await p.waitForSelector('.save-bar')
await p.click('.settings-item:has-text("Emoji")')
await p.waitForTimeout(200)
ok(!(await p.locator('.save-bar').count()), 'the bar is hidden on a pane that has no draft')

// the role editor drafts too, across both of its tabs
await p.click('.settings-item:has-text("Roles")')
await p.waitForTimeout(200)
await p.click('.btn-primary:has-text("Create Role")')
await p.waitForSelector('.role-tab.on:has-text("Display")')
ok(!(await p.locator('.save-bar').count()), 'a fresh role editor opens clean')
await p.getByLabel('ROLE NAME').fill('moderator')
await p.waitForSelector('.save-bar', { timeout: 2000 })
await p.click('.role-tab:has-text("Permissions")')
await p.waitForSelector('.perm-group')
ok(await p.locator('.save-bar').count(), 'the draft survives a tab switch')
await p.locator('[aria-label="Administrator"]').click()
await p.click('.save-go')
await p.waitForTimeout(250)
ok(!(await p.locator('.save-bar').count()), 'saving the role puts the bar down')
const role = await p.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('discord-ui:v4:servers') ?? '[]')
  return s.flatMap((x) => x.roles).find((r) => r.name === 'moderator')
})
ok(!!role, 'the role name saved')
ok(role?.permissions?.includes('ADMINISTRATOR'), 'the permission saved with it')

console.log('errors:', errs.length ? errs : 'none')
if (errs.length) fails++
console.log(fails ? `${fails} save-bar check(s) failed` : 'all save-bar checks pass')
await b.close()
process.exit(fails ? 1 : 0)
