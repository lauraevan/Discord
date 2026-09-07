/**
 * Puts the app into the reference frame's exact state — two servers in the
 * rail, member list hidden, the ok-ui-test channel open — and screenshots at
 * 1558x743. Pass "popout" to open the profile popout as the reference has it.
 */
import { chromium } from 'playwright'
import { readFileSync as __readSession } from 'node:fs'
const out = process.argv[2] || 'ref.png'
const popout = process.argv[3] === 'popout'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1558, height: 743 }, deviceScaleFactor: 1 })
await p.addInitScript(__readSession('tools/session.js', 'utf8'))
const errs = []
p.on('pageerror', (e) => errs.push(String(e).split('\n')[0]))
await p.addInitScript(() => {
  // two servers, the second selected, matching the reference rail
  localStorage.setItem(
    'discord-ui:v4:servers',
    JSON.stringify([
      { id: 's0', name: 'The Crew', initials: 'TC', color: '#3ba55d',
        categories: [{ id: 'text', name: 'Text Channels' }], channels: [{ id: 'c0', name: 'general', kind: 'text', categoryId: 'text' }],
        roles: [], emojis: [], invites: [], bans: [], audit: [], notifyLevel: 1, boostTier: 0 },
      { id: 's1', name: "Nebula's Server", initials: 'NS', color: '#5865f2',
        categories: [{ id: 'text', name: 'Text Channels' }, { id: 'voice', name: 'Voice Channels' }],
        channels: [
          { id: 'c1', name: 'ok-ui-test', kind: 'text', categoryId: null },
          { id: 'c2', name: 'general', kind: 'text', categoryId: 'text' },
          { id: 'c3', name: 'General', kind: 'voice', categoryId: 'voice' },
        ],
        roles: [], emojis: [], invites: [], bans: [], audit: [], notifyLevel: 1, boostTier: 0 },
    ]),
  )
})
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(700)
// select the second server and its first channel, as the reference shows
await p.evaluate(() => {
  const tiles = [...document.querySelectorAll('.server-tile.srv')]
  tiles[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
})
await p.waitForTimeout(400)
if (popout) {
  await p.click('.user-card .id')
  await p.waitForTimeout(400)
}
await p.mouse.move(760, 400)
await p.waitForTimeout(200)
await p.screenshot({ path: out })
if (errs.length) console.log('ERRORS', errs)
await b.close()
