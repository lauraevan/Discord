/**
 * Samples what the UI actually animates, so the springs can be checked against
 * the numbers in Discord's bundle rather than taken on trust.
 *
 * Prints, for each surface, the scale over time: where it peaks, when, and how
 * long it takes to come to rest.
 *
 *   node tools/motion.mjs
 */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1558, height: 900 } })
await p.addInitScript(readFileSync('tools/session.js', 'utf8'))
p.on('pageerror', (e) => console.log('ERR', String(e).split('\n')[0]))
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(600)

/** scale over time for the first element matching `sel`, once `open` runs it */
const sample = async (label, open, sel, ms) => {
  await open()
  const track = await p.evaluate(
    async ([sel, ms]) => {
      const el = document.querySelector(sel)
      if (!el) return null
      const out = []
      const t0 = performance.now()
      while (performance.now() - t0 < ms) {
        const cs = getComputedStyle(el)
        const m = new DOMMatrixReadOnly(cs.transform)
        const s = cs.scale === 'none' ? 1 : parseFloat(cs.scale)
        out.push([Math.round(performance.now() - t0), Number((m.a * s).toFixed(5))])
        await new Promise((r) => requestAnimationFrame(r))
      }
      return out
    },
    [sel, ms],
  )
  if (!track) return console.log(`${label.padEnd(10)} MISSING ${sel}`)
  const peak = track.reduce((a, s) => (s[1] > a[1] ? s : a), track[0])
  // rest is the last time it is still outside the band, not the first time it
  // crosses — an overshooting spring passes through 1 on the way up
  const moving = track.filter(([, v]) => Math.abs(v - 1) >= 0.0005)
  const rest = moving.length ? moving[moving.length - 1][0] : 0
  console.log(
    `${label.padEnd(10)} start ${track[0][1].toFixed(4)}  peak ${peak[1].toFixed(4)} @${peak[0]}ms` +
      `  rest @${rest}ms`,
  )
  return { start: track[0][1], peak: peak[1], peakAt: peak[0], rest }
}

/**
 * What the springs in src/springs.css say each of these should do. Only the
 * peak is asserted tightly: sampling cannot start until the element exists, so
 * the first value read is already a few milliseconds into the curve.
 */
const check = (label, got, want, tol) => {
  const bad = Object.entries(want).filter(([k, v]) => Math.abs(got[k] - v) > tol[k])
  if (bad.length)
    console.log(
      `  ^ ${label}: expected ` +
        bad.map(([k, v]) => `${k} ~${v} (got ${got[k].toFixed(4)})`).join(', '),
    )
  return bad.length
}

let bad = 0
const t = await sample(
  'tooltip',
  async () => {
    await p.hover('.server-tile.srv')
    await p.waitForSelector('.tip', { timeout: 2000 })
  },
  '.tip',
  400,
)
// 0.95 -> 1 on the popout spring, which overshoots the 0.05 range by 13.5%
bad += check('tooltip', t, { peak: 1.0068 }, { peak: 0.002 })
await p.mouse.move(760, 400)
await p.waitForTimeout(300)

const po = await sample(
  'popout',
  async () => {
    await p.click('.user-card .id')
    await p.waitForSelector('.popout', { timeout: 2000 })
  },
  '.popout',
  400,
)
bad += check('popout', po, { peak: 1.0068 }, { peak: 0.002 })
await p.keyboard.press('Escape')
await p.waitForTimeout(300)

const mo = await sample(
  'modal',
  async () => {
    await p.click('[aria-label="Add a Server"]')
    await p.waitForSelector('.overlay > *', { timeout: 2000 })
  },
  '.overlay > *',
  500,
)
// 0.9 -> 1 on the modal spring, which overshoots its 0.1 range by 2.3%
bad += check('modal', mo, { start: 0.9, peak: 1.0023 }, { start: 0.002, peak: 0.002 })
// the modal is the one whose start is reliable: it is still at 0.9 when the
// element first paints, because the spring is delayed 64ms behind the scrim
await p.keyboard.press('Escape')
await p.waitForTimeout(300)

// the reaction pop, which runs on the emoji rather than the pill
await p.click('.composer-input')
await p.fill('.composer-input', 'motion check')
await p.press('.composer-input', 'Enter')
await p.waitForTimeout(300)
const re = await sample(
  'reaction',
  async () => {
    await p.hover('.group >> nth=-1')
    await p.click('.group >> nth=-1 >> .msg-acts button[aria-label="React with :thumbsup:"]')
    await p.waitForSelector('.reaction.popped .emoji', { timeout: 2000 })
  },
  '.reaction.popped .emoji',
  500,
)

// the middle leg of Discord's three-spring sequence overshoots to 1.1
bad += check('reaction', re, { peak: 1.1 }, { peak: 0.005 })

console.log(bad ? `\n${bad} off` : '\nall springs match the bundle')
await b.close()
process.exit(bad ? 1 : 0)
