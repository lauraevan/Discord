import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1558, height: 743 }, deviceScaleFactor: 1 })
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(600)
await p.click('.user-card .id')
await p.waitForTimeout(400)
await p.screenshot({ path: process.argv[2] })
await b.close()
