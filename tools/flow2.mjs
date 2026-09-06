import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1558, height: 860 } })
const errs = []
p.on('pageerror', (e) => errs.push(String(e).split('\n')[0]))
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(400)
const step = async (label, fn) => {
  try { await fn(); console.log('PASS ', label) }
  catch (e) { console.log('FAIL ', label, '\n    ' + String(e).split('\n').slice(0,6).join('\n    ')) }
  await p.keyboard.press('Escape'); await p.mouse.move(700, 300); await p.waitForTimeout(150)
}
const say = async (t) => { await p.click('.composer-input'); await p.fill('.composer-input', t); await p.press('.composer-input','Enter'); await p.waitForTimeout(80) }

// the checklist is up while the server is still as it was created; the tests
// below add channels, which is what retires it
await step('server checklist shows on a fresh server', async () => {
  const n = await p.locator('.onboard-step').count()
  if (n !== 6) throw new Error('expected 6 steps, got ' + n)
})
await step('user settings opens', async () => {
  await p.click('[aria-label="User settings"]')
  await p.waitForSelector('.settings-layer')
  if ((await p.locator('.settings-item').count()) < 25) throw new Error('sidebar too short')
})
await step('appearance: compact mode really applies', async () => {
  await p.click('[aria-label="User settings"]')
  await p.click('.settings-item:has-text("Appearance")')
  await p.click('.set-radio:has-text("Compact")')
  await p.waitForFunction(() => document.body.classList.contains('compact'))
  await p.click('.set-radio:has-text("Cozy")')
})
await step('appearance: font scale drives CSS', async () => {
  await p.click('[aria-label="User settings"]')
  await p.click('.settings-item:has-text("Appearance")')
  await p.locator('[aria-label="Chat Font Scaling"]').fill('20')
  const v = await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--msg-font'))
  if (v.trim() !== '20px') throw new Error('got ' + v)
  await p.locator('[aria-label="Chat Font Scaling"]').fill('16')
})
await step('developer mode adds Copy IDs', async () => {
  await p.click('[aria-label="User settings"]')
  await p.click('.settings-item:has-text("Advanced")')
  await p.click('[aria-label="Developer Mode"]')
  await p.keyboard.press('Escape')
  await p.locator('.sidebar-scroll .row:not(.nav)').first().click({ button: 'right' })
  if (!(await p.locator('.ctx-item:has-text("Copy Channel ID")').count())) throw new Error('no copy id')
})
await step('language pane lists locales', async () => {
  await p.click('[aria-label="User settings"]')
  await p.click('.settings-item:has-text("Language")')
  if ((await p.locator('.locale').count()) < 25) throw new Error('too few locales')
})
await step('keybinds pane', async () => {
  await p.click('[aria-label="User settings"]')
  await p.click('.settings-item:has-text("Keybinds")')
  if ((await p.locator('.keybind').count()) < 10) throw new Error('too few keybinds')
})
await step('server settings: create + edit a role', async () => {
  await p.click('.server-header')
  await p.click('.ctx-item:has-text("Server Settings")')
  await p.click('.settings-item:has-text("Roles")')
  await p.click('.btn-primary:has-text("Create Role")')
  await p.waitForSelector('.perm-group')
  await p.locator('[aria-label="Administrator"]').click()
  await p.click('.back-link')
  if ((await p.locator('.role-row').count()) !== 2) throw new Error('role not created')
})
await step('server settings: audit log recorded it', async () => {
  await p.click('.server-header')
  await p.click('.ctx-item:has-text("Server Settings")')
  await p.click('.settings-item:has-text("Audit Log")')
  if (!(await p.locator('.audit-row').count())) throw new Error('empty audit log')
})
await step('server settings: add an emoji', async () => {
  await p.click('.server-header')
  await p.click('.ctx-item:has-text("Server Settings")')
  await p.click('.settings-item:has-text("Emoji")')
  await p.fill('[aria-label="Search emoji"]', 'fire')
  await p.click('.emoji-result')
  if (!(await p.locator('.emoji-row').count())) throw new Error('emoji not added')
})
await step('server settings: mint an invite', async () => {
  await p.click('.server-header')
  await p.click('.ctx-item:has-text("Server Settings")')
  await p.click('.settings-item:has-text("Invites")')
  await p.click('.btn-primary:has-text("Create Invite")')
  const t = await p.locator('.invite-row code').first().innerText()
  if (!/^discord\.gg\/\w{8}$/.test(t)) throw new Error('bad code ' + t)
})
await step('channel settings: slowmode + topic', async () => {
  await p.locator('.sidebar-scroll .row:not(.nav)').first().hover()
  await p.locator('.sidebar-scroll .row:not(.nav)').first().locator('[aria-label="Edit channel"]').click()
  await p.waitForSelector('.settings-layer')
  await p.locator('[aria-label="Slowmode"]').fill('5')
  if ((await p.locator('.slowmode span').innerText()) !== '1 min') throw new Error('slowmode label wrong')
})
await step('channel context menu has mute submenu', async () => {
  await p.locator('.sidebar-scroll .row:not(.nav)').first().click({ button: 'right' })
  await p.locator('.ctx-item:has-text("Mute Channel")').hover()
  await p.waitForSelector('.ctx-sub')
  if (!(await p.locator('.ctx-sub .ctx-item:has-text("For 15 Minutes")').count())) throw new Error('no durations')
})
// custom status lives inside the status submenu, where Discord keeps it
await step('custom status', async () => {
  await p.click('.user-card .id')
  await p.click('.p-btn:has-text("Online")')
  await p.click('.status-opt:has-text("Set Custom Status")')
  await p.waitForSelector('.status-modal')
  await p.fill('[aria-label="Custom status"]', 'building discord')
  await p.click('.modal-foot .btn-primary')
  await p.waitForTimeout(150)
})
await step('switch accounts panel', async () => {
  await p.click('.user-card .id')
  await p.click('.p-btn:has-text("Switch Accounts")')
  await p.waitForSelector('.accounts')
  await p.keyboard.press('Escape')
  await p.waitForTimeout(120)
})
await step('search filters parse', async () => {
  await say('needle in here')
  await say('haystack')
  await p.fill('.searchbox input', 'has:link needle')
  await p.waitForTimeout(250)
  if (await p.locator('.result').count()) throw new Error('has:link should exclude it')
  await p.fill('.searchbox input', 'from:Nebula needle')
  await p.waitForSelector('.result', { timeout: 2000 })
  await p.fill('.searchbox input', '')
})
await step('search options popover', async () => {
  await p.click('.searchbox input')
  await p.waitForSelector('.search-hints')
  if ((await p.locator('.search-hint').count()) !== 8) throw new Error('wrong filter count')
})
await step('friends page', async () => {
  await p.click('[aria-label="Direct Messages"]')
  await p.waitForSelector('.friends-empty')
  await p.click('.friends-add')
  await p.fill('[aria-label="Username"]', 'someone')
  await p.click('.add-friend-box .btn-primary')
  await p.waitForSelector('.add-friend-note')
})
console.log('\nerrors:', errs.length ? errs : 'none')
await b.close()
