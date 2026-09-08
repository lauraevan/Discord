import type { Account } from '../data'
import { nameStyleCss } from '../namestyles'

/**
 * A display name, lettered the way its owner set it.
 *
 * Nitro lets a name carry a font, an effect and colours; without one it is the
 * plain name in whatever colour its highest role gives it, which is what the
 * `color` prop is for. The same component is used everywhere a name appears so
 * the style follows it — feed, member list, popout, profile.
 */
export function DisplayName({
  account,
  color,
  className,
}: {
  account: Account
  color?: string | null
  className?: string
}) {
  const styled = nameStyleCss(account.nameStyle)
  return (
    <span
      className={className}
      style={styled ?? (color ? { color } : undefined)}
      data-styled={styled ? '' : undefined}
    >
      {account.name}
    </span>
  )
}
