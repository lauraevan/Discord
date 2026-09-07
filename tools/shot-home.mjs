import { chromium } from 'playwright'
import { readFileSync as __readSession } from 'node:fs'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1558, height: 820 } })
await p.addInitScript(__readSession('tools/session.js', 'utf8'))
const errs = []
p.on('pageerror', (e) => errs.push(String(e).split('\n')[0]))
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(500)
await p.click('[aria-label="Direct Messages"]')
await p.waitForSelector('.friends-empty', { timeout: 3000 })
await p.screenshot({ path: process.argv[2] })
await p.click('.friends-add')
await p.waitForTimeout(200)
await p.screenshot({ path: process.argv[3] })
console.log('errors:', errs.length ? errs : 'none')
await b.close()
