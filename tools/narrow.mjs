/**
 * The app at Discord's own minimum window.
 *
 * Discord's desktop client will not go below 940x500, so that is the width
 * this has to hold without the page scrolling sideways. It did not: the chat
 * header's right-hand group was a fixed 402 wide whatever the window was,
 * because a flex item will not shrink below its content unless it is told it
 * may. Discord's search box shrinks — `width: clamp(var(--space-64), 100cqi -
 * 320px, 244px)` — and now so does this one.
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
await p.waitForTimeout(300)

let fails = 0
const ok = (c, what, got) => {
  if (!c) {
    fails++
    console.log('FAIL', what, got === undefined ? '' : '\n    got: ' + JSON.stringify(got))
  }
}

for (const width of [1558, 1366, 1100, 940]) {
  await p.setViewportSize({ width, height: 700 })
  await p.waitForTimeout(400)
  const o = await p.evaluate(() => ({
    doc: document.documentElement.scrollWidth,
    win: window.innerWidth,
    search: Math.round(document.querySelector('.searchbox').getBoundingClientRect().width),
    composer: !!document.querySelector('.composer-input'),
  }))
  ok(o.doc <= o.win, `no sideways scroll at ${width}`, o)
  ok(o.composer, `the composer is still there at ${width}`)
  // the box shrinks rather than pushing the page wide, and never past its floor
  ok(o.search >= 63 && o.search <= 245, `the search box stays in range at ${width}`, o.search)
}

// and it grows back
await p.setViewportSize({ width: 1558, height: 900 })
await p.waitForTimeout(400)
ok(
  Math.round(await p.locator('.searchbox').evaluate((e) => e.getBoundingClientRect().width)) === 244,
  'back at full width the box is Discord\'s 244 again',
  await p.locator('.searchbox').evaluate((e) => Math.round(e.getBoundingClientRect().width)),
)

console.log('errors:', errs.length ? errs : 'none')
if (errs.length) fails++
console.log(fails ? `${fails} narrow-window check(s) failed` : 'all narrow-window checks pass')
await b.close()
process.exit(fails ? 1 : 0)
