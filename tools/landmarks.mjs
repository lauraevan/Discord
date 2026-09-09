/**
 * Measures the chrome against docs/refs, which are Discord at 1:1.
 *
 * The captures are of a different account in a different server, so the text
 * cannot be diffed — but the boxes can. This reads the geometry of every piece
 * of chrome out of the DOM and prints it beside what the capture measures, so
 * "close enough" has a number on it.
 */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1366, height: 882 } })
await p.addInitScript(readFileSync('tools/session.js', 'utf8'))
// Discord's channel list is draggable, and the captures were taken with it at
// 303, so the comparison is of the same window rather than two windows
await p.addInitScript(() => localStorage.setItem('discord-ui:v4:sidebar', '303'))
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(700)
await p.click('.server-tile.srv')
await p.waitForTimeout(300)
await p.fill('.composer-input', 'hello')
await p.press('.composer-input', 'Enter')
await p.waitForTimeout(300)

const got = await p.evaluate(() => {
  const r = (sel) => {
    const el = document.querySelector(sel)
    if (!el) return null
    const b = el.getBoundingClientRect()
    return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) }
  }
  const chat = document.querySelector('.chat').getBoundingClientRect()
  const g = document.querySelector('.group').getBoundingClientRect()
  const av = document.querySelector('.group-avatar').getBoundingClientRect()
  const head = document.querySelector('.msg-head').getBoundingClientRect()
  const cs = (sel, prop) => {
    const el = document.querySelector(sel)
    return el ? getComputedStyle(el)[prop] : null
  }
  const zoom = parseFloat(getComputedStyle(document.documentElement).zoom) || 1
  return {
    'rail width': r('.rail').w,
    'sidebar left': r('.sidebar').x,
    'chat left': chat.x,
    'title bar height': r('.titlebar')?.h,
    'chat header height': r('.chat-header').h,
    'server header height': r('.server-header').h,
    'channel row height': r('.sidebar-scroll .row:not(.nav)').h,
    'user card height': r('.user-card').h,
    'composer height': r('.composer').h,
    'message avatar size': av.width,
    'message avatar inset': +(av.x - chat.x).toFixed(1),
    'message content inset': +(head.x - chat.x).toFixed(1),
    'message group top gap': +getComputedStyle(document.querySelector('.group')).marginTop.replace('px', '') * zoom,
    'username px': +cs('.author', 'fontSize').replace('px', '') * zoom,
    'username weight': cs('.author', 'fontWeight'),
    'message px': +cs('.msg-line', 'fontSize').replace('px', '') * zoom,
    'message line': +cs('.msg-line', 'lineHeight').replace('px', '') * zoom,
    'timestamp px': +cs('.timestamp', 'fontSize').replace('px', '') * zoom,
    'server tile size': r('.server-tile.srv')?.w,
    'user card avatar': r('.user-card .avatar-wrap')?.w,
  }
})
await b.close()

// What docs/refs measures — every one of these was read off the captures with
// tools rather than remembered, because three of the first four "failures"
// here turned out to be a wrong expectation rather than a wrong app: Discord's
// rail tile is 40px and not the 48 it used to be, and its composer and account
// card are both 58 rather than the 44 and 52 you would guess.
const REAL = {
  'rail width': 72,
  'sidebar left': 72,
  'chat left': 375,
  'title bar height': 30,
  'chat header height': 48,
  'server header height': 48,
  'channel row height': 34,
  'user card height': 58,
  'composer height': 58,
  'message avatar size': 40,
  'message avatar inset': 16,
  'message content inset': 72,
  'message group top gap': 17,
  'username px': 16,
  'username weight': '500',
  'message px': 16,
  'message line': 22,
  'timestamp px': 12,
  'server tile size': 40,
  'user card avatar': 32,
}

/** How far a length may drift before it is worth a look. */
const TOLERANCE = 3

let bad = 0
console.log('landmark                     Discord      ours     delta')
for (const [k, want] of Object.entries(REAL)) {
  const have = got[k]
  const num = typeof want === 'number'
  const d = num && have != null ? +(have - want).toFixed(1) : have === want ? 0 : NaN
  const off = num ? Math.abs(d) > TOLERANCE : d !== 0
  if (off) bad++
  console.log(
    `${k.padEnd(28)} ${String(want).padStart(7)} ${String(have ?? '—').padStart(9)} ${
      (Number.isNaN(d) ? 'differs' : String(d)).padStart(9)
    }${off ? '   <-- off' : ''}`,
  )
}
console.log(
  bad
    ? `\n${bad} landmark${bad === 1 ? '' : 's'} more than ${TOLERANCE}px from Discord`
    : `\nall ${Object.keys(REAL).length} landmarks within ${TOLERANCE}px of Discord`,
)
process.exit(bad ? 1 : 0)
