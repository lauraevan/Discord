/** Renders the app in the state of docs/refs/1aa6b935.jpg (bullet's server,
 *  #general, two messages) at that capture's logical size, for side-by-side. */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
const out = process.argv[2] || 'real-cmp.png'
const zoom = process.argv[3]
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1366, height: 882 }, deviceScaleFactor: 2 })
await p.addInitScript(readFileSync('tools/session.js', 'utf8'))
// the captures were taken with the channel list dragged to 303
await p.addInitScript(() => localStorage.setItem('discord-ui:v4:sidebar', '303'))
p.on('pageerror', (e) => console.log('ERR', String(e).split('\n')[0]))
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(700)
if (zoom) await p.addStyleTag({ content: `#root{zoom:${zoom}}` })
await p.click('.server-tile.srv'); await p.waitForTimeout(300)
for (const t of ['hello', 'hey claude this is a reference']) {
  await p.fill('.composer-input', t); await p.press('.composer-input', 'Enter'); await p.waitForTimeout(150)
}
await p.mouse.move(1000, 200); await p.waitForTimeout(200)
await p.screenshot({ path: out })
await b.close()
console.log('wrote', out)
