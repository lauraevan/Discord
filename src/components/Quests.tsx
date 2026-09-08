import { useCallback, useEffect, useRef, useState } from 'react'
import {
  HEARTBEAT_INTERVAL_S,
  nextBeatMs,
  ORB_MULTIPLIER,
  QUESTS,
  RewardType,
  SORT_LABELS,
  SortOrder,
  TASK_VERB,
  isClaimed,
  isComplete,
  isExpired,
  isEnrolled,
  mmss,
  orbValue,
  progressOf,
  questState,
  sortQuests,
  taskLabel,
  taskOf,
  timeLeft,
  type Quest,
  type QuestUserStatus,
  type SortOrderValue,
} from '../quests'
import { QuestKeyArt } from '../ui/QuestArt'
import orbsHero from '../assets/quests/orbs-hero.jpg'
import {
  CheckSmallIcon,
  ChevronDownIcon,
  CircleCheckIcon,
  FiltersIcon,
  MoreIcon,
  ClockIcon,
  OrbsIcon,
  PauseIcon,
  PlayIcon,
  QuestsIcon,
  SearchIcon,
  SparkleIcon,
  TrophyIcon,
} from '../ui/Icons'

/**
 * The Quests tab.
 *
 * The quest object, the task types, the reward types, the enrollment states,
 * the sort orders and the brand colours are the client's own (see
 * src/quests.ts). The quests on offer are Discord's first-party Activities.
 *
 * The tasks run for real: enrolling writes a userStatus, the task ticks the
 * way the client's heartbeat does — every 30 seconds of running time, with the
 * elapsed seconds added to `progress[eventName].value` — and the quest only
 * completes when `value` reaches the task's target. Nothing is skipped or
 * faked forward; a fifteen-minute quest takes fifteen minutes of the task
 * actually running, and stops the moment it is paused.
 */


export function QuestsPage({
  status,
  orbs,
  multiplier,
  onEnroll,
  onBeat,
  onClaim,
}: {
  status: Record<string, QuestUserStatus>
  orbs: number
  multiplier: boolean
  onEnroll: (q: Quest) => void
  onBeat: (questId: string, seconds: number, terminal?: boolean) => void
  onClaim: (q: Quest, orbs: number) => void
}) {
  const [sort, setSort] = useState<SortOrderValue>(SortOrder.SUGGESTED)
  const [query, setQuery] = useState('')
  const [sortOpen, setSortOpen] = useState(false)
  const [tab, setTab] = useState<'all' | 'claimed'>('all')
  const [openId, setOpenId] = useState<string | null>(null)

  const quests: Quest[] = QUESTS.map((q) => ({ ...q, userStatus: status[q.id] ?? null }))
  const ordered = sortQuests(quests, sort)
  const open = quests.find((q) => q.id === openId) ?? null
  const claimed = quests.filter(isClaimed).length

  /**
   * The tab's sections are the client's own: it instruments Quest Home as
   * hero, featured, in progress, ending soon, discovered and expired, each a
   * separate content location, so those are the shelves here.
   */
  const live = ordered.filter((q) => !isExpired(q))
  const inProgress = live.filter((q) => isEnrolled(q) && !isComplete(q))
  const endingSoon = live.filter(
    (q) => !isClaimed(q) && q.config.expiresAt - Date.now() < 7 * 24 * 3600e3,
  )
  const expired = ordered.filter((q) => isExpired(q))
  const hit = query.trim().toLowerCase()
  const results = hit
    ? quests.filter((q) =>
        (q.config.messages.gameTitle + ' ' + q.config.messages.questName)
          .toLowerCase()
          .includes(hit),
      )
    : []
  const shown = tab === 'claimed' ? ordered.filter(isClaimed) : live

  return (
    <main className="chat quests">
      <header className="quests-header">
        <QuestsIcon size={24} className="quests-mark" />
        <nav className="quests-tabs">
          <button
            className={'quests-tab' + (tab === 'all' ? ' on' : '')}
            onClick={() => setTab('all')}
          >
            All Quests
          </button>
          <button
            className={'quests-tab' + (tab === 'claimed' ? ' on' : '')}
            onClick={() => setTab('claimed')}
          >
            Claimed Quests
          </button>
        </nav>
        <div className="quests-header-right">
          <label className="quests-search">
            <input
              value={query}
              placeholder="Search Quests"
              onChange={(e) => setQuery(e.target.value)}
            />
            <SearchIcon size={16} />
          </label>
          {multiplier ? (
            <span className="quests-multiplier">
              <SparkleIcon size={14} />
              {ORB_MULTIPLIER}× Orbs
            </span>
          ) : null}
          <span className="quests-orbs">
            <OrbsIcon size={18} />
            {orbs.toLocaleString()}
          </span>
        </div>
      </header>

      <div className="quests-body">
        {hit ? (
          <>
            <h2 className="quests-shelf-title">
              {results.length} result{results.length === 1 ? '' : 's'} for “{query.trim()}”
            </h2>
            {results.length ? (
              <div className="quests-grid">
                {results.map((q) => (
                  <QuestCard key={q.id} quest={q} onOpen={() => setOpenId(q.id)} />
                ))}
              </div>
            ) : (
              <p className="quests-count">No Quest matched that.</p>
            )}
          </>
        ) : tab === 'claimed' ? (
          <>
            <h2 className="quests-shelf-title">Claimed Quests</h2>
            {shown.length ? (
              <div className="quests-grid">
                {shown.map((q) => (
                  <QuestCard key={q.id} quest={q} onOpen={() => setOpenId(q.id)} />
                ))}
              </div>
            ) : (
              <p className="quests-count">
                No claimed Quests yet — finish one and its reward lands here.
              </p>
            )}
          </>
        ) : (
          <>
            <OrbsHero />

            {inProgress.length ? (
              <Shelf title="In progress" quests={inProgress} onOpen={setOpenId} />
            ) : null}

            {endingSoon.length ? (
              <Shelf title="Ending soon" quests={endingSoon} onOpen={setOpenId} />
            ) : null}

            <div className="quests-bar">
              <h2>All Quests</h2>
              <div className="quests-controls">
                <div className="quests-select">
                  <button className="quests-select-btn" onClick={() => setSortOpen((v) => !v)}>
                    {SORT_LABELS[sort]}
                    <ChevronDownIcon size={16} />
                  </button>
                  {sortOpen ? (
                    <>
                      <div className="quests-select-away" onClick={() => setSortOpen(false)} />
                      <ul className="quests-select-menu">
                        {(Object.values(SortOrder) as SortOrderValue[]).map((o) => (
                          <li key={o}>
                            <button
                              className={o === sort ? 'on' : ''}
                              onClick={() => {
                                setSort(o)
                                setSortOpen(false)
                              }}
                            >
                              {SORT_LABELS[o]}
                              {o === sort ? <CheckSmallIcon size={16} /> : null}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </div>
                <button className="quests-filters">
                  Filters
                  <FiltersIcon size={16} />
                </button>
              </div>
            </div>

            <div className="quests-grid">
              {shown.map((q) => (
                <QuestCard key={q.id} quest={q} onOpen={() => setOpenId(q.id)} />
              ))}
            </div>

            {expired.length ? (
              <Shelf title="Expired" quests={expired} onOpen={setOpenId} dim />
            ) : null}

            <p className="quests-count">
              {claimed} of {quests.length} Quests claimed.
            </p>
          </>
        )}
      </div>

      {open ? (
        <QuestSheet
          quest={open}
          multiplier={multiplier}
          onClose={() => setOpenId(null)}
          onEnroll={onEnroll}
          onBeat={onBeat}
          onClaim={onClaim}
        />
      ) : null}
    </main>
  )
}

/**
 * A shelf: one of Quest Home's sections, with its own row of cards. The client
 * files these separately — featured, in progress, ending soon, discovered,
 * expired — rather than showing one flat list.
 */
function Shelf({
  title,
  quests,
  onOpen,
  dim,
}: {
  title: string
  quests: Quest[]
  onOpen: (id: string) => void
  dim?: boolean
}) {
  return (
    <section className={'quests-shelf' + (dim ? ' dim' : '')}>
      <h2 className="quests-shelf-title">
        {title}
        <span>{quests.length}</span>
      </h2>
      <div className="quests-grid">
        {quests.map((q) => (
          <QuestCard key={q.id} quest={q} onOpen={() => onOpen(q.id)} />
        ))}
      </div>
    </section>
  )
}

/** The card's poster: the quest's key art with its own colours. */
function QuestPoster({
  quest,
  className,
  wide,
}: {
  quest: Quest
  className?: string
  wide?: boolean
}) {
  return (
    <QuestKeyArt
      id={quest.id}
      colors={quest.config.colors}
      title={quest.config.messages.gameTitle}
      className={className}
      wide={wide}
    />
  )
}

/** "Ends 9/7" — the date Discord prints on a quest card. */
const endsOn = (at: number) => {
  const d = new Date(at)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function QuestCard({ quest, onOpen }: { quest: Quest; onOpen: () => void }) {
  const task = taskOf(quest)
  const value = progressOf(quest)
  const state = questState(quest)
  const pct = Math.round((value / task.target) * 100)
  return (
    <button className={'quest-card ' + state} onClick={onOpen}>
      <span className="quest-card-art">
        <QuestPoster quest={quest} />
        <span className="quest-card-more" aria-hidden>
          <MoreIcon size={18} />
        </span>
        {state === 'claimed' ? (
          <span className="quest-card-badge done">
            <CheckSmallIcon size={13} />
            Claimed
          </span>
        ) : state === 'completed' ? (
          <span className="quest-card-badge ready">Ready to claim</span>
        ) : isEnrolled(quest) ? (
          <span className="quest-card-progress">
            <i style={{ width: `${pct}%` }} />
          </span>
        ) : null}
      </span>
      <span className="quest-card-foot">
        <span className="quest-card-promo">
          Promoted by
          <CircleCheckIcon size={15} className="quest-verified" />
          <b>{quest.config.messages.gamePublisher}</b>
        </span>
        <span className="quest-card-ends">Ends {endsOn(quest.config.expiresAt)}</span>
      </span>
    </button>
  )
}

/**
 * The Discord Orbs banner across the top of the tab.
 *
 * Discord leads the Quests tab with this rather than with a quest: the Orbs
 * key art, the headline, the line about earning and spending, and two buttons
 * — a white primary to the Orbs Exclusives shelf and a dark secondary to the
 * terms.
 */
function OrbsHero() {
  return (
    <section className="orbs-hero">
      <img className="orbs-hero-art" src={orbsHero} alt="" aria-hidden="true" />
      <div className="orbs-hero-body">
        <h1>
          Introducing
          <br />
          Discord Orbs
        </h1>
        <p>Reward Your Play. Earn through Quests. Spend in the Shop.</p>
        <div className="orbs-hero-actions">
          <button className="orbs-cta">Explore Orbs Exclusives</button>
          <button className="orbs-cta secondary">Discord Orbs Terms</button>
        </div>
      </div>
    </section>
  )
}

/**
 * The quest detail sheet, with the task actually running.
 *
 * The client keeps a quest's progress alive with a heartbeat every 30 seconds
 * and the server adds the elapsed time, so the timer here beats on the same
 * interval. The beat itself is applied by the owner of the quest state, from
 * the state it already holds — a tick that read the quest through a prop or a
 * ref would drop progress whenever several beats land before React has
 * re-rendered. Leaving the sheet stops the task, exactly as closing the game
 * does.
 */
function QuestSheet({
  quest,
  multiplier,
  onClose,
  onEnroll,
  onBeat,
  onClaim,
}: {
  quest: Quest
  multiplier: boolean
  onClose: () => void
  onEnroll: (q: Quest) => void
  onBeat: (questId: string, seconds: number, terminal?: boolean) => void
  onClaim: (q: Quest, orbs: number) => void
}) {
  const task = taskOf(quest)
  const questId = quest.id
  const done = isComplete(quest)
  // "started" is what the button toggles; the task stops on its own once the
  // quest completes, so whether it is running is derived rather than stored
  const [started, setStarted] = useState(false)
  const running = started && !done

  const value = progressOf(quest)

  /**
   * The heartbeat, scheduled the way the client's own manager schedules it: a
   * beat a minute, except that when less than a minute of the task is left the
   * next beat is set for exactly the remaining time plus a second, so the
   * quest finishes on a beat instead of up to a minute after it. Each beat
   * credits the time that has actually passed since the last one.
   *
   * The loop schedules its own next beat rather than re-arming off a render,
   * so it keeps its cadence whether or not React has caught up — which is also
   * what makes it testable against a faked clock.
   */
  const valueRef = useRef(value)
  valueRef.current = value

  useEffect(() => {
    if (!running) return
    let timer = 0
    let credited = valueRef.current
    const schedule = () => {
      const ms = nextBeatMs(task.target - credited)
      timer = window.setTimeout(() => {
        const seconds = Math.round(ms / 1000)
        credited = Math.min(task.target, credited + seconds)
        onBeat(questId, seconds)
        if (credited < task.target) schedule()
      }, ms)
    }
    schedule()
    return () => window.clearTimeout(timer)
  }, [running, questId, task.target, onBeat])

  /** Stopping the task sends the terminal beat the client sends. */
  const stop = useCallback(() => {
    setStarted(false)
    if (!done) onBeat(questId, 0, true)
  }, [done, questId, onBeat])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // leaving with the task running is what the client sends a terminal beat for
  useEffect(() => () => stopRef.current?.(), [])
  const stopRef = useRef<(() => void) | null>(null)
  stopRef.current = running ? stop : null

  const pct = Math.min(100, (value / task.target) * 100)
  const payout = orbValue(quest) * (multiplier ? ORB_MULTIPLIER : 1)

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="quest-sheet" onMouseDown={(e) => e.stopPropagation()}>
        <div
          className="quest-sheet-hero"
        >
          <QuestPoster quest={quest} className="quest-sheet-art" />
          <div>
            <h2>{quest.config.messages.questName}</h2>
            <p>
              {quest.config.messages.gameTitle} · {quest.config.messages.gamePublisher}
            </p>
          </div>
        </div>

        <div className="quest-sheet-body">
          <h3>Requirement</h3>
          <p className="quest-task">{taskLabel(task)}</p>

          <div className="quest-progress">
            <span className="quest-bar big">
              <i style={{ width: `${pct}%` }} />
            </span>
            <span className="quest-count">
              {mmss(value)} / {mmss(task.target)}
            </span>
          </div>

          <h3>Reward</h3>
          <ul className="quest-rewards">
            {quest.config.rewardsConfig.rewards.map((r) => (
              <li key={r.skuId + r.name}>
                {r.type === RewardType.VIRTUAL_CURRENCY ? <OrbsIcon size={18} /> : <TrophyIcon size={18} />}
                <span>{r.name}</span>
                {r.type === RewardType.VIRTUAL_CURRENCY && multiplier ? (
                  <em>×{ORB_MULTIPLIER} with Nitro</em>
                ) : null}
                {r.expiresInDays ? <em>{r.expiresInDays} days</em> : null}
              </li>
            ))}
          </ul>

          <p className="quest-expiry">
            <ClockIcon size={14} />
            {timeLeft(quest.config.expiresAt)}
          </p>
        </div>

        <div className="quest-sheet-foot">
          <button className="btn-ghost" onClick={onClose}>
            Close
          </button>
          {isClaimed(quest) ? (
            <span className="quest-claimed">
              <CheckSmallIcon size={18} />
              Reward claimed
            </span>
          ) : isComplete(quest) ? (
            <button className="btn-primary" onClick={() => onClaim(quest, payout)}>
              Claim {payout.toLocaleString()} Orbs
            </button>
          ) : !isEnrolled(quest) ? (
            <button
              className="btn-primary"
              onClick={() => {
                onEnroll(quest)
                setStarted(true)
              }}
            >
              Accept Quest
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={() => (running ? stop() : setStarted(true))}
            >
              {running ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
              {running ? 'Pause' : TASK_VERB[task.type]}
            </button>
          )}
        </div>

        {running ? (
          <p className="quest-running">
            Task running — a heartbeat every {HEARTBEAT_INTERVAL_S} seconds, and a last one at
            the moment the task finishes, as the client beats.
          </p>
        ) : null}
      </div>
    </div>
  )
}
