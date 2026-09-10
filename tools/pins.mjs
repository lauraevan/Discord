/**
 * Pinning against Discord's own rules.
 *
 * Every string asserted here is Discord's, taken from two sources: the Pin
 * Messages FAQ (support article 221421867, mirrored by
 * Wumpus-Central/blog-tracker) for the behaviour, and Discord's shipped
 * client string table (docs/sources/discord-strings.json) for the exact copy.
 * `tools/strings.py has "..."` verifies any line quoted below.
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
await p.waitForTimeout(800)

// a fresh channel starts empty, so post something to pin
await p.click('.composer-input')
await p.fill('.composer-input', 'the one worth keeping')
await p.press('.composer-input', 'Enter')
await p.waitForTimeout(300)

/** Right-clicks the last real message and returns the menu's item labels. */
async function menu() {
  await p.locator('.group').last().click({ button: 'right' })
  await p.waitForTimeout(250)
  return (await p.locator('.ctx').innerText()).split('\n').map((s) => s.trim())
}

// --- pinning asks first ---------------------------------------------------
let items = await menu()
check('the message menu offers Pin Message', items.includes('Pin Message'), items)
await p.locator('.ctx-item:has-text("Pin Message")').click()
await p.waitForTimeout(300)

// "A confirmation dialog will appear. Press Oh yeah. Pin it to confirm."
const title = (await p.locator('.modal-head h3').innerText()).trim()
check('the pin confirmation is Discord\'s', title === 'Pin It. Pin It Good.', title)
const body = (await p.locator('.confirm-body').innerText()).trim()
check(
  'the confirmation names the channel',
  /^Hey, just double checking that you want to pin this message to #\S+ for posterity and greatness\?$/.test(body),
  body,
)
const btns = await p.locator('.modal-foot button').allInnerTexts()
check('its buttons are Cancel and Oh yeah. Pin it', btns.join('|') === 'Cancel|Oh yeah. Pin it', btns)

// cancelling really cancels
await p.locator('.modal-foot button:has-text("Cancel")').click()
await p.waitForTimeout(250)
check('cancelling pins nothing', (await p.locator('.group.pinned').count()) === 0)

// --- confirming pins, and posts the system row ----------------------------
await menu()
await p.locator('.ctx-item:has-text("Pin Message")').click()
await p.waitForTimeout(200)
await p.locator('.modal-foot button:has-text("Oh yeah. Pin it")').click()
await p.waitForTimeout(400)
check('confirming pins the message', (await p.locator('.group.pinned').count()) === 1)
const sys = await p.locator('.system-msg').last().innerText()
check('a system message announces the pin', /pinned a message to this channel/.test(sys), sys)

// "This message is a system message and cannot be pinned."
await p.locator('.system-msg').last().click({ button: 'right' })
await p.waitForTimeout(250)
const sysMenu = (await p.locator('.ctx').count()) ? await p.locator('.ctx').innerText() : ''
if (sysMenu.includes('Pin Message')) {
  await p.locator('.ctx-item:has-text("Pin Message")').click()
  await p.waitForTimeout(300)
  const t = (await p.locator('.modal-head h3').innerText()).trim()
  const msg = (await p.locator('.modal-body').innerText()).trim()
  check('a system message refuses to pin', t === 'The Pin Broke' && msg === 'This message is a system message and cannot be pinned.', t + ' / ' + msg)
  await p.locator('.modal-foot button').click()
} else {
  check('a system message offers no Pin Message', !sysMenu.includes('Pin Message'), sysMenu)
}
await p.keyboard.press('Escape')
await p.waitForTimeout(200)

// --- the pins panel -------------------------------------------------------
await p.locator('.chat-tools [aria-label="Pinned messages"]').click()
await p.waitForTimeout(350)
check('the panel is titled Pinned Messages', (await p.locator('.pins-head span').innerText()).trim() === 'Pinned Messages')
check('the pin has a Jump button', (await p.locator('.pin-actions button:has-text("Jump")').count()) === 1)
check('the pin has an X, not an Unpin label', (await p.locator('.pin-remove').count()) === 1 && (await p.locator('.pin-actions button:has-text("Unpin")').count()) === 0)

// clicking the X asks first — "The Pin Is Stuck!"
await p.locator('.pin-remove').first().click()
await p.waitForTimeout(300)
const ut = (await p.locator('.modal-head h3').innerText()).trim()
const ub = (await p.locator('.confirm-body').innerText()).trim()
check('removing a pin asks first', ut === 'The Pin Is Stuck!' && ub === 'You sure you want to remove this pinned message?', ut + ' / ' + ub)
await p.locator('.modal-foot button:has-text("Cancel")').click()
await p.waitForTimeout(250)
check('cancelling keeps the pin', (await p.locator('.group.pinned').count()) === 1)

// "To skip the confirmation prompt ... hold Shift and select the X icon"
await p.locator('.pin-remove').first().click({ modifiers: ['Shift'] })
await p.waitForTimeout(350)
check('shift-clicking the X skips the prompt', (await p.locator('.modal-head').count()) === 0)
check('shift-clicking the X unpins', (await p.locator('.group.pinned').count()) === 0)

// the empty state is Discord's
const empty = (await p.locator('.pins-empty').innerText()).replace(/\s+/g, ' ').trim()
check(
  'the empty state is Discord\'s copy',
  empty === "This channel doesn’t have any pinned messages... yet. Users with the 'Pin Messages' permission can pin a message from its context menu.",
  empty,
)

await b.close()
console.log(fails ? `\n${fails} failure(s)` : '\nall pin checks pass')
process.exit(fails ? 1 : 0)
