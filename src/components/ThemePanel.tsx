import { colorThemes, defaultThemes, type Theme } from '../themes'
import { CheckIcon, CloseIcon } from '../ui/Icons'

/** The "Preview Theme" side panel. */
export function ThemePanel({
  current,
  onPick,
  onClose,
}: {
  current: string
  onPick: (t: Theme) => void
  onClose: () => void
}) {
  const swatch = (t: Theme) => (
    <button
      key={t.id}
      className={'theme-swatch' + (t.id === current ? ' on' : '')}
      style={{ background: t.swatch }}
      onClick={() => onPick(t)}
      aria-label={t.name}
      title={t.name}
    >
      {t.id === current ? (
        <span className="tick">
          <CheckIcon size={11} />
        </span>
      ) : null}
    </button>
  )
  return (
    <aside className="theme-panel">
      <h3>
        Appearance
        <button onClick={onClose} aria-label="Close">
          <CloseIcon size={17} />
        </button>
      </h3>
      <div className="theme-section">Default themes</div>
      <div className="theme-grid">{defaultThemes.map(swatch)}</div>
      <div className="theme-section">Color Themes</div>
      <div className="theme-grid">{colorThemes.map(swatch)}</div>
    </aside>
  )
}
