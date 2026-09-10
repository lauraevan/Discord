import { useCallback, useEffect, useRef, useState } from 'react'
import {
  DAILY_CAP,
  HEARTBEAT_INTERVAL_S,
  acceptLabel,
  capLiftsAt,
  isVideoQuest,
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
  timeUntil,
  collectibleReward,
  taskOf,
  timeLeft,
  type Quest,
  type QuestUserStatus,
  type SortOrderValue,
} from '../quests'
import type { Account } from '../data'
import { DECORATIONS, Decoration } from '../ui/Decorations'
import { DefaultAvatar } from '../ui/Art'
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
  account,
  owned,
  onBuy,
  onEquip,
  onEnroll,
  onBeat,
  onClaim,
  teen,
}: {
  status: Record<string, QuestUserStatus>
  orbs: number
  multiplier: boolean
  account: Account
  /** 13 to 17, the ages Discord caps at three Quests a day */
  teen?: boolean
  /** collectible ids already owned, for the Orbs shelf */
  owned: string[]
  onBuy: (id: string, price: number) => void
  onEquip: (id: string) => void
  onEnroll: (q: Quest) => void
  onBeat: (questId: string, seconds: number, terminal?: boolean) => void
  onClaim: (q: Quest, orbs: number) => void
}) {
  const [sort, setSort] = useState<SortOrderValue>(SortOrder.SUGGESTED)
  const [query, setQuery] = useState('')
  const [sortOpen, setSortOpen] = useState(false)
  const [tab, setTab] = useState<'all' | 'claimed'>('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const [why, setWhy] = useState(false)
  /* "press the ellipsis on the Quest in-app promotion ... and then select Hide
     This ... If you hide all the in-app promotions of a specific Quest, you can
     still view and accept the Quest in Quest Home" — so a hidden Quest keeps
     its card and loses its promotion. */
  const [hidden, setHidden] = useState<string[]>([])

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
  /* The cap is Discord's: three a day for 13 to 17, lifting 24 hours after the
     third completion. Rewards already earned can still be claimed. */
  const capAt = teen ? capLiftsAt(quests) : null

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
        {capAt ? (
          <div className={'quest-cap' + (why ? ' open' : '')}>
            <div className="quest-cap-row">
              <ClockIcon size={16} />
              <b>You've reached your daily Quest limit</b>
              <button className="quest-cap-why" onClick={() => setWhy((v) => !v)}>
                Why?
              </button>
            </div>
            {why ? (
              <p className="quest-cap-detail">
                If you are between the ages of 13 and 17, you can complete {DAILY_CAP} Quests
                per day. The timer counts down 24 hours from when you completed your third
                Quest, so you'll be able to accept new Quests {timeUntil(capAt)}. You can still
                claim rewards for Quests you completed beforehand.
              </p>
            ) : null}
          </div>
        ) : null}
        {hit ? (
          <>
            <h2 className="quests-shelf-title">
              {results.length} result{results.length === 1 ? '' : 's'} for “{query.trim()}”
            </h2>
            {results.length ? (
              <div className="quests-grid">
                {results.map((q) => (
                  <QuestCard
                    key={q.id}
                    quest={q}
                    hidden={hidden.includes(q.id)}
                    onHide={() =>
                      setHidden((all) =>
                        all.includes(q.id) ? all.filter((x) => x !== q.id) : [...all, q.id],
                      )
                    }
                    onOpen={() => setOpenId(q.id)}
                  />
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
                  <QuestCard
                    key={q.id}
                    quest={q}
                    hidden={hidden.includes(q.id)}
                    onHide={() =>
                      setHidden((all) =>
                        all.includes(q.id) ? all.filter((x) => x !== q.id) : [...all, q.id],
                      )
                    }
                    onOpen={() => setOpenId(q.id)}
                  />
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

            <OrbShelf
              account={account}
              orbs={orbs}
              owned={owned}
              equipped={account.decoration}
              onBuy={onBuy}
              onEquip={onEquip}
            />

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
                <QuestCard
                    key={q.id}
                    quest={q}
                    hidden={hidden.includes(q.id)}
                    onHide={() =>
                      setHidden((all) =>
                        all.includes(q.id) ? all.filter((x) => x !== q.id) : [...all, q.id],
                      )
                    }
                    onOpen={() => setOpenId(q.id)}
                  />
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
          capped={capAt != null}
          onClaim={onClaim}
        />
      ) : null}
    </main>
  )
}

/**
 * The Orbs shelf — `QUEST_HOME_ORB_SECTION` in the client's own instrumentation,
 * and the reason a quest pays anything: the Orbs it pays are spent here without
 * leaving the tab. The collectibles, their names and their prices are Discord's
 * catalogue, and the artwork is the real decoration, worn on your own avatar.
 */
function OrbShelf({
  account,
  orbs,
  owned,
  equipped,
  onBuy,
  onEquip,
}: {
  account: Account
  orbs: number
  owned: string[]
  equipped?: string
  onBuy: (id: string, price: number) => void
  onEquip: (id: string) => void
}) {
  // the cheapest thing in each collection, so the shelf reads as a spread of
  // the Shop rather than six of one set
  const affordable = Object.values(
    DECORATIONS.reduce<Record<string, (typeof DECORATIONS)[number]>>((best, d) => {
      if (best[d.collection] == null || d.orbs < best[d.collection].orbs) best[d.collection] = d
      return best
    }, {}),
  )
    .sort((a, b) => a.orbs - b.orbs)
    .slice(0, 6)
  return (
    <section className="quests-shelf orb-shelf">
      <h2 className="quests-shelf-title">
        Spend your Orbs
        <span>
          <OrbsIcon size={13} />
          {orbs.toLocaleString()}
        </span>
      </h2>
      <div className="orb-shelf-row">
        {affordable.map((d) => {
          const have = owned.includes(d.id)
          const worn = equipped === d.id
          return (
            <article key={d.id} className={'orb-item' + (worn ? ' on' : '')}>
              <span className="orb-item-art">
                <DefaultAvatar color={account.color} />
                <span className="avatar-decoration">
                  <Decoration id={d.id} size={72} />
                </span>
              </span>
              <b>{d.name}</b>
              <span className="orb-item-collection">{d.collection}</span>
              {have ? (
                <button
                  className={'shop-buy' + (worn ? ' equipped' : '')}
                  onClick={() => onEquip(worn ? '' : d.id)}
                >
                  {worn ? (
                    <>
                      <CheckSmallIcon size={16} />
                      Worn
                    </>
                  ) : (
                    'Wear'
                  )}
                </button>
              ) : (
                <button
                  className="shop-buy"
                  disabled={orbs < d.orbs}
                  onClick={() => onBuy(d.id, d.orbs)}
                >
                  <OrbsIcon size={14} />
                  {d.orbs.toLocaleString()}
                </button>
              )}
            </article>
          )
        })}
      </div>
    </section>
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
      reward={collectibleReward(quest)}
      orbs={orbValue(quest)}
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

function QuestCard({
  quest,
  onOpen,
  hidden,
  onHide,
}: {
  quest: Quest
  onOpen: () => void
  /** the in-app promotion has been hidden; the card stays in Quest Home */
  hidden?: boolean
  onHide?: () => void
}) {
  const task = taskOf(quest)
  const value = progressOf(quest)
  const state = questState(quest)
  const pct = Math.round((value / task.target) * 100)
  const [menu, setMenu] = useState(false)
  return (
    <div className={'quest-card-wrap' + (hidden ? ' hidden-promo' : '')}>
      {onHide ? (
        <>
          <button
            className="quest-card-more"
            aria-label="More"
            onClick={(e) => {
              e.stopPropagation()
              setMenu((v) => !v)
            }}
          >
            <MoreIcon size={18} />
          </button>
          {menu ? (
            <div className="quest-card-menu" onMouseLeave={() => setMenu(false)}>
              <button
                onClick={() => {
                  setMenu(false)
                  onHide()
                }}
              >
                {hidden ? 'Unhide This' : 'Hide This'}
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    <button className={'quest-card ' + state} onClick={onOpen}>
      <span className="quest-card-art">
        <QuestPoster quest={quest} />
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
    </div>
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
  capped,
  onClose,
  onEnroll,
  onBeat,
  onClaim,
}: {
  quest: Quest
  multiplier: boolean
  /** the daily cap is in force: no new Quests, but rewards still claim */
  capped?: boolean
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

  /*
   * "The video pauses if you switch windows, but don't worry - your progress is
   * saved and you can resume watching later." — Discord's Quests FAQ. Stopping
   * sends the terminal beat, which is what saves the progress, so the same call
   * the pause button makes does both.
   */
  useEffect(() => {
    if (!running || !isVideoQuest(quest)) return
    const away = () => document.visibilityState === 'hidden' && stopRef.current?.()
    document.addEventListener('visibilitychange', away)
    window.addEventListener('blur', away)
    return () => {
      document.removeEventListener('visibilitychange', away)
      window.removeEventListener('blur', away)
    }
  }, [running, quest])

  // leaving with the task running is what the client sends a terminal beat for
  useEffect(() => () => stopRef.current?.(), [])
  const stopRef = useRef<(() => void) | null>(null)
  stopRef.current = running ? stop : null

  const pct = Math.min(100, (value / task.target) * 100)
  // Orbs are whole; the 1.2x lands on a round number for every quest here, but
  // a future one need not, and Discord does not pay a fraction of an Orb
  const payout = Math.round(orbValue(quest) * (multiplier ? ORB_MULTIPLIER : 1))

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
            {/* Discord rolls a changing count up from below rather than
                swapping it: 220ms, clamped, translate3d(0, 107%, 0) -> 0 */}
            <span className="quest-count">
              <b className="roll" key={mmss(value)}>
                {mmss(value)}
              </b>
              {' / '}
              {mmss(task.target)}
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
              Claim Reward
            </button>
          ) : !isEnrolled(quest) ? (
            <button
              className="btn-primary"
              disabled={capped}
              title={capped ? "You've reached your daily Quest limit" : undefined}
              onClick={() => {
                onEnroll(quest)
                setStarted(true)
              }}
            >
              {acceptLabel(quest)}
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
