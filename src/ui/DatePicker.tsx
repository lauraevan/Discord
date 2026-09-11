import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeftIcon, ChevronRightIcon } from './Icons'
import { box, vh } from '../zoom'

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/**
 * Discord's date field.
 *
 * `<input type="date">` hands the browser's own calendar to the page — the
 * one with Chrome's chrome on it — which is the same tell a native select is.
 * Discord draws a month grid in a popout instead, so this does too: the
 * month and a pair of chevrons across the top, a row of weekday initials
 * under it, then the month laid out Sunday-first with today ringed and the
 * chosen day filled brand.
 *
 * The value is an ISO `YYYY-MM-DD` string, which is what the native input
 * gave and what the callers already parse.
 */
export function DatePicker({
  value,
  onChange,
  id,
  'aria-label': ariaLabel,
  min,
}: {
  value: string
  onChange: (v: string) => void
  id?: string
  'aria-label'?: string
  /** the earliest day that can be picked, as ISO; earlier days are dead */
  min?: string
}) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  // portalled for the same reason the select's popout is: a modal's overflow
  // would otherwise cut the calendar in half
  const [at, setAt] = useState<{ left: number; top: number } | null>(null)
  const picked = useMemo(() => (value ? new Date(value + 'T00:00:00') : null), [value])
  const [month, setMonth] = useState(() => {
    const d = picked ?? new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  // opening on a different month than the one showing would be disorienting
  useEffect(() => {
    if (open && picked) setMonth(new Date(picked.getFullYear(), picked.getMonth(), 1))
  }, [open, picked])

  useLayoutEffect(() => {
    if (!open) {
      setAt(null)
      return
    }
    const place = () => {
      const el = root.current?.firstElementChild
      if (!el) return
      const b = box(el)
      // 300 is the popout's height with its six weeks; flip above when the
      // room under the field will not take it
      const up = vh() - b.bottom < 300 && b.top > 300
      setAt({ left: b.left, top: up ? b.top - 300 : b.bottom })
    }
    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const away = (e: MouseEvent) => {
      const t = e.target as Node
      // the popout lives on the body now, so "outside" has to mean outside
      // both the field and the calendar
      if (root.current?.contains(t)) return
      if ((t as Element).closest?.('.dpick-popout')) return
      setOpen(false)
    }
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setOpen(false)
      }
    }
    const t = setTimeout(() => document.addEventListener('mousedown', away))
    document.addEventListener('keydown', key)
    return () => {
      clearTimeout(t)
      document.removeEventListener('mousedown', away)
      document.removeEventListener('keydown', key)
    }
  }, [open])

  // the grid starts on the Sunday on or before the first of the month, and
  // runs six weeks so the popout never changes height as you page through
  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1)
    const start = new Date(first)
    start.setDate(1 - first.getDay())
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }, [month])

  const today = iso(new Date())
  const page = (by: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + by, 1))

  return (
    <div className="dpick" ref={root}>
      <div
        id={id}
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={'dd-control' + (open ? ' open' : '')}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen((v) => !v)
          }
        }}
      >
        <span className={picked ? 'dd-value' : 'dd-placeholder'}>
          {picked
            ? picked.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : 'Pick a date'}
        </span>
      </div>
      {open && at
        ? createPortal(
        <div
          className="dpick-popout"
          role="dialog"
          aria-label={ariaLabel}
          style={{ left: at.left, top: at.top }}
        >
          <div className="dpick-head">
            <button aria-label="Previous month" onClick={() => page(-1)}>
              <ChevronLeftIcon />
            </button>
            <span>
              {MONTHS[month.getMonth()]} {month.getFullYear()}
            </span>
            <button aria-label="Next month" onClick={() => page(1)}>
              <ChevronRightIcon />
            </button>
          </div>
          <div className="dpick-dow" aria-hidden="true">
            {DOW.map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div className="dpick-grid">
            {days.map((d) => {
              const key = iso(d)
              const outside = d.getMonth() !== month.getMonth()
              const dead = min != null && key < min
              return (
                <button
                  key={key}
                  className={
                    'dpick-day' +
                    (outside ? ' outside' : '') +
                    (key === today ? ' today' : '') +
                    (key === value ? ' on' : '')
                  }
                  disabled={dead}
                  aria-pressed={key === value}
                  aria-label={d.toDateString()}
                  onClick={() => {
                    onChange(key)
                    setOpen(false)
                  }}
                >
                  {d.getDate()}
                </button>
              )
            })}
          </div>
        </div>,
            document.body,
          )
        : null}
    </div>
  )
}

/**
 * The times Discord's event form offers: every half hour of the day, shown in
 * the reader's own locale so a 24-hour region is not handed AM/PM.
 */
export const TIMES = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2)
  const m = i % 2 ? 30 : 0
  const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  const label = new Date(2000, 0, 1, h, m).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
  return { value, label }
})
