import { useMemo, useState } from 'react'
import {
  DISPLAY_NAME_MAX,
  MONTHS,
  USERNAME_MAX,
  birthdayError,
  daysIn,
  displayNameError,
  emailError,
  emailTaken,
  findByLogin,
  hashPassword,
  makeSalt,
  passwordError,
  suggestUsername,
  usernameError,
  usernameTaken,
  type Credential,
} from '../auth'
import { encodeQr } from '../qr'
import { ClydeIcon } from '../ui/Icons'

/**
 * The login and register screens.
 *
 * Field set, labels, hint text, validation errors and the QR panel are
 * Discord's own. There is no account server behind the page, so accounts live
 * in localStorage and the password is only ever kept as a salted SHA-256 hash
 * (see src/auth.ts).
 */

/** Discord's required-field marker: a red asterisk after the label. */
function Label({ children, required = true, htmlFor, error }: {
  children: React.ReactNode
  required?: boolean
  htmlFor: string
  error?: string | null
}) {
  return (
    <label className={'auth-label' + (error ? ' bad' : '')} htmlFor={htmlFor}>
      {children}
      {required && !error ? <i aria-hidden> *</i> : null}
      {error ? <span> - {error}</span> : null}
    </label>
  )
}

function Field(props: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  hint?: string
  error?: string | null
  required?: boolean
  autoFocus?: boolean
  autoComplete?: string
  onEnter?: () => void
}) {
  return (
    <div className="auth-field">
      <Label htmlFor={props.id} error={props.error} required={props.required ?? true}>
        {props.label}
      </Label>
      <input
        id={props.id}
        className="auth-input"
        type={props.type ?? 'text'}
        value={props.value}
        autoFocus={props.autoFocus}
        autoComplete={props.autoComplete}
        onChange={(e) => props.onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && props.onEnter?.()}
      />
      {props.hint ? <p className="auth-hint">{props.hint}</p> : null}
    </div>
  )
}

/**
 * The QR the mobile app scans. Discord's carries a remote-auth URL keyed by a
 * one-time fingerprint, so this generates one of the same shape — and the code
 * is a real, scannable QR rather than a decorative grid (see src/qr.ts).
 */
function LoginQr() {
  const [nonce] = useState(() => {
    const b = new Uint8Array(24)
    crypto.getRandomValues(b)
    return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  })
  const modules = useMemo(() => encodeQr(`https://discord.com/ra/${nonce}`, 'M'), [nonce])
  const n = modules.length
  // 4 modules of quiet zone, as the spec requires for the code to be found
  const q = 2
  const span = n + q * 2
  return (
    <div className="auth-qr">
      <svg viewBox={`0 0 ${span} ${span}`} role="img" aria-label="Log in with QR code">
        <rect width={span} height={span} fill="#fff" />
        {modules.map((row, y) =>
          row.map((on, x) =>
            on ? <rect key={`${x}-${y}`} x={x + q} y={y + q} width={1} height={1} fill="#000" /> : null,
          ),
        )}
      </svg>
      <span className="auth-qr-mark">
        <ClydeIcon />
      </span>
    </div>
  )
}

export function LoginScreen({
  credentials,
  onLogin,
  onRegister,
}: {
  credentials: Credential[]
  onLogin: (c: Credential) => void
  onRegister: () => void
}) {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit() {
    setError(null)
    if (!login.trim() || !password) {
      setError('This field is required')
      return
    }
    setBusy(true)
    const found = findByLogin(credentials, login)
    const hash = found ? await hashPassword(password, found.salt) : null
    setBusy(false)
    // Discord does not say which of the two was wrong, and neither does this
    if (!found || hash !== found.hash) {
      setError('Login or password is invalid.')
      return
    }
    onLogin(found)
  }

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-login">
        <div className="auth-col">
          <h1>Welcome back!</h1>
          <p className="auth-sub">We’re so excited to see you again!</p>
          <Field
            id="login"
            label="Email or Phone Number"
            value={login}
            onChange={(v) => {
              setLogin(v)
              setError(null)
            }}
            error={error}
            autoFocus
            autoComplete="username"
            onEnter={submit}
          />
          <Field
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(v) => {
              setPassword(v)
              setError(null)
            }}
            error={error ? '' : null}
            autoComplete="current-password"
            onEnter={submit}
          />
          <button className="auth-link auth-forgot" type="button">
            Forgot your password?
          </button>
          <button className="auth-submit" onClick={submit} disabled={busy}>
            Log In
          </button>
          <p className="auth-foot">
            Need an account?{' '}
            <button className="auth-link" onClick={onRegister}>
              Register
            </button>
          </p>
        </div>
        <div className="auth-qr-col">
          <LoginQr />
          <h2>Log in with QR Code</h2>
          <p>
            Scan this with the <b>Discord mobile app</b> to log in instantly.
          </p>
        </div>
      </div>
    </div>
  )
}

const THIS_YEAR = new Date().getFullYear()

export function RegisterScreen({
  credentials,
  onCreated,
  onLogin,
}: {
  credentials: Credential[]
  onCreated: (c: Credential) => void
  onLogin: () => void
}) {
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [day, setDay] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [optIn, setOptIn] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  const monthIndex = month === '' ? -1 : MONTHS.indexOf(month)
  const yearNum = year === '' ? THIS_YEAR : Number(year)
  const dayCount = monthIndex < 0 ? 31 : daysIn(monthIndex, yearNum)
  const birthday =
    day && month && year
      ? `${year}-${String(monthIndex + 1).padStart(2, '0')}-${day.padStart(2, '0')}`
      : null

  async function submit() {
    const next: Record<string, string> = {}
    const e = emailError(email)
    if (e) next.email = e
    const d = displayNameError(displayName)
    if (d) next.displayName = d
    const handle = (username || suggestUsername(displayName)).trim().toLowerCase()
    const u = usernameError(handle)
    if (u) next.username = u
    else if (usernameTaken(credentials, handle)) next.username = 'Username is already taken. Please try another.'
    if (!e && emailTaken(credentials, email)) next.email = 'Email is already registered.'
    const p = passwordError(password)
    if (p) next.password = p
    const b = birthdayError(birthday)
    if (b) next.birthday = b
    setErrors(next)
    if (Object.keys(next).length) return

    setBusy(true)
    const salt = makeSalt()
    const hash = await hashPassword(password, salt)
    setBusy(false)
    onCreated({
      username: handle,
      email: email.trim(),
      displayName: displayName.trim() || handle,
      salt,
      hash,
      birthday: birthday!,
      createdAt: Date.now(),
    })
  }

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-register">
        <h1>Create an account</h1>
        <Field
          id="r-email"
          label="Email"
          value={email}
          onChange={setEmail}
          error={errors.email}
          autoFocus
          autoComplete="email"
        />
        <Field
          id="r-display"
          label="Display Name"
          required={false}
          value={displayName}
          onChange={(v) => setDisplayName(v.slice(0, DISPLAY_NAME_MAX))}
          error={errors.displayName}
          hint="This is how others see you. You can use special characters and emoji."
        />
        <Field
          id="r-username"
          label="Username"
          value={username}
          onChange={(v) => setUsername(v.slice(0, USERNAME_MAX))}
          error={errors.username}
          hint="Please only use numbers, letters, underscores _ , or periods."
        />
        <Field
          id="r-password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          error={errors.password}
          autoComplete="new-password"
        />

        <div className="auth-field">
          <Label htmlFor="r-day" error={errors.birthday}>
            Date of Birth
          </Label>
          <div className="auth-dob">
            <select id="r-day" className="auth-select" value={day} onChange={(e) => setDay(e.target.value)}>
              <option value="">Day</option>
              {Array.from({ length: dayCount }, (_, i) => (
                <option key={i + 1} value={String(i + 1)}>
                  {i + 1}
                </option>
              ))}
            </select>
            <select className="auth-select" value={month} onChange={(e) => setMonth(e.target.value)}>
              <option value="">Month</option>
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select className="auth-select" value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="">Year</option>
              {Array.from({ length: 100 }, (_, i) => THIS_YEAR - i).map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="auth-check">
          <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} />
          <span className="auth-box" aria-hidden />
          <span>
            (Optional) It’s okay to send me emails with Discord updates, tips, and special offers.
            You can opt out at any time.
          </span>
        </label>

        <button className="auth-submit" onClick={submit} disabled={busy}>
          Continue
        </button>

        <p className="auth-terms">
          By registering, you agree to Discord’s <a href="#terms">Terms of Service</a> and{' '}
          <a href="#privacy">Privacy Policy</a>.
        </p>
        <p className="auth-foot auth-foot-left">
          <button className="auth-link" onClick={onLogin}>
            Already have an account?
          </button>
        </p>
      </div>
    </div>
  )
}
