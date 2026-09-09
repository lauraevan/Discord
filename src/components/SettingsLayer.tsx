import { useEffect, useId, type ReactNode } from 'react'
import { CloseIcon } from '../ui/Icons'

export type NavItem =
  | { head: string }
  | { sep: true }
  | { id: string; label: string; danger?: boolean; onPick?: () => void }

/**
 * The full-window settings layer both User Settings and Server Settings use:
 * a right-aligned sidebar of grouped sections, the pane beside it, and the
 * round close button with ESC under it in the top right.
 */
export function SettingsLayer({
  nav,
  section,
  onSection,
  onClose,
  children,
}: {
  nav: NavItem[]
  section: string
  onSection: (id: string) => void
  onClose: () => void
  children: ReactNode
}) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [onClose])

  return (
    <div className="settings-layer">
      <nav className="settings-nav" aria-label="Settings">
        <div className="settings-nav-inner">
          {nav.map((n, i) =>
            'head' in n ? (
              <div key={i} className="settings-head">
                {n.head}
              </div>
            ) : 'sep' in n ? (
              <div key={i} className="settings-sep" />
            ) : (
              <button
                key={n.id}
                className={
                  'settings-item' +
                  (n.id === section ? ' on' : '') +
                  (n.danger ? ' danger' : '')
                }
                onClick={() => (n.onPick ? n.onPick() : onSection(n.id))}
              >
                {n.label}
              </button>
            ),
          )}
        </div>
      </nav>
      <div className="settings-pane">
        <div className="settings-content">{children}</div>
        <div className="settings-close">
          <button onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
          <span>ESC</span>
        </div>
      </div>
    </div>
  )
}

/* --------------------------------------------------------------- controls */

export const Title = ({ children }: { children: ReactNode }) => (
  <h2 className="set-title">{children}</h2>
)

export const Sub = ({ children }: { children: ReactNode }) => (
  <h3 className="set-sub">{children}</h3>
)

export const Note = ({ children }: { children: ReactNode }) => (
  <p className="set-note">{children}</p>
)

export const Divider = () => <div className="set-divider" />

export function Toggle({
  label,
  note,
  value,
  disabled,
  onChange,
}: {
  label: string
  note?: string
  value: boolean
  /** held on by another switch, the way Everyone holds the other two */
  disabled?: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className={'set-row' + (disabled ? ' set-row-held' : '')}>
      <div className="set-row-main">
        <div className="set-row-label">{label}</div>
        {note ? <div className="set-row-note">{note}</div> : null}
      </div>
      <button
        role="switch"
        aria-checked={value}
        aria-label={label}
        aria-disabled={disabled || undefined}
        disabled={disabled}
        className={'switch' + (value ? ' on' : '')}
        onClick={() => onChange(!value)}
      >
        <span />
      </button>
    </div>
  )
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = '',
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  suffix?: string
  onChange: (v: number) => void
}) {
  return (
    <div className="set-slider">
      <div className="set-row-label">
        {label}
        <span className="set-value">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}

export function Radio<T extends string>({
  options,
  value,
  onChange,
}: {
  options: [T, string, string?][]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="set-radios">
      {options.map(([v, label, note]) => (
        <button
          key={v}
          className={'set-radio' + (v === value ? ' on' : '')}
          onClick={() => onChange(v)}
          aria-pressed={v === value}
        >
          <span className="set-dot" />
          <span>
            <b>{label}</b>
            {note ? <i>{note}</i> : null}
          </span>
        </button>
      ))}
    </div>
  )
}

export function Field({
  label,
  value,
  placeholder,
  maxLength,
  onChange,
  textarea,
}: {
  label: string
  value: string
  placeholder?: string
  maxLength?: number
  onChange: (v: string) => void
  textarea?: boolean
}) {
  // the label has to actually be the control's label, not just text above it
  const id = useId()
  return (
    <div className="set-field">
      <label htmlFor={id}>{label}</label>
      {textarea ? (
        <textarea
          id={id}
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          id={id}
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  )
}

/** The grey card Discord uses for a read-only or not-applicable surface. */
export function Unavailable({ what, why }: { what: string; why: string }) {
  return (
    <div className="set-unavailable">
      <b>{what}</b>
      <span>{why}</span>
    </div>
  )
}
