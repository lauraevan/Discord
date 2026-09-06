/**
 * Renders every icon the app uses, labelled, so the mapping in
 * tools/gen-icons.py can be checked by eye against the real client.
 *
 *   node tools/icon-sheet.mjs out.png
 */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

const named = JSON.parse(readFileSync('tools/discord-named-icons.json', 'utf8'))
const src = readFileSync('tools/gen-icons.py', 'utf8')
const body = src.slice(src.indexOf('MAP = {'), src.indexOf('ALIASES = {'))
const map = [...body.matchAll(/'(\w+Icon)': '(\w+Icon)',/g)].map((m) => [m[1], m[2]])

const cells = map
  .map(([slot, discord]) => {
    const g = named[discord]
    const box = g.size[0]
    const paths = g.paths
      .map(([d, eo]) => `<path fill="#dbdee1" fill-rule="${eo ? 'evenodd' : 'nonzero'}" d="${d}"/>`)
      .join('')
    return `<figure><svg viewBox="0 0 ${box} ${box}" width="40" height="40">${paths}</svg>
      <b>${slot}</b><i>${discord}</i></figure>`
  })
  .join('')

const html = `<style>
body{background:#1a1a1e;color:#b5bac1;font:12px system-ui;margin:0;padding:16px;
  display:grid;grid-template-columns:repeat(8,1fr);gap:14px}
figure{margin:0;text-align:center;background:#232328;border-radius:6px;padding:8px 4px}
b{display:block;color:#e4e4e8;font-size:11px;margin-top:4px}
i{display:block;font-size:10px;opacity:.7}
</style>${cells}`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1200, height: 900 } })
await p.setContent(html)
await p.screenshot({ path: process.argv[2] || 'icons.png', fullPage: true })
await b.close()
console.log(`${map.length} icons`)
