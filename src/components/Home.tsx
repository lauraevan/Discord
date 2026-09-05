import { useState } from 'react'
import type { Account } from '../data'
import { WumpusMark } from '../ui/Art'
import {
  ChevronDownIcon,
  CloseIcon,
  InboxIcon,
  MembersIcon,
  MoreIcon,
  PlusIcon,
  SearchIcon,
  SparkleIcon,
  VideoIcon,
} from '../ui/Icons'
import { Tooltip } from '../ui/Tooltip'
import { Avatar } from './UserArea'

type Tab = 'online' | 'all' | 'pending' | 'blocked' | 'add'

/**
 * Home — the view behind the Discord button in the rail.
 *
 * The Friends tabs are the client's own (Online, All, Pending, Blocked, plus
 * the Add Friend button), and the empty states are the client's copy. With no
 * account server there is nobody to be friends with, so every list is genuinely
 * empty rather than populated with invented people.
 */
export function HomeSidebar({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  return (
    <div className="dm-sidebar">
      <button className="dm-search">Find or start a conversation</button>
      <div className="dm-nav">
        <button className={'row nav' + (tab !== 'add' ? ' active' : '')} onClick={() => onTab('online')}>
          <MembersIcon />
          <span className="row-name">Friends</span>
        </button>
        <div className="row nav">
          <SparkleIcon />
          <span className="row-name">Nitro</span>
        </div>
        <div className="row nav">
          <InboxIcon />
          <span className="row-name">Shop</span>
        </div>
      </div>
      <div className="dm-head">
        <span>DIRECT MESSAGES</span>
        <Tooltip label="Create DM" side="below">
          <button aria-label="Create DM">
            <PlusIcon />
          </button>
        </Tooltip>
      </div>
      <div className="dm-empty">
        <p>No conversations yet.</p>
        <span>
          Direct messages need someone to message — that takes an account server, which a page
          does not have.
        </span>
      </div>
    </div>
  )
}

const EMPTY: Record<Tab, [string, string]> = {
  online: ["No one's around to play with Wumpus.", ''],
  all: ['Wumpus is waiting on friends. You don’t have to though!', ''],
  pending: ['There are no pending friend requests. Here’s Wumpus for now.', ''],
  blocked: ['You can’t unblock the Wumpus.', ''],
  add: ['', ''],
}

export function FriendsPage({
  tab,
  onTab,
}: {
  tab: Tab
  onTab: (t: Tab) => void
}) {
  const [handle, setHandle] = useState('')
  const [sent, setSent] = useState<string | null>(null)

  return (
    <main className="chat">
      <header className="chat-header">
        <MembersIcon />
        <h2>Friends</h2>
        <div className="friends-tabs">
          {(['online', 'all', 'pending', 'blocked'] as Tab[]).map((t) => (
            <button
              key={t}
              className={'friends-tab' + (t === tab ? ' on' : '')}
              onClick={() => onTab(t)}
            >
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
          <button
            className={'friends-add' + (tab === 'add' ? ' on' : '')}
            onClick={() => onTab('add')}
          >
            Add Friend
          </button>
        </div>
        <div className="chat-tools">
          <Tooltip label="New Group DM" side="below">
            <button aria-label="New group DM">
              <VideoIcon />
            </button>
          </Tooltip>
          <Tooltip label="Inbox" side="below">
            <button aria-label="Inbox">
              <InboxIcon />
            </button>
          </Tooltip>
        </div>
      </header>

      <div className="chat-body">
        <div className="chat-main friends-main">
          {tab === 'add' ? (
            <div className="add-friend">
              <h3>ADD FRIEND</h3>
              <p>You can add friends with their Discord username.</p>
              <div className={'add-friend-box' + (sent ? ' ok' : '')}>
                <input
                  value={handle}
                  placeholder="You can add friends with their Discord username."
                  aria-label="Username"
                  onChange={(e) => {
                    setHandle(e.target.value)
                    setSent(null)
                  }}
                />
                <button
                  className="btn-primary"
                  disabled={!handle.trim()}
                  onClick={() => {
                    setSent(handle.trim())
                    setHandle('')
                  }}
                >
                  Send Friend Request
                </button>
              </div>
              {sent ? (
                <p className="add-friend-note">
                  A friend request to <b>{sent}</b> would go to Discord’s API. Nothing was sent —
                  this page has no account server to send it to.
                </p>
              ) : null}
              <div className="add-friend-art">
                <WumpusMark />
              </div>
            </div>
          ) : (
            <>
              <div className="friends-search">
                <input placeholder="Search" aria-label="Search friends" />
                <SearchIcon />
              </div>
              <div className="friends-count">
                {tab.toUpperCase()} — 0
              </div>
              <div className="friends-empty">
                <WumpusMark />
                <p>{EMPTY[tab][0]}</p>
              </div>
            </>
          )}
        </div>
        <aside className="active-now">
          <h3>Active Now</h3>
          <div className="active-empty">
            <b>It’s quiet for now...</b>
            <span>
              When a friend starts an activity—like playing a game or hanging out on voice—we’ll
              show it here!
            </span>
          </div>
        </aside>
      </div>
    </main>
  )
}

/**
 * The full user profile modal — banner, avatar, names, About Me, Member Since,
 * Roles and the message box, in the client's order.
 */
export function ProfileModal({
  account,
  roles,
  onClose,
}: {
  account: Account
  roles: { id: string; name: string; color: string | null }[]
  onClose: () => void
}) {
  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="profile-modal" onMouseDown={(e) => e.stopPropagation()}>
        <button className="profile-close" onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>
        <div className="profile-banner-lg" style={{ background: account.color }} />
        <span className="profile-avatar-lg">
          <Avatar account={account} size={92} />
        </span>
        <div className="profile-more">
          <button aria-label="More">
            <MoreIcon />
          </button>
        </div>
        <div className="profile-card">
          <div className="profile-names">
            <b>{account.name}</b>
            <span>{account.handle}</span>
            {account.pronouns ? <i>{account.pronouns}</i> : null}
          </div>
          <div className="profile-section">
            <h4>About Me</h4>
            <p>{account.bio || 'Nothing here yet.'}</p>
          </div>
          <div className="profile-section">
            <h4>Member Since</h4>
            <p>{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
          </div>
          <div className="profile-section">
            <h4>Roles</h4>
            <div className="profile-roles">
              {roles.map((r) => (
                <span className="role-pill" key={r.id}>
                  <span className="role-dot" style={{ background: r.color ?? '#99aab5' }} />
                  {r.name}
                </span>
              ))}
            </div>
          </div>
          <div className="profile-section">
            <h4>Note</h4>
            <input className="profile-note" placeholder="Click to add a note" aria-label="Note" />
          </div>
          <div className="profile-msg">
            <input placeholder={`Message @${account.name}`} aria-label="Message" />
            <ChevronDownIcon />
          </div>
        </div>
      </div>
    </div>
  )
}
