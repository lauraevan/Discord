/**
 * The Quests tab against Discord's own rules.
 *
 * Everything asserted here is quoted from Discord's help centre — the Quests
 * FAQ (support article 22225719947543), the Orbs FAQ (30593690165783) and the
 * Nitro Quest Perk article (29790581779735) — read out of
 * Wumpus-Central/blog-tracker, which mirrors Discord's Zendesk hourly. The
 * quotes are in src/quests.ts beside the constants they set.
 */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
let fails = 0
const check = (label, ok, got) => {
  if (ok) console.log('PASS ', label)
  else { fails += 1; console.log('FAIL ', label, '\n    got:', got) }
}

/** Opens Quest Home, optionally as a 15-year-old three quests into the day. */
async function open(capped) {
  const p = await b.newPage({ viewport: { width: 1366, height: 882 } })
  await p.addInitScript(readFileSync('tools/session.js', 'utf8'))
  if (capped)
    await p.addInitScript(() => {
      const c = JSON.parse(localStorage.getItem('discord-ui:v4:credentials'))
      c[0].birthday = `${new Date().getFullYear() - 15}-01-01`
      localStorage.setItem('discord-ui:v4:credentials', JSON.stringify(c))
      const now = Date.now()
      const st = {}
      for (const [i, id] of ['q-watch-together', 'q-sketch-heads', 'q-chess'].entries())
        st[id] = {
          questId: id, enrolledAt: now - 4000e3, completedAt: now - (3 - i) * 600e3,
          claimedAt: null, progress: {},
        }
      localStorage.setItem('discord-ui:v4:quests', JSON.stringify(st))
    })
  p.on('pageerror', (e) => { fails += 1; console.log('FAIL  page error\n    ', String(e).split('\n')[0]) })
  await p.goto('file://' + process.cwd() + '/dist/index.html')
  await p.waitForTimeout(700)
  await p.click('.server-tile.discover, [aria-label="Discover"]').catch(async () => {
    await p.evaluate(() => { const t = [...document.querySelectorAll('.server-tile')]; t[t.length - 3]?.click() })
  })
  await p.waitForTimeout(400)
  await p.click('.dm-nav .row:has-text("Quests")').catch(() => {})
  await p.waitForTimeout(500)
  return p
}

{
  const p = await open(false)
  check('Quest Home opens with cards', (await p.locator('.quest-card').count()) > 0)
  check('no cap for an adult', (await p.locator('.quest-cap').count()) === 0)

  // "press the ellipsis on the Quest in-app promotion ... and then select Hide This"
  await p.locator('.quest-card-wrap').first().hover()
  await p.locator('.quest-card-more').first().click()
  await p.waitForTimeout(200)
  const label = (await p.locator('.quest-card-menu').innerText()).trim()
  check('the promotion menu offers Hide This', label === 'Hide This', label)
  await p.locator('.quest-card-menu button').click()
  await p.waitForTimeout(200)
  // "you can still view and accept the Quest in Quest Home"
  check('a hidden promotion keeps its card', (await p.locator('.quest-card-wrap.hidden-promo .quest-card').count()) === 1)

  // "press Accept Quest for a Play Quest or Start Video Quest for a Video Quest"
  const ctas = []
  for (const i of [0, 1, 2, 3, 4, 5, 6]) {
    const card = p.locator('.quest-card').nth(i)
    if (!(await card.count())) break
    await card.click()
    await p.waitForTimeout(300)
    ctas.push((await p.locator('.quest-sheet-foot .btn-primary').innerText().catch(() => '')).trim())
    await p.keyboard.press('Escape')
    await p.waitForTimeout(200)
  }
  check('both accept labels are Discord\'s', ctas.includes('Accept Quest') && ctas.includes('Start Video Quest'), ctas)
  check('the claim button says Claim Reward', !ctas.some((c) => /^Claim \d/.test(c)), ctas)
  await p.close()
}

{
  const p = await open(true)
  // "If you are between the ages of 13 and 17, you will only be able to complete three Quests per day."
  check('the daily cap shows for a 15-year-old', (await p.locator('.quest-cap').count()) === 1)
  await p.click('.quest-cap-why')
  await p.waitForTimeout(200)
  const why = (await p.locator('.quest-cap-detail').innerText()).trim()
  check('Why? explains the 24 hours', /24 hours/.test(why) && /in \d+ hours?/.test(why), why)

  // "While you cannot accept new Quests after reaching the cap, you can still
  //  claim rewards for Quests completed beforehand."
  await p.locator('.quest-card.unclaimed').last().click()
  await p.waitForTimeout(300)
  check('accepting is refused while capped', await p.locator('.quest-sheet-foot .btn-primary').isDisabled())
  await p.keyboard.press('Escape')
  await p.waitForTimeout(200)
  await p.locator('.quest-card.completed').first().click()
  await p.waitForTimeout(300)
  const claim = p.locator('.quest-sheet-foot .btn-primary')
  check('claiming still works while capped', (await claim.innerText()).trim() === 'Claim Reward' && !(await claim.isDisabled()))
  await p.close()
}

console.log(fails ? `\n${fails} failing` : '\nall passing')
await b.close()
process.exit(fails ? 1 : 0)
