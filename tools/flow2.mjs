import { chromium } from 'playwright'
import { readFileSync as __readSession } from 'node:fs'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1558, height: 860 } })
await p.addInitScript(__readSession('tools/session.js', 'utf8'))
const errs = []
p.on('pageerror', (e) => errs.push(String(e).split('\n')[0]))
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(400)
let fails = 0
const step = async (label, fn) => {
  try { await fn(); console.log('PASS ', label) }
  catch (e) {
    fails += 1
    console.log('FAIL ', label, '\n    ' + String(e).split('\n').slice(0,6).join('\n    '))
    const shot = `/tmp/flow-fail-${label.replace(/\W+/g, '-')}.png`
    await p.screenshot({ path: shot }).catch(() => {})
    console.log('    frame:', shot)
  }
  await p.keyboard.press('Escape'); await p.mouse.move(700, 300); await p.waitForTimeout(150)
}
const say = async (t) => { await p.click('.composer-input'); await p.fill('.composer-input', t); await p.press('.composer-input','Enter'); await p.waitForTimeout(80) }

// the checklist is up while the server is still as it was created; the tests
// below add channels, which is what retires it
await step('server checklist shows on a fresh server', async () => {
  const n = await p.locator('.onboard-step').count()
  if (n !== 6) throw new Error('expected 6 steps, got ' + n)
})
await step('user settings opens', async () => {
  await p.click('[aria-label="User settings"]')
  await p.waitForSelector('.settings-layer')
  if ((await p.locator('.settings-item').count()) < 25) throw new Error('sidebar too short')
})
await step('appearance: compact mode really applies', async () => {
  await p.click('[aria-label="User settings"]')
  await p.click('.settings-item:has-text("Appearance")')
  await p.click('.set-radio:has-text("Compact")')
  await p.waitForFunction(() => document.body.classList.contains('compact'))
  await p.click('.set-radio:has-text("Cozy")')
})
await step('appearance: font scale drives CSS', async () => {
  await p.click('[aria-label="User settings"]')
  await p.click('.settings-item:has-text("Appearance")')
  await p.locator('[aria-label="Chat Font Scaling"]').fill('20')
  const v = await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--msg-font'))
  if (v.trim() !== '20px') throw new Error('got ' + v)
  await p.locator('[aria-label="Chat Font Scaling"]').fill('16')
})
await step('content & social and friend requests are real pages', async () => {
  await p.click('[aria-label="User settings"]')
  await p.click('.settings-item:has-text("Content & Social")')
  await p.waitForSelector('.set-radio:has-text("Blur")')
  await p.click('.set-radio:has-text("Block") >> nth=0')
  const scan = await p.evaluate(() =>
    JSON.parse(localStorage.getItem('discord-ui:v4:prefs') ?? '{}').sensitiveDms,
  )
  if (scan !== 2) throw new Error('sensitive content did not save: ' + scan)
  await p.click('.settings-item:has-text("Friend Requests")')
  // Everyone holds the other two on
  const held = await p.locator('.set-row-held').count()
  if (held !== 2) throw new Error(`${held} switches held, not 2`)
  await p.click('[aria-label="Everyone"]')
  if ((await p.locator('.set-row-held').count()) !== 0) throw new Error('still held')
  await p.click('[aria-label="Server Members"]')
  const fr = await p.evaluate(() =>
    JSON.parse(localStorage.getItem('discord-ui:v4:prefs') ?? '{}').friendRequests,
  )
  if (fr.everyone !== false || fr.serverMembers !== false)
    throw new Error('friend requests did not save: ' + JSON.stringify(fr))
})
await step('developer mode adds Copy IDs', async () => {
  await p.click('[aria-label="User settings"]')
  await p.click('.settings-item:has-text("Advanced")')
  await p.click('[aria-label="Developer Mode"]')
  await p.keyboard.press('Escape')
  await p.locator('.sidebar-scroll .row:not(.nav)').first().click({ button: 'right' })
  if (!(await p.locator('.ctx-item:has-text("Copy Channel ID")').count())) throw new Error('no copy id')
})
await step('language pane lists locales', async () => {
  await p.click('[aria-label="User settings"]')
  await p.click('.settings-item:has-text("Language")')
  if ((await p.locator('.locale').count()) < 25) throw new Error('too few locales')
})
await step('keybinds pane', async () => {
  await p.click('[aria-label="User settings"]')
  await p.click('.settings-item:has-text("Keybinds")')
  if ((await p.locator('.keybind').count()) < 10) throw new Error('too few keybinds')
})
await step('server settings: create + edit a role', async () => {
  await p.click('.server-header')
  await p.click('.ctx-item:has-text("Server Settings")')
  await p.click('.settings-item:has-text("Roles")')
  await p.click('.btn-primary:has-text("Create Role")')
  // a new role opens on Display, the way Discord opens it
  await p.waitForSelector('.role-tab.on:has-text("Display")')
  await p.getByLabel('ROLE NAME').fill('moderator')
  await p.click('.role-tab:has-text("Permissions")')
  await p.waitForSelector('.perm-group')
  await p.locator('[aria-label="Administrator"]').click()
  // the permission search narrows the list to the group that has the hit
  await p.fill('[aria-label="Search permissions"]', 'kick')
  if ((await p.locator('.perm').count()) !== 1) throw new Error('permission search did not narrow')
  await p.fill('[aria-label="Search permissions"]', '')
  // roles are handed out on the third tab
  await p.click('.role-tab:has-text("Manage Members")')
  await p.click('.role-members button:has-text("Add")')
  await p.waitForSelector('.role-members button:has-text("Remove")')
  await p.click('.back-link')
  if ((await p.locator('.role-row').count()) !== 2) throw new Error('role not created')
  // @everyone always sits last, whatever else is ranked above it
  const last = await p.locator('.role-row .role-name').last().innerText()
  if (last !== '@everyone') throw new Error('@everyone is not the floor: ' + last)
})
await step('a role the member holds colours their name', async () => {
  await p.click('.server-header')
  await p.click('.ctx-item:has-text("Server Settings")')
  await p.click('.settings-item:has-text("Roles")')
  await p.click('.role-name:has-text("moderator")')
  await p.click('.swatch:not(.none) >> nth=0')
  await p.keyboard.press('Escape')
  await p.waitForTimeout(300)
  await p.click('[aria-label="Toggle member list"]')
  await p.waitForSelector('.member-name')
  const c = await p.locator('.member-name').first().evaluate((e) => getComputedStyle(e).color)
  if (c === 'rgb(228, 228, 232)') throw new Error('the role colour did not reach the name: ' + c)
  await p.click('[aria-label="Toggle member list"]')
})
await step('server discovery: the checklist answers from the server itself', async () => {
  await p.click('.server-header')
  await p.click('.ctx-item:has-text("Server Settings")')
  await p.click('.settings-item:has-text("Discovery")')
  await p.waitForSelector('.discovery-checklist')
  const rows = await p.locator('.discovery-check').count()
  if (rows !== 7) throw new Error(`${rows} requirements, not Discord's 7`)
  const before = await p.locator('.discovery-check.ok').count()
  // turning Community on has to tick the row that asks for it
  await p.click('.settings-item:has-text("Enable Community")')
  await p.click('[aria-label="Community enabled"]')
  await p.click('.settings-item:has-text("Discovery")')
  const after = await p.locator('.discovery-check.ok').count()
  if (after !== before + 1) throw new Error(`met ${before} then ${after}`)
  // the listing keeps what it is given
  await p.selectOption('#disc-primary', 'Gaming')
  await p.click('.discovery-pick:has-text("Music")')
  await p.fill('#disc-term', 'raiding')
  await p.press('#disc-term', 'Enter')
  if (!(await p.locator('.discovery-term:has-text("raiding")').count()))
    throw new Error('the search term did not stick')
  if ((await p.locator('.discovery-pick.on').count()) !== 1)
    throw new Error('the extra category did not stick')
})
await step('server settings: audit log recorded it', async () => {
  await p.click('.server-header')
  await p.click('.ctx-item:has-text("Server Settings")')
  await p.click('.settings-item:has-text("Audit Log")')
  if (!(await p.locator('.audit-row').count())) throw new Error('empty audit log')
})
await step('server settings: add an emoji', async () => {
  await p.click('.server-header')
  await p.click('.ctx-item:has-text("Server Settings")')
  await p.click('.settings-item:has-text("Emoji")')
  await p.fill('[aria-label="Search emoji"]', 'fire')
  await p.click('.emoji-result')
  if (!(await p.locator('.emoji-row').count())) throw new Error('emoji not added')
})
await step('server settings: mint an invite', async () => {
  await p.click('.server-header')
  await p.click('.ctx-item:has-text("Server Settings")')
  await p.click('.settings-item:has-text("Invites")')
  await p.click('.btn-primary:has-text("Create Invite")')
  const t = await p.locator('.invite-row code').first().innerText()
  if (!/^discord\.gg\/\w{8}$/.test(t)) throw new Error('bad code ' + t)
})
await step('channel settings: slowmode + topic', async () => {
  await p.locator('.sidebar-scroll .row:not(.nav)').first().hover()
  await p.locator('.sidebar-scroll .row:not(.nav)').first().locator('[aria-label="Edit channel"]').click()
  await p.waitForSelector('.settings-layer')
  await p.getByLabel('CHANNEL TOPIC').fill('a topic worth reading twice')
  await p.locator('[aria-label="Slowmode"]').fill('5')
  if ((await p.locator('.slowmode span').innerText()) !== '1 min') throw new Error('slowmode label wrong')
})
await step('a channel topic reaches the header, and opens in full', async () => {
  // the topic was set by the step above
  await p.waitForSelector('.header-topic')
  const t = await p.locator('.header-topic').innerText()
  if (!t.startsWith('a topic')) throw new Error('the header shows: ' + t)
  await p.click('.header-topic')
  await p.waitForSelector('.topic-full')
  await p.keyboard.press('Escape')
  if (await p.locator('.topic-full').count()) throw new Error('the dialog did not close')
})
await step('channel context menu has mute submenu', async () => {
  await p.locator('.sidebar-scroll .row:not(.nav)').first().click({ button: 'right' })
  await p.locator('.ctx-item:has-text("Mute Channel")').hover()
  await p.waitForSelector('.ctx-sub')
  if (!(await p.locator('.ctx-sub .ctx-item:has-text("For 15 Minutes")').count())) throw new Error('no durations')
})
// custom status lives inside the status submenu, where Discord keeps it
await step('custom status', async () => {
  await p.click('.user-card .id')
  await p.click('.p-btn:has-text("Online")')
  await p.click('.status-opt:has-text("Custom Status")')
  await p.waitForSelector('.status-modal')
  await p.fill('[aria-label="Custom status"]', 'building discord')
  await p.click('.modal-foot .btn-primary')
  await p.waitForTimeout(150)
})
await step('switch accounts panel', async () => {
  await p.click('.user-card .id')
  await p.click('.p-btn:has-text("Switch Accounts")')
  await p.waitForSelector('.accounts')
  await p.keyboard.press('Escape')
  await p.waitForTimeout(120)
})
await step('search filters parse', async () => {
  await say('needle in here')
  await say('haystack')
  await p.fill('.searchbox input', 'has:link needle')
  await p.waitForTimeout(250)
  if (await p.locator('.result').count()) throw new Error('has:link should exclude it')
  await p.fill('.searchbox input', 'from:Nebula needle')
  await p.waitForSelector('.result', { timeout: 2000 })
  await p.fill('.searchbox input', '')
})
await step('search options popover', async () => {
  await p.click('.searchbox input')
  await p.waitForSelector('.search-hints')
  if ((await p.locator('.search-hint').count()) !== 8) throw new Error('wrong filter count')
})
await step('friends page', async () => {
  await p.click('[aria-label="Direct Messages"]')
  await p.waitForSelector('.friends-empty')
  await p.click('.friends-add')
  await p.fill('[aria-label="Username"]', 'someone')
  await p.click('.add-friend-box .btn-primary')
  await p.waitForSelector('.add-friend-note')
})
/* ------------------------------------------------- the expression picker */

await step('the picker has all four of Discord\'s views', async () => {
  await p.click('.server-tile.srv')
  await p.waitForTimeout(300)
  await p.click('[aria-label="GIF"]')
  await p.waitForSelector('.picker', { timeout: 3000 })
  if ((await p.locator('.picker-tabs button').count()) !== 4) throw new Error('not four tabs')
  if (!(await p.locator('.picker-gif').count()))
    throw new Error('the GIF view has no GIFs in it')
  if (!(await p.locator('.picker-note:has-text("Tenor")').count()))
    throw new Error('the GIF view does not say where its GIFs come from')
  await p.click('.picker-tabs button[aria-label="Emoji"]')
  await p.waitForTimeout(200)
  if (!(await p.locator('.picker-cell').count())) throw new Error('the emoji view is empty')
  await p.keyboard.press('Escape')
})

await step('a sticker uploads, shows in the picker, and sends', async () => {
  await p.click('.server-header')
  await p.waitForSelector('.ctx-item', { timeout: 3000 })
  await p.click('.ctx-item:has-text("Server Settings")')
  await p.click('.settings-item:has-text("Stickers")')
  await p.waitForTimeout(250)
  await p.setInputFiles('.set-row-add input[type=file]', {
    name: 's.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAABnElEQVR4nO2b3VHEMAyEA0MJUBL0AYVBH1AS1wM8+cXnH8laW1ay32OSkXfXip2ZOx8HIeTKPKwc7Pf180/67MvPxxJtUwfRGO4xK5ApRZHGc9BBQIvNNJ6DCgJSZKXxHGsQj1YBnuYR45sC8DafsOgYap9djJfQvhLqDtjZ/HHo9akC2N18QqPTvAhGRxxAlNlPSPWKAohmPiHR3Q0gqvlETz/XgNbN6LOfaPl4mjHg8/f73bXb25dbnRbVDhid/ZLo1vXZdRI1P9A1oCdOKh5VR0IxgJHZX21uJISSL+4C3gK8YQD5hbPs/TVyf7AOkO7PvedQdaRAX4FV5pAfQ/A1oCZOKxpVp8eUT2GUSLTZEtwFvAV4wwC8BXjDALwFeHMXwKp/ZniR+2MHeAvwhgGULp51HSj5YgfUbpytC2p+2AGtm2fpgpYPdkDvgehd0NMv6oCoIUh0i1+BaCFI9XIN0DwcpQs0OtUdsHsIWn0mMzv9jDY6MaY1YJdusOgwL4LeIVjH54kRRJGcy54ZyrnsqbEaO54bJOTi/APcR7IOysst6gAAAABJRU5ErkJggg==',
      'base64',
    ),
  })
  await p.waitForTimeout(200)
  await p.fill('.set-row-add input.field', 'Blobwave')
  await p.click('.set-row-add .btn-primary')
  await p.waitForTimeout(200)
  if (!(await p.locator('.srv-stickers li').count())) throw new Error('sticker not added')
  await p.keyboard.press('Escape')
  await p.waitForTimeout(300)
  await p.click('[aria-label="Sticker"]')
  await p.waitForSelector('.picker-sticker', { timeout: 3000 })
  await p.click('.picker-sticker')
  await p.waitForTimeout(300)
  if ((await p.locator('.msg-sticker').count()) !== 1) throw new Error('sticker not sent')
})

/* ------------------------------------------------------------------ GIFs */

/** a three-frame animated GIF, so the badge and the favourite have something real */
const GIF =
  'R0lGODlhYABIAIEAAP///+tFngAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQAFAAAACwAAAAAYABIAAAI6gADCBxIsKDBgwgTKlzIsKHDhxAjSpxIsaLFixgzatzIsaPHjyBDihxJsqTJkyhTqlzJsqXLlzBjypxJs6bNmyAB6Ny5EydHnkCD+rQYtKjQoRCNKj2KdOHSpzybKoRKVafUg1WzXiWYtevWAF3DXg1LVipZsUjPlh2qFi3OtmtvwnVrc65XuXbv1syrlyZfrXX/UsUr+CnhwkoPIy6qeDHQxo57QnbsMzLTwJYlv80MIC3nppnNWh5LeevirwILox74dzVXu64Lzo2NNS7t2oNvN0ysu7fv38CDCx9OvLjx48iTK1/OvDnSgAAh+QQBFAACACwAAAAAYABIAIH///9YZfIAAAAAAAAI/wADCBxIsKDBgwgTKlzIsKHDhxAjSpxIsaLFixgzatzIsaPHjyBDihxJsqTJkyhTqlzJsqXLlzBjypxJs6bNmygFANjJcydOjgKCCtXZk+dPi0OTBi1q9ChEpVCXMgXgtGHUq1OpVk14tWvWrQe7iv0KdqDYs2TBnl2b1unat21/vmU7tepcuHWP3qXLVO9evkXl/kWb9+Zgwn0NH0Yc2OZixj0VP8ZamOZkr5VnXqacuObmqHFlfoYaOuZopaVhnk6aWvVqop0dv27tejXt2p9v496se/fj3r4XAw/+d7jp35m3Ck+utjjzsnuN45wr3S/nxmUdkn6enSFs7N3DixUfT768+fPo06tfz769+/fw48tPHxAAIfkEARQAAgAsAAAAAGAASACBO6VdFBQYAAAAAAAACOoAAQgcSLCgwYMIEypcyLChw4cQI0qcSLGixYsYM2rcyLGjx48gQ4ocSbKkyZMoU6pcybKly5cwY8qcSbOmzZswA+jcuRMnR55Ag/q0GLSo0KEQjSo9inTh0qc8myqESlWn1INVs14lmLXrVgBdw14NS1YqWbFIz5YdqhYtzrZrb8J1a3OuV7l279bMq5cmX611/1LFK/gp4cJKDyMuqngx0MaOe0J27DMy08CWJb/NHCAt56aZzVoeS3nr4q8CC6Me+Hc1V7uuC86NjTUu7dqDbzdMrLu379/AgwsfTry48ePIkytfzrz5yoAAOw=='

await step('a GIF is badged, stars into favourites, and sends from the picker', async () => {
  await p.click('.server-tile.srv')
  await p.waitForTimeout(300)
  await p.setInputFiles('.composer-wrap input[type=file]', {
    name: 'wave.gif',
    mimeType: 'image/gif',
    buffer: Buffer.from(GIF, 'base64'),
  })
  await p.waitForTimeout(250)
  await p.click('.composer-input')
  await p.press('.composer-input', 'Enter')
  await p.waitForTimeout(350)
  if (!(await p.locator('.attachment-gif').count())) throw new Error('no GIF badge')
  await p.hover('.attachment')
  await p.click('.attachment-fav')
  await p.waitForTimeout(250)
  if (!(await p.locator('.attachment-fav.on').count())) throw new Error('star did not stick')
  const before = await p.locator('.attachment').count()
  await p.click('[aria-label="GIF"]')
  await p.waitForSelector('.picker-gif', { timeout: 3000 })
  await p.click('.picker-gif')
  await p.waitForTimeout(350)
  if ((await p.locator('.attachment').count()) !== before + 1)
    throw new Error('the favourite did not send')
})

await step('the GIF tab has a real library, searchable and sendable', async () => {
  await p.click('[aria-label="GIF"]')
  await p.waitForSelector('.picker-gif', { timeout: 3000 })
  const all = await p.locator('.picker-gif').count()
  if (all < 20) throw new Error(`only ${all} gifs in the library`)
  await p.fill('.picker-search input', 'party')
  await p.waitForTimeout(300)
  const hits = await p.locator('.picker-gif').count()
  if (!(hits > 0 && hits < all)) throw new Error(`search did not narrow: ${hits} of ${all}`)
  const before = await p.locator('.attachment-gif').count()
  await p.click('.picker-gif')
  await p.waitForTimeout(350)
  if ((await p.locator('.attachment-gif').count()) !== before + 1)
    throw new Error('a library GIF did not send')
})

/* -------------------------------------------------- display name styles */

await step('Nitro letters the display name, and it follows the name around', async () => {
  await p.evaluate(() =>
    localStorage.setItem(
      'discord-ui:v4:subscription',
      JSON.stringify({ premiumType: 2, until: Date.now() + 250 * 864e5, source: 'purchase', interval: 2 }),
    ),
  )
  await p.reload()
  // wait on the app rather than the clock: a fixed pause after a reload is the
  // one thing in this file that loses when several browsers run at once
  await p.waitForSelector('[aria-label="User settings"]', { timeout: 15000 })
  await p.click('[aria-label="User settings"]')
  await p.waitForSelector('.settings-item:has-text("Profiles")', { timeout: 15000 })
  await p.click('.settings-item:has-text("Profiles")')
  await p.waitForSelector('.name-font:has-text("Orbitron")', { timeout: 15000 })
  await p.locator('.name-font:has-text("Orbitron")').click()
  await p.locator('.name-effect:has-text("Neon")').click()
  await p.waitForFunction(
    () => {
      const el = document.querySelector('.name-preview span')
      return !!el && /Orbitron/.test(getComputedStyle(el).fontFamily)
    },
    { timeout: 15000 },
  )
  const preview = await p.evaluate(() => {
    const el = document.querySelector('.name-preview span')
    const cs = getComputedStyle(el)
    return { font: cs.fontFamily, shadow: cs.textShadow }
  })
  if (!/Orbitron/.test(preview.font)) throw new Error('font not applied: ' + preview.font)
  if (preview.shadow === 'none') throw new Error('Neon drew no glow')
  await p.keyboard.press('Escape')
  await p.waitForTimeout(400)
  await p.click('.server-tile.srv')
  await p.waitForTimeout(300)
  if (await p.locator('.age-gate').count()) await p.click('.age-gate .btn-primary')
  await p.click('.composer-input')
  await p.fill('.composer-input', 'lettered')
  await p.press('.composer-input', 'Enter')
  await p.waitForTimeout(350)
  const inFeed = await p.evaluate(
    () => getComputedStyle(document.querySelector('.author span')).fontFamily,
  )
  if (!/Orbitron/.test(inFeed)) throw new Error('the feed did not letter it: ' + inFeed)
})

console.log('\nerrors:', errs.length ? errs : 'none')
console.log(fails ? `${fails} failing` : 'all passing')
await b.close()
process.exit(fails ? 1 : 0)
