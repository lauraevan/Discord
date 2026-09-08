/** Opens the account popout from the user card, at the size docs/refs uses. */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
const out = process.argv[2]
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1366, height: 884 }, deviceScaleFactor: 2 })
await p.addInitScript(readFileSync('tools/session.js', 'utf8'))
p.on('pageerror', (e) => console.log('ERR', String(e).split('\n')[0]))
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(700)
await p.click('.server-tile.srv'); await p.waitForTimeout(250)
await p.click('.user-card .id'); await p.waitForTimeout(500)
await p.screenshot({ path: out })
console.log(await p.evaluate(() => {
  const r = (s) => { const e = document.querySelector(s); if (!e) return null
    const b = e.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] }
  return { popout: r('.popout'), banner: r('.popout .banner'), avatar: r('.popout .avatar-wrap'),
           name: r('.popout .pop-name'), html: document.querySelector('.popout')?.className }
}))
await b.close()
