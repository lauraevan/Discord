/**
 * Escape closes it.
 *
 * Every popout, menu, panel and modal in Discord goes away on Escape, and a
 * surface that does not is the kind of thing that reads as unfinished the
 * first time a reader reaches for the key. The composer's plus menu was one:
 * it only closed on a click away, and that click was swallowed closing it.
 */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1558, height: 900 } })
const errs = []
p.on('pageerror', (e) => errs.push(String(e).split('\n')[0]))
await p.addInitScript(readFileSync('tools/session.js', 'utf8'))
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(700)
await p.click('.server-tile.srv')
await p.waitForTimeout(400)

let fails = 0
/** Open it, check it is there, press Escape, check it is gone. */
const closes = async (what, selector, open) => {
  try {
    await open()
    await p.waitForSelector(selector, { timeout: 4000 })
    await p.keyboard.press('Escape')
    await p.waitForTimeout(400)
    const left = await p.locator(selector).count()
    if (left) {
      fails++
      console.log('FAIL', what, '— still open after Escape')
      // leave the page in a usable state for the next case
      await p.mouse.click(780, 320)
      await p.waitForTimeout(300)
    }
  } catch (e) {
    fails++
    console.log('FAIL', what, '—', String(e).split('\n')[0].slice(0, 80))
  }
}

await closes('the composer plus menu', '.plus-menu', () =>
  p.click('[aria-label="Upload a file"]'),
)
await closes('the expression picker', '.picker', () => p.click('[aria-label="Emoji"]'))
await closes('the quick switcher', '.switcher', () => p.keyboard.press('Control+k'))
await closes('a channel context menu', '.ctx', () =>
  p.locator('.sidebar-scroll .row:not(.nav)').first().click({ button: 'right' }),
)
await closes('the server menu', '.ctx', () => p.click('.server-header'))
// the status menu hangs off the profile popout, which the user card opens
await closes('the profile popout', '.popout', () => p.click('.user-card .id'))
await closes('the status menu', '.status-menu', async () => {
  await p.click('.user-card .id')
  await p.waitForSelector('.popout')
  await p.click('.popout .pop-status, .popout button:has-text("Online")')
})
await closes('the inbox', '.inbox', () => p.click('[aria-label="Inbox"]'))
await closes('user settings', '.settings-layer', () => p.click('[aria-label="User settings"]'))
await closes('a select popout', '.dd-popout', async () => {
  await p.click('.server-header')
  await p.waitForSelector('.ctx-item')
  await p.click('.ctx-item:has-text("Server Settings")')
  await p.waitForSelector('.settings-layer')
  await p.waitForTimeout(300)
  await p.locator('.dd-control').first().click()
})
// and Escape again leaves the settings layer the select was inside
await p.keyboard.press('Escape')
await p.waitForTimeout(400)
if (await p.locator('.settings-layer').count()) {
  fails++
  console.log('FAIL the settings layer — still open after a second Escape')
  await p.keyboard.press('Escape')
  await p.waitForTimeout(300)
}

await closes('the threads panel', '.threads-panel', () => p.click('[aria-label="Threads"]'))
await closes('the pins panel', '.pins', () => p.click('[aria-label="Pinned messages"]'))

console.log('errors:', errs.length ? errs : 'none')
if (errs.length) fails++
console.log(fails ? `${fails} Escape check(s) failed` : 'every popout closes on Escape')
await b.close()
process.exit(fails ? 1 : 0)
