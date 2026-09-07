/**
 * Reproduces the second reference set's state — "bullet's server", brand new,
 * with two messages — and screenshots at its 1366x884 CSS size on a 2x screen.
 *
 *   node tools/ref2.mjs out.png [popout|plus]
 */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

const out = process.argv[2] || 'ref2.png'
const mode = process.argv[3] ?? ''

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1366, height: 884 }, deviceScaleFactor: 2 })
const errs = []
p.on('pageerror', (e) => errs.push(String(e).split('\n')[0]))
await p.addInitScript(readFileSync('tools/session.js', 'utf8'))
await p.addInitScript(() => {
  localStorage.setItem(
    'discord-ui:v4:credentials',
    JSON.stringify([
      {
        username: 'pleasespeedineedthus',
        email: 'bullet@example.com',
        displayName: 'bullet',
        salt: '0'.repeat(32),
        hash: '0'.repeat(64),
        birthday: '2000-01-01',
        createdAt: 1700000000000,
      },
    ]),
  )
  localStorage.setItem('discord-ui:v4:session', JSON.stringify('pleasespeedineedthus'))
  localStorage.setItem(
    'discord-ui:v4:account',
    JSON.stringify({
      name: 'bullet',
      handle: 'pleasespeedineedthus',
      pronouns: '',
      bio: '',
      status: 'online',
      color: '#ed4245',
      badges: ['quests'],
    }),
  )
  localStorage.setItem(
    'discord-ui:v4:servers',
    JSON.stringify([
      {
        id: 's0',
        name: "bullet's server",
        initials: 'bs',
        color: '#5865f2',
        categories: [
          { id: 'text', name: 'Text Channels' },
          { id: 'voice', name: 'Voice Channels' },
        ],
        channels: [
          { id: 'c0', name: 'general', kind: 'text', categoryId: 'text' },
          { id: 'c1', name: 'General', kind: 'voice', categoryId: 'voice' },
        ],
        roles: [],
        emojis: [],
        invites: [],
        bans: [],
        audit: [],
        notifyLevel: 1,
        boostTier: 0,
      },
    ]),
  )
  const at = new Date('2026-09-05T19:59:00').getTime()
  localStorage.setItem(
    'discord-ui:v4:messages',
    JSON.stringify({
      's0/c0': [
        { id: 'm0', author: 'pleasespeedineedthus', time: at, text: 'hello' },
        { id: 'm1', author: 'pleasespeedineedthus', time: at + 1000, text: 'hey claude this is a reference' },
      ],
    }),
  )
})
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(800)
if (mode === 'popout') {
  await p.evaluate(() =>
    document.querySelector('.user-card .id')?.dispatchEvent(new MouseEvent('click', { bubbles: true })),
  )
  await p.waitForTimeout(300)
} else if (mode === 'plus') {
  await p.evaluate(() =>
    document.querySelector('.composer .plus')?.dispatchEvent(new MouseEvent('click', { bubbles: true })),
  )
  await p.waitForTimeout(300)
}
await p.mouse.move(700, 400)
await p.waitForTimeout(200)
await p.screenshot({ path: out })
await b.close()
console.log(errs.length ? 'pageerror: ' + errs.join(' | ') : 'ok')
