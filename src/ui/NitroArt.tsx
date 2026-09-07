import { NITRO_COLORS } from '../nitro'
import {
  BoostIcon,
  NitroIcon,
  SendIcon,
  SmileyIcon,
  UploadFileIcon,
  UserIcon,
  VideoIcon,
} from './Icons'

/**
 * Artwork for the Nitro tab.
 *
 * Discord's own hero art is a rendered illustration served from its CDN, which
 * this page has no access to and should not fake. What it does have is
 * Discord's typography, its icon set and the exact Nitro gradient stops from
 * the client's colour table, so the hero is set rather than drawn, and each
 * perk card carries the client's own glyph for that perk on a tinted disc.
 */

export function NitroWordmark() {
  return (
    <div className="nitro-wordmark">
      <span className="nitro-wordmark-small">World of</span>
      <span className="nitro-wordmark-big">
        <NitroIcon size={44} />
        NITRO
      </span>
    </div>
  )
}

const ART: Record<string, [typeof NitroIcon, string]> = {
  upload: [UploadFileIcon, NITRO_COLORS.tier2Purple],
  emoji: [SmileyIcon, NITRO_COLORS.tier2Pink],
  video: [VideoIcon, NITRO_COLORS.tier1Blue],
  profile: [UserIcon, NITRO_COLORS.tier1Purple],
  boost: [BoostIcon, NITRO_COLORS.tier2PinkGradient2],
  message: [SendIcon, NITRO_COLORS.tier0Purple],
}

export function PerkArt({ kind }: { kind: string }) {
  const [Icon, color] = ART[kind] ?? ART.upload
  return (
    <span className="nitro-perk-art" style={{ background: `${color}22`, color }}>
      <Icon size={28} />
    </span>
  )
}
