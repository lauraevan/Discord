import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1558, height: 743 }, deviceScaleFactor: 1 })
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(600)
const sel = process.argv.slice(2)
for (const s of sel) {
  const box = await p.locator(s).first().boundingBox().catch(() => null)
  console.log(s, box ? `x=${box.x} y=${box.y} w=${box.width} h=${box.height}` : 'none')
}
await b.close()
