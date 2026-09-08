/**
 * The app is authored against the reference frame, which is Discord captured
 * at 80% — so every length in styles.css is 0.8 of the size Discord actually
 * ships. `html { zoom }` puts that back, and the app renders at Discord's
 * real size: a 72px rail, 48px channel header, 40px avatars, 16px message
 * text. Scoring against docs/reference.png sets the zoom to 1 to compare
 * against the frame as captured.
 *
 * Chromium's `zoom` is not free, though: getBoundingClientRect, clientX/Y and
 * window.innerWidth all come back in *visual* pixels, while a length written
 * into style.left is read in the element's own zoomed space. Feeding one to
 * the other multiplies the zoom in twice and throws every popout off. So
 * everything that measures the page goes through here and comes back in the
 * space the stylesheet is written in.
 */

/**
 * The reference frame's scale. A component that is given a size in Discord's
 * own numbers — an avatar is 40px in a message, 32px in the member list —
 * multiplies by this to land in the units the stylesheet is written in, and
 * `html { zoom }` puts it back at Discord's size on screen.
 */
export const U = 0.8

export function zoom(): number {
  const z = parseFloat(getComputedStyle(document.documentElement).zoom)
  return Number.isFinite(z) && z > 0 ? z : 1
}

export type Box = {
  x: number
  y: number
  top: number
  left: number
  right: number
  bottom: number
  width: number
  height: number
}

/** An element's box, in the units styles.css is written in. */
export function box(el: Element): Box {
  const r = el.getBoundingClientRect()
  const z = zoom()
  return {
    x: r.x / z,
    y: r.y / z,
    top: r.top / z,
    left: r.left / z,
    right: r.right / z,
    bottom: r.bottom / z,
    width: r.width / z,
    height: r.height / z,
  }
}

/** A pointer event's position, in the same units. */
export function point(e: { clientX: number; clientY: number }) {
  const z = zoom()
  return { x: e.clientX / z, y: e.clientY / z }
}

/** The viewport, in the same units. */
export function vw() {
  return window.innerWidth / zoom()
}

export function vh() {
  return window.innerHeight / zoom()
}
