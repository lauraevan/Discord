/**
 * The four rows above the channel list, which used to be inert.
 *
 * Discord makes all four real surfaces: Events and Browse Channels open over
 * the message list, Members and Server Boosts open Server Settings straight
 * onto their own pane. Every label asserted here is Discord's own, out of
 * docs/sources/discord-strings.json — "Upcoming Server Events", "There are no
 * upcoming events.", "Create Event", "Browse Channels", "Search Channels",
 * "Interested", "Hide Muted Channels".
 */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
let fails = 0
const check = (label, ok, got) => {
  if (ok) console.log('PASS ', label)
  else { fails += 1; console.log('FAIL ', label, '\n    got:', JSON.stringify(got)) }
}

const p = await b.newPage({ viewport: { width: 1366, height: 882 } })
await p.addInitScript(readFileSync('tools/session.js', 'utf8'))
p.on('pageerror', (e) => { fails += 1; console.log('FAIL  page error\n    ', String(e).split('\n')[0]) })
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForSelector('.nav-block', { timeout: 15000 })

// Browse Channels and Members only appear once the server has grown past the
// two channels it was created with — both reference frames agree on that — so
// add a third before asserting on them.
await p.locator('.cat-add').first().click()
await p.waitForSelector('.modal', { timeout: 10000 })
await p.fill('.modal .field, .modal input[type="text"]', 'ideas')
await p.locator('.modal-foot .btn-primary').click()
await p.waitForSelector('.row.nav:has-text("Browse Channels")', { timeout: 10000 })

// --- Events ---------------------------------------------------------------
await p.locator('.row.nav:has-text("Events")').click()
await p.waitForSelector('.events', { timeout: 10000 })
check('Events opens', (await p.locator('.events-head h2').innerText()).trim() === 'Upcoming Server Events')
check('and is empty to start', (await p.locator('.events-empty').innerText()).includes('There are no upcoming events.'))

await p.locator('.events-head .btn-primary:has-text("Create Event")').click()
await p.waitForSelector('.modal', { timeout: 10000 })
check('Create Event opens a form', (await p.locator('.modal-head h3').innerText()).trim() === 'Create Event')
check('the form offers Somewhere Else', (await p.locator('.modal select option:has-text("Somewhere Else")').count()) === 1)
await p.fill('.modal .set-field input', 'Launch Party')
await p.locator('.modal-foot .btn-primary').click()
await p.waitForSelector('.event-card', { timeout: 10000 })
check('the event lands on the list', (await p.locator('.event-card h3').innerText()).trim() === 'Launch Party')

await p.locator('.event-acts .btn-ghost:has-text("Interested")').click()
await p.waitForTimeout(250)
check('Interested counts the RSVP', (await p.locator('.event-count').innerText()).trim() === '1 interested')

await p.locator('.events-close').click()
await p.waitForSelector('.composer-input', { timeout: 10000 })
check('closing returns to the channel', (await p.locator('.events').count()) === 0)

// --- Browse Channels ------------------------------------------------------
// it only appears once the server has grown past its first two channels
const browse = p.locator('.row.nav:has-text("Browse Channels")')
if (await browse.count()) {
  await browse.click()
  await p.waitForSelector('.browse', { timeout: 10000 })
  check('Browse Channels opens', (await p.locator('.browse-head h2').innerText()).trim() === 'Browse Channels')
  const rows = await p.locator('.browse-row').count()
  check('it lists the server\'s channels', rows > 0, rows)
  await p.fill('[aria-label="Search Channels"]', 'zzzznope')
  await p.waitForTimeout(250)
  check('search filters it', (await p.locator('.browse-row').count()) === 0)
  await p.fill('[aria-label="Search Channels"]', '')
  await p.waitForTimeout(250)
  await p.locator('.browse-row').first().click()
  await p.waitForSelector('.composer-input', { timeout: 10000 })
  check('picking a channel opens it', (await p.locator('.browse').count()) === 0)
} else {
  check('Browse Channels row present', false, 'row missing')
}

// --- Members and Server Boosts open Server Settings ------------------------
for (const [row, pane] of [['Members', 'Members'], ['Server Boosts', 'Server Boost Status']]) {
  await p.locator(`.row.nav:has-text("${row}")`).click()
  await p.waitForSelector('.settings-layer, .set-nav, .settings-nav', { timeout: 10000 }).catch(() => {})
  await p.waitForTimeout(400)
  const on = await p.locator('.set-item.on, .settings-item.on').first().innerText().catch(() => '')
  check(`${row} opens Server Settings on ${pane}`, on.trim() === pane, on)
  await p.keyboard.press('Escape')
  await p.waitForTimeout(400)
}

// --- Hide Muted Channels --------------------------------------------------
const before = await p.locator('.sidebar-scroll .row:not(.nav)').count()
await p.locator('.server-header').click()
await p.waitForSelector('.ctx', { timeout: 10000 })
const menu = (await p.locator('.ctx').innerText()).split('\n').map((s) => s.trim())
check('the server menu offers Hide Muted Channels', menu.includes('Hide Muted Channels'), menu)
check('and Mute Server and Report Raid', menu.includes('Mute Server') && menu.includes('Report Raid'), menu)
await p.keyboard.press('Escape')
await p.waitForTimeout(200)
check('the channel list is intact', (await p.locator('.sidebar-scroll .row:not(.nav)').count()) === before)

// --- Notification settings, which used to be four dead menu rows -----------
await p.locator('.chat-tools [aria-label="Notification settings"]').click()
await p.waitForSelector('.ctx', { timeout: 10000 })
const levels = (await p.locator('.ctx').innerText()).split('\n').map((s) => s.trim())
check(
  "the bell opens Discord's four levels",
  ['Use Server Default', 'All Messages', 'Only @mentions', 'Nothing'].every((x) => levels.includes(x)),
  levels,
)
check(
  'with the server default ticked',
  (await p.locator('.ctx-item.checked:has-text("Use Server Default")').count()) === 1,
)
await p.locator('.ctx-item:has-text("Nothing")').click()
await p.waitForTimeout(300)
await p.locator('.chat-tools [aria-label="Notification settings"]').click()
await p.waitForSelector('.ctx', { timeout: 10000 })
check(
  'picking a level moves the tick onto it',
  (await p.locator('.ctx-item.checked:has-text("Nothing")').count()) === 1 &&
    (await p.locator('.ctx-item.checked:has-text("Use Server Default")').count()) === 0,
  await p.locator('.ctx-item.checked').allInnerTexts(),
)
await p.keyboard.press('Escape')
await p.waitForTimeout(200)

// --- the Audit Log, which now records channels and filters ----------------
await p.locator('.server-header').click()
await p.waitForSelector('.ctx', { timeout: 10000 })
await p.locator('.ctx-item:has-text("Server Settings")').click()
await p.waitForSelector('.settings-item, .set-item', { timeout: 10000 })
await p.locator('.settings-item:has-text("Audit Log"), .set-item:has-text("Audit Log")').first().click()
await p.waitForTimeout(400)

const logged = (await p.locator('.audit-row').allInnerTexts()).join(' | ')
check('creating a channel is audited', /channel created/i.test(logged), logged)
check(
  'and the pane names Discord\'s 45-day retention',
  (await p.locator('.settings-pane').first().innerText()).includes('45 days'),
)
const actions = await p.locator('.audit-filter select').nth(1).locator('option').allInnerTexts()
check('Filter by Action lists what happened', actions[0] === 'All Actions' && actions.length > 1, actions)
const all = await p.locator('.audit-row').count()
await p.locator('.audit-filter select').nth(1).selectOption({ index: 1 })
await p.waitForTimeout(300)
const some = await p.locator('.audit-row').count()
check('and filtering narrows the list', some > 0 && some <= all, { all, some })
await p.keyboard.press('Escape')
await p.waitForTimeout(400)

await b.close()
console.log(fails ? `\n${fails} failure(s)` : '\nall server-nav checks pass')
process.exit(fails ? 1 : 0)
