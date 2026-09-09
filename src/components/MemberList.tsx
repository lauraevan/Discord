import { roleColor, type Account, type Server } from '../data'
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
  server,
  onOpenProfile,
}: {
  account: Account
  server?: Server | null
  onOpenProfile: (anchor: HTMLElement) => void
}) {
  const offline = account.status === 'invisible'
  // the group Discord would hoist this member into, if a role they hold asks
  const hoisted = (server?.roles ?? []).find(
    (r) => r.hoist && (server?.memberRoles ?? []).includes(r.id),
  )
  return (
    <aside className="members">
      <div className="members-head">
        {hoisted ? `${hoisted.name.toUpperCase()} — 1` : offline ? 'OFFLINE — 1' : 'ONLINE — 1'}
      </div>
      <button className="member" onClick={(e) => onOpenProfile(e.currentTarget)}>
        <Nameplate id={account.nameplate} />
        <span className="member-avatar">
          <Avatar account={account} size={32} />
        </span>
        <span className="member-body">
          <DisplayName
            account={account}
            color={roleColor(server) ?? account.color}
            className="member-name"
          />
          {/* Discord's second line is what someone is doing — their custom
              status — not the word "Online"; with nothing to say the name
              sits centred on its own */}
          {account.customStatus ? (
            <span className="member-sub">{account.customStatus}</span>
          ) : null}
        </span>
      </button>
    </aside>
  )
}
