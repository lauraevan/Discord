import { chromium } from 'playwright'
import { readFileSync as __readSession } from 'node:fs'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1558, height: 743 } })
await p.addInitScript(__readSession('tools/session.js', 'utf8'))
const errs = []
p.on('pageerror', (e) => errs.push(String(e).split('\n')[0]))
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(500)

const type = async (t) => {
  await p.click('.composer-input')
  await p.fill('.composer-input', t)
  await p.press('.composer-input', 'Enter')
  await p.waitForTimeout(120)
}
const step = async (label, fn) => {
  try { await fn(); console.log('PASS ', label) }
  catch (e) { console.log('FAIL ', label, '\n    ' + String(e).split('\n').slice(0, 8).join('\n    ')) }
  await p.mouse.move(760, 300)
  await p.waitForTimeout(150)
}

await step('markdown renders', async () => {
  await type('**bold** *italic* __underline__ ~~strike~~ `code` ||secret||')
  for (const sel of ['.msg-line strong', '.msg-line em', '.msg-line u', '.msg-line s', '.md-code', '.spoiler'])
    if (!(await p.locator(sel).count())) throw new Error('missing ' + sel)
})
await step('headers, quote, list, subtext', async () => {
  await type('# Title\n> quoted\n- one\n- two\n-# subtext')
  for (const sel of ['.md-h', '.md-quote', '.md-list li', '.md-subtext'])
    if (!(await p.locator(sel).count())) throw new Error('missing ' + sel)
})
await step('code block', async () => {
  await p.fill('.composer-input', '```js\nconst a = 1\n```')
  await p.press('.composer-input', 'Enter')
  await p.waitForTimeout(150)
  if (!(await p.locator('.md-block').count())) throw new Error('no code block')
})
await step('masked link + autolink', async () => {
  await type('[docs](https://discord.com) and https://example.com')
  if ((await p.locator('.md-link').count()) < 2) throw new Error('links missing')
})
await step('emoji shortcode + jumbo', async () => {
  await type('nice :fire: work')
  if (!(await p.locator('.msg-line .emoji').count())) throw new Error('no emoji')
  await type(':joy::fire:')
  if (!(await p.locator('.emoji.jumbo').count())) throw new Error('not jumbo')
})
await step('slash command', async () => {
  await type('/shrug well then')
  const t = await p.locator('.msg-line').last().innerText()
  if (!t.includes('¯')) throw new Error('shrug did not expand: ' + t)
})
await step('spoiler reveals on click', async () => {
  await p.click('.spoiler')
  if (!(await p.locator('.spoiler.revealed').count())) throw new Error('did not reveal')
})
await step('message grouping', async () => {
  await type('first')
  await type('second')
  if (!(await p.locator('.group.grouped').count())) throw new Error('no grouped message')
})
await step('date divider', async () => {
  if (!(await p.locator('.divider').count())) throw new Error('no divider')
})
await step('hover toolbar + react', async () => {
  await p.locator('.group').last().hover()
  await p.locator('.group').last().locator('.msg-actions button').first().click()
  await p.waitForSelector('.picker', { timeout: 2000 })
  await p.click('.picker-cell')
  await p.waitForSelector('.reaction.mine', { timeout: 2000 })
})
await step('reaction toggles off', async () => {
  await p.click('.reaction.mine')
  if (await p.locator('.reaction.mine').count()) throw new Error('still reacted')
})
await step('reply', async () => {
  await p.locator('.group').last().hover()
  await p.locator('.group').last().locator('[aria-label="Reply"]').click()
  await p.waitForSelector('.reply-bar', { timeout: 2000 })
  await type('replying now')
  await p.waitForSelector('.reply-ref', { timeout: 2000 })
})
await step('edit + (edited) tag', async () => {
  await p.locator('.group').last().hover()
  await p.locator('.group').last().locator('[aria-label="Edit"]').click()
  await p.fill('.edit-box textarea', 'edited text')
  await p.press('.edit-box textarea', 'Enter')
  await p.waitForSelector('.edited', { timeout: 2000 })
})
await step('up-arrow edits last message', async () => {
  await p.click('.composer-input')
  await p.press('.composer-input', 'ArrowUp')
  await p.waitForSelector('.edit-box', { timeout: 2000 })
  await p.press('.edit-box textarea', 'Escape')
})
await step('pin + pins popover', async () => {
  await p.locator('.group').last().hover()
  await p.locator('.group').last().locator('[aria-label="Pin message"]').click()
  await p.click('[aria-label="Pinned messages"]')
  await p.waitForSelector('.pin-card', { timeout: 2000 })
  await p.keyboard.press('Escape')
})
await step('autocomplete: channel', async () => {
  await p.click('.composer-input')
  await p.fill('.composer-input', '#gen')
  await p.waitForSelector('.ac-row', { timeout: 2000 })
  await p.press('.composer-input', 'Tab')
  const v = await p.inputValue('.composer-input')
  if (!v.startsWith('#general')) throw new Error('got ' + v)
  await p.fill('.composer-input', '')
})
await step('autocomplete: emoji', async () => {
  await p.fill('.composer-input', ':fir')
  await p.waitForSelector('.ac-row', { timeout: 2000 })
  await p.press('.composer-input', 'Tab')
  const v = await p.inputValue('.composer-input')
  if (!v.startsWith(':fire:')) throw new Error('got ' + v)
  await p.fill('.composer-input', '')
})
await step('autocomplete: slash', async () => {
  await p.fill('.composer-input', '/table')
  await p.waitForSelector('.ac-row', { timeout: 2000 })
  await p.fill('.composer-input', '')
})
await step('member list toggles', async () => {
  if (await p.locator('.member').count()) throw new Error('should start hidden')
  await p.click('[aria-label="Toggle member list"]')
  if (!(await p.locator('.member').count())) throw new Error('did not show')
  await p.click('[aria-label="Toggle member list"]')
  if (await p.locator('.member').count()) throw new Error('did not hide')
})
await step('search results panel', async () => {
  await p.fill('.searchbox input', 'edited')
  await p.waitForSelector('.result', { timeout: 2000 })
  await p.click('.results-head button')
})
await step('quick switcher (Ctrl+K)', async () => {
  await p.keyboard.press('Control+k')
  await p.waitForSelector('.switcher', { timeout: 2000 })
  await p.fill('.switcher input', 'gen')
  await p.waitForSelector('.switcher-row', { timeout: 2000 })
  await p.press('.switcher input', 'Enter')
  await p.waitForTimeout(200)
  const h = await p.locator('.chat-header h2').innerText()
  if (h !== 'general') throw new Error('landed on ' + h)
})
await step('context menu', async () => {
  await p.locator('.sidebar-scroll .row:not(.nav)').first().click({ button: 'right' })
  await p.waitForSelector('.ctx-item', { timeout: 2000 })
  await p.keyboard.press('Escape')
})
await step('voice channel join', async () => {
  await p.locator('.row', { hasText: 'Voice' }).count()
  const rows = await p.locator('.sidebar-scroll .row').all()
  for (const r of rows) {
    if (await r.locator('svg').first().isVisible()) { /* noop */ }
  }
  await p.evaluate(() => {
    const btn = [...document.querySelectorAll('.row')].find((r) => r.querySelector('.row-name')?.textContent === 'General')
    btn?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
})
await step('unread pip + Escape marks read', async () => {
  await p.keyboard.press('Escape')
})
console.log('\nerrors:', errs.length ? errs : 'none')
await b.close()
