/**
 * Key art for a quest.
 *
 * Discord's quest cards carry the game's own key art, served per quest from a
 * CDN this page cannot reach — and unlike the Nitro and Shop artwork, no repo
 * mirrors it, because it belongs to the games rather than to Discord. So the
 * card carries the one piece of real artwork a quest does have here: what it
 * pays out. A quest whose reward is a collectible shows that decoration,
 * animating, worn on an avatar the way it will be worn once it is claimed; a
 * quest that pays Orbs shows the Orbs mark from the client's own icon set.
 * Nothing on the card is drawn.
 */
import { Decoration } from './Decorations'
import { OrbsIcon } from './Icons'

export function QuestKeyArt({
  id,
  colors,
  title,
  reward,
  orbs,
  className,
  wide = false,
}: {
  id: string
  colors: { primary: string; secondary: string }
  title: string
  /** the decoration this quest pays out, if it pays one */
  reward?: string
  /** the Orbs it pays, for a quest that pays Orbs */
  orbs?: number
  className?: string
  wide?: boolean
}) {
  return (
    <span
      className={'quest-art' + (wide ? ' wide' : '') + (className ? ' ' + className : '')}
      style={{
        background: `linear-gradient(150deg, ${colors.primary}, ${colors.secondary})`,
      }}
      data-quest={id}
    >
      <span className="quest-art-mark">
        {reward ? (
          <span className="quest-art-avatar">
            <i />
            <Decoration id={reward} size={96} />
          </span>
        ) : (
          <>
            <OrbsIcon size={54} />
            {orbs ? <b>{orbs.toLocaleString()}</b> : null}
          </>
        )}
      </span>
      <span className="quest-art-title">{title}</span>
    </span>
  )
}
