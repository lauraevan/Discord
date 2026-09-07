/**
 * Screenshot the app in an arbitrary seeded state.
 * Usage: node tools/shot.mjs <out.png> <seed.js> [width] [height]
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import { readFileSync as __readSession } from 'node:fs'

const [out, seedFile, w = '1366', h = '884'] = process.argv.slice(2)
const seed = fs.readFileSync(seedFile, 'utf8')
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 })
await p.addInitScript(__readSession('tools/session.js', 'utf8'))
const errs = []
p.on('pageerror', (e) => errs.push(String(e).split('\n')[0]))
await p.addInitScript(seed)
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(900)
await p.evaluate(() => {
  ;[...document.querySelectorAll('.server-tile.srv')][0]?.dispatchEvent(
    new MouseEvent('click', { bubbles: true }),
  )
})
await p.waitForTimeout(400)
await p.mouse.move(700, 300)
await p.screenshot({ path: out })
if (errs.length) console.log('PAGE ERRORS:', errs.join(' | '))
await b.close()
console.log('wrote', out)
