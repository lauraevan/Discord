import { useEffect, useState } from 'react'
import {
  HEARTBEAT_INTERVAL_S,
  ORB_MULTIPLIER,
  QUESTS,
  RewardType,
  SORT_LABELS,
  SortOrder,
  TASK_VERB,
  isClaimed,
  isComplete,
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
  onBeat: (questId: string) => void
  onClaim: (q: Quest, orbs: number) => void
}) {
  const [sort, setSort] = useState<SortOrderValue>(SortOrder.SUGGESTED)
  const [sortOpen, setSortOpen] = useState(false)
  const [tab, setTab] = useState<'all' | 'claimed'>('all')
  const [openId, setOpenId] = useState<string | null>(null)

  const quests: Quest[] = QUESTS.map((q) => ({ ...q, userStatus: status[q.id] ?? null }))
  const ordered = sortQuests(quests, sort)
  const shown = tab === 'claimed' ? ordered.filter(isClaimed) : ordered
  const open = quests.find((q) => q.id === openId) ?? null
  const claimed = quests.filter(isClaimed).length

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
        <OrbsHero />

        <div className="quests-bar">
          <h2>{tab === 'claimed' ? 'Claimed Quests' : 'Available Quests'}</h2>
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
                    {(Object.values(SortOrder) as SortOrderValue[]).map((s) => (
                      <li key={s}>
                        <button
                          className={s === sort ? 'on' : ''}
                          onClick={() => {
                            setSort(s)
                            setSortOpen(false)
                          }}
                        >
                          {SORT_LABELS[s]}
                          {s === sort ? <CheckSmallIcon size={16} /> : null}
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

        {tab === 'all' ? (
          <p className="quests-count">
            {claimed} of {quests.length} Quests claimed.
          </p>
        ) : null}
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
  onBeat: (questId: string) => void
  onClaim: (q: Quest, orbs: number) => void
}) {
  const task = taskOf(quest)
  const questId = quest.id
  const done = isComplete(quest)
  // "started" is what the button toggles; the task stops on its own once the
  // quest completes, so whether it is running is derived rather than stored
  const [started, setStarted] = useState(false)
  const running = started && !done

  useEffect(() => {
    if (!running) return
    const tick = setInterval(() => onBeat(questId), HEARTBEAT_INTERVAL_S * 1000)
    return () => clearInterval(tick)
  }, [running, questId, onBeat])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const value = progressOf(quest)
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
            <button className="btn-primary" onClick={() => setStarted((v) => !v)}>
              {running ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
              {running ? 'Pause' : TASK_VERB[task.type]}
            </button>
          )}
        </div>

        {running ? (
          <p className="quest-running">
            Task running — progress is sent every {HEARTBEAT_INTERVAL_S} seconds, as the client
            does.
          </p>
        ) : null}
      </div>
    </div>
  )
}
