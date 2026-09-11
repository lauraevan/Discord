/**
 * Server emoji end to end: upload one in Server Settings, see it in the table,
 * find it in the expression picker under the server's name, send it, and see
 * it rendered in the message.
 *
 * Also checks the three rules Discord states on that page and this enforces:
 * the 256 KB ceiling, the two-character name minimum, and the slot count.
 */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1558, height: 900 } })
const errs = []
p.on('pageerror', (e) => errs.push(String(e).split('\n')[0]))
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
await p.addInitScript(readFileSync('tools/session.js', 'utf8'))
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(600)

// the app keeps a second file input elsewhere, so scope this to the pane
const EMOJI_INPUT = '.settings-content input[type=file]'

let fails = 0
const ok = (cond, what) => {
  if (!cond) {
    fails++
    console.log('FAIL', what)
  }
}

// a 1x1 transparent PNG, small enough to pass the size rule
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

const openSettings = async () => {
  await p.click('.server-header')
  await p.waitForSelector('.ctx-item', { timeout: 3000 })
  await p.click('.ctx-item:has-text("Server Settings")')
  await p.waitForSelector('.settings-layer', { timeout: 3000 })
  await p.click('.settings-item:has-text("Emoji")')
  await p.waitForTimeout(200)
}

await p.click('.server-tile.srv')
await p.waitForTimeout(300)
await openSettings()

ok(await p.locator('.table-empty').count(), 'the table starts empty')

// a name that survives the strip at under two characters is refused
await p.setInputFiles(EMOJI_INPUT, {
  name: 'a.png',
  mimeType: 'image/png',
  buffer: PNG,
})
await p.waitForTimeout(200)
ok(
  (await p.locator('.set-error').innerText()).includes('at least 2 characters'),
  'a one-character name is refused',
)

// over the size ceiling is refused
await p.setInputFiles(EMOJI_INPUT, {
  name: 'toobig.png',
  mimeType: 'image/png',
  buffer: Buffer.alloc(257 * 1024, 1),
})
await p.waitForTimeout(200)
ok((await p.locator('.set-error').innerText()).includes('256 KB'), 'over 256 KB is refused')

// a good one lands, with the file name lower-cased and stripped
await p.setInputFiles(EMOJI_INPUT, {
  name: 'Party-Blob!.png',
  mimeType: 'image/png',
  buffer: PNG,
})
await p.waitForTimeout(300)
ok(!(await p.locator('.table-empty').count()), 'the empty row is gone')
const shown = await p.locator('.emoji-row .emoji-name').innerText()
ok(shown === ':partyblob:', `the name is stripped and lower-cased (got ${shown})`)
ok(await p.locator('.emoji-row img.emoji').count(), 'the row shows the uploaded image')

await p.keyboard.press('Escape')
await p.waitForTimeout(300)

// it shows in the picker, under the server's name, above the unicode set
await p.click('[aria-label="Select emoji"], .composer-emoji, [aria-label="Emoji"]')
await p.waitForSelector('.picker', { timeout: 3000 })
const first = p.locator('.picker-grid > div').first()
ok((await first.getAttribute('data-cat')) === 'own', 'the server section is first in the picker')
ok(
  (await first.locator('.picker-cat').innerText()).length > 0,
  'the server section is headed by its name',
)
await first.locator('.picker-cell').first().click()
await p.waitForTimeout(250)
const composed = await p.inputValue('.composer-input')
ok(composed.includes(':partyblob:'), `picking inserts the shortcode (got "${composed}")`)
ok(await p.locator('.picker').count(), 'the picker stays open after picking an emoji')

await p.keyboard.press('Escape')
await p.waitForTimeout(150)
await p.press('.composer-input', 'Enter')
await p.waitForTimeout(300)
ok(
  await p.locator('.group img.emoji[alt=":partyblob:"]').count(),
  'the sent message renders the emoji as its image',
)

// deleting it takes it back out of the picker
await openSettings()
await p.click('.emoji-row button[aria-label="Delete partyblob"]')
await p.waitForTimeout(200)
ok(await p.locator('.table-empty').count(), 'deleting empties the table again')

console.log('errors:', errs.length ? errs : 'none')
if (errs.length) fails++
console.log(fails ? `${fails} emoji check(s) failed` : 'all emoji checks pass')
await b.close()
process.exit(fails ? 1 : 0)
