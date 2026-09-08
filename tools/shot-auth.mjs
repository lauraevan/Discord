import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1558, height: 900 } })
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(700)
await p.screenshot({ path: process.argv[2] })
await b.close()
