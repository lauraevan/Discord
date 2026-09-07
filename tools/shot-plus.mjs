import { chromium } from 'playwright'
import fs from 'node:fs'
import { readFileSync as __readSession } from 'node:fs'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1366, height: 884 }, deviceScaleFactor: 1 })
await p.addInitScript(__readSession('tools/session.js', 'utf8'))
const errs = []
p.on('pageerror', (e) => errs.push(String(e).split('\n')[0]))
await p.addInitScript(fs.readFileSync('/tmp/seed-new2.js', 'utf8'))
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(900)
await p.click('.composer .plus')
await p.waitForTimeout(300)
await p.screenshot({ path: process.argv[2] })
if (errs.length) console.log('ERR', errs.join(' | '))
await b.close()
