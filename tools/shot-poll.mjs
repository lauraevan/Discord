import { chromium } from 'playwright'
import { readFileSync as __readSession } from 'node:fs'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1558, height: 743 } })
await p.addInitScript(__readSession('tools/session.js', 'utf8'))
const errs = []
p.on('pageerror', (e) => errs.push(String(e).split('\n')[0]))
await p.goto('file://' + process.cwd() + '/dist/index.html')
await p.waitForTimeout(400)
const say = async (t) => { await p.click('.composer-input'); await p.fill('.composer-input', t); await p.press('.composer-input','Enter'); await p.waitForTimeout(80) }
await say('does the poll work')
// create a poll from the + menu
await p.click('[aria-label="Upload a file"]')
await p.click('.plus-menu button:has-text("Create Poll")')
await p.waitForSelector('.poll-modal')
await p.fill('.poll-modal input[placeholder="What do you want to ask?"]', 'Is this actually Discord now?')
await p.fill('[aria-label="Answer 1"]', 'Yes')
await p.fill('[aria-label="Answer 2"]', 'Getting there')
await p.click('.poll-add')
await p.fill('[aria-label="Answer 3"]', 'No')
await p.click('.modal-foot .btn-primary')
await p.waitForSelector('.poll', { timeout: 3000 })
await p.click('.poll-opt')
await p.waitForTimeout(300)
// pin something to produce a system message
await p.locator('.group').first().hover()
await p.locator('.group').first().locator('[aria-label="Pin message"]').click()
await p.waitForTimeout(200)
// and a thread
await p.locator('.group').first().hover()
await p.locator('.group').first().locator('[aria-label="More"]').click()
await p.click('.ctx-item:has-text("Create Thread")')
await p.waitForTimeout(300)
// back to the parent channel so the poll and system messages are visible
await p.click('.row:not(.thread):has-text("ok-ui-test")')
await p.waitForTimeout(300)
await p.mouse.move(760, 200)
await p.screenshot({ path: process.argv[2] })
console.log('threads in sidebar:', await p.locator('.row', { hasText: 'does-the-poll' }).count())
console.log('errors:', errs.length ? errs : 'none')
await b.close()
