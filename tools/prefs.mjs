/**
 * The settings that change what you see.
 *
 * A sweep found 42 of the 51 entries in Prefs were written by the settings
 * page and read nowhere — the page was, in effect, offering toggles that did
 * nothing. These are the ones a browser can honestly serve; the rest need a
 * device, a mail server or a socket, and are left alone.
 */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
let fails = 0
const check = (label, ok, got) => {
  if (ok) console.log('PASS ', label)
  else { fails += 1; console.log('FAIL ', label, '\n    got:', JSON.stringify(got)) }
}

const p = await b.newPage({ viewport: { width: 1366, height: 882 } })
await p.addInitScript(readFileSync('tools/session.js', 'utf8'))
p.on('pageerror', (e) => { fails += 1; console.log('FAIL  page error\n    ', String(e).split('\n')[0]) })

/** Writes prefs straight into storage and reloads, so each is tested alone. */
const withPrefs = async (patch) => {
  await p.evaluate((patch) => {
    const k = 'discord-ui:v4:prefs'
    localStorage.setItem(k, JSON.stringify({ ...JSON.parse(localStorage.getItem(k) ?? '{}'), ...patch }))
  }, patch)
  await p.reload()
  await p.waitForSelector('.composer-input', { timeout: 15000 })
}

await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForSelector('.composer-input', { timeout: 15000 })

// --- convertEmoticons -----------------------------------------------------
const say = async (t) => {
  await p.click('.composer-input')
  await p.fill('.composer-input', t)
  await p.press('.composer-input', 'Enter')
  await p.waitForTimeout(350)
  return p.locator('.msg-line').last()
}
// a converted emoticon renders as a sprite, not text, so the proof is the
// glyph's alt rather than the row's innerText
const lastEmojiAlts = async () =>
  (await p.locator('.msg-line').last().locator('img,[role=img]').evaluateAll((els) =>
    els.map((e) => e.getAttribute('alt') ?? ''),
  ))

await say('hello :) there')
check('emoticons convert when the setting is on', (await lastEmojiAlts()).length === 1, await lastEmojiAlts())

await say('`:)` stays')
check('and a code span is left alone', ((await p.locator('.msg-line').last().innerText()).includes(':)')))

await withPrefs({ convertEmoticons: false })
await say('nope :) here')
const off = await p.locator('.msg-line').last().innerText()
check('and not when it is off', off.includes(':)'), off)

// --- showEmojiReactions ---------------------------------------------------
await withPrefs({ convertEmoticons: true })
await say('react to me')
await p.locator('.group').last().hover()
await p.locator('.group').last().locator('.msg-acts button').first().click()
await p.waitForTimeout(400)
check('a reaction lands', (await p.locator('.reaction').count()) > 0)
await withPrefs({ showEmojiReactions: false })
check('Show emoji reactions off hides them', (await p.locator('.reaction:not(.add)').count()) === 0)
await withPrefs({ showEmojiReactions: true })

// --- showSendButton -------------------------------------------------------
check('no send button by default', (await p.locator('.send-message').count()) === 0)
await withPrefs({ showSendButton: true })
check('Show send button adds one', (await p.locator('.send-message').count()) === 1)
await p.fill('.composer-input', 'sent by button')
await p.locator('.send-message').click()
await p.waitForTimeout(400)
check('and it sends', (await p.locator('.msg-line').last().innerText()).trim() === 'sent by button')
await withPrefs({ showSendButton: false })

// --- renderSpoilers -------------------------------------------------------
await say('||hidden||')
check('a spoiler starts covered', (await p.locator('.spoiler.revealed').count()) === 0)
await withPrefs({ renderSpoilers: 'always' })
check('Show spoiler content: always reveals it', (await p.locator('.spoiler.revealed').count()) >= 1)
await withPrefs({ renderSpoilers: 'on_click' })

// --- hideMutedChannels persists -------------------------------------------
await withPrefs({ hideMutedChannels: true })
await p.locator('.server-header').click()
await p.waitForSelector('.ctx', { timeout: 10000 })
check(
  'Hide Muted Channels survives a reload',
  (await p.locator('.ctx-item.checked:has-text("Hide Muted Channels")').count()) === 1,
)
await p.keyboard.press('Escape')

await b.close()
console.log(fails ? `\n${fails} failure(s)` : '\nall prefs checks pass')
process.exit(fails ? 1 : 0)
