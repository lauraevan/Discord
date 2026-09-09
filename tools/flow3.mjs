/**
 * End-to-end checks for the account, server-creation, Nitro and Quest flows.
 *
 * The quest timer runs on real time — a fifteen-minute quest takes fifteen
 * minutes — so the clock is faked here and fast-forwarded, which exercises the
 * same heartbeat path the client uses rather than a shortcut in the app.
 */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const url = 'file://' + process.cwd() + '/dist/index.html'
let fails = 0

const step = async (label, fn) => {
  try {
    await fn()
    console.log('PASS ', label)
  } catch (e) {
    fails++
    console.log('FAIL ', label, '\n    ' + String(e).split('\n').slice(0, 6).join('\n    '))
  }
}

const expect = (cond, msg) => {
  if (!cond) throw new Error(msg)
}

/* ------------------------------------------------------------- registration */

let p = await b.newPage({ viewport: { width: 1400, height: 900 } })
const errs = []
p.on('pageerror', (e) => errs.push(String(e).split('\n')[0]))
await p.goto(url)
await p.waitForTimeout(400)

await step('a fresh browser lands on Create an account', async () => {
  expect(await p.locator('.auth-card-register h1').innerText() === 'Create an account', 'no register card')
})

await step('the register form rejects a bad username', async () => {
  await p.fill('#r-email', 'nova@example.com')
  await p.fill('#r-display', 'Nova')
  await p.fill('#r-username', 'Nova Star')
  await p.fill('#r-password', 'hunter22')
  await p.click('.auth-submit')
  await p.waitForTimeout(150)
  const text = await p.locator('.auth-label.bad').allInnerTexts()
  expect(text.join(' ').includes('numbers, letters, underscores'), 'no username error: ' + text)
})

await step('and a date of birth under thirteen', async () => {
  await p.fill('#r-username', 'nova')
  const year = String(new Date().getFullYear() - 5)
  await p.selectOption('#r-day', '1')
  await p.selectOption('.auth-dob select:nth-of-type(1)', 'January').catch(() => {})
  const selects = p.locator('.auth-dob select')
  await selects.nth(1).selectOption('January')
  await selects.nth(2).selectOption(year)
  await p.click('.auth-submit')
  await p.waitForTimeout(150)
  const text = (await p.locator('.auth-label.bad').allInnerTexts()).join(' ')
  expect(text.includes('older'), 'no age error: ' + text)
})

await step('a valid registration signs you in', async () => {
  await p.locator('.auth-dob select').nth(2).selectOption('2000')
  await p.click('.auth-submit')
  await p.waitForTimeout(600)
  expect(await p.locator('.user-card .name').innerText() === 'Nova', 'not signed in as Nova')
})

await step('the new account starts with its own server and no badges', async () => {
  expect((await p.locator('.server-tile.srv').count()) === 1, 'expected one server')
  await p.click('.user-card .id')
  await p.waitForTimeout(250)
  expect((await p.locator('.p-badge').count()) === 0, 'a new account should have no badges')
  await p.keyboard.press('Escape')
})

await step('logging out returns to the login screen, and back in restores it', async () => {
  await p.click('.user-card .acts button[aria-label="User settings"]')
  await p.waitForTimeout(400)
  await p.click('.settings-item:has-text("Log Out")')
  await p.waitForTimeout(200)
  await p.click('.btn-danger')
  await p.waitForTimeout(400)
  expect(await p.locator('.auth-card-login h1').innerText() === 'Welcome back!', 'no login card')
  await p.fill('#login', 'nova')
  await p.fill('#password', 'hunter22')
  await p.click('.auth-submit')
  await p.waitForTimeout(600)
  expect(await p.locator('.user-card .name').innerText() === 'Nova', 'could not log back in')
})

await step('a wrong password is refused', async () => {
  await p.evaluate(() => localStorage.setItem('discord-ui:v4:session', 'null'))
  await p.reload()
  await p.waitForTimeout(400)
  await p.fill('#login', 'nova')
  await p.fill('#password', 'wrong-one')
  await p.click('.auth-submit')
  await p.waitForTimeout(300)
  const text = (await p.locator('.auth-label.bad').allInnerTexts()).join(' ')
  expect(text.includes('invalid'), 'wrong password was accepted: ' + text)
  await p.fill('#password', 'hunter22')
  await p.click('.auth-submit')
  await p.waitForTimeout(600)
})

/* ---------------------------------------------------------- server creation */

await step('the create-server flow builds a server from a template', async () => {
  await p.click('.server-tile.plain.green')
  await p.waitForTimeout(300)
  expect(await p.locator('.cs-head h2').innerText() === 'Create a server', 'no create dialog')
  await p.click('.cs-template:has-text("Gaming")')
  await p.waitForTimeout(200)
  await p.click('.cs-intent:has-text("For me and my friends")')
  await p.waitForTimeout(200)
  await p.fill('#cs-name', 'Test Guild')
  await p.click('.cs-foot .btn-primary')
  await p.waitForTimeout(500)
  expect((await p.locator('.server-tile.srv').count()) === 2, 'server was not created')
  const names = await p.locator('.channel-row .row-name, .row .row-name').allInnerTexts()
  expect(names.includes('clips-and-highlights'), 'template channels missing: ' + names)
  expect(names.includes('Lobby'), 'template voice channels missing: ' + names)
})

await step('Create My Own gives the two channels a new server gets', async () => {
  await p.click('.server-tile.plain.green')
  await p.waitForTimeout(250)
  await p.click('.cs-own')
  await p.waitForTimeout(200)
  await p.click('.cs-inline-link')
  await p.waitForTimeout(200)
  await p.fill('#cs-name', 'Plain Guild')
  await p.click('.cs-foot .btn-primary')
  await p.waitForTimeout(500)
  const names = await p.locator('.row .row-name').allInnerTexts()
  expect(names.filter((n) => n === 'general' || n === 'General').length === 2, 'wrong default channels: ' + names)
})

/* ------------------------------------------------------------------- nitro */

await step('the Nitro tab is one marketing surface, section by section', async () => {
  await p.click('.server-tile.home')
  await p.waitForTimeout(250)
  await p.click('.dm-nav .row:has-text("Nitro")')
  await p.waitForTimeout(300)
  // the client routes Nitro as a single page and instruments it by section,
  // so every section is on the one surface rather than behind a tab
  for (const sel of [
    '.nitro-banner',
    '.nitro-hero',
    '.nitro-status',
    '.nitro-perks',
    '.nitro-tenure',
    '.nitro-plans',
    '.nitro-compare',
    '.nitro-redeem',
    '.nitro-footer-cta',
  ])
    expect((await p.locator(sel).count()) === 1, 'missing section ' + sel)
  expect((await p.locator('.nitro-perk').count()) === 8, 'the perk shelf should start at eight')
  await p.click('.nitro-seeall')
  await p.waitForTimeout(200)
  expect((await p.locator('.nitro-perk').count()) === 20, 'See all perks did not open the rest')
})

await step('subscribing grants the perks it says it does', async () => {
  await p.click('.nitro-plan.nitro .nitro-plan-btn')
  await p.waitForTimeout(350)
  const cards = await p.locator('.nitro-status-card').allInnerTexts()
  expect(cards.join(' ').includes('500MB'), 'upload perk not applied: ' + cards)
  expect(cards.join(' ').includes('2'), 'boosts not applied')
  await p.click('.user-card .id')
  await p.waitForTimeout(250)
  expect((await p.locator('.p-badge').count()) === 1, 'the Nitro badge was not granted')
  await p.keyboard.press('Escape')
})

await step('the message limit really moves to 4,000', async () => {
  await p.click('.server-tile.srv')
  await p.waitForTimeout(300)
  await p.fill('.composer-input', 'x'.repeat(3900))
  await p.waitForTimeout(200)
  expect(await p.locator('.composer-count').innerText() === '100', 'counter should read 100 left')
  await p.fill('.composer-input', '')
})

await step('and back to 2,000 once the subscription is cancelled', async () => {
  await p.click('.server-tile.home')
  await p.waitForTimeout(200)
  await p.click('.dm-nav .row:has-text("Nitro")')
  await p.waitForTimeout(250)
  await p.click('.nitro-cancel')
  await p.waitForTimeout(300)
  await p.click('.server-tile.srv')
  await p.waitForTimeout(300)
  await p.fill('.composer-input', 'x'.repeat(1900))
  await p.waitForTimeout(200)
  expect(await p.locator('.composer-count').innerText() === '100', 'counter should read 100 left')
  await p.fill('.composer-input', '')
})

await step('a gift can be bought and redeemed', async () => {
  await p.click('.server-tile.home')
  await p.waitForTimeout(200)
  await p.click('.dm-nav .row:has-text("Nitro")')
  await p.waitForTimeout(250)
  await p.click('.nitro-gift-btn')
  await p.waitForTimeout(300)
  expect(await p.locator('.gift-head h2').innerText() === 'Send a Gift', 'no gift dialog')
  await p.click('.gift-col.nitro .gift-price')
  await p.waitForTimeout(350)
  expect((await p.locator('.nitro-gifts li').count()) === 1, 'gift not added')
  await p.click('.nitro-gifts .btn-primary')
  await p.waitForTimeout(350)
  expect((await p.locator('.nitro-gifts li.used').count()) === 1, 'gift not marked redeemed')
  expect((await p.locator('.nitro-chip').count()) === 1, 'redeeming did not start a subscription')
})

/* ------------------------------------------------------------------ quests */

await step('a quest enrols, runs, completes and pays out', async () => {
  await p.click('.dm-nav .row:has-text("Quests")')
  await p.waitForTimeout(300)
  // the Orbs banner leads the tab, and the client's own sections follow it:
  // ending soon, all quests, expired
  expect((await p.locator('.orbs-hero').count()) === 1, 'no Orbs banner')
  const shelves = await p.locator('.quests-shelf-title').allInnerTexts()
  expect(
    shelves.some((t) => t.startsWith('Ending soon')),
    'no ending-soon shelf: ' + shelves.join('|'),
  )
  expect(
    shelves.some((t) => t.startsWith('Expired')),
    'no expired shelf: ' + shelves.join('|'),
  )
  // the grid holds the live quests; the expired one is filed under its own
  expect(
    (await p.locator('.quests-body > .quests-grid .quest-card').count()) === 6,
    'expected six live quest cards',
  )
  await p.click('.quests-body > .quests-grid .quest-card:has-text("Chess In The Park")')
  await p.waitForTimeout(300)
  await p.clock.install()
  await p.click('.quest-sheet-foot .btn-primary')     // Accept Quest, starts the task
  await p.waitForTimeout(200)
  // the chess quest needs 600 seconds. The client beats once a minute and
  // schedules its last beat at exactly the remaining time, so 700s of clock
  // covers it either way.
  await p.clock.runFor(700_000)
  await p.waitForTimeout(300)
  const count = await p.locator('.quest-count').innerText()
  expect(count.startsWith('10:00'), 'progress did not reach the target: ' + count)
  const claim = await p.locator('.quest-sheet-foot .btn-primary').innerText()
  expect(claim.includes('Claim'), 'not claimable: ' + claim)
  await p.click('.quest-sheet-foot .btn-primary')
  await p.waitForTimeout(300)
  const orbs = await p.locator('.quests-orbs').innerText()
  expect(orbs.replace(/\D/g, '') === '1500', 'wrong payout with the Nitro multiplier: ' + orbs)
  await p.click('.quest-sheet-foot .btn-ghost')
  await p.waitForTimeout(200)
  await p.clock.runFor(1000)
})

await step('the Orbs can be spent in the Shop, and the decoration is worn', async () => {
  await p.click('.dm-nav .row:has-text("Shop")')
  await p.waitForTimeout(300)
  await p.click('.shop-item:has-text("Cozy Cat") .shop-buy')
  await p.waitForTimeout(300)
  await p.click('.shop-item:has-text("Cozy Cat") .shop-buy')
  await p.waitForTimeout(300)
  expect((await p.locator('.shop-buy.equipped').count()) === 1, 'decoration not worn')
  expect((await p.locator('.user-card .avatar-decoration').count()) === 1, 'not shown on the avatar')
})

/* ------------------------------------------------------------- profiles */

await step('the profile can actually be changed, and the preview follows', async () => {
  await p.click('.user-card .acts button[aria-label="User settings"]')
  await p.waitForTimeout(400)
  await p.click('.settings-item:has-text("Profiles")')
  await p.waitForTimeout(300)
  // a decoration bought earlier in this run is offered, and wearing it lands
  // on the preview card and on the avatar everywhere else
  expect((await p.locator('.profile-pick').count()) > 1, 'no decoration to wear')
  await p.click('.profile-pick:has-text("Cozy Cat")')
  await p.waitForTimeout(250)
  expect(
    (await p.locator('.preview-card .avatar-decoration').count()) === 1,
    'the preview did not wear it',
  )
  await p.fill('.profile-edit-form textarea', 'wearing a cat')
  await p.waitForTimeout(200)
  expect(
    (await p.locator('.preview-card p').innerText()) === 'wearing a cat',
    'the preview did not follow About Me',
  )
  await p.click('.profile-tab:has-text("Server Profiles")')
  await p.waitForTimeout(250)
  await p.fill('.profile-edit-form input', 'Nebulaaa')
  await p.waitForTimeout(200)
  expect(
    (await p.locator('.preview-card b').innerText()) === 'Nebulaaa',
    'the server nickname did not reach the preview',
  )
  await p.keyboard.press('Escape')
  await p.waitForTimeout(250)
})

/* -------------------------------------------------------- server settings */

await step('an AutoMod rule really blocks a message', async () => {
  await p.click('.server-tile.srv')
  await p.waitForTimeout(300)
  await p.click('.server-header')
  await p.waitForTimeout(250)
  await p.click('text=Server Settings')
  await p.waitForTimeout(350)
  await p.click('.settings-item:has-text("AutoMod")')
  await p.waitForTimeout(250)
  await p.click('.srv-automod-add button:has-text("Custom words")')
  await p.waitForTimeout(250)
  expect((await p.locator('.srv-rules li').count()) === 1, 'rule not created')
  await p.fill('.srv-rules .field', 'bananas')
  await p.waitForTimeout(200)
  await p.keyboard.press('Escape')
  await p.waitForTimeout(300)

  const before = await p.locator('.group').count()
  await p.fill('.composer-input', 'i love bananas')
  await p.press('.composer-input', 'Enter')
  await p.waitForTimeout(300)
  expect((await p.locator('.composer-blocked').count()) === 1, 'AutoMod did not block')
  expect((await p.locator('.group').count()) === before, 'the blocked message was sent anyway')

  await p.fill('.composer-input', 'i love apples')
  await p.press('.composer-input', 'Enter')
  await p.waitForTimeout(300)
  expect((await p.locator('.group').count()) === before + 1, 'a clean message was blocked too')
})

/* -------------------------------------------------------------- uploads */

await step('a picked file waits in the composer, then sends with the message', async () => {
  await p.click('.server-tile.srv')
  await p.waitForTimeout(300)
  // a 2x2 red PNG is enough to exercise the whole path
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z4AATAxQxhBjAgIAAP//DEwBH1p9U7QAAAAASUVORK5CYII=',
    'base64',
  )
  await p.setInputFiles('.composer-wrap input[type=file]', {
    name: 'image.png',
    mimeType: 'image/png',
    buffer: png,
  })
  await p.waitForTimeout(300)
  expect((await p.locator('.upload-card').count()) === 1, 'no pending upload card')
  expect(
    (await p.locator('.upload-card figcaption').innerText()) === 'image.png',
    'wrong file name',
  )
  await p.hover('.upload-card')
  await p.click('.upload-acts button[aria-label="Mark as spoiler"]')
  await p.waitForTimeout(150)
  expect((await p.locator('.upload-card.spoiler').count()) === 1, 'spoiler not applied')
  const before = await p.locator('.group').count()
  await p.fill('.composer-input', 'with a file')
  await p.press('.composer-input', 'Enter')
  await p.waitForTimeout(400)
  expect((await p.locator('.upload-card').count()) === 0, 'tray did not clear')
  expect((await p.locator('.group').count()) === before + 1, 'message not sent')
  expect((await p.locator('.attachment').count()) === 1, 'attachment not carried')
})

/* ------------------------------------------------------ non-image uploads */

await step('a file Discord cannot preview gets its own card', async () => {
  await p.setInputFiles('.composer-wrap input[type=file]', {
    name: 'notes.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 notes'),
  })
  await p.waitForTimeout(300)
  expect((await p.locator('.upload-file').count()) === 1, 'pdf previewed as an image')
  await p.press('.composer-input', 'Enter')
  await p.waitForTimeout(400)
  const card = p.locator('.file-card').last()
  expect((await p.locator('.file-card').count()) === 1, 'no file card in the message')
  expect((await card.locator('.file-name').innerText()) === 'notes.pdf', 'wrong file name')
  // Discord's own class table puts a .pdf on the acrobat badge
  const badge = await card.locator('.file-badge').getAttribute('src')
  expect(badge != null && badge.length > 0, 'file badge missing')
})

/* ------------------------------------------------------------- age gate */

await step('an age-restricted channel opens on the gate, then lets you in', async () => {
  await p.locator('.row.active [aria-label="Edit channel"]').click({ force: true })
  await p.waitForSelector('.settings-layer', { timeout: 4000 })
  await p.locator('.set-row:has-text("Age-Restricted") .switch').click()
  await p.keyboard.press('Escape')
  await p.waitForTimeout(400)
  expect((await p.locator('.age-gate').count()) === 1, 'no age gate')
  expect((await p.locator('.composer-input').count()) === 0, 'composer still reachable')
  await p.click('.age-gate .btn-primary')
  await p.waitForTimeout(300)
  expect((await p.locator('.age-gate').count()) === 0, 'gate did not clear')
  expect((await p.locator('.composer-input').count()) === 1, 'composer did not come back')
})

/* --------------------------------------------------------- nameplates */

await step('a nameplate can be bought, worn, and shows behind the name', async () => {
  await p.evaluate(() => localStorage.setItem('discord-ui:v4:orbs', '9800'))
  await p.reload()
  await p.waitForTimeout(600)
  await p.click('.dm-nav .row:has-text("Shop")').catch(async () => {
    await p.click('.server-tile.home, [aria-label="Direct Messages"]')
    await p.click('.dm-nav .row:has-text("Shop")')
  })
  await p.waitForTimeout(400)
  await p.fill('.shop-search input', 'norway')
  await p.waitForTimeout(300)
  const card = p.locator('.shop-item:has-text("Norway")')
  expect((await card.count()) === 1, 'no Norway nameplate in the Shop')
  await card.locator('.shop-buy').click()
  await p.waitForTimeout(200)
  expect(
    (await card.locator('.shop-buy').innerText()).trim() === 'Wear',
    'buying did not turn the button into Wear',
  )
  await card.locator('.shop-buy').click()
  await p.waitForTimeout(200)
  expect((await p.locator('.shop-item.on').count()) === 1, 'wearing did not mark it worn')

  // and it shows behind the name in the member list
  await p.click('.server-tile.srv')
  await p.waitForTimeout(300)
  await p.click('[aria-label="Toggle member list"]')
  await p.waitForTimeout(300)
  expect((await p.locator('.member .nameplate').count()) === 1, 'no nameplate on the member row')
  const laid = await p.evaluate(() => {
    const el = document.querySelector('.member .nameplate')
    const r = el.getBoundingClientRect()
    return { w: Math.round(r.width), pos: getComputedStyle(el).position }
  })
  expect(laid.pos === 'absolute' && laid.w > 100, `nameplate not laid out: ${JSON.stringify(laid)}`)
})

/* ------------------------------------------- profiles open from anywhere */

await step('an avatar in the feed opens the user popout, and it can go full', async () => {
  await p.click('[aria-label="Toggle member list"]')
  // the reload above dropped the age gate's session consent, so pass it again
  if (await p.locator('.age-gate').count()) {
    await p.click('.age-gate .btn-primary')
    await p.waitForTimeout(300)
  }
  await p.click('.composer-input')
  await p.fill('.composer-input', 'open me')
  await p.press('.composer-input', 'Enter')
  await p.waitForTimeout(300)
  await p.locator('button.group-avatar').last().click()
  await p.waitForSelector('.popout.anchored', { timeout: 3000 })
  expect((await p.locator('.popout.anchored').count()) === 1, 'no anchored popout')
  await p.click('.popout .p-btn:has-text("View Full Profile")')
  await p.waitForTimeout(300)
  expect((await p.locator('.profile-modal').count()) === 1, 'View Full Profile did nothing')
  await p.keyboard.press('Escape')
  await p.waitForTimeout(200)
})

/* ------------------------------------------------------------ presence */

await step('presence is on the member list but never on a message', async () => {
  // leave whatever the last step opened
  if (await p.locator('.profile-modal').count()) await p.click('.profile-close')
  await p.keyboard.press('Escape')
  await p.waitForTimeout(250)
  const feed = await p.evaluate(
    () => document.querySelectorAll('.group .avatar-svg rect').length,
  )
  expect(feed === 0, `the feed is drawing ${feed} status indicators`)
  if (!(await p.locator('.member').count())) {
    await p.click('[aria-label="Toggle member list"]')
    await p.waitForTimeout(300)
  }
  const member = await p.evaluate(
    () => document.querySelectorAll('.member .avatar-svg rect').length,
  )
  expect(member === 1, `the member row drew ${member} status indicators`)
})

await step('the channel list drags, clamps and remembers', async () => {
  const left = () =>
    p.evaluate(() => Math.round(document.querySelector('.chat').getBoundingClientRect().x))
  const drag = async (by) => {
    const g = await p.locator('.side-grip').boundingBox()
    await p.mouse.move(g.x + g.width / 2, 400)
    await p.mouse.down()
    await p.mouse.move(g.x + g.width / 2 + by, 400, { steps: 8 })
    await p.mouse.up()
    await p.waitForTimeout(150)
  }
  const start = await left()
  await drag(-40)
  // the width is rounded to a whole pixel, so allow one either way
  expect(Math.abs((await left()) - (start - 40)) <= 1, 'dragging did not narrow the list')
  // Discord clamps the list between 240 and 340
  await drag(500)
  const wide = await left()
  await drag(-900)
  const narrow = await left()
  expect(
    Math.abs(wide - narrow - 100) <= 1,
    `the clamps span ${wide - narrow}px, not Discord's 100`,
  )
  // and it is written down, because Discord remembers where you left it
  await drag(30)
  const set = await left()
  const kept = await p.evaluate(() =>
    Number(JSON.parse(localStorage.getItem('discord-ui:v4:sidebar') ?? 'null')),
  )
  expect(
    Math.abs(Math.round(kept + 72.5) - set) <= 1,
    `the width on screen is ${set} but ${kept} was written down`,
  )
  await p.dblclick('.side-grip')
  await p.waitForTimeout(150)
  expect(Math.abs((await left()) - start) <= 1, 'double click did not put it back')
})

await step('the popout adds Discord\'s server sections, and only there', async () => {
  await p.click('.composer-input')
  await p.fill('.composer-input', 'for the popout')
  await p.press('.composer-input', 'Enter')
  await p.waitForTimeout(250)
  // from a message avatar, Discord adds Member Since, Roles and a note
  await p.click('.group-avatar >> nth=-1')
  await p.waitForSelector('.popout .p-note')
  // the labels are uppercased in CSS, so compare on the text itself
  const labels = (await p.locator('.popout .p-label').allInnerTexts()).map((t) => t.toLowerCase())
  expect(
    labels.join('|') === 'member since|roles|note',
    'the server popout reads ' + labels.join('|'),
  )
  expect(
    (await p.locator('.popout .p-role').innerText()).includes('@everyone'),
    'the roles section is empty',
  )
  // the note is Discord's, private and kept
  await p.fill('.popout .p-note', 'talks to himself')
  await p.keyboard.press('Escape')
  await p.waitForTimeout(200)
  await p.click('.group-avatar >> nth=-1')
  expect(
    (await p.locator('.popout .p-note').inputValue()) === 'talks to himself',
    'the note was not kept',
  )
  await p.keyboard.press('Escape')
  // the account panel's own popout has no server behind it, so none of that
  await p.click('.user-card .id')
  await p.waitForSelector('.popout')
  expect(
    (await p.locator('.popout .p-label').count()) === 0,
    'the account popout grew server sections',
  )
  await p.keyboard.press('Escape')
})

await step('a staged upload sits above the input, inside the same box', async () => {
  const png =
    'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAFklEQVR42mNk+M9QzzCKRsEoGgWjAAA6TQP9lRe0KgAAAABJRU5ErkJggg=='
  await p.keyboard.press('Escape')
  await p.mouse.move(760, 300)
  await p.waitForTimeout(200)
  await p.setInputFiles('input[type=file]', {
    name: 'shot.png',
    mimeType: 'image/png',
    buffer: Buffer.from(png, 'base64'),
  })
  await p.waitForSelector('.upload-card')
  expect(
    (await p.locator('.upload-card figcaption').innerText()) === 'shot.png',
    'the card is not named after the file',
  )
  // Discord puts the tray above the input, not under the composer
  const order = await p.evaluate(() => {
    const tray = document.querySelector('.upload-tray')
    const input = document.querySelector('.composer-input')
    if (!tray || !input) return 'missing'
    return tray.getBoundingClientRect().bottom <= input.getBoundingClientRect().top + 1
      ? 'above'
      : 'below'
  })
  expect(order === 'above', `the upload tray sits ${order} the input`)
  // the card's controls come up on hover, as Discord's do
  await p.hover('.upload-card')
  await p.locator('.upload-card [aria-label="Remove attachment"]').click()
  expect((await p.locator('.upload-card').count()) === 0, 'the card did not go')
})

await step('the compass opens Discover, with Discord\'s own three tabs', async () => {
  await p.click('[aria-label="Discover"]')
  await p.waitForSelector('.discover-hero')
  const nav = await p.locator('.dm-sidebar .row.nav .row-name').allInnerTexts()
  expect(
    nav.join('|') === 'Servers|Apps|Quests',
    'the Discover sidebar reads ' + nav.join('|'),
  )
  // the compass takes the rail's pill the way a server does
  const on = await p.locator('.server.active .server-tile.plain').count()
  expect(on === 1, 'the compass did not take the rail pill')
  // all sixteen of the directory's categories
  const cats = await p.locator('.discover-cat').count()
  expect(cats === 16, `the servers tab shows ${cats} categories, not 16`)
  await p.click('.discover-cat:has-text("Gaming")')
  const head = await p.locator('.discover-heading').innerText()
  expect(head === 'Gaming', 'picking a category did not retitle the grid: ' + head)
})
await step('Discover searches its categories, and switches to Apps', async () => {
  await p.fill('[aria-label="Explore communities"]', 'anime')
  expect((await p.locator('.discover-cat').count()) === 1, 'the search did not narrow')
  await p.fill('[aria-label="Explore communities"]', '')
  await p.click('.row.nav:has-text("Apps")')
  await p.waitForSelector('[aria-label="Search apps"]')
  const cats = await p.locator('.discover-cat').count()
  expect(cats === 9, `the apps tab shows ${cats} categories, not 9`)
  // Quests is the third tab, and it is the same page the home nav opens
  await p.click('.row.nav:has-text("Quests")')
  await p.waitForSelector('.quests-header, .quest-card, .quests')
})

console.log('\nerrors:', errs.length ? errs.join('\n  ') : 'none')
console.log(fails ? `${fails} failing` : 'all passing')
await b.close()
process.exit(fails ? 1 : 0)
