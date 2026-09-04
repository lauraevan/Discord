import { chromium } from 'playwright'
const out = process.argv[2] || '/tmp/claude-0/-home-user-Discord/d79a875f-de4b-540c-a828-cbd4c5853547/scratchpad/shot.png'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', proxy: { server: 'http://127.0.0.1:39467' }, args: ['--ignore-certificate-errors'] })
const p = await b.newPage({ viewport: { width: 1536, height: 993 }, deviceScaleFactor: 1, ignoreHTTPSErrors: true })
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(1400)
await p.screenshot({ path: out })
await b.close()
