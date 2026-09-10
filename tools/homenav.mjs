/**
 * The Home surface's buttons, which used to be inert.
 *
 * Discord's DM search opens the Quick Switcher rather than being a field; the
 * DM list's + and the friends header's New Group DM both open Select Friends;
 * and the Inbox button opens the inbox. The copy asserted here is Discord's
 * own — "Find or start a conversation", "Select Friends", "Add Friend", and
 * the empty state "You don't have any friends to add!", which is what the
 * client really says when there is nobody to pick.
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
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForSelector('.server-tile', { timeout: 15000 })

// land on Home
await p.locator('.server-tile.home').click()
await p.waitForSelector('.dm-search', { timeout: 10000 })

// the search opens the Quick Switcher
await p.locator('.dm-search').click()
await p.waitForSelector('.switcher', { timeout: 10000 })
check('the DM search opens the Quick Switcher', (await p.locator('.switcher').count()) === 1)
await p.keyboard.press('Escape')
await p.waitForTimeout(300)

// the + opens Select Friends
await p.locator('[aria-label="Create DM"]').click()
await p.waitForSelector('.modal', { timeout: 10000 })
check('Create DM opens Select Friends', (await p.locator('.modal-head h3').innerText()).trim() === 'Select Friends')
const empty = (await p.locator('.fwd-empty').innerText()).trim()
check("it shows Discord's own empty state", empty === "You don’t have any friends to add!", empty)
check('and offers Add Friend', (await p.locator('.modal-foot .btn-primary').innerText()).trim() === 'Add Friend')
await p.locator('.modal-foot .btn-primary').click()
await p.waitForTimeout(400)
check('Add Friend lands on the Add Friend tab', (await p.locator('.friends-add.on').count()) === 1)

// New Group DM opens the same picker
await p.locator('[aria-label="New group DM"]').click()
await p.waitForSelector('.modal', { timeout: 10000 })
check('New Group DM opens Select Friends too', (await p.locator('.modal-head h3').innerText()).trim() === 'Select Friends')
await p.keyboard.press('Escape')
await p.waitForTimeout(300)

// Inbox opens
await p.locator('.chat-tools [aria-label="Inbox"]').click()
await p.waitForTimeout(400)
check('the Inbox button opens the inbox', (await p.locator('.inbox').count()) === 1)

await b.close()
console.log(fails ? `\n${fails} failure(s)` : '\nall home-nav checks pass')
process.exit(fails ? 1 : 0)
