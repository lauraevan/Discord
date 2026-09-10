/**
 * The keyboard shortcuts, which User Settings lists sixteen of.
 *
 * Only four used to work; the rest were listed as if they did. These are the
 * ones this app can honestly serve, each on Discord's own binding out of
 * src/prefs.ts — which is Discord's keybind table, ids and all.
 *
 * The two left unbound are Navigate Back and Navigate Forward, which need a
 * route history this page does not keep.
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
await p.waitForSelector('.composer-input', { timeout: 15000 })
const away = async () => { await p.keyboard.press('Escape'); await p.waitForTimeout(250) }

// Ctrl+K — Quick Switcher
await p.keyboard.press('Control+k')
await p.waitForTimeout(300)
check('Ctrl+K opens the Quick Switcher', (await p.locator('.switcher').count()) === 1)
await away()

// Ctrl+Shift+M / Ctrl+Shift+D — mute and deafen
const micState = () => p.locator('.user-card .split').first().getAttribute('class')
const before = await micState()
await p.keyboard.press('Control+Shift+m')
await p.waitForTimeout(250)
check('Ctrl+Shift+M toggles mute', (await micState()) !== before, await micState())
await p.keyboard.press('Control+Shift+m')
await p.waitForTimeout(250)

const deafState = () => p.locator('.user-card .split').nth(1).getAttribute('class')
const dBefore = await deafState()
await p.keyboard.press('Control+Shift+d')
await p.waitForTimeout(250)
check('Ctrl+Shift+D toggles deafen', (await deafState()) !== dBefore, await deafState())
await p.keyboard.press('Control+Shift+d')
await p.waitForTimeout(250)

// Ctrl+Shift+S — streamer mode paints a class on <body>
await p.keyboard.press('Control+Shift+s')
await p.waitForTimeout(300)
check('Ctrl+Shift+S turns on Streamer Mode', await p.evaluate(() => document.body.classList.contains('streamer')))
await p.keyboard.press('Control+Shift+s')
await p.waitForTimeout(300)
check('and off again', !(await p.evaluate(() => document.body.classList.contains('streamer'))))

// Ctrl+Shift+N — Create Server
await p.keyboard.press('Control+Shift+n')
await p.waitForTimeout(400)
check('Ctrl+Shift+N opens Create Server', (await p.locator('.overlay').count()) >= 1)
await away()

// Ctrl+E — the emoji picker
await p.keyboard.press('Control+e')
await p.waitForTimeout(400)
check('Ctrl+E opens the emoji picker', (await p.locator('.picker').count()) === 1)
await away()

// Ctrl+F — focus the header search
await p.keyboard.press('Control+f')
await p.waitForTimeout(300)
check('Ctrl+F focuses the search box', await p.evaluate(() => document.activeElement?.getAttribute('aria-label') === 'Search'))
await p.evaluate(() => (document.activeElement instanceof HTMLElement) && document.activeElement.blur())

// Shift+PageUp — Jump to First Unread Message.
//
// Rather than seeding storage (the app saves its in-memory messages back on
// every change, so a post-mount write is a race with its own save effect),
// this uses the app's own Mark Unread: send two messages, mark the first
// unread, then jump. jumpTo flashes the row it lands on, which is the proof.
await p.click('.composer-input')
await p.fill('.composer-input', 'the one to land on')
await p.press('.composer-input', 'Enter')
await p.waitForTimeout(300)
await p.fill('.composer-input', 'and one after it')
await p.press('.composer-input', 'Enter')
await p.waitForTimeout(300)

const target = p.locator('.group').nth(-2)
const targetId = await target.evaluate((el) => el.closest('[data-msg]')?.getAttribute('data-msg'))
await target.click({ button: 'right' })
await p.waitForSelector('.ctx', { timeout: 10000 })
await p.locator('.ctx-item:has-text("Mark Unread")').click()
await p.waitForTimeout(400)

await p.evaluate(() => (document.activeElement instanceof HTMLElement) && document.activeElement.blur())
await p.keyboard.press('Shift+PageUp')
await p.waitForTimeout(500)
check(
  'Shift+Page Up jumps to the first unread',
  (await p.locator(`[data-msg="${targetId}"].flash`).count()) === 1,
  await p.locator('[data-msg].flash').count(),
)

await b.close()
console.log(fails ? `\n${fails} failure(s)` : '\nall keybind checks pass')
process.exit(fails ? 1 : 0)
