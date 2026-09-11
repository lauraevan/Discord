import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckIcon, ChevronDownIcon } from './Icons'
import { box, vh } from '../zoom'

export type Option = { value: string; label: string; disabled?: boolean }

/**
 * Discord's select.
 *
 * A native <select> gives you the operating system's dropdown — Chrome's grey
 * list on Windows, the mac one on a Mac — which is the single loudest tell
 * that a page is not the client. Discord builds its own, and every number
 * here is out of its stylesheet:
 *
 *   .select_a16aea { display: grid; grid-template-columns: 1fr auto; gap: 8px;
 *                    padding-block: 8px; padding-inline: 12px 8px;
 *                    color: var(--text-default); font-weight: 500 }
 *   .placeholder_a16aea { color: var(--text-subtle) }
 *   .popout_a16aea { background: var(--background-surface-higher);
 *                    border: 1px solid var(--border-subtle);
 *                    border-radius: 0 0 4px 4px; margin-top: 8px }
 *   .option_a16aea { display: grid; grid-template-columns: 1fr auto;
 *                    font-size: 16px; line-height: 20px; padding: 12px;
 *                    color: var(--text-subtle) }
 *   .option[aria-selected=true] { background: --interactive-background-selected;
 *                    color: --interactive-text-active; font-weight: 500 }
 *   .option:hover { background: --interactive-background-hover;
 *                   color: --interactive-text-hover }
 *   .selectedIcon_a16aea { color: var(--brand-500) }
 *
 * The odd one is the popout: it is detached by 8px and yet keeps square top
 * corners, rounding only its bottom two. That is Discord's, not a mistake
 * here.
 *
 * It is a real combobox rather than a div that opens: arrow keys walk the
 * list, Home and End jump it, Enter and Space commit, Escape closes without
 * committing, and typing a letter jumps to the next option starting with it.
 */
export function Select({
  value,
  options,
  onChange,
  placeholder,
  id,
  'aria-label': ariaLabel,
  disabled,
  className,
}: {
  value: string
  options: readonly Option[]
  onChange: (v: string) => void
  placeholder?: string
  id?: string
  'aria-label'?: string
  disabled?: boolean
  className?: string
}) {
  const auto = useId()
  const listId = `${id ?? auto}-list`
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const typed = useRef({ term: '', at: 0 })
  // the popout is portalled to the body: inside a modal or a scroller it would
  // otherwise be clipped by the overflow that keeps those in their box
  const [at, setAt] = useState<{ left: number; top: number; width: number; up: boolean } | null>(
    null,
  )

  const index = useMemo(() => options.findIndex((o) => o.value === value), [options, value])
  const current = index >= 0 ? options[index] : null

  // open on the selected option, the way Discord's does
  useEffect(() => {
    if (open) setActive(index >= 0 ? index : 0)
  }, [open, index])

  // measure before paint, and keep measuring while anything under it scrolls
  useLayoutEffect(() => {
    if (!open) {
      setAt(null)
      return
    }
    const place = () => {
      const el = root.current?.firstElementChild
      if (!el) return
      const b = box(el)
      const room = vh() - b.bottom
      setAt({ left: b.left, top: b.bottom, width: b.width, up: room < 200 && b.top > room })
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
      // the popout is on the body, so "outside" is outside both parts
      if (root.current?.contains(t)) return
      if ((t as Element).closest?.('.dd-popout')) return
      setOpen(false)
    }
    // defer, so the click that opened it does not close it again
    const t = setTimeout(() => document.addEventListener('mousedown', away))
    return () => {
      clearTimeout(t)
      document.removeEventListener('mousedown', away)
    }
  }, [open])

  // keep the active option in view as the arrows walk past the fold
  useEffect(() => {
    if (!open) return
    list.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  const commit = (i: number) => {
    const o = options[i]
    if (!o || o.disabled) return
    onChange(o.value)
    setOpen(false)
  }

  /** Walk to the next option that is not disabled. */
  const step = (from: number, by: number) => {
    for (let i = from, n = 0; n < options.length; n += 1) {
      i = (i + by + options.length) % options.length
      if (!options[i].disabled) return i
    }
    return from
  }

  const key = (e: React.KeyboardEvent) => {
    if (disabled) return
    if (!open) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault()
        setOpen(true)
      }
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      setOpen(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => step(a, 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => step(a, -1))
    } else if (e.key === 'Home') {
      e.preventDefault()
      setActive(step(-1, 1))
    } else if (e.key === 'End') {
      e.preventDefault()
      setActive(step(0, -1))
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      commit(active)
    } else if (e.key === 'Tab') {
      setOpen(false)
    } else if (e.key.length === 1) {
      // type-ahead: letters typed close together build a term
      const now = Date.now()
      const term = (now - typed.current.at < 800 ? typed.current.term : '') + e.key.toLowerCase()
      typed.current = { term, at: now }
      const hit = options.findIndex((o) => !o.disabled && o.label.toLowerCase().startsWith(term))
      if (hit >= 0) setActive(hit)
    }
  }

  return (
    <div className={'dd' + (className ? ' ' + className : '')} ref={root}>
      <div
        id={id}
        role="combobox"
        tabIndex={disabled ? -1 : 0}
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        aria-disabled={disabled || undefined}
        className={'dd-control' + (open ? ' open' : '') + (disabled ? ' disabled' : '')}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={key}
      >
        <span className={current ? 'dd-value' : 'dd-placeholder'}>
          {current ? current.label : (placeholder ?? '')}
        </span>
        <ChevronDownIcon />
      </div>
      {open && at
        ? createPortal(
        <div
          className={'dd-popout' + (at.up ? ' up' : '')}
          id={listId}
          role="listbox"
          ref={list}
          style={{ left: at.left, top: at.top, width: at.width }}
        >
          {options.map((o, i) => (
            <div
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              aria-disabled={o.disabled || undefined}
              data-active={i === active || undefined}
              data-value={o.value}
              className={
                'dd-option' + (i === active ? ' active' : '') + (o.disabled ? ' disabled' : '')
              }
              onMouseEnter={() => setActive(i)}
              onClick={() => commit(i)}
            >
              <span>{o.label}</span>
              {o.value === value ? <CheckIcon /> : null}
            </div>
          ))}
        </div>,
            document.body,
          )
        : null}
    </div>
  )
}
