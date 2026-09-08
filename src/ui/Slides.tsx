import {
  Children,
  isValidElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react'

/**
 * Discord's stepped modal.
 *
 * A modal with steps does not swap its contents: the outgoing step slides out
 * and the incoming one slides in from the side it came from, both fading, while
 * the shell resizes to the new step's height — all three on one spring, which
 * the bundle gives as `{ mass: 1, tension: 300, friction: 28, clamp: true }`.
 * Direction comes from the step's index, so going back slides the other way.
 *
 * src/springs.css carries that spring as `--dur-panel` / `--ease-panel`; the
 * height rides it as a transition and the slides as animations.
 */

type SlideProps = { id: string; children: ReactNode }

/** One step. Only `id` matters — Slides reads it to work out the direction. */
export function Slide({ children }: SlideProps) {
  return <>{children}</>
}

export function Slides({ active, children }: { active: string; children: ReactNode }) {
  const items = Children.toArray(children).filter(
    (c): c is ReactElement<SlideProps> => isValidElement(c),
  )
  const index = items.findIndex((c) => c.props.id === active)

  const box = useRef<HTMLDivElement>(null)
  const live = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | null>(null)
  // the step being left, kept mounted so it can slide out
  const [leaving, setLeaving] = useState<{ id: string; back: boolean } | null>(null)
  const was = useRef(index)

  useLayoutEffect(() => {
    if (was.current !== index && was.current >= 0) {
      const from = items[was.current]
      if (from) setLeaving({ id: from.props.id, back: index < was.current })
    }
    was.current = index
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  // the shell follows the live step's height, so the spring has something to
  // animate to rather than snapping
  useLayoutEffect(() => {
    const el = live.current
    if (!el) return
    const measure = () => setHeight(el.offsetHeight)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [active])

  // drop the outgoing step once its slide has run
  useEffect(() => {
    if (!leaving) return
    const ms = Number(
      getComputedStyle(document.documentElement).getPropertyValue('--dur-panel').trim().replace('ms', ''),
    )
    const t = window.setTimeout(() => setLeaving(null), Number.isFinite(ms) && ms ? ms : 250)
    return () => window.clearTimeout(t)
  }, [leaving])

  const back = leaving?.back ?? false
  const gone = leaving ? items.find((c) => c.props.id === leaving.id) : null

  return (
    <div
      className="slides"
      ref={box}
      style={height == null ? undefined : { height }}
      data-sliding={leaving ? '' : undefined}
    >
      {gone ? (
        <div className={'slide leaving' + (back ? ' back' : '')} key={leaving!.id} aria-hidden>
          {gone}
        </div>
      ) : null}
      <div className={'slide live' + (back ? ' back' : '')} key={active} ref={live}>
        {items[index]}
      </div>
    </div>
  )
}
