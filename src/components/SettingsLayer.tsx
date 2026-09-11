import { useEffect, useId, useState, type ReactNode } from 'react'
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
  notice,
  children,
}: {
  nav: NavItem[]
  section: string
  onSection: (id: string) => void
  onClose: () => void
  /** the unsaved-changes bar, which rides in Discord's noticeRegion */
  notice?: ReactNode
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
        <div className="settings-scroll">
          <div className="settings-content">{children}</div>
          {/* Discord's toolsContainer: a 60px column immediately right of the
              content column, not a corner the button is pinned into. */}
          <div className="settings-tools">
            <div className="settings-close">
              <button onClick={onClose} aria-label="Close">
                <CloseIcon />
              </button>
              <span>ESC</span>
            </div>
          </div>
        </div>
        {/* .noticeRegion, which sits outside the scroller so the bar stays
            pinned to the bottom of the pane however far down you are */}
        {notice}
      </div>
    </div>
  )
}

/* ------------------------------------------------------- unsaved changes */

/**
 * Discord's settings panes buffer their edits. A field writes to a draft, a
 * bar slides up over the pane saying "Careful — you have unsaved changes!",
 * and nothing is committed until Save Changes; Reset throws the draft away.
 *
 * The draft is replaced whenever `source` changes identity — which covers both
 * a successful save (the committed object is new) and the pane being pointed
 * at something else (another role, another server).
 */
export function useDraft<T extends object>(source: T) {
  const [base, setBase] = useState(source)
  const [draft, setDraft] = useState(source)
  if (base !== source) {
    setBase(source)
    setDraft(source)
  }
  return {
    draft: base === source ? draft : source,
    patch: (fn: (d: T) => T) => setDraft(fn),
    reset: () => setDraft(source),
    dirty: JSON.stringify(draft) !== JSON.stringify(source),
  }
}

/**
 * The bar itself. Discord parks it in `noticeRegion` — absolute to the content
 * region, 20px off the bottom, the same 740px wide as the column — and rides
 * it up on the client's default spring.
 */
export function SaveBar({
  open,
  onReset,
  onSave,
}: {
  open: boolean
  onReset: () => void
  onSave: () => void
}) {
  if (!open) return null
  return (
    <div className="settings-notice">
      <div className="save-bar">
        <span className="save-bar-text">Careful — you have unsaved changes!</span>
        <div className="save-bar-actions">
          <button className="save-reset" onClick={onReset}>
            Reset
          </button>
          <button className="save-go" onClick={onSave}>
            Save Changes
          </button>
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

/**
 * A labelled select. Discord's settings selects are a custom combobox rather
 * than a native one, but they carry the same box: --input-background-default
 * over a 1px --input-border-default, an 8px radius, 16px text, and
 * --control-input-height-md (40px) tall.
 */
export function Select({
  label,
  note,
  value,
  options,
  onChange,
}: {
  label?: string
  note?: string
  value: string
  options: readonly (readonly [string, string])[]
  onChange: (v: string) => void
}) {
  const id = useId()
  return (
    <div className="set-field">
      {label ? <label htmlFor={id}>{label}</label> : null}
      <select id={id} className="set-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      {note ? <div className="set-field-note">{note}</div> : null}
    </div>
  )
}

/**
 * A checkbox row. Discord's system-message settings are checkboxes, not
 * switches: a 20px square with a 2px --interactive-text-default edge and a
 * 4px radius, filled brand with a white tick when it is on.
 */
export function Check({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="set-check">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
      <span className="set-check-box" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="14" height="14">
          <path
            fill="currentColor"
            d="M9 20.42 2.79 14.21l2.83-2.83L9 14.77l9.88-9.88 2.83 2.83L9 20.42Z"
          />
        </svg>
      </span>
      <span className="set-check-label">{label}</span>
    </label>
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
