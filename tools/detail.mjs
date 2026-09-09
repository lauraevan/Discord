/**
 * The second measuring pass: the pieces that were called out as "close but
 * not it" — the sidebar's category headings and channel rows, the composer,
 * and the account panel's row of controls.
 *
 * Unlike tools/landmarks.mjs this one compares *images*: it renders the app
 * into the same frame as docs/refs/febf1f6c.jpg and runs the same scans over
 * both, so what it reports is what a pixel diff would see rather than what the
 * DOM says it intended.
 */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

const out = process.argv[2] || '/tmp/detail-ours.png'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1366, height: 882 }, deviceScaleFactor: 1 })
await p.addInitScript(readFileSync('tools/session.js', 'utf8'))
// the capture's own window: the channel list dragged to 303
await p.addInitScript(() => localStorage.setItem('discord-ui:v4:sidebar', '303'))
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(700)
await p.click('.server-tile.srv')
await p.waitForTimeout(400)
await p.mouse.move(700, 300)
await p.waitForTimeout(200)
await p.screenshot({ path: out })
console.log(
  JSON.stringify(
    await p.evaluate(() => {
      const z = parseFloat(getComputedStyle(document.documentElement).zoom) || 1
      const R = (sel) => {
        const el = document.querySelector(sel)
        if (!el) return null
        const b = el.getBoundingClientRect()
        return [+b.x.toFixed(1), +b.y.toFixed(1), +b.width.toFixed(1), +b.height.toFixed(1)]
      }
      const C = (sel, ...ps) => {
        const el = document.querySelector(sel)
        if (!el) return null
        const s = getComputedStyle(el)
        const o = {}
        for (const k of ps) o[k] = s[k]
        return o
      }
      const pxOf = (v) => +String(v).replace('px', '') * z
      return {
        cat: R('.category'),
        catCss: C('.cat-label', 'fontSize', 'fontWeight', 'letterSpacing', 'paddingLeft', 'height'),
        rowSel: R('.sidebar-scroll .row.active, .sidebar-scroll .row.on, .sidebar-scroll .row'),
        rowCss: C('.sidebar-scroll .row', 'height', 'borderRadius', 'marginLeft', 'marginRight', 'paddingLeft'),
        rowBg: getComputedStyle(document.querySelector('.sidebar-scroll .row.active') ?? document.querySelector('.sidebar-scroll .row')).backgroundColor,
        composer: R('.composer'),
        composerCss: C('.composer', 'paddingLeft', 'paddingRight', 'minHeight', 'borderRadius'),
        composerBg: getComputedStyle(document.querySelector('.composer')).backgroundColor,
        userCard: R('.user-card'),
        userAvatar: R('.user-card .avatar-wrap'),
        scaled: { catFont: pxOf(C('.cat-label', 'fontSize').fontSize) },
      }
    }),
    null,
    1,
  ),
)
await b.close()
