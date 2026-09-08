/** Renders an SVG from stdin to a PNG at a given size, using the page engine. */
import { chromium } from 'playwright'
const [, , out, w, h] = process.argv
const svg = await new Promise((res) => {
  let s = ''
  process.stdin.on('data', (d) => (s += d))
  process.stdin.on('end', () => res(s))
})
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2 })
await p.setContent(
  `<style>html,body{margin:0;background:transparent}
   svg{display:block;width:${w}px;height:${h}px}</style>${svg}`,
)
await p.waitForTimeout(80)
await p.screenshot({ path: out, omitBackground: true })
await b.close()
