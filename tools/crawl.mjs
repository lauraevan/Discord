/**
 * Walks every surface in the app and reports anything the console complains
 * about — uncaught errors, React warnings, failed requests.
 *
 * A page error on a settings pane nobody opens is still a page error; this is
 * the cheapest way to find the ones no other harness reaches.
 */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1366, height: 882 } })
await p.addInitScript(readFileSync('tools/session.js', 'utf8'))

const problems = []
let where = 'boot'
p.on('pageerror', (e) => problems.push([where, 'error', String(e).split('\n')[0]]))
p.on('console', (m) => {
  if (m.type() !== 'error' && m.type() !== 'warning') return
  const t = m.text()
  // the singlefile build inlines everything, so a favicon 404 is expected
  if (/favicon/i.test(t)) return
  problems.push([where, m.type(), t.slice(0, 160)])
})

await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForSelector('.composer-input', { timeout: 20000 })

const seen = []
const visit = async (label, fn) => {
  where = label
  seen.push(label)
  try { await fn() } catch (e) { problems.push([label, 'nav', String(e).split('\n')[0].slice(0, 120)]) }
  await p.waitForTimeout(250)
}

// grow the server so every sidebar row exists
await visit('create channel', async () => {
  await p.locator('.cat-add').first().click()
  await p.waitForSelector('.modal', { timeout: 8000 })
  await p.fill('.modal .field, .modal input[type="text"]', 'ideas')
  await p.locator('.modal-foot .btn-primary').click()
  await p.waitForTimeout(400)
})

// --- every User Settings pane --------------------------------------------
await visit('open user settings', async () => {
  await p.click('[aria-label="User settings"]')
  await p.waitForSelector('.settings-item', { timeout: 8000 })
})
const userPanes = await p.locator('.settings-item').allInnerTexts()
for (const name of userPanes.map((s) => s.trim()).filter(Boolean)) {
  await visit(`user settings › ${name}`, async () => {
    await p.locator(`.settings-item:has-text("${name}")`).first().click({ timeout: 5000 })
    await p.waitForTimeout(200)
  })
}
await visit('close user settings', async () => { await p.keyboard.press('Escape') })

// --- every Server Settings pane ------------------------------------------
await visit('open server settings', async () => {
  await p.locator('.server-header').click()
  await p.waitForSelector('.ctx', { timeout: 8000 })
  await p.locator('.ctx-item:has-text("Server Settings")').click()
  await p.waitForSelector('.settings-item, .set-item', { timeout: 8000 })
})
const srvPanes = await p.locator('.settings-item, .set-item').allInnerTexts()
for (const name of srvPanes.map((s) => s.trim()).filter(Boolean)) {
  await visit(`server settings › ${name}`, async () => {
    await p.locator(`.settings-item:has-text("${name}"), .set-item:has-text("${name}")`).first().click({ timeout: 5000 })
    await p.waitForTimeout(200)
  })
}
await visit('close server settings', async () => { await p.keyboard.press('Escape') })

// --- the home surfaces ----------------------------------------------------
await visit('home', async () => {
  await p.locator('.server-tile.home').click()
  await p.waitForSelector('.dm-search', { timeout: 8000 })
})
for (const row of ['Friends', 'Nitro', 'Shop', 'Quests']) {
  await visit(`home › ${row}`, async () => {
    await p.locator(`.dm-nav .row:has-text("${row}")`).first().click({ timeout: 5000 })
    await p.waitForTimeout(400)
  })
}
for (const tab of ['Online', 'All', 'Pending', 'Blocked', 'Add Friend']) {
  await visit(`friends › ${tab}`, async () => {
    await p.locator('.dm-nav .row:has-text("Friends")').first().click()
    await p.waitForTimeout(200)
    await p.locator(`.friends-tab:has-text("${tab}"), .friends-add:has-text("${tab}")`).first().click({ timeout: 4000 })
  })
}

// --- Discover -------------------------------------------------------------
await visit('discover', async () => {
  await p.locator('.server-tile.discover, [aria-label="Discover"]').first().click()
  await p.waitForTimeout(500)
})
const discoverRows = await p.locator('.dm-nav .row').allInnerTexts().catch(() => [])
for (const row of discoverRows.map((s) => s.trim()).filter(Boolean)) {
  await visit(`discover › ${row}`, async () => {
    await p.locator(`.dm-nav .row:has-text("${row}")`).first().click({ timeout: 4000 })
    await p.waitForTimeout(300)
  })
}

// --- back to a server, and its own surfaces -------------------------------
await visit('server', async () => {
  await p.locator('.server-tile.srv').first().click()
  await p.waitForSelector('.composer-input', { timeout: 8000 })
})
for (const row of ['Events', 'Browse Channels']) {
  await visit(`server › ${row}`, async () => {
    await p.locator(`.row.nav:has-text("${row}")`).first().click({ timeout: 5000 })
    await p.waitForTimeout(400)
    await p.locator('.events-close').first().click({ timeout: 4000 }).catch(() => {})
  })
}
for (const [label, sel] of [
  ['threads panel', '.chat-tools [aria-label="Threads"]'],
  ['pins panel', '.chat-tools [aria-label="Pinned messages"]'],
  ['member list', '.chat-tools [aria-label="Toggle member list"]'],
  ['expression picker', '.composer-acts .emoji, .composer-acts button'],
]) {
  await visit(label, async () => {
    await p.locator(sel).first().click({ timeout: 5000 })
    await p.waitForTimeout(400)
    await p.keyboard.press('Escape')
  })
}

await b.close()

// a crawl that silently reached nothing would also report no problems, so the
// count is part of the result
console.log(`visited ${seen.length} surfaces:`)
for (const s of seen) console.log('   ', s)
if (seen.length < 40) {
  console.log(`\nonly ${seen.length} surfaces reached — the crawl is not covering the app`)
  process.exit(1)
}
if (!problems.length) {
  console.log('\nno console errors or warnings across any of them')
  process.exit(0)
}
console.log(`${problems.length} problem(s):\n`)
for (const [w, kind, msg] of problems) console.log(`  [${kind}] ${w}\n      ${msg}`)
process.exit(1)
