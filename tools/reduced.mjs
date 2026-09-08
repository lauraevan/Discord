/** Checks the reduced-motion path: the fades stay, the movement goes. */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1558, height: 900 }, reducedMotion: 'reduce' })
await p.addInitScript(readFileSync('tools/session.js', 'utf8'))
p.on('pageerror', (e) => console.log('ERR', String(e).split('\n')[0]))
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(600)

let bad = 0
const check = (label, ok, detail) => {
  console.log(`${ok ? 'PASS ' : 'FAIL '} ${label}${ok ? '' : '  ' + detail}`)
  if (!ok) bad += 1
}

await p.click('[aria-label="Add a Server"]')
await p.waitForSelector('.overlay > *')
const modal = await p.evaluate(() => {
  const el = document.querySelector('.overlay > *')
  const a = el.getAnimations()[0]
  const cs = getComputedStyle(el)
  return { running: a != null, transform: cs.transform, opacity: Number(cs.opacity) }
})
check('the modal still fades', modal.running, JSON.stringify(modal))
check('but does not scale', modal.transform === 'none', modal.transform)
await p.keyboard.press('Escape')
await p.waitForTimeout(300)

await p.hover('.server-tile.srv')
await p.waitForSelector('.tip')
const tip = await p.evaluate(() => {
  const cs = getComputedStyle(document.querySelector('.tip'))
  return cs.scale
})
check('the tooltip does not scale', tip === 'none' || tip === '1', tip)

// a decoration falls back to its still frame
const still = await p.evaluate(() => {
  const s = document.createElement('style')
  document.head.append(s)
  const a = document.createElement('img')
  a.className = 'decoration anim'
  const b = document.createElement('img')
  b.className = 'decoration still'
  document.body.append(a, b)
  const out = [getComputedStyle(a).display, getComputedStyle(b).display]
  a.remove(); b.remove(); s.remove()
  return out
})
check('an animated decoration shows its still', still[0] === 'none' && still[1] === 'block', String(still))

console.log(bad ? `\n${bad} failing` : '\nall clear')
await b.close()
process.exit(bad ? 1 : 0)
