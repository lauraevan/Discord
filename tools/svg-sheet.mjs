/**
 * Renders a folder of SVGs onto one dark sheet, so vendored artwork can be
 * looked at rather than guessed at.
 *
 *   node tools/svg-sheet.mjs <dir> <out.png> [cols]
 */
import { chromium } from 'playwright'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = process.argv[2]
const out = process.argv[3]
const cols = Number(process.argv[4] || 3)
const files = readdirSync(dir).filter((f) => f.endsWith('.svg')).sort()
const cells = files
  .map((f) => {
    const svg = readFileSync(join(dir, f), 'utf8')
    return `<figure><div class="art">${svg}</div><figcaption>${f}</figcaption></figure>`
  })
  .join('')
const html = `<style>
  body { margin:0; background:#17181c; color:#ddd; font:12px system-ui;
         display:grid; grid-template-columns:repeat(${cols}, 1fr); gap:12px; padding:12px }
  figure { margin:0; background:#0e0f13; border-radius:8px; padding:10px; text-align:center }
  .art { display:grid; place-items:center; min-height:150px }
  .art svg { max-width:100%; max-height:220px; height:auto }
  figcaption { margin-top:6px; opacity:.7 }
</style>${cells}`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1200, height: 800 } })
await p.setContent(html)
await p.waitForTimeout(300)
await p.screenshot({ path: out, fullPage: true })
await b.close()
console.log(files.length, 'svgs ->', out)
