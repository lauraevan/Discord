import { useEffect, useState } from 'react'
import {
  HEARTBEAT_INTERVAL_S,
  ORB_MULTIPLIER,
  QUESTS,
  RewardType,
  SORT_LABELS,
  SortOrder,
  TASK_VERB,
  TaskType,
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
import {
  CheckSmallIcon,
  ClockIcon,
  GameControllerIcon,
  OrbsIcon,
  PauseIcon,
  PlayIcon,
  QuestsIcon,
  ScreenIcon,
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

const TASK_ICON = {
  [TaskType.PLAY_ACTIVITY]: GameControllerIcon,
  [TaskType.PLAY_ON_DESKTOP]: GameControllerIcon,
  [TaskType.PLAY_ON_XBOX]: GameControllerIcon,
  [TaskType.PLAY_ON_PLAYSTATION]: GameControllerIcon,
  [TaskType.STREAM_ON_DESKTOP]: ScreenIcon,
  [TaskType.WATCH_VIDEO]: PlayIcon,
  [TaskType.WATCH_VIDEO_ON_MOBILE]: PlayIcon,
  [TaskType.ACHIEVEMENT_IN_GAME]: TrophyIcon,
  [TaskType.ACHIEVEMENT_IN_ACTIVITY]: TrophyIcon,
}

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
  const [openId, setOpenId] = useState<string | null>(null)

  const quests: Quest[] = QUESTS.map((q) => ({ ...q, userStatus: status[q.id] ?? null }))
  const ordered = sortQuests(quests, sort)
  // Discord leads the tab with one quest and lists the rest below it
  const featured = ordered[0] ?? null
  const rest = ordered.slice(1)
  const open = quests.find((q) => q.id === openId) ?? null
  const done = quests.filter(isComplete).length

  return (
    <main className="chat quests">
      <header className="quests-header">
        <div className="quests-title">
          <QuestsIcon size={22} />
          <h2>Quests</h2>
        </div>
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
        {featured ? <FeaturedQuest quest={featured} onOpen={() => setOpenId(featured.id)} /> : null}

        <div className="quests-bar">
          <h2>
            Available Quests <span>{rest.length}</span>
          </h2>
          <div className="quests-sort">
            {(Object.values(SortOrder) as SortOrderValue[]).map((s) => (
              <button
                key={s}
                className={'quests-sort-btn' + (s === sort ? ' on' : '')}
                onClick={() => setSort(s)}
              >
                {SORT_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="quests-grid">
          {rest.map((q) => (
            <QuestCard key={q.id} quest={q} onOpen={() => setOpenId(q.id)} />
          ))}
        </div>

        <p className="quests-count">
          {done} of {quests.length} quests completed.
        </p>
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
      publisher={quest.config.messages.gamePublisher}
      className={className}
      wide={wide}
    />
  )
}

function QuestCard({ quest, onOpen }: { quest: Quest; onOpen: () => void }) {
  const task = taskOf(quest)
  const value = progressOf(quest)
  const state = questState(quest)
  const pct = Math.round((value / task.target) * 100)
  const collectible = quest.config.rewardsConfig.rewards.some(
    (r) => r.type === RewardType.COLLECTIBLE,
  )
  const Icon = TASK_ICON[task.type]
  return (
    <button className={'quest-card ' + state} onClick={onOpen}>
      <span className="quest-card-art">
        <QuestPoster quest={quest} />
        <span className="quest-card-badge">
          {state === 'claimed' ? (
            <>
              <CheckSmallIcon size={13} />
              Claimed
            </>
          ) : state === 'completed' ? (
            'Ready to claim'
          ) : (
            <>
              <ClockIcon size={12} />
              {timeLeft(quest.config.expiresAt)}
            </>
          )}
        </span>
      </span>
      <span className="quest-card-body">
        <b>{quest.config.messages.questName}</b>
        <span className="quest-card-task">
          <Icon size={13} />
          {taskLabel(task)}
        </span>
        <span className="quest-card-foot">
          <span className="quest-card-reward">
            <OrbsIcon size={15} />
            {orbValue(quest).toLocaleString()}
            {collectible ? <span className="quest-plus">+1</span> : null}
          </span>
          {isEnrolled(quest) && !isComplete(quest) ? (
            <span className="quest-bar">
              <i style={{ width: `${pct}%` }} />
            </span>
          ) : null}
        </span>
      </span>
    </button>
  )
}

/** The featured quest across the top of the tab, the way Discord leads with one. */
function FeaturedQuest({ quest, onOpen }: { quest: Quest; onOpen: () => void }) {
  const task = taskOf(quest)
  const state = questState(quest)
  return (
    <section className="quest-featured">
      <QuestPoster quest={quest} className="quest-featured-art" wide />
      <div className="quest-featured-body">
        <span className="quest-featured-tag">Featured Quest</span>
        <span className="quest-featured-game">
          {quest.config.messages.gameTitle} · {quest.config.messages.gamePublisher}
        </span>
        <h1>{quest.config.messages.questName}</h1>
        <p>{taskLabel(task)}</p>
        <div className="quest-featured-meta">
          <span className="quest-card-reward big">
            <OrbsIcon size={18} />
            {orbValue(quest).toLocaleString()} Orbs
          </span>
          <span className="quest-left">
            <ClockIcon size={14} />
            {timeLeft(quest.config.expiresAt)}
          </span>
        </div>
        <button className="quest-featured-cta" onClick={onOpen}>
          {state === 'claimed'
            ? 'View Quest'
            : state === 'completed'
              ? 'Claim reward'
              : isEnrolled(quest)
                ? 'Continue Quest'
                : 'Accept Quest'}
        </button>
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
