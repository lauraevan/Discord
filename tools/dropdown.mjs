/**
 * The app's own combobox. A native <select> would be the operating system's
 * dropdown, which is the loudest tell that a page is not the client, so every
 * one of them is Discord's instead — and being ours, it has to earn the
 * keyboard a native select gave away for free.
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
const ok = (c, what, got) => {
  if (!c) {
    fails++
    console.log('FAIL', what, got === undefined ? '' : '\n    got: ' + JSON.stringify(got))
  }
}

await p.click('.server-tile.srv')
await p.waitForTimeout(300)
await p.click('.server-header')
await p.waitForSelector('.ctx-item')
await p.click('.ctx-item:has-text("Server Settings")')
await p.waitForSelector('.settings-layer')
await p.waitForTimeout(400)

// the app ships no native dropdowns at all
ok(
  (await p.locator('select').count()) === 0,
  'no native <select> survives anywhere in the layer',
)

const timeout = p.locator('.dd').filter({ has: p.locator('[aria-label="Inactive Timeout"]') })
const control = timeout.locator('.dd-control')

ok((await control.getAttribute('role')) === 'combobox', 'the control is a combobox')
ok((await control.getAttribute('aria-expanded')) === 'false', 'and starts closed')
ok((await control.innerText()).trim() === '5 Minutes', 'showing the current value')

await control.click()
await p.waitForSelector('.dd-popout')
ok((await control.getAttribute('aria-expanded')) === 'true', 'clicking opens it')
const opts = await p.locator('.dd-popout [role="option"]').allInnerTexts()
ok(opts.length === 5, "it lists Discord's five timeouts", opts)
ok(
  (await p.locator('.dd-popout [role="option"][aria-selected="true"]').innerText()) === '5 Minutes',
  'with the current one marked selected',
)

// a click outside closes it without changing anything
await p.mouse.click(1450, 500)
await p.waitForTimeout(200)
ok(!(await p.locator('.dd-popout').count()), 'clicking away closes it')
ok((await control.innerText()).trim() === '5 Minutes', 'and commits nothing')

// the keyboard drives it: open, walk, commit
await control.focus()
await p.keyboard.press('Enter')
await p.waitForSelector('.dd-popout')
await p.keyboard.press('ArrowDown')
await p.keyboard.press('Enter')
await p.waitForTimeout(200)
ok((await control.innerText()).trim() === '15 Minutes', 'arrow down then Enter commits the next')

// Escape closes without committing
await p.keyboard.press('Enter')
await p.waitForSelector('.dd-popout')
await p.keyboard.press('ArrowDown')
await p.keyboard.press('Escape')
await p.waitForTimeout(200)
ok(!(await p.locator('.dd-popout').count()), 'Escape closes it')
ok((await control.innerText()).trim() === '15 Minutes', 'and leaves the value alone')

// type-ahead jumps to the option starting with what you typed
await p.keyboard.press('Enter')
await p.waitForSelector('.dd-popout')
await p.keyboard.press('3')
await p.keyboard.press('Enter')
await p.waitForTimeout(200)
ok((await control.innerText()).trim() === '30 Minutes', 'typing a character jumps to its option')

// Home and End reach the ends
await p.keyboard.press('Enter')
await p.waitForSelector('.dd-popout')
await p.keyboard.press('End')
await p.keyboard.press('Enter')
await p.waitForTimeout(200)
ok((await control.innerText()).trim() === '1 Hour', 'End reaches the last option')
await p.keyboard.press('Enter')
await p.waitForSelector('.dd-popout')
await p.keyboard.press('Home')
await p.keyboard.press('Enter')
await p.waitForTimeout(200)
ok((await control.innerText()).trim() === '1 Minute', 'Home reaches the first')

// and the whole thing was a draft — the save bar is up and the server is not
// changed until it is pressed
ok(await p.locator('.save-bar').count(), 'all of that went into the draft, not the server')

// the popouts are portalled to the body, so a modal's overflow cannot cut
// them in half — which it did while they were absolute inside the field
// out of the settings layer first — Events is a sidebar row behind it, and
// the draft left open above would swallow the clicks
await p.keyboard.press('Escape')
await p.waitForTimeout(200)
await p.keyboard.press('Escape')
await p.waitForSelector('.settings-layer', { state: 'detached', timeout: 4000 })
await p.waitForTimeout(300)
await p.click('.row.nav:has-text("Events")')
await p.waitForSelector('.events')
await p.click('.events-head .btn-primary:has-text("Create Event")')
await p.waitForSelector('.modal')
await p.waitForTimeout(300)
ok(
  (await p.locator('.modal input[type="datetime-local"], .modal select').count()) === 0,
  'the event form has no browser-drawn date or select control',
)
const dateField = p.locator('.dpick .dd-control[aria-label="Start Date"]')
await dateField.click()
await p.waitForSelector('.dpick-popout')
const cal = await p.locator('.dpick-popout').boundingBox()
const modal = await p.locator('.modal').boundingBox()
ok(
  cal.y >= 0 && cal.y + cal.height <= 900 + 1,
  'the calendar is on screen in full',
  { cal, modal },
)
ok((await p.locator('.dpick-day').count()) === 42, 'it lays out six full weeks')
ok((await p.locator('.dpick-day.today').count()) === 1, 'today is marked')
ok((await p.locator('.dpick-day:disabled').count()) > 0, 'days before today are dead')
const before = await dateField.innerText()
await p.click('[aria-label="Next month"]')
await p.waitForTimeout(150)
await p.locator('.dpick-day:not(.outside):not(:disabled)').nth(9).click()
await p.waitForTimeout(200)
ok(!(await p.locator('.dpick-popout').count()), 'picking a day closes the calendar')
ok((await dateField.innerText()) !== before, 'and the field takes the new date')

console.log('errors:', errs.length ? errs : 'none')
if (errs.length) fails++
console.log(fails ? `${fails} dropdown check(s) failed` : 'all dropdown checks pass')
await b.close()
process.exit(fails ? 1 : 0)
