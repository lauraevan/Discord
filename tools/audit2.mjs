import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
const out = process.argv[2]
mkdirSync(out, { recursive: true })
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1558, height: 900 } })
await p.addInitScript(readFileSync('tools/session.js', 'utf8'))
p.on('pageerror', (e) => console.log('ERR', String(e).split('\n')[0]))
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(700)
const shot = async (name, fn) => {
  try { await fn(); await p.screenshot({ path: `${out}/${name}.png` }) }
  catch (e) { console.log(`skip ${name}: ${String(e).split('\n')[0].slice(0, 70)}`) }
}
await p.click('.server-tile.srv')
await p.waitForTimeout(400)
console.log('composer buttons:', await p.locator('.composer-actions button, .composer-tools button').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label'))))
await shot('20-emoji', async () => {
  await p.click('[aria-label="Emoji"], [aria-label="Select emoji"]')
  await p.waitForTimeout(400)
})
await shot('21-gif', async () => {
  await p.keyboard.press('Escape')
  await p.click('[aria-label="GIF"], [aria-label="GIFs"]')
  await p.waitForTimeout(400)
})
await shot('22-sticker', async () => {
  await p.keyboard.press('Escape')
  await p.click('[aria-label="Sticker"], [aria-label="Stickers"]')
  await p.waitForTimeout(400)
})
await shot('23-plus', async () => {
  await p.keyboard.press('Escape')
  await p.click('.composer-plus, [aria-label="Upload a File"], [aria-label="Attach"]')
  await p.waitForTimeout(400)
})
await shot('24-ctx', async () => {
  await p.keyboard.press('Escape')
  await p.click('.composer-input')
  await p.fill('.composer-input', 'right click me')
  await p.press('.composer-input', 'Enter')
  await p.waitForTimeout(300)
  await p.click('.group >> nth=-1', { button: 'right' })
  await p.waitForTimeout(300)
})
await shot('25-inbox', async () => {
  await p.keyboard.press('Escape')
  await p.click('[aria-label="Inbox"]')
  await p.waitForTimeout(400)
})
await b.close()
console.log('done')
