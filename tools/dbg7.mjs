import { chromium } from 'playwright'
import { readFileSync as __readSession } from 'node:fs'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1558, height: 743 } })
await p.addInitScript(__readSession('tools/session.js', 'utf8'))
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(400)
await p.click('.searchbox input')
await p.waitForTimeout(300)
console.log('hints in dom:', await p.locator('.search-hints').count())
console.log(await p.evaluate(() => {
  const el = document.querySelector('.search-hints')
  if (!el) return 'absent'
  const r = el.getBoundingClientRect()
  const cs = getComputedStyle(el)
  let clip = null
  for (let n = el.parentElement; n; n = n.parentElement) {
    const s = getComputedStyle(n)
    if (s.overflow !== 'visible') { clip = n.className + ' overflow:' + s.overflow; break }
  }
  return { rect: [r.x, r.y, r.width, r.height], display: cs.display, vis: cs.visibility, clip }
}))
await b.close()
