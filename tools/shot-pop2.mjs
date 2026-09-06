import { chromium } from 'playwright'
import fs from 'node:fs'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1366, height: 884 }, deviceScaleFactor: 1 })
const errs = []
p.on('pageerror', (e) => errs.push(String(e).split('\n')[0]))
await p.addInitScript(fs.readFileSync(process.argv[3] ?? process.argv[4], "utf8"))
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(900)
await p.click('.user-card .id')
await p.waitForTimeout(350)
await p.screenshot({ path: process.argv[2] })
if (errs.length) console.log('ERR', errs.join(' | '))
await b.close()
