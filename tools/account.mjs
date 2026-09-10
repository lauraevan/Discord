/**
 * The account actions in My Account, which used to be three dead buttons.
 *
 * Change Password is real: credentials are stored as a per-account random salt
 * and a SHA-256 of `salt:password` (src/auth.ts), so the current password can
 * genuinely be verified and a wrong one genuinely refused. Disable and Delete
 * differ the way Discord's do — one keeps the credential so signing in
 * recovers it, the other removes it.
 */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
let fails = 0
const check = (label, ok, got) => {
  if (ok) console.log('PASS ', label)
  else { fails += 1; console.log('FAIL ', label, '\n    got:', JSON.stringify(got)) }
}

const p = await b.newPage({ viewport: { width: 1366, height: 882 } })
await p.addInitScript(readFileSync('tools/session.js', 'utf8'))
p.on('pageerror', (e) => { fails += 1; console.log('FAIL  page error\n    ', String(e).split('\n')[0]) })
// The fixture stores a placeholder hash, so give the account a real one for a
// password we know. src/auth.ts hashes `salt:password` with SHA-256, and this
// is that hash computed in Node, so the verify path is genuinely exercised.
// It has to be a second init script rather than a post-load write: session.js
// re-runs on every navigation and would put the placeholder back.
const pw = 'correct-horse-battery'
const salt = 'a'.repeat(32)
const hash = createHash('sha256').update(`${salt}:${pw}`).digest('hex')
await p.addInitScript(
  ({ salt, hash }) => {
    const key = 'discord-ui:v4:credentials'
    const all = JSON.parse(localStorage.getItem(key) ?? '[]')
    localStorage.setItem(key, JSON.stringify(all.map((c) => ({ ...c, salt, hash }))))
  },
  { salt, hash },
)

await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForSelector('[aria-label="User settings"]', { timeout: 15000 })
await p.click('[aria-label="User settings"]')
await p.waitForSelector('.settings-item:has-text("My Account")', { timeout: 10000 })

await p.locator('.btn-primary:has-text("Change Password")').click()
await p.waitForSelector('.modal', { timeout: 10000 })
check('Change Password opens', (await p.locator('.modal-head h3').innerText()).trim() === 'Change Password')
const labels = (await p.locator('.modal .set-field label').allInnerTexts()).map((s) => s.trim())
check(
  "the fields are Discord's",
  labels.join('|') === 'CURRENT PASSWORD|NEW PASSWORD|CONFIRM NEW PASSWORD',
  labels,
)

// a wrong current password is refused
const fields = p.locator('.modal .set-field input')
await fields.nth(0).fill('definitely-not-it')
await fields.nth(1).fill('a-brand-new-one')
await fields.nth(2).fill('a-brand-new-one')
await p.locator('.modal-foot .btn-primary').click()
await p.waitForSelector('.form-error', { timeout: 10000 })
check('a wrong current password is refused', (await p.locator('.form-error').innerText()).includes('does not match'))
check('and the modal stays open', (await p.locator('.modal').count()) === 1)

// mismatched confirmation is refused too
await fields.nth(0).fill(pw)
await fields.nth(2).fill('something-else')
await p.locator('.modal-foot .btn-primary').click()
await p.waitForTimeout(400)
check('a mismatched confirmation is refused', (await p.locator('.form-error').innerText()).includes('do not match'))

// the right current password, and a matching confirmation, goes through
await fields.nth(2).fill('a-brand-new-one')
await p.locator('.modal-foot .btn-primary').click()
await p.waitForTimeout(600)
check(
  'the right current password is accepted',
  (await p.locator('.modal').count()) === 0,
  await p.locator('.form-error').innerText().catch(() => 'no error shown'),
)

// and the new password really is what is stored now
const rehashed = await p.evaluate(async () => {
  const c = JSON.parse(localStorage.getItem('discord-ui:v4:credentials'))[0]
  const bytes = new TextEncoder().encode(`${c.salt}:a-brand-new-one`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  const hash = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
  return hash === c.hash
})
check('the new password is what is stored', rehashed)


// Disable and Delete each confirm first, with their own warning
for (const [button, title] of [['Disable Account', 'Disable Account'], ['Delete Account', 'Delete Account']]) {
  await p.locator(`.btn-danger:has-text("${button}"), .btn-danger-outline:has-text("${button}")`).first().click()
  await p.waitForSelector('.modal', { timeout: 10000 })
  check(`${button} confirms first`, (await p.locator('.modal-head h3').innerText()).trim() === title)
  const body = (await p.locator('.confirm-body').innerText()).trim()
  check(
    `${button} warns the right way`,
    button === 'Delete Account'
      ? body.includes('not be able to log in again')
      : body.includes('recover it at any time'),
    body,
  )
  await p.locator('.modal-foot .btn-ghost').click()
  await p.waitForTimeout(300)
}

await b.close()
console.log(fails ? `\n${fails} failure(s)` : '\nall account checks pass')
process.exit(fails ? 1 : 0)
