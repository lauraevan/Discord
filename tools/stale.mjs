import { chromium } from 'playwright'
import { readFileSync as __readSession } from 'node:fs'
const cases = {
  'old schema (v1 servers)': { 'discord-ui:servers': '[{"id":"s1","name":"The Crew","initials":"TC","color":"#5865f2","badge":3}]' },
  'v2 servers (no categories)': { 'discord-ui:servers': '[{"id":"s1","name":"X","initials":"X","color":"#000","channels":[]}]' },
  'unparseable json': { 'discord-ui:servers': '{not json' },
  'wrong type': { 'discord-ui:servers': '"a string"', 'discord-ui:account': '42' },
  'null servers': { 'discord-ui:servers': 'null' },
  'stale theme id': { 'discord-ui:theme': '"midnight-does-not-exist"' },
  'bad messages': { 'discord-ui:messages': '{"a/b":[{"id":1}]}' },
  'bad account status': { 'discord-ui:account': '{"name":"N","handle":"n","color":"#fff","status":"asleep"}' },
  'channels missing kind': { 'discord-ui:servers': '[{"id":"s","name":"X","initials":"X","color":"#000","categories":[],"channels":[{"id":"c","name":"g"}]}]' },
  'v3 server (no roles)': { 'discord-ui:v3:servers': '[{"id":"s","name":"X","initials":"X","color":"#000","categories":[],"channels":[]}]' },
  'v4 server missing audit': { 'discord-ui:v4:servers': '[{"id":"s","name":"X","initials":"X","color":"#000","categories":[],"channels":[],"roles":[],"emojis":[],"invites":[]}]' },
  'nothing stored': {},
  // corrupt credentials or a session naming an account that is gone must fall
  // back to the account screens rather than a blank client
  'bad credentials': { 'discord-ui:v4:credentials': '[{"username":5}]', __auth: 'register' },
  'session for a missing account': { 'discord-ui:v4:session': '"ghost"', __auth: 'login' },
}
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
let bad = 0
for (const [label, seed] of Object.entries(cases)) {
  const p = await b.newPage({ viewport: { width: 1558, height: 743 } })
await p.addInitScript(__readSession('tools/session.js', 'utf8'))
  const errs = []
  p.on('pageerror', (e) => errs.push(String(e).split('\n')[0]))
  await p.addInitScript((s) => {
    for (const [k, v] of Object.entries(s)) if (k !== '__auth') localStorage.setItem(k, v)
  }, seed)
  await p.goto('file://' + process.cwd() + '/dist/index.html')
  await p.waitForTimeout(700)
  const len = (await p.locator('#root').innerHTML()).length
  const rail = await p.locator('.rail').count()
  // most cases should land in the client; the auth ones should land on the
  // matching account screen, which has no rail
  const want = seed.__auth
  const card = want ? await p.locator(`.auth-card-${want}`).count() : 0
  const ok = want
    ? len > 2000 && card === 1 && rail === 0 && errs.length === 0
    : len > 10000 && rail === 1 && errs.length === 0
  if (!ok) bad++
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(30)} root=${len} rail=${rail}` +
      (want ? ` ${want}=${card}` : '') +
      ` ${errs.join(' | ')}`,
  )
  await p.close()
}
await b.close()
console.log(bad ? `\n${bad} failing` : '\nall clear')
