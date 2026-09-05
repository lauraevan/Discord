import { chromium } from 'playwright'
const out = process.argv[2] || 'shot.png'
const w = Number(process.argv[3] || 1595)
const h = Number(process.argv[4] || 1180)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
const errs = []
p.on('pageerror', (e) => errs.push(String(e)))
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(1200)
await p.screenshot({ path: out })
if (errs.length) console.log('ERRORS', errs)
await b.close()
