/**
 * Measure the settings layer against Discord's own geometry.
 *
 * The page renders under html { zoom: 1.25 }, so a client rect already comes
 * back in the same units Discord's stylesheet is written in: a rule that says
 * 264px in Discord's CSS must measure 264 here. That is the whole point of
 * writing our own values as calc(Npx * var(--u)) -- a raw px in this
 * stylesheet lands 25% too big.
 */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1558, height: 900 } })
p.on('pageerror', (e) => console.log('ERR', String(e).split('\n')[0]))
await p.addInitScript(readFileSync('tools/session.js', 'utf8'))
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(600)
await p.click('.server-tile.srv')
await p.waitForTimeout(300)
await p.click('.server-header')
await p.waitForSelector('.ctx-item', { timeout: 3000 })
await p.click('.ctx-item:has-text("Server Settings")')
await p.waitForSelector('.settings-layer', { timeout: 3000 })
await p.waitForTimeout(400)
const out = await p.evaluate(() => {
  const q = (s) => document.querySelector(s)
  const R = (s) => {
    const el = typeof s === 'string' ? q(s) : s
    if (!el) return null
    const r = el.getBoundingClientRect()
    return [r.x, r.y, r.width, r.height].map((n) => +n.toFixed(1))
  }
  const C = (s, ...ps) => {
    const el = typeof s === 'string' ? q(s) : s
    if (!el) return null
    const st = getComputedStyle(el)
    return Object.fromEntries(ps.map((k) => [k, st[k]]))
  }
  const items = [...document.querySelectorAll('.settings-item')]
  return {
    layer: R('.settings-layer'),
    nav: R('.settings-nav'),
    navInner: R('.settings-nav-inner'),
    navBg: C('.settings-nav', 'backgroundColor'),
    pane: R('.settings-pane'),
    paneBg: C('.settings-pane', 'backgroundColor'),
    content: R('.settings-content'),
    contentPad: C('.settings-content', 'paddingTop', 'paddingLeft', 'paddingRight', 'paddingBottom', 'width', 'maxWidth'),
    item0: R(items[0]),
    itemCss: C(items[0], 'fontSize', 'lineHeight', 'fontWeight', 'paddingTop', 'paddingLeft', 'borderRadius', 'color'),
    itemGapY: items[1] ? +(items[1].getBoundingClientRect().y - items[0].getBoundingClientRect().bottom).toFixed(1) : null,
    head: R('.settings-head'),
    headCss: C('.settings-head', 'fontSize', 'lineHeight', 'fontWeight', 'color', 'paddingTop', 'paddingLeft'),
    title: R('.set-title'),
    titleCss: C('.set-title', 'fontSize', 'lineHeight', 'fontWeight', 'color', 'marginBottom'),
    close: R('.settings-close'),
    closeBtn: R('.settings-close button'),
    closeCss: C('.settings-close button', 'width', 'height', 'borderRadius', 'borderWidth', 'borderColor', 'color'),
    escCss: C('.settings-close span', 'fontSize', 'lineHeight', 'fontWeight', 'color', 'marginTop'),
  }
})
console.log(JSON.stringify(out, null, 1))
await b.close()
