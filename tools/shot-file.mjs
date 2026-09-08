import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1558, height: 900 } })
await p.addInitScript(readFileSync('tools/session.js', 'utf8'))
p.on('pageerror', (e) => console.log('ERR', String(e).split('\n')[0]))
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(600)
await p.setInputFiles('input[type=file]', [
  { name: 'quarterly-report.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 hello') },
])
await p.waitForTimeout(200)
await p.setInputFiles('input[type=file]', [
  { name: 'build.zip', mimeType: 'application/zip', buffer: Buffer.alloc(1_500_000) },
])
await p.waitForTimeout(200)
await p.setInputFiles('input[type=file]', [
  { name: 'theme.css', mimeType: 'text/css', buffer: Buffer.from('body{}') },
])
await p.waitForTimeout(300)
await p.screenshot({ path: process.argv[2] })
await p.click('.composer textarea, textarea')
await p.keyboard.press('Enter')
await p.waitForTimeout(400)
await p.screenshot({ path: process.argv[3] })
await b.close()
