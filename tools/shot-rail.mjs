/**
 * The rail with something unread on another server: the pill at its smallest
 * on the tile, and the red mention badge in its corner.
 *
 * The seed has to run *after* the app's first render — it creates the starting
 * server itself, so there is nothing in localStorage to copy until then.
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

await p.evaluate(() => {
  const sk = 'discord-ui:v4:servers'
  const servers = JSON.parse(localStorage.getItem(sk) ?? '[]')
  const other = JSON.parse(JSON.stringify(servers[0]))
  other.id = 'srv-other'
  other.name = 'The Crew'
  other.initials = 'TC'
  other.color = '#3ba55d'
  other.channels = other.channels.map((c, i) => ({ ...c, id: 'other-ch-' + i }))
  servers.push(other)
  localStorage.setItem(sk, JSON.stringify(servers))

  const mk = 'discord-ui:v4:messages'
  const msgs = JSON.parse(localStorage.getItem(mk) ?? '{}')
  const now = Date.now()
  msgs['srv-other/other-ch-0'] = [
    { id: 'm1', author: 'someone', text: 'anyone about?', time: now },
    { id: 'm2', author: 'someone', text: '@Nebula have a look at this', time: now },
    { id: 'm3', author: 'someone', text: '@everyone heads up', time: now },
  ]
  localStorage.setItem(mk, JSON.stringify(msgs))
})
await p.reload()
await p.waitForTimeout(900)
await p.screenshot({ path: process.argv[2] })
console.log(
  'unread:', await p.locator('.server.unread').count(),
  '| badge:', await p.locator('.server-badge').innerText().catch(() => 'none'),
  '| errors:', errs.length ? errs : 'none',
)
await b.close()
