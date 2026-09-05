/**
 * localStorage, versioned and validated.
 *
 * The data model changed shape more than once while this was being built, and a
 * value written by an earlier build crashed the app on load — a white screen the
 * reader had no way to clear, since the only copy of the bad data was in their
 * own browser. So two defences: the keys carry a schema version, and every read
 * is checked against the shape the app expects before it is handed back. A value
 * that fails either check is discarded and the default is used.
 */
import type { Account, Message, Server, Status } from './data'

/** Bump when the shape of anything below changes. */
const SCHEMA = 3
const PREFIX = `discord-ui:v${SCHEMA}:`
const LEGACY = 'discord-ui:'

export const K = {
  servers: `${PREFIX}servers`,
  messages: `${PREFIX}messages`,
  theme: `${PREFIX}theme`,
  account: `${PREFIX}account`,
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const isStr = (v: unknown): v is string => typeof v === 'string'

const STATUSES: Status[] = ['online', 'idle', 'dnd', 'invisible']

export function isServers(v: unknown): v is Server[] {
  return (
    Array.isArray(v) &&
    v.every(
      (s) =>
        isObj(s) &&
        isStr(s.id) &&
        isStr(s.name) &&
        isStr(s.initials) &&
        isStr(s.color) &&
        Array.isArray(s.categories) &&
        Array.isArray(s.channels) &&
        s.channels.every((c) => isObj(c) && isStr(c.id) && isStr(c.name) && isStr(c.kind)),
    )
  )
}

export function isAccount(v: unknown): v is Account {
  return (
    isObj(v) &&
    isStr(v.name) &&
    isStr(v.handle) &&
    isStr(v.color) &&
    STATUSES.includes(v.status as Status)
  )
}

export function isMessages(v: unknown): v is Record<string, Message[]> {
  return (
    isObj(v) &&
    Object.values(v).every(
      (thread) =>
        Array.isArray(thread) &&
        thread.every(
          (m) =>
            isObj(m) && isStr(m.id) && isStr(m.author) && isStr(m.text) && typeof m.time === 'number',
        ),
    )
  )
}

export const isThemeId = (ids: string[]) => (v: unknown): v is string =>
  isStr(v) && ids.includes(v)

/** Read `key`, or return `fallback` if it is missing, unparseable or the wrong shape. */
export function load<T>(key: string, fallback: T, valid: (v: unknown) => v is T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    const parsed: unknown = JSON.parse(raw)
    if (!valid(parsed)) {
      localStorage.removeItem(key)
      return fallback
    }
    return parsed
  } catch {
    return fallback
  }
}

export function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* private mode, or the quota is full — the UI still works, it just won't persist */
  }
}

/** Drop everything this app has ever written, including older schema versions. */
export function reset() {
  try {
    const stale = Object.keys(localStorage).filter((k) => k.startsWith(LEGACY))
    stale.forEach((k) => localStorage.removeItem(k))
  } catch {
    /* nothing we can do, and nothing that should stop the reload */
  }
}

/** Drop keys left by an older schema, so they don't sit in storage forever. */
export function purgeOldSchemas() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(LEGACY) && !k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k))
  } catch {
    /* ignore */
  }
}
