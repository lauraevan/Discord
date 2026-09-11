/**
 * Channel reordering in Server Settings. Playwright's mouse cannot drive HTML5
 * drag events, so this dispatches the sequence the browser would: dragstart on
 * the row you pick up, dragover then drop on the row it lands above.
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

await p.click('.server-tile.srv')
await p.waitForTimeout(300)
// two more text channels, so there is an order worth changing
for (const n of ['second', 'third']) {
  await p.click('.category:has-text("Text Channels") .cat-add')
  await p.waitForSelector('.modal input')
  await p.fill('.modal input', n)
  await p.click('.modal .btn-primary')
  await p.waitForTimeout(250)
}
await p.click('.server-header')
await p.waitForSelector('.ctx-item')
await p.click('.ctx-item:has-text("Server Settings")')
await p.waitForSelector('.settings-layer')
await p.click('.settings-item:has-text("Channels")')
await p.waitForTimeout(300)

const names = () => p.locator('.srv-channels li b').allInnerTexts()
const before = await names()
ok(before.join(',') === 'general,second,third,General', `starting order (${before})`)

/** Drag the row at `from` onto the row at `to`, in the same list. */
const dragRow = (from, to) =>
  p.evaluate(
    ([from, to]) => {
      const rows = [...document.querySelectorAll('.srv-channels li')]
      const dt = new DataTransfer()
      const fire = (el, type) =>
        el.dispatchEvent(
          new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dt }),
        )
      fire(rows[from], 'dragstart')
      fire(rows[to], 'dragover')
      fire(rows[to], 'drop')
      fire(rows[from], 'dragend')
    },
    [from, to],
  )

// third above general
await dragRow(2, 0)
await p.waitForTimeout(250)
const after = await names()
ok(after.join(',') === 'third,general,second,General', `dragging reorders (${after})`)

// and it is the real channel list, not just this table
await p.keyboard.press('Escape')
await p.waitForTimeout(300)
const sidebar = await p.locator('.sidebar-scroll .row:not(.nav) .row-name').allInnerTexts()
ok(
  sidebar.slice(0, 3).join(',') === 'third,general,second',
  `the sidebar follows the new order (${sidebar})`,
)

// the array is flat and holds every kind, so read the text run out of it
const stored = await p.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('discord-ui:v4:servers') ?? '[]')
  return s
    .flatMap((x) => x.channels)
    .filter((c) => c.kind === 'text')
    .map((c) => c.name)
})
ok(stored.join(',') === 'third,general,second', `the move persisted (${stored})`)

console.log('errors:', errs.length ? errs : 'none')
if (errs.length) fails++
console.log(fails ? `${fails} channel-drag check(s) failed` : 'all channel-drag checks pass')
await b.close()
process.exit(fails ? 1 : 0)
