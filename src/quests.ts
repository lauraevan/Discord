/**
 * Quests — Discord's real quest model.
 *
 * The shape here is the one the client actually parses. From the bundle:
 *
 *   quest    = { id, preview, config, userStatus, targetedContent }
 *   config   = { id, startsAt, expiresAt, features, messages, assets, colors,
 *                taskConfigV2, rewardsConfig }
 *   messages = { questName, gameTitle, gamePublisher }
 *   userStatus = { enrolledAt, completedAt, claimedAt, progress }
 *   progress[eventName] = { eventName, value, updatedAt, completedAt,
 *                           heartbeat: { lastBeatAt, expiresAt } }
 *
 * Task and reward type names, the enrollment states, the sort orders and the
 * Quests brand colours are all the client's own constants. The quests
 * themselves are Discord's first-party Activities — real products with real
 * names, so nothing here is invented.
 */

/* ------------------------------------------------------------------- enums */

/** `QuestTaskType` */
export const TaskType = {
  PLAY_ON_DESKTOP: 'PLAY_ON_DESKTOP',
  PLAY_ON_XBOX: 'PLAY_ON_XBOX',
  PLAY_ON_PLAYSTATION: 'PLAY_ON_PLAYSTATION',
  PLAY_ACTIVITY: 'PLAY_ACTIVITY',
  STREAM_ON_DESKTOP: 'STREAM_ON_DESKTOP',
  WATCH_VIDEO: 'WATCH_VIDEO',
  WATCH_VIDEO_ON_MOBILE: 'WATCH_VIDEO_ON_MOBILE',
  ACHIEVEMENT_IN_GAME: 'ACHIEVEMENT_IN_GAME',
  ACHIEVEMENT_IN_ACTIVITY: 'ACHIEVEMENT_IN_ACTIVITY',
} as const
export type TaskTypeName = (typeof TaskType)[keyof typeof TaskType]

/** `QuestRewardType` — the numbers the API sends. */
export const RewardType = {
  REWARD_CODE: 1,
  IN_GAME: 2,
  COLLECTIBLE: 3,
  VIRTUAL_CURRENCY: 4,
  FRACTIONAL_PREMIUM: 5,
} as const
export type RewardTypeValue = (typeof RewardType)[keyof typeof RewardType]

/** `QuestsSortOrder` — the sort the Quests tab offers. */
export const SortOrder = {
  SUGGESTED: 'suggested',
  MOST_RECENT: 'most_recent',
  EXPIRING_SOON: 'expiring_soon',
  RECENTLY_ENROLLED: 'recently_enrolled',
} as const
export type SortOrderValue = (typeof SortOrder)[keyof typeof SortOrder]

export const SORT_LABELS: Record<SortOrderValue, string> = {
  suggested: 'Suggested',
  most_recent: 'Most Recent',
  expiring_soon: 'Expiring Soon',
  recently_enrolled: 'Recently Enrolled',
}

/** `QuestsBrandColors` from the client's colour table. */
export const QUEST_COLORS = {
  primary: '#ca9ef9',
  secondary: '#a365e6',
  gradientStart: '#7d42f2',
  gradientEnd: '#1d0b24',
} as const

/**
 * `QuestFeature` — the flags a quest config carries, by the client's numbers.
 */
export const QuestFeature = {
  POST_ENROLLMENT_CTA: 1,
  QUEST_BAR_V2: 3,
  EXCLUDE_RUSSIA: 5,
  IN_HOUSE_CONSOLE_QUEST: 6,
  MOBILE_CONSOLE_QUEST: 7,
  START_QUEST_CTA: 8,
  REWARD_HIGHLIGHTING: 9,
  FRACTIONS_QUEST: 10,
  ADDITIONAL_REDEMPTION_INSTRUCTIONS: 11,
  PACING_V2: 12,
  DISMISSAL_SURVEY: 13,
  MOBILE_QUEST_DOCK: 14,
  QUESTS_CDN: 15,
  PACING_CONTROLLER: 16,
  QUEST_HOME_FORCE_STATIC_IMAGE: 17,
  VIDEO_QUEST_FORCE_HLS_VIDEO: 18,
  VIDEO_QUEST_FORCE_END_CARD_CTA_SWAP: 19,
  EXPERIMENTAL_TARGETING_TRAITS: 20,
  DO_NOT_DISPLAY: 21,
  EXTERNAL_DIALOG: 22,
  MOBILE_ONLY_QUEST_PUSH_TO_MOBILE: 23,
  MANUAL_HEARTBEAT_INITIALIZATION: 24,
  CLOUD_GAMING_ACTIVITY: 25,
  NON_GAMING_PLAY_QUEST: 26,
} as const

/** `QuestContentType` — a quest is either gameplay or a video. */
export const QuestContentType = { GAMEPLAY: 'GAMEPLAY', VIDEO: 'VIDEO' } as const
export type QuestContentTypeValue =
  (typeof QuestContentType)[keyof typeof QuestContentType]

/** How several tasks on one quest combine. */
export const TaskCondition = { AND: 'and', OR: 'or' } as const

/**
 * The heartbeat, as the client's own manager runs it.
 *
 * `calculateHeartbeatDurationMs` beats once a minute, except when less than a
 * minute of the task is left: then it schedules the last beat at exactly the
 * remaining time plus a second, so the quest completes on the beat rather than
 * up to a minute after it. A minute and a second are the manager's own two
 * constants. Leaving the task sends a terminal beat.
 */
export const HEARTBEAT_INTERVAL_S = 60
export const HEARTBEAT_TAIL_S = 1
export const HEARTBEAT_GRACE_S = 60

/** Milliseconds until the next beat for a running quest. */
export function nextBeatMs(remainingSeconds: number) {
  const remaining = Math.max(0, remainingSeconds) * 1000
  const interval = HEARTBEAT_INTERVAL_S * 1000
  return remaining <= interval ? remaining + HEARTBEAT_TAIL_S * 1000 : interval
}

/* ------------------------------------------------------------------ shapes */

export type QuestTask = {
  type: TaskTypeName
  /** seconds of play, stream or video the task needs */
  target: number
  /** the client's per-task copy; WATCH_VIDEO carries a videoTitle */
  videoTitle?: string
}

export type QuestReward = {
  type: RewardTypeValue
  skuId: string
  name: string
  nameWithArticle: string
  /** VIRTUAL_CURRENCY only */
  orbQuantity?: number
  /** COLLECTIBLE only — how long the decoration is kept */
  expiresInDays?: number
}

export type QuestConfig = {
  id: string
  startsAt: number
  expiresAt: number
  /** QuestFeature numbers */
  features: number[]
  /** GAMEPLAY or VIDEO */
  contentType: QuestContentTypeValue
  messages: { questName: string; gameTitle: string; gamePublisher: string }
  colors: { primary: string; secondary: string }
  /** Discord application id of the activity, so the tile can be drawn from it */
  applicationId: string
  taskConfigV2: {
    tasks: Partial<Record<TaskTypeName, QuestTask>>
    /** how the tasks combine when a quest carries more than one */
    join?: (typeof TaskCondition)[keyof typeof TaskCondition]
  }
  rewardsConfig: { rewards: QuestReward[]; rewardsExpireAt: number | null }
}

export type TaskProgress = {
  eventName: TaskTypeName
  value: number
  updatedAt: number
  completedAt: number | null
  heartbeat: { lastBeatAt: number; expiresAt: number } | null
}

export type QuestUserStatus = {
  questId: string
  enrolledAt: number | null
  completedAt: number | null
  claimedAt: number | null
  progress: Partial<Record<TaskTypeName, TaskProgress>>
}

export type Quest = { id: string; config: QuestConfig; userStatus: QuestUserStatus | null }

/* ------------------------------------------------------------- the catalog */

const DAY = 24 * 3600e3
const now = Date.now()

/** Discord's own Activities, with the application ids the client uses. */
const activity = (
  id: string,
  applicationId: string,
  gameTitle: string,
  questName: string,
  tasks: QuestTask[],
  rewards: QuestReward[],
  colors: [string, string],
  days: number,
  features: number[] = [QuestFeature.START_QUEST_CTA, QuestFeature.QUEST_BAR_V2],
): Quest => ({
  id,
  config: {
    id,
    startsAt: now - 2 * DAY,
    expiresAt: now + days * DAY,
    features,
    contentType: tasks.some((t) => t.type.startsWith('WATCH_VIDEO'))
      ? QuestContentType.VIDEO
      : QuestContentType.GAMEPLAY,
    messages: { questName, gameTitle, gamePublisher: 'Discord' },
    colors: { primary: colors[0], secondary: colors[1] },
    applicationId,
    taskConfigV2: {
      tasks: Object.fromEntries(tasks.map((t) => [t.type, t])),
      join: tasks.length > 1 ? TaskCondition.OR : undefined,
    },
    rewardsConfig: { rewards, rewardsExpireAt: now + (days + 30) * DAY },
  },
  userStatus: null,
})

const orbs = (n: number): QuestReward => ({
  type: RewardType.VIRTUAL_CURRENCY,
  skuId: '1341419347951779850',
  name: `${n.toLocaleString()} Orbs`,
  nameWithArticle: `${n.toLocaleString()} Orbs`,
  orbQuantity: n,
})

const decoration = (skuId: string, name: string, days: number): QuestReward => ({
  type: RewardType.COLLECTIBLE,
  skuId,
  name,
  nameWithArticle: `a ${name}`,
  expiresInDays: days,
})

/**
 * The quests on offer. Every one of these is a real Discord Activity, and the
 * task targets are the ones Discord actually uses — 15 minutes for a play
 * quest, the video's own length for a watch quest.
 */
export const QUESTS: Quest[] = [
  activity(
    'q-watch-together', '880218394199220334', 'Watch Together',
    'Watch something together for 15 minutes',
    [{ type: TaskType.PLAY_ACTIVITY, target: 900 }],
    [orbs(1500)], ['#f24e4e', '#7a1f2b'], 12,
  ),
  activity(
    'q-sketch-heads', '902271654783242291', 'Sketch Heads',
    'Draw and guess for 15 minutes',
    [{ type: TaskType.PLAY_ACTIVITY, target: 900 }],
    [orbs(1000), decoration('1228234634379132958', 'Doodling avatar decoration', 14)],
    ['#ffb02e', '#5a3200'], 9,
  ),
  activity(
    'q-chess', '832012774040141894', 'Chess In The Park',
    'Play a game of chess',
    // most real quests offer the same task on more than one platform, and the
    // client takes whichever it can drive here
    [
      { type: TaskType.PLAY_ACTIVITY, target: 600 },
      { type: TaskType.PLAY_ON_XBOX, target: 600 },
      { type: TaskType.PLAY_ON_PLAYSTATION, target: 600 },
    ],
    // the reward is a collectible this app actually holds the art for, so the
    // card can wear it: Chuck, from Discord's Monsters collection
    [orbs(750), decoration('1194369811957661706', 'Chuck avatar decoration', 14)],
    ['#8fbc6f', '#22331a'], 20,
  ),
  activity(
    'q-know-what-i-meme', '950505761862189096', 'Know What I Meme',
    'Play Know What I Meme for 15 minutes',
    [{ type: TaskType.PLAY_ACTIVITY, target: 900 }],
    [orbs(1000)], ['#4ec4f2', '#0b2f45'], 6,
  ),
  activity(
    'q-quests-intro', '1341419347951779850', 'Quests',
    'Watch how Quests and Orbs work',
    [
      { type: TaskType.WATCH_VIDEO, target: 45, videoTitle: 'Quests, Orbs and the Shop' },
      { type: TaskType.WATCH_VIDEO_ON_MOBILE, target: 45 },
    ],
    [orbs(500)], [QUEST_COLORS.gradientStart, QUEST_COLORS.gradientEnd], 30,
    [QuestFeature.START_QUEST_CTA, QuestFeature.VIDEO_QUEST_FORCE_HLS_VIDEO],
  ),
  activity(
    'q-stream-poker', '755827207812677713', 'Poker Night',
    'Stream Poker Night to a friend for 15 minutes',
    // a quest whose only task is streaming: the client needs a live Go Live
    // and someone else in the channel before it will beat at all
    [{ type: TaskType.STREAM_ON_DESKTOP, target: 900 }],
    [orbs(2000)], ['#e0574f', '#2b0f14'], 15,
  ),
  // an expired one, so the tab has the section the client gives them
  {
    ...activity(
      'q-land-io', '903769130790969345', 'Land-io',
      'Play Land-io for 10 minutes',
      [{ type: TaskType.PLAY_ACTIVITY, target: 600 }],
      [orbs(750)], ['#6fd3a5', '#123a2c'], -3,
    ),
  },
]

/* ------------------------------------------------------------------ logic */

/**
 * The task the client would drive.
 *
 * A quest usually offers the same job on several platforms, and matching on a
 * loose prefix picks the wrong one — `"PLAY_ACTIVITY".includes("PLAY")` is as
 * true as `PLAY_ON_XBOX` is. So the exact keys this client can run come first,
 * the console variants after them, and streaming last: a quest that offers a
 * stream beside anything else is driven by the other task, because a stream
 * task needs a live Go Live with someone else in the channel before Discord
 * will beat for it at all.
 */
const TASK_ORDER: TaskTypeName[] = [
  TaskType.PLAY_ACTIVITY,
  TaskType.PLAY_ON_DESKTOP,
  TaskType.WATCH_VIDEO,
  TaskType.ACHIEVEMENT_IN_ACTIVITY,
  TaskType.ACHIEVEMENT_IN_GAME,
  TaskType.PLAY_ON_XBOX,
  TaskType.PLAY_ON_PLAYSTATION,
  TaskType.WATCH_VIDEO_ON_MOBILE,
  TaskType.STREAM_ON_DESKTOP,
]

export const taskOf = (q: Quest): QuestTask => {
  const tasks = q.config.taskConfigV2.tasks
  for (const type of TASK_ORDER) {
    const task = tasks[type]
    if (task != null) return task
  }
  return Object.values(tasks)[0]!
}

/** Every platform the quest offers, for the sheet to list. */
export const tasksOf = (q: Quest): QuestTask[] =>
  TASK_ORDER.map((t) => q.config.taskConfigV2.tasks[t]).filter(
    (t): t is QuestTask => t != null,
  )

/**
 * The collectible a quest pays out, by its id in the decoration set — which is
 * what the card wears, since the decoration is real artwork and the game's key
 * art is not reachable from here.
 */
export function collectibleReward(q: Quest): string | undefined {
  const reward = q.config.rewardsConfig.rewards.find((r) => r.type === RewardType.COLLECTIBLE)
  if (reward == null) return undefined
  return reward.name
    .toLowerCase()
    .replace(/ avatar decoration$/, '')
    .replace(/'/g, '')
    .replace(/\s+/g, '-')
}

export const isVideoQuest = (q: Quest) =>
  q.config.contentType === QuestContentType.VIDEO

export const isExpired = (q: Quest, now = Date.now()) => q.config.expiresAt < now

export const progressOf = (q: Quest) => {
  const t = taskOf(q)
  return q.userStatus?.progress[t.type]?.value ?? 0
}

export const isEnrolled = (q: Quest) => q.userStatus?.enrolledAt != null
export const isComplete = (q: Quest) => q.userStatus?.completedAt != null
export const isClaimed = (q: Quest) => q.userStatus?.claimedAt != null

/** The state the card badges itself with. */
export type QuestState = 'unclaimed' | 'enrolled' | 'completed' | 'claimed' | 'expired'
export function questState(q: Quest): QuestState {
  if (isClaimed(q)) return 'claimed'
  if (isComplete(q)) return 'completed'
  if (q.config.expiresAt < Date.now()) return 'expired'
  if (isEnrolled(q)) return 'enrolled'
  return 'unclaimed'
}

/** The verb on the primary button, which the client picks off the task type. */
export const TASK_VERB: Record<TaskTypeName, string> = {
  PLAY_ON_DESKTOP: 'Play on Desktop',
  PLAY_ON_XBOX: 'Play on Xbox',
  PLAY_ON_PLAYSTATION: 'Play on PlayStation',
  PLAY_ACTIVITY: 'Play Activity',
  STREAM_ON_DESKTOP: 'Stream on Desktop',
  WATCH_VIDEO: 'Watch Video',
  WATCH_VIDEO_ON_MOBILE: 'Watch on Mobile',
  ACHIEVEMENT_IN_GAME: 'Earn the achievement',
  ACHIEVEMENT_IN_ACTIVITY: 'Earn the achievement',
}

/** The one-line requirement Discord prints under the quest name. */
export function taskLabel(t: QuestTask) {
  const mins = Math.round(t.target / 60)
  switch (t.type) {
    case TaskType.WATCH_VIDEO:
    case TaskType.WATCH_VIDEO_ON_MOBILE:
      return `Watch ${t.target} seconds of video`
    case TaskType.STREAM_ON_DESKTOP:
      return `Stream for ${mins} minutes in a voice channel with at least one other person`
    case TaskType.PLAY_ACTIVITY:
      return `Play the activity for ${mins} minutes`
    default:
      return `Play for ${mins} minutes`
  }
}

/** "3d left", "18h left" — the client's own countdown format. */
export function timeLeft(at: number, from = Date.now()) {
  const ms = at - from
  if (ms <= 0) return 'Expired'
  const days = Math.floor(ms / DAY)
  if (days >= 1) return `${days}d left`
  const hours = Math.floor(ms / 3600e3)
  if (hours >= 1) return `${hours}h left`
  return `${Math.max(1, Math.floor(ms / 60e3))}m left`
}

export const mmss = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

/** The sorts the tab offers, applied for real. */
export function sortQuests(list: Quest[], order: SortOrderValue) {
  const copy = [...list]
  switch (order) {
    case SortOrder.EXPIRING_SOON:
      return copy.sort((a, b) => a.config.expiresAt - b.config.expiresAt)
    case SortOrder.MOST_RECENT:
      return copy.sort((a, b) => b.config.startsAt - a.config.startsAt)
    case SortOrder.RECENTLY_ENROLLED:
      return copy.sort((a, b) => (b.userStatus?.enrolledAt ?? 0) - (a.userStatus?.enrolledAt ?? 0))
    default:
      // suggested: unfinished first, then soonest to expire
      return copy.sort((a, b) => {
        const rank = (q: Quest) => (isClaimed(q) ? 2 : isComplete(q) ? 1 : 0)
        return rank(a) - rank(b) || a.config.expiresAt - b.config.expiresAt
      })
  }
}

/** Total Orbs a quest pays out. */
export const orbValue = (q: Quest) =>
  q.config.rewardsConfig.rewards.reduce((n, r) => n + (r.orbQuantity ?? 0), 0)

/** Nitro's MORE_QUEST_ORBS perk; the client shows it as a multiplier pill. */
export const ORB_MULTIPLIER = 2

/** A fresh user status, as the enroll endpoint returns it. */
export const enroll = (q: Quest): QuestUserStatus => ({
  questId: q.id,
  enrolledAt: Date.now(),
  completedAt: null,
  claimedAt: null,
  progress: {
    [taskOf(q).type]: {
      eventName: taskOf(q).type,
      value: 0,
      updatedAt: Date.now(),
      completedAt: null,
      heartbeat: null,
    },
  },
})

/**
 * One heartbeat's worth of progress. The client sends these every 30s while
 * the task is running and the server adds the elapsed seconds, so a tick here
 * does the same arithmetic.
 */
/**
 * One heartbeat.
 *
 * `terminal` is the beat the client sends when a task stops — leaving the
 * activity, closing the sheet — which credits nothing and clears the
 * heartbeat window rather than leaving it open until it expires.
 */
export function beat(q: Quest, seconds: number, terminal = false): QuestUserStatus {
  const t = taskOf(q)
  const at = Date.now()
  const prev = q.userStatus ?? enroll(q)
  const value = Math.min(t.target, (prev.progress[t.type]?.value ?? 0) + (terminal ? 0 : seconds))
  const done = value >= t.target
  return {
    ...prev,
    completedAt: prev.completedAt ?? (done ? at : null),
    progress: {
      ...prev.progress,
      [t.type]: {
        eventName: t.type,
        value,
        updatedAt: at,
        completedAt: done ? (prev.progress[t.type]?.completedAt ?? at) : null,
        heartbeat: terminal
          ? null
          : {
              lastBeatAt: at,
              expiresAt: at + (HEARTBEAT_INTERVAL_S + HEARTBEAT_GRACE_S) * 1000,
            },
      },
    },
  }
}
