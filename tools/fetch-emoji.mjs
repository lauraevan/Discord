/**
 * Downloads the Twemoji SVGs behind src/emoji.ts from jdecked/twemoji.
 * Names are Discord's own shortcodes, so :joy: resolves the way it does in the
 * real client. Re-run after adding to CATALOGUE.
 */
import fs from 'node:fs'
import { CATALOGUE } from './emoji-catalogue.mjs'

const OUT = 'src/assets/emoji'
fs.mkdirSync(OUT, { recursive: true })

let got = 0
let had = 0
for (const [code] of CATALOGUE) {
  const file = `${OUT}/${code}.svg`
  if (fs.existsSync(file)) { had++; continue }
  const res = await fetch(`https://raw.githubusercontent.com/jdecked/twemoji/main/assets/svg/${code}.svg`)
  if (!res.ok) { console.log('MISS', code, res.status); continue }
  const svg = (await res.text()).replace(/<\?xml[^>]*\?>/, '').replace(/>\s+</g, '><').trim()
  fs.writeFileSync(file, svg)
  got++
}
console.log(`${got} downloaded, ${had} already present, ${CATALOGUE.length} total`)
