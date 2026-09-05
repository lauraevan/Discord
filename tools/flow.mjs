import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1558, height: 743 } })
const errs = []
p.on('pageerror', (e) => errs.push(String(e).split('\n')[0]))
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(500)
const step = async (label, fn) => {
  try { await fn(); console.log('PASS ', label) }
  catch (e) { console.log('FAIL ', label, '\n    ' + String(e).split('\n').slice(0,16).join('\n    ')) }
  await p.mouse.move(760, 400)   // park the pointer away from any hover target
  await p.waitForTimeout(250)
}
await step('send a message', async () => {
  await p.fill('.composer-input', 'hello world')
  await p.press('.composer-input', 'Enter')
  await p.waitForSelector('.msg-line', { timeout: 2000 })
})
await step('create a server', async () => {
  await p.click('[aria-label="Add a Server"]')
  await p.fill('.modal input', 'Test Server')
  await p.click('.modal-foot .btn-primary')
  await p.waitForFunction(() => document.querySelectorAll('.server-initials').length >= 2, null, { timeout: 2000 })
})
await step('create a channel', async () => {
  await p.click('[aria-label="Create channel"]')
  await p.fill('.modal input', 'new-channel')
  await p.click('.modal-foot .btn-primary')
  await p.waitForFunction(() => [...document.querySelectorAll('.row-name')].some(e => e.textContent === 'new-channel'), null, { timeout: 2000 })
})
await step('edit + delete a channel', async () => {
  await p.click('.row.active [aria-label="Edit channel"]', { timeout: 5000 })
  await p.waitForSelector('.modal', { timeout: 2000 })
  await p.click('.modal .btn-ghost.danger')
  await p.waitForFunction(() => !document.querySelector('.modal'), null, { timeout: 2000 })
})
await step('profile popout', async () => {
  await p.click('.user-card .id')
  await p.waitForSelector('.popout', { timeout: 2000 })
  await p.keyboard.press('Escape')
})
await step('escape closes a modal', async () => {
  await p.click('.row.active [aria-label="Edit channel"]')
  await p.waitForSelector('.modal', { timeout: 2000 })
  await p.keyboard.press('Escape')
  await p.waitForFunction(() => !document.querySelector('.modal'), null, { timeout: 2000 })
})
await step('theme panel', async () => {
  await p.keyboard.press('Escape')
  await p.click('[aria-label="User settings"]')
  await p.waitForSelector('.theme-panel, .panel', { timeout: 2000 })
})
await step('reload keeps state', async () => {
  await p.reload(); await p.waitForTimeout(600)
  const n = await p.locator('.server-initials').count()
  if (n < 2) throw new Error('server did not persist (' + n + ')')
})
console.log('\nerrors:', errs.length ? errs : 'none')
await b.close()
