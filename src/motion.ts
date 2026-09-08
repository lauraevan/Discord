/**
 * Motion.
 *
 * Discord animates with react-spring, so anything it moves is a damped
 * harmonic oscillator rather than a duration and a curve. Most of that is
 * expressible in CSS through the `linear()` easings tools/gen-springs.py
 * generates into src/springs.css, but a scroll position is not: it has to be
 * driven frame by frame. This runs the same integrator react-spring's frame
 * loop runs — 1ms Euler substeps, `springForce = -tension * 1e-6 * x` and
 * `dampingForce = -friction * 1e-3 * v`, both over mass — so a jump lands on
 * Discord's curve and not on the browser's `behavior: 'smooth'`.
 */

export type SpringConfig = {
  tension: number
  friction: number
  mass?: number
  clamp?: boolean
}

/**
 * The scroller Discord's own jump-to-message rides, straight out of the
 * bundle: a heavy, clamped spring that never overshoots the target.
 */
export const SCROLL_SPRING: SpringConfig = { tension: 200, friction: 35, mass: 2, clamp: true }

const reducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Scrolls `el` to `to` on a spring. Returns a cancel function; calling it
 * leaves the scroller wherever it had got to, the way dropping a spring does.
 */
export function springScroll(
  el: Element,
  to: number,
  config: SpringConfig = SCROLL_SPRING,
): () => void {
  const { tension, friction, mass = 1, clamp = false } = config
  const from = el.scrollTop
  const distance = to - from
  if (distance === 0 || reducedMotion()) {
    el.scrollTop = to
    return () => {}
  }

  // react-spring works on the 0..1 range and scales the result, and picks its
  // rest threshold from the distance travelled
  const precision = Math.min(1, Math.abs(distance) * 0.001)
  let x = from
  let v = 0
  let last = performance.now()
  let frame = 0

  const tick = (now: number) => {
    // clamp the step the way the frame loop does, so a backgrounded tab does
    // not integrate one enormous jump on the way back
    const dt = Math.min(64, now - last)
    last = now
    for (let i = 0; i < Math.ceil(dt); i += 1) {
      const spring = -tension * 1e-6 * (x - to)
      const damping = -friction * 1e-3 * v
      v += ((spring + damping) / mass) * 1
      x += v * 1
      if (clamp && (distance > 0 ? x > to : x < to)) {
        x = to
        v = 0
        break
      }
    }
    el.scrollTop = x
    if (Math.abs(v) <= precision && Math.abs(to - x) <= precision) {
      el.scrollTop = to
      return
    }
    frame = requestAnimationFrame(tick)
  }
  frame = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(frame)
}

/** Scrolls `target` to the middle of `scroller`, on the same spring. */
export function springScrollIntoView(scroller: Element, target: Element) {
  const box = scroller.getBoundingClientRect()
  const t = target.getBoundingClientRect()
  const to = scroller.scrollTop + (t.top - box.top) - (box.height - t.height) / 2
  const max = scroller.scrollHeight - scroller.clientHeight
  return springScroll(scroller, Math.max(0, Math.min(max, to)))
}
