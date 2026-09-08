import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1558, height: 900 } })
p.on('pageerror', (e) => console.log('ERR', String(e).split('\n')[0]))
await p.addInitScript(readFileSync('tools/session.js', 'utf8'))
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(600)
await p.click('.server-tile.srv'); await p.waitForTimeout(300)
for (const t of ['first message', 'second one']) {
  await p.fill('.composer-input', t); await p.press('.composer-input', 'Enter'); await p.waitForTimeout(120)
}
await p.hover('.group >> nth=0'); await p.waitForTimeout(120)
await p.click('.group >> nth=0 >> .msg-acts button[aria-label="Reply"]'); await p.waitForTimeout(150)
await p.fill('.composer-input', 'replying'); await p.press('.composer-input', 'Enter'); await p.waitForTimeout(300)
const out = await p.evaluate(() => {
  const g = (sel, root = document) => root.querySelector(sel)
  const R = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) } }
  const C = (el, ...ps) => { if (!el) return null; const s = getComputedStyle(el); return Object.fromEntries(ps.map(k => [k, s[k]])) }
  const list = g('.messages') || g('.msg-list') || g('.chat-scroll') || g('.chat')
  const groups = [...document.querySelectorAll('.group')]
  const last = groups[groups.length - 1]
  return {
    listSel: list?.className,
    list: R(list), listPad: C(list, 'paddingLeft', 'paddingRight'),
    group0: R(groups[0]), groupPad: C(groups[0], 'paddingLeft', 'paddingRight', 'marginTop', 'minHeight'),
    lastGroup: R(last),
    avatar: R(g('.group-avatar', last)), avatarCss: C(g('.group-avatar', last), 'position', 'left', 'top', 'marginTop'),
    replyRef: R(g('.reply-ref', last)), replyCss: C(g('.reply-ref', last), 'height', 'fontSize', 'marginBottom', 'gap'),
    spine: R(g('.reply-spine', last)),
    head: R(g('.msg-head', last)),
    author: R(g('.author', last)), authorCss: C(g('.author', last), 'fontSize', 'lineHeight', 'fontWeight', 'color'),
    ts: R(g('.timestamp', last)), tsCss: C(g('.timestamp', last), 'fontSize', 'lineHeight', 'color', 'marginLeft'),
    body: R(g('.msg-text', last) || g('.content', last)),
    bodyCss: C(g('.msg-text', last) || g('.content', last), 'fontSize', 'lineHeight', 'color'),
    bodyClass: (g('.msg-text', last) || g('.content', last))?.className,
    lastHTML: last?.outerHTML.slice(0, 900),
  }
})
console.log(JSON.stringify(out, null, 1))
await b.close()
