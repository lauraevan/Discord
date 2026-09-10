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
// The capture's account is "bullet", not the fixture's "Nebula". The two
// names render at different widths in the user card and the message row, so
// leaving the fixture as Nebula makes the scorer partly measure a name
// mismatch instead of the layout — the user-card block alone was 50.5.
await p.addInitScript(() => {
  // the display name comes from the credential, so both have to be patched
  const ak = 'discord-ui:v4:account'
  localStorage.setItem(
    ak,
    JSON.stringify({ ...JSON.parse(localStorage.getItem(ak) ?? '{}'), name: 'bullet' }),
  )
  const ck = 'discord-ui:v4:credentials'
  const creds = JSON.parse(localStorage.getItem(ck) ?? '[]')
  localStorage.setItem(ck, JSON.stringify(creds.map((c) => ({ ...c, displayName: 'bullet' }))))
})

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
if (which === 'b251') {
  // the b251 capture has the account popout open over the channel list
  await p.click('.user-card .id')
  await p.waitForTimeout(400)
}
await p.mouse.move(1200, 820)
await p.waitForTimeout(250)
// a sweep hook: DCSS_OVERRIDE is injected as !important CSS, which beats the
// inline custom properties applyTheme writes onto <html>
if (process.env.DCSS_OVERRIDE) {
  await p.addStyleTag({ content: ':root{' + process.env.DCSS_OVERRIDE + '}' })
  await p.waitForTimeout(150)
}
await p.screenshot({ path: out })
if (errs.length) console.log('ERRORS', errs)
await b.close()
