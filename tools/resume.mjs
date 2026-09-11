/**
 * The client remembers where you were.
 *
 * Discord reopens the channel you were last in, per server, keeps the
 * categories you collapsed and holds your mute and deafen across a restart.
 * An app that forgets all of that on reload reads as a demo however good the
 * pixels are, so this drives a reload after each and checks what came back.
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
const openChannel = () => p.locator('.sidebar-scroll .row.active .row-name').innerText()

await p.click('.server-tile.srv')
await p.waitForTimeout(300)
// a second text channel to move to
await p.locator('.category:has-text("Text Channels") .cat-add').click()
await p.waitForSelector('.modal input')
await p.fill('.modal input', 'ideas')
await p.click('.modal .btn-primary')
await p.waitForTimeout(300)
await p.click('.sidebar-scroll .row:has-text("ideas")')
await p.waitForTimeout(300)
ok((await openChannel()) === 'ideas', 'moved to the new channel')

await p.reload()
await p.waitForTimeout(800)
ok((await openChannel()) === 'ideas', 'a reload reopens the channel you were in', await openChannel())

// collapsing a category survives too
await p.click('.category:has-text("Voice Channels") .cat-label')
await p.waitForTimeout(250)
const collapsed = await p.locator('.category.collapsed').count()
ok(collapsed === 1, 'the category collapsed', collapsed)
await p.reload()
await p.waitForTimeout(800)
ok(
  (await p.locator('.category.collapsed').count()) === 1,
  'and is still collapsed after a reload',
)

// the mic starts muted, which is what the 1:1 capture shows, and then stays
// wherever the reader puts it
const muteClass = () => p.locator('.user-card .split').first().getAttribute('class')
ok((await muteClass()).includes('on'), 'the mic starts muted, as the capture has it', await muteClass())
await p.click('[aria-label="Toggle mute"]')
await p.waitForTimeout(250)
ok(!(await muteClass()).includes('on'), 'clicking unmutes it')
await p.reload()
await p.waitForTimeout(800)
ok(!(await muteClass()).includes('on'), 'and it is still unmuted after a reload', await muteClass())

// switching servers and back returns to the channel you were in, not the first
await p.click('.server-tile.home, .rail .server-tile >> nth=0')
await p.waitForTimeout(400)
await p.click('.server-tile.srv')
await p.waitForTimeout(400)
ok(
  (await openChannel()) === 'ideas',
  'coming back to a server returns to its own last channel',
  await openChannel(),
)

// and the button Discord floats over a list you have scrolled away from
for (let i = 0; i < 30; i += 1) {
  await p.fill('.composer-input', 'message number ' + (i + 1))
  await p.press('.composer-input', 'Enter')
}
await p.waitForTimeout(500)
ok(!(await p.locator('.jump-present').count()), 'no jump button while the list is at the bottom')
await p.evaluate(() => {
  document.querySelector('.feed').scrollTop = 0
})
await p.waitForTimeout(400)
ok(await p.locator('.jump-present').count(), 'scrolling up floats Jump To Present over the list')
await p.click('.jump-present button')
await p.waitForTimeout(900)
ok(!(await p.locator('.jump-present').count()), 'pressing it takes you back and puts it away')
ok(
  await p.evaluate(() => {
    const el = document.querySelector('.feed')
    return el.scrollHeight - el.scrollTop - el.clientHeight < 4
  }),
  'the list really is back at the newest message',
)

console.log('errors:', errs.length ? errs : 'none')
if (errs.length) fails++
console.log(fails ? `${fails} resume check(s) failed` : 'all resume checks pass')
await b.close()
process.exit(fails ? 1 : 0)
