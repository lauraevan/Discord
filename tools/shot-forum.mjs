import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1558, height: 900 } })
await p.addInitScript(readFileSync('tools/session.js', 'utf8'))
// seed a forum channel with a few posts so both layouts have something to show
await p.addInitScript(() => {
  localStorage.setItem(
    'discord-ui:v4:servers',
    JSON.stringify([
      {
        id: 's1', name: "Nebula's server", initials: 'NS', color: '#5865f2',
        categories: [{ id: 'c1', name: 'Text Channels' }],
        channels: [
          { id: 'ch1', name: 'general', kind: 'text', categoryId: 'c1' },
          { id: 'ch2', name: 'ideas', kind: 'forum', categoryId: 'c1' },
        ],
        roles: [{ id: 'r0', name: '@everyone', color: null }],
        members: [{ id: 'self', name: 'Nebula', color: '#5865f2' }],
        emojis: [], invites: [], audit: [],
      },
    ]),
  )
  localStorage.setItem(
    'discord-ui:v4:messages',
    JSON.stringify({
      's1/ch2': [
        { id: 'p1', author: 'nebula', time: 1757000000000, text: 'Dark theme tweaks\nThe rail could sit a shade lower.' },
        { id: 'p2', author: 'nebula', time: 1757100000000, text: 'Keyboard shortcuts\nCtrl+K should also match categories.' },
        { id: 'p3', author: 'nebula', time: 1757200000000, text: 'Forum tags\nWorth having a colour per tag.' },
      ],
    }),
  )
})
p.on('pageerror', (e) => console.log('ERR', String(e).split('\n')[0]))
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(600)
await p.click('.row:has-text("ideas")')
await p.waitForTimeout(400)
await p.screenshot({ path: process.argv[2] })
await p.click('.forum-layout')
await p.waitForTimeout(300)
await p.screenshot({ path: process.argv[3] })
// and its settings
await p.evaluate(() => {
  const rows = [...document.querySelectorAll('.row')]
  const r = rows.find((x) => x.textContent.includes('ideas'))
  r?.querySelector('[aria-label="Edit channel"]')?.click()
})
await p.waitForSelector('.settings-layer', { timeout: 4000 })
await p.waitForTimeout(400)
await p.screenshot({ path: process.argv[4] })
await b.close()
