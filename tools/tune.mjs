/**
 * Per-element tuning loop.
 *
 * Loads the built page once, applies a CSS override per trial, screenshots and
 * scores just the region that override affects against the reference frame.
 * Far faster than rebuilding, so the sweeps can be fine.
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import { readFileSync as __readSession } from 'node:fs'

const SEED = () => {
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
}

const trials = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const prelude = process.argv[3] ? fs.readFileSync(process.argv[3], 'utf8') : null
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1558, height: 743 }, deviceScaleFactor: 1 })
await p.addInitScript(__readSession('tools/session.js', 'utf8'))
await p.addInitScript(SEED)
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(700)
await p.evaluate(() => {
  const t = [...document.querySelectorAll('.server-tile.srv')][1]
  t?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
})
await p.waitForTimeout(400)
if (process.env.POPOUT) {
  await p.evaluate(() => document.querySelector('.user-card .id')?.dispatchEvent(
    new MouseEvent('click', { bubbles: true })))
  await p.waitForTimeout(300)
}
await p.mouse.move(760, 400)
if (prelude) {
  await p.addStyleTag({ content: prelude })
  await p.waitForTimeout(1200)
}

fs.rmSync('/tmp/tune', { recursive: true, force: true })
fs.mkdirSync('/tmp/tune', { recursive: true })
let tag = null
for (const [i, css] of trials.entries()) {
  if (tag) await p.evaluate((id) => document.getElementById(id)?.remove(), 'tune')
  await p.addStyleTag({ content: `#tune{}\n${css}` })
  await p.evaluate(() => {
    const s = [...document.querySelectorAll('style')].pop()
    if (s) s.id = 'tune'
  })
  tag = true
  await p.waitForTimeout(90)
  await p.screenshot({ path: `/tmp/tune/${i}.png` })
}
await b.close()
console.log('rendered', trials.length)
