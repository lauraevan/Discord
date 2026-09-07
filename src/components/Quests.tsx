import { useEffect, useState } from 'react'
import {
  HEARTBEAT_INTERVAL_S,
  ORB_MULTIPLIER,
  QUESTS,
  QUEST_COLORS,
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
        <section
          className="quests-hero"
          style={{
            background: `linear-gradient(135deg, ${QUEST_COLORS.gradientStart}, ${QUEST_COLORS.gradientEnd})`,
          }}
        >
          <h1>Play, watch, earn Orbs.</h1>
          <p>
            Finish a quest to collect its reward. Progress is tracked while the task is running and
            picks up where it left off.
          </p>
          <span className="quests-hero-count">
            {done} of {quests.length} completed
          </span>
        </section>

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

        <div className="quests-grid">
          {ordered.map((q) => (
            <QuestCard key={q.id} quest={q} onOpen={() => setOpenId(q.id)} />
          ))}
        </div>
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

function QuestTile({ quest, size }: { quest: Quest; size: number }) {
  const { colors, messages } = quest.config
  const Icon = TASK_ICON[taskOf(quest).type]
  return (
    <span
      className="quest-tile"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
      }}
      aria-hidden
    >
      <Icon size={Math.round(size * 0.42)} />
      <i>{messages.gameTitle}</i>
    </span>
  )
}

function QuestCard({ quest, onOpen }: { quest: Quest; onOpen: () => void }) {
  const task = taskOf(quest)
  const value = progressOf(quest)
  const state = questState(quest)
  const pct = Math.round((value / task.target) * 100)
  return (
    <button className={'quest-card ' + state} onClick={onOpen}>
      <QuestTile quest={quest} size={56} />
      <div className="quest-card-text">
        <b>{quest.config.messages.questName}</b>
        <span className="quest-card-game">
          {quest.config.messages.gameTitle} · {quest.config.messages.gamePublisher}
        </span>
        <span className="quest-card-reward">
          <OrbsIcon size={14} />
          {orbValue(quest).toLocaleString()} Orbs
          {quest.config.rewardsConfig.rewards.some((r) => r.type === RewardType.COLLECTIBLE)
            ? ' + a collectible'
            : ''}
        </span>
        {isEnrolled(quest) && !isComplete(quest) ? (
          <span className="quest-bar">
            <i style={{ width: `${pct}%` }} />
          </span>
        ) : null}
      </div>
      <div className="quest-card-right">
        {state === 'claimed' ? (
          <span className="quest-state done">
            <CheckSmallIcon size={16} />
            Claimed
          </span>
        ) : state === 'completed' ? (
          <span className="quest-state ready">Claim</span>
        ) : (
          <span className="quest-left">
            <ClockIcon size={14} />
            {timeLeft(quest.config.expiresAt)}
          </span>
        )}
      </div>
    </button>
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
          style={{
            background: `linear-gradient(135deg, ${quest.config.colors.primary}, ${quest.config.colors.secondary})`,
          }}
        >
          <QuestTile quest={quest} size={72} />
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
