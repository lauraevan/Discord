import { chromium } from 'playwright'
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
  'nothing stored': {},
}
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
let bad = 0
for (const [label, seed] of Object.entries(cases)) {
  const p = await b.newPage({ viewport: { width: 1558, height: 743 } })
  const errs = []
  p.on('pageerror', (e) => errs.push(String(e).split('\n')[0]))
  await p.addInitScript((s) => {
    for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v)
  }, seed)
  await p.goto('file://' + process.cwd() + '/dist/index.html')
  await p.waitForTimeout(700)
  const len = (await p.locator('#root').innerHTML()).length
  const rail = await p.locator('.rail').count()
  const ok = len > 10000 && rail === 1 && errs.length === 0
  if (!ok) bad++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(28)} root=${len} rail=${rail} ${errs.join(' | ')}`)
  await p.close()
}
await b.close()
console.log(bad ? `\n${bad} failing` : '\nall clear')
