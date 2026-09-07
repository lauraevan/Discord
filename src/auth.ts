/**
 * Accounts — registration and login.
 *
 * There is no account server behind this page, so the register and login
 * screens keep their accounts in localStorage. Everything the user can *see*
 * is Discord's: the field set of the real register form (email, display name,
 * username, password, date of birth, the opt-in checkbox), the real username
 * rules Discord moved to when it dropped discriminators, and the errors the
 * client prints when a field fails.
 *
 * Passwords are never stored: only a SHA-256 hash of a per-account random salt
 * plus the password, which is what the login screen compares against.
 */

export type Credential = {
  /** the pomelo username — lowercase, unique, what people @ you by */
  username: string
  email: string
  /** the name shown in chat; free-form, and optional at signup */
  displayName: string
  salt: string
  hash: string
  /** yyyy-mm-dd */
  birthday: string
  createdAt: number
}

/* -------------------------------------------------------------- validation */

/** Discord's username rules since the discriminator was retired. */
export const USERNAME_MIN = 2
export const USERNAME_MAX = 32
export const DISPLAY_NAME_MAX = 32
export const PASSWORD_MIN = 6
export const PASSWORD_MAX = 72
export const MIN_AGE = 13

const USERNAME_OK = /^[a-z0-9_.]+$/
const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function usernameError(v: string): string | null {
  if (v.length < USERNAME_MIN || v.length > USERNAME_MAX)
    return `Must be between ${USERNAME_MIN} and ${USERNAME_MAX} in length.`
  if (!USERNAME_OK.test(v)) return 'Please only use numbers, letters, underscores _ , or periods.'
  if (v.includes('..')) return 'Please only use numbers, letters, underscores _ , or periods.'
  if (v.startsWith('.') || v.endsWith('.'))
    return 'Please only use numbers, letters, underscores _ , or periods.'
  return null
}

export function emailError(v: string): string | null {
  if (v.trim() === '') return 'This field is required'
  if (!EMAIL_OK.test(v.trim())) return 'Email is invalid.'
  return null
}

export function displayNameError(v: string): string | null {
  if (v.length > DISPLAY_NAME_MAX) return `Must be ${DISPLAY_NAME_MAX} or fewer in length.`
  return null
}

export function passwordError(v: string): string | null {
  if (v.length < PASSWORD_MIN) return `Must be ${PASSWORD_MIN} or more in length.`
  if (v.length > PASSWORD_MAX) return `Must be ${PASSWORD_MAX} or fewer in length.`
  return null
}

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** Days in a month, leap years included, so the day select is never wrong. */
export const daysIn = (month: number, year: number) =>
  month === 1
    ? (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
      ? 29
      : 28
    : [31, 0, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month]

export function ageOn(birthday: string, on = new Date()) {
  const [y, m, d] = birthday.split('-').map(Number)
  const age = on.getFullYear() - y
  const before = on.getMonth() + 1 < m || (on.getMonth() + 1 === m && on.getDate() < d)
  return before ? age - 1 : age
}

export function birthdayError(birthday: string | null): string | null {
  if (!birthday) return 'This field is required'
  if (ageOn(birthday) < MIN_AGE) return 'You need to be older to sign up for Discord.'
  return null
}

/* ------------------------------------------------------------------ crypto */

const hex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')

export function makeSalt() {
  const b = new Uint8Array(16)
  crypto.getRandomValues(b)
  return hex(b.buffer)
}

export async function hashPassword(password: string, salt: string) {
  const data = new TextEncoder().encode(`${salt}:${password}`)
  return hex(await crypto.subtle.digest('SHA-256', data))
}

/* ------------------------------------------------------------------- store */

export const isCredentials = (v: unknown): v is Credential[] =>
  Array.isArray(v) &&
  v.every(
    (c) =>
      typeof c === 'object' &&
      c !== null &&
      typeof (c as Credential).username === 'string' &&
      typeof (c as Credential).email === 'string' &&
      typeof (c as Credential).salt === 'string' &&
      typeof (c as Credential).hash === 'string',
  )

export const findByLogin = (list: Credential[], login: string) => {
  const key = login.trim().toLowerCase()
  return list.find((c) => c.email.toLowerCase() === key || c.username === key) ?? null
}

export const usernameTaken = (list: Credential[], username: string) =>
  list.some((c) => c.username === username.trim().toLowerCase())

export const emailTaken = (list: Credential[], email: string) =>
  list.some((c) => c.email.toLowerCase() === email.trim().toLowerCase())

/** Discord suggests a username from the display name when the field is empty. */
export function suggestUsername(displayName: string) {
  const base = displayName.toLowerCase().replace(/[^a-z0-9_.]/g, '')
  return base.slice(0, USERNAME_MAX)
}
