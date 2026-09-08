import { chromium } from 'playwright'
import { readFileSync, mkdirSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
const out = process.argv[2]
const TMP = '/tmp/slides'
rmSync(TMP, { recursive: true, force: true })
mkdirSync(TMP, { recursive: true })
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1558, height: 900 } })
await p.addInitScript(readFileSync('tools/session.js', 'utf8'))
p.on('pageerror', (e) => console.log('ERR', String(e).split('\n')[0]))
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(600)
await p.click('[aria-label="Add a Server"]')
await p.waitForSelector('.cs')
await p.waitForTimeout(500)
const clip = { x: 540, y: 120, width: 480, height: 620 }
await p.screenshot({ path: `${TMP}/a0.png`, clip })
await p.click('.cs-template >> nth=0')
for (let i = 1; i <= 6; i += 1) {
  await p.screenshot({ path: `${TMP}/a${i}.png`, clip })
  await p.waitForTimeout(45)
}
await p.waitForTimeout(400)
await p.screenshot({ path: `${TMP}/a7.png`, clip })
console.log('sliding class seen:', await p.locator('.slides[data-sliding]').count())
await b.close()
execFileSync('python3', ['-c', `
import glob
from PIL import Image, ImageDraw
files = sorted(glob.glob('${TMP}/a*.png'), key=lambda f: int(f.split('a')[-1].split('.')[0]))
ims = [Image.open(f).convert('RGB') for f in files]
w, h = ims[0].size
sheet = Image.new('RGB', (w * len(ims), h + 16), (20, 20, 24))
d = ImageDraw.Draw(sheet)
for i, im in enumerate(ims):
    sheet.paste(im, (i * w, 0))
    d.text((i * w + 4, h + 2), 'f' + str(i), fill=(170, 170, 180))
sheet = sheet.resize((sheet.width // 2, sheet.height // 2))
sheet.save('${out}')
print(sheet.size)
`])
