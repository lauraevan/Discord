/** All four statuses at the sizes Discord ships, so the masks can be seen. */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 900, height: 420 }, deviceScaleFactor: 2 })
await p.addInitScript(readFileSync('tools/session.js', 'utf8'))
p.on('pageerror', (e) => console.log('ERR', String(e).split('\n')[0]))
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(600)
// borrow the page's own mask sprite and draw a grid of avatars into it
await p.evaluate(() => {
  const wrap = document.createElement('div')
  wrap.style.cssText =
    'position:fixed;inset:0;z-index:9999;background:#1a1a1e;display:grid;' +
    'grid-template-columns:repeat(5,1fr);align-items:center;justify-items:center;padding:24px;font:12px system-ui;color:#b5bac1'
  const specs = [16, 24, 32, 48, 80]
  const statuses = ['online', 'idle', 'dnd', 'invisible']
  const colors = { online: '#23a55a', idle: '#f0b232', dnd: '#f23f43', invisible: '#80848e' }
  wrap.append(...specs.map((s) => Object.assign(document.createElement('div'), { textContent: s + 'px' })))
  for (const st of statuses) {
    for (const size of specs) {
      const holeFor = { 16: 16, 24: 24, 32: 32, 48: 48, 80: 80 }[size]
      const d = { 16: 6, 24: 8, 32: 10, 48: 12, 80: 16 }[size]
      const off = size === 80 ? 4 : 0
      const cell = document.createElement('div')
      cell.innerHTML =
        `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="overflow:visible">` +
        `<foreignObject x="0" y="0" width="${size}" height="${size}" mask="url(#dc-hole-${holeFor})">` +
        `<div style="width:100%;height:100%;border-radius:50%;background:#5865f2"></div></foreignObject>` +
        `<rect x="${size - d - off}" y="${size - d - off}" width="${d}" height="${d}" fill="${colors[st]}" ` +
        `mask="url(#dc-status-${st === 'invisible' ? 'offline' : st})"/></svg>`
      wrap.append(cell)
    }
  }
  document.body.append(wrap)
})
await p.waitForTimeout(200)
await p.screenshot({ path: process.argv[2] })
await b.close()
