/**
 * Reports the laid-out width of a line of text in the app's own typography,
 * which is what a font-size correction actually needs. Measuring ink from a
 * screenshot works too, but only once you know exactly where the box is.
 */
import { chromium } from 'playwright'
import fs from 'node:fs'

const seedFile = process.argv[2]
const specs = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'))
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1366, height: 884 }, deviceScaleFactor: 1 })
await p.addInitScript(fs.readFileSync(seedFile, 'utf8'))
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(900)
const out = await p.evaluate((specs) => {
  const probe = document.createElement('span')
  probe.style.cssText = 'position:fixed;left:-9999px;white-space:pre;visibility:hidden'
  document.body.appendChild(probe)
  return specs.map(({ label, text, css }) => {
    probe.style.font = ''
    probe.style.cssText =
      'position:fixed;left:-9999px;white-space:pre;visibility:hidden;' + css
    probe.textContent = text
    return { label, w: +probe.getBoundingClientRect().width.toFixed(1) }
  })
}, specs)
for (const r of out) console.log(`${r.label.padEnd(22)} ${String(r.w).padStart(7)}`)
await b.close()
