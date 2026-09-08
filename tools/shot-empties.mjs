import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1558, height: 900 } })
await p.addInitScript(readFileSync('tools/session.js', 'utf8'))
p.on('pageerror', (e) => console.log('ERR', String(e).split('\n')[0]))
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(600)
// search with no hits
await p.fill('.chat-search input, input[placeholder^="Search"]', 'zzzzqqq')
await p.keyboard.press('Enter')
await p.waitForTimeout(400)
await p.screenshot({ path: process.argv[2] })
await p.keyboard.press('Escape')
// quick switcher with no hits
await p.keyboard.press('Control+k')
await p.waitForTimeout(200)
await p.keyboard.type('zzzzqqq')
await p.waitForTimeout(300)
await p.screenshot({ path: process.argv[3] })
await b.close()
