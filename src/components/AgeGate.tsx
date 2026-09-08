import type { Channel } from '../data'

const art = (
  import.meta.glob('../assets/gates/nsfw-gate.webp', {
    eager: true,
    query: '?url',
    import: 'default',
  }) as Record<string, string>
)['../assets/gates/nsfw-gate.webp']

/**
 * The gate Discord puts in front of an age-restricted channel.
 *
 * A channel with the age-restricted flag never opens straight into its
 * messages: Discord shows this screen first, and remembers the answer for the
 * rest of the session rather than asking again on every visit. The artwork is
 * Discord's own — the mobile client ships it as age_gate nsfw_gate.
 */
export function AgeGate({
  channel,
  onEnter,
  onLeave,
}: {
  channel: Channel
  onEnter: () => void
  onLeave: () => void
}) {
  return (
    <div className="age-gate">
      <img className="age-gate-art" src={art} alt="" draggable={false} />
      <h3>Hold up!</h3>
      <p>
        You&rsquo;re about to enter a channel that may contain sensitive or explicit content. Are
        you sure you want to continue?
      </p>
      <div className="age-gate-acts">
        <button className="btn-primary" onClick={onEnter}>
          Continue
        </button>
        <button className="btn-quiet" onClick={onLeave}>
          Nope, I&rsquo;m out!
        </button>
      </div>
      <span className="age-gate-note">#{channel.name} is marked age-restricted.</span>
    </div>
  )
}
