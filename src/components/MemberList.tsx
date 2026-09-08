import { statusLabel, type Account } from '../data'
import { Avatar } from './UserArea'
import { Nameplate } from '../ui/Nameplate'
import { DisplayName } from '../ui/DisplayName'

/**
 * The member list.
 *
 * Discord splits it by hoisted role, then a plain "Online" group, then
 * "Offline", and colours each name by the member's highest coloured role. This
 * server has one member — you — so it renders the honest version of that rather
 * than a cast of invented people.
 */
export function MemberList({
  account,
  onOpenProfile,
}: {
  account: Account
  onOpenProfile: (anchor: HTMLElement) => void
}) {
  const offline = account.status === 'invisible'
  return (
    <aside className="members">
      <div className="members-head">{offline ? 'OFFLINE — 1' : 'ONLINE — 1'}</div>
      <button className="member" onClick={(e) => onOpenProfile(e.currentTarget)}>
        <Nameplate id={account.nameplate} />
        <span className="member-avatar">
          <Avatar account={account} size={32} />
        </span>
        <span className="member-body">
          <DisplayName account={account} color={account.color} className="member-name" />
          <span className="member-sub">{statusLabel[account.status]}</span>
        </span>
      </button>
    </aside>
  )
}
