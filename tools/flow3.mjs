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

await step('the Nitro tab opens on its five tabs', async () => {
  await p.click('.server-tile.home')
  await p.waitForTimeout(250)
  await p.click('.dm-nav .row:has-text("Nitro")')
  await p.waitForTimeout(300)
  const tabs = await p.locator('.nitro-tab').allInnerTexts()
  expect(
    tabs.join('|') === "Home|What's New|Best of Nitro|Plans|Compare",
    'wrong tabs: ' + tabs.join('|'),
  )
})

await step('subscribing grants the perks it says it does', async () => {
  await p.click('.nitro-tab:has-text("Plans")')
  await p.waitForTimeout(250)
  await p.click('.nitro-plan.nitro .nitro-plan-btn')
  await p.waitForTimeout(350)
  await p.click('.nitro-tab:has-text("Home")')
  await p.waitForTimeout(300)
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
  // the Orbs banner leads the tab, and every quest is a card in the grid
  expect((await p.locator('.orbs-hero').count()) === 1, 'no Orbs banner')
  expect((await p.locator('.quest-card').count()) === 6, 'expected six quest cards')
  await p.click('.quest-card:has-text("Chess In The Park")')
  await p.waitForTimeout(300)
  await p.clock.install()
  await p.click('.quest-sheet-foot .btn-primary')     // Accept Quest, starts the task
  await p.waitForTimeout(200)
  // the chess quest needs 600 seconds; run the clock past it
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

console.log('\nerrors:', errs.length ? errs.join('\n  ') : 'none')
console.log(fails ? `${fails} failing` : 'all passing')
await b.close()
process.exit(fails ? 1 : 0)
