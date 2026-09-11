/**
 * Unread and mentions.
 *
 * Discord shows a server with something unread as the rail pill at its
 * smallest, counts the messages that mention you in a red badge on the tile,
 * and washes the message itself amber with a bar down its left edge. None of
 * that existed here — MdContext even carried a `self` field nothing read.
 *
 * The second server has to be seeded after the first render: the app creates
 * its own starting server, so there is nothing to copy before then.
 */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1558, height: 900 } })
const errs = []
p.on('pageerror', (e) => errs.push(String(e).split('\n')[0]))
await p.addInitScript(readFileSync('tools/session.js', 'utf8'))
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(800)

let fails = 0
const ok = (c, what, got) => {
  if (!c) {
    fails++
    console.log('FAIL', what, got === undefined ? '' : '\n    got: ' + JSON.stringify(got))
  }
}

const seed = (texts) =>
  p.evaluate((texts) => {
    const sk = 'discord-ui:v4:servers'
    const servers = JSON.parse(localStorage.getItem(sk) ?? '[]')
    if (!servers.some((s) => s.id === 'srv-other')) {
      const other = JSON.parse(JSON.stringify(servers[0]))
      other.id = 'srv-other'
      other.name = 'The Crew'
      other.initials = 'TC'
      other.color = '#3ba55d'
      other.channels = other.channels.map((c, i) => ({ ...c, id: 'other-ch-' + i }))
      servers.push(other)
      localStorage.setItem(sk, JSON.stringify(servers))
    }
    const mk = 'discord-ui:v4:messages'
    const msgs = JSON.parse(localStorage.getItem(mk) ?? '{}')
    const now = Date.now()
    msgs['srv-other/other-ch-0'] = texts.map((text, i) => ({
      id: 'm' + i,
      author: 'someone',
      text,
      time: now,
    }))
    localStorage.setItem(mk, JSON.stringify(msgs))
  }, texts)

await seed(['anyone about?', '@Nebula have a look at this', '@everyone heads up'])
await p.reload()
await p.waitForTimeout(900)

const other = p.locator('.server:has(.server-tile:has-text("TC"))')
ok(await other.evaluate((el) => el.classList.contains('unread')), 'the unread server takes the pill')
ok(
  !(await p
    .locator('.server:has(.server-tile:has-text("NS"))')
    .evaluate((el) => el.classList.contains('unread'))),
  'the server you are reading does not',
)
ok((await p.locator('.server-badge').innerText()) === '2', 'the badge counts both mentions', await p.locator('.server-badge').innerText())

// opening the server reads it, which clears both
await other.locator('.server-tile').click()
await p.waitForTimeout(600)
ok(!(await p.locator('.server-badge').count()), 'opening the server clears the badge')

// and the messages that mention you are washed, the ones that do not are plain
const groups = p.locator('.group')
ok((await groups.count()) >= 3, 'all three landed', await groups.count())
const marked = await p.locator('.group.mentioned').count()
ok(marked === 2, 'exactly the two mentions are marked', marked)
ok(
  !(await groups.first().evaluate((el) => el.classList.contains('mentioned'))),
  'the plain message is not',
)
ok(
  (await p.locator('.group.mentioned .md-mention').count()) >= 2,
  '@everyone is a pill, not plain text',
)

// your own message never mentions you, however you write it
await p.fill('.composer-input', '@Nebula @everyone talking to myself')
await p.press('.composer-input', 'Enter')
await p.waitForTimeout(400)
ok(
  (await p.locator('.group.mentioned').count()) === 2,
  'a message you sent yourself is never a mention of you',
  await p.locator('.group.mentioned').count(),
)

console.log('errors:', errs.length ? errs : 'none')
if (errs.length) fails++
console.log(fails ? `${fails} unread check(s) failed` : 'all unread checks pass')
await b.close()
process.exit(fails ? 1 : 0)
