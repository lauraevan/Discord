/**
 * Forward, against Discord's own strings.
 *
 * Every label asserted here is verbatim from Discord's shipped client string
 * table (docs/sources/discord-strings.json) — "Forward", "Forward To",
 * "Add a comment", "Send", "Forwarded", and the one rule the client enforces:
 * "Messages cannot be forwarded from age-restricted to unrestricted channels."
 * Check any of them with `tools/strings.py has "..."`.
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
await p.waitForTimeout(800)

await p.click('.composer-input')
await p.fill('.composer-input', 'worth passing along')
await p.press('.composer-input', 'Enter')
await p.waitForTimeout(300)

await p.locator('.group').last().click({ button: 'right' })
await p.waitForTimeout(250)
const items = (await p.locator('.ctx').innerText()).split('\n').map((s) => s.trim())
check('the menu offers Forward', items.includes('Forward'), items)
check('and Super React, Apps and Speak Message', ['Super React', 'Apps', 'Speak Message'].every((x) => items.includes(x)), items)

await p.locator('.ctx-item:has-text("Forward")').click()
await p.waitForTimeout(300)
check('the modal is Forward To', (await p.locator('.modal-head h3').innerText()).trim() === 'Forward To')
check('it has a comment box', (await p.locator('[aria-label="Add a comment"]').count()) === 1)
check('Send is disabled until a target is picked', await p.locator('.modal-foot .btn-primary').isDisabled())

const rows = await p.locator('.fwd-row').count()
check('it lists channels to forward into', rows > 0, rows)

// pick a channel that is not the one we are in, so the forward is visible
const names = await p.locator('.fwd-name').allInnerTexts()
const other = names.findIndex((n) => n.trim() !== 'general')
await p.locator('.fwd-row').nth(other === -1 ? 0 : other).click()
await p.waitForTimeout(150)
check('Send enables once a target is picked', !(await p.locator('.modal-foot .btn-primary').isDisabled()))
await p.fill('[aria-label="Add a comment"]', 'look at this')
await p.locator('.modal-foot .btn-primary:has-text("Send")').click()
await p.waitForTimeout(400)
check('the modal closes', (await p.locator('.modal').count()) === 0)

// go to the destination and check the snapshot landed
const target = names[other === -1 ? 0 : other].trim()
await p.locator(`.row:has-text("${target}")`).first().click()
await p.waitForTimeout(400)
check('the forward arrived', (await p.locator('.forwarded').count()) === 1)
const label = (await p.locator('.forwarded-label').innerText()).trim()
check('it is labelled Forwarded', label === 'Forwarded', label)
const body = (await p.locator('.forwarded-body').innerText()).trim()
check('it carries the original text', body === 'worth passing along', body)
const from = (await p.locator('.forwarded-from').innerText()).trim()
check('and names where it came from', from === '#general', from)
const line = (await p.locator('.group').last().locator('.msg-line').innerText()).trim()
check('the comment is the message body', line === 'look at this', line)

await b.close()
console.log(fails ? `\n${fails} failure(s)` : '\nall forward checks pass')
process.exit(fails ? 1 : 0)
