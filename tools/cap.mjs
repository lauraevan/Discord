/**
 * Renders the app into docs/refs/febf1f6c.jpg's own frame — bullet's server as
 * it was created, one message posted, the member list hidden — at the capture's
 * 2x device scale, so the two can be compared pixel for pixel.
 *
 *     node tools/cap.mjs out.png [b251|febf|1aa6]
 */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

const out = process.argv[2] || '/tmp/cap.png'
const which = process.argv[3] || 'febf'
const H = { b251: 884, febf: 882, '1aa6': 882 }[which] ?? 882

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1366, height: H }, deviceScaleFactor: 2 })
await p.addInitScript(readFileSync('tools/session.js', 'utf8'))
await p.addInitScript(() => {
  localStorage.setItem('discord-ui:v4:sidebar', '303')
  localStorage.setItem(
    'discord-ui:v4:servers',
    JSON.stringify([
      {
        id: 's0', name: "bullet's server", initials: 'bs', color: '#5865f2',
        categories: [{ id: 'text', name: 'Text Channels' }, { id: 'voice', name: 'Voice Channels' }],
        channels: [
          { id: 'c0', name: 'general', kind: 'text', categoryId: 'text' },
          { id: 'c1', name: 'General', kind: 'voice', categoryId: 'voice' },
        ],
        roles: [], emojis: [], invites: [], bans: [], audit: [], notifyLevel: 1, boostTier: 0,
      },
    ]),
  )
})
const errs = []
p.on('pageerror', (e) => errs.push(String(e).split('\n')[0]))
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(700)
if (which !== 'b251') {
  await p.click('.composer-input')
  await p.fill('.composer-input', 'hello')
  await p.press('.composer-input', 'Enter')
  await p.waitForTimeout(150)
  await p.fill('.composer-input', 'hey claude this is a reference')
  await p.press('.composer-input', 'Enter')
  await p.waitForTimeout(250)
}
await p.mouse.move(1200, 820)
await p.waitForTimeout(250)
await p.screenshot({ path: out })
if (errs.length) console.log('ERRORS', errs)
await b.close()
