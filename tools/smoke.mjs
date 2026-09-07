import { chromium } from 'playwright'
import { readFileSync as __readSession } from 'node:fs'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
await p.addInitScript(__readSession('tools/session.js', 'utf8'))
const errs = []
p.on('pageerror', (e) => errs.push('PAGEERROR ' + String(e)))
p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type().toUpperCase() + ' ' + m.text()) })
p.on('requestfailed', (r) => errs.push('REQFAIL ' + r.url().slice(0, 120)))
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(1500)
console.log('root html length:', (await p.locator('#root').innerHTML()).length)
console.log('errors:', errs.length ? errs : 'none')
await p.screenshot({ path: process.argv[2] })
await b.close()
