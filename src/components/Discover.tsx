/**
 * Discover.
 *
 * The client routes this at /discovery, with three tabs the sidebar switches
 * between — GlobalDiscoveryTab.SERVERS, .APPS and .QUESTS — and sub-routes at
 * /discovery/servers and /discovery/applications. The catalogue behind the
 * servers tab is Discord's own directory: /discoverable-guilds for the
 * featured set, /discoverable-guilds/search for the search box, and
 * /discovery/categories for the categories below. The categories are real and
 * fixed, so they are here; the guilds are rows in Discord's database, so the
 * grid says so rather than inventing communities to fill itself.
 */
import { useState } from 'react'
import { AppsIcon, CompassIcon, QuestsIcon, SearchIcon } from '../ui/Icons'
import { EmptyArt } from '../ui/Art'

export type DiscoverTab = 'servers' | 'apps' | 'quests'

/**
 * Discord's own discovery categories, in the order its directory lists them.
 * A guild picks up to five; the client shows them as the row under the search.
 */
export const DISCOVERY_CATEGORIES = [
  'Gaming',
  'Music',
  'Entertainment',
  'Science & Education',
  'Student Hubs',
  'Anime & Manga',
  'Movies & TV',
  'Creative Arts',
  'Content Creator',
  'Sports',
  'Fashion & Beauty',
  'Relationships & Identity',
  'Travel & Food',
  'Fitness & Health',
  'Financial',
  'Other',
] as const

/** Discord's own App Directory categories. */
export const APP_CATEGORIES = [
  'Games',
  'Social',
  'Moderation & Tools',
  'Utilities',
  'Anime',
  'Productivity',
  'Music',
  'Customization',
  'Entertainment',
] as const

/** The panel that replaces the DM list while Discover is open. */
export function DiscoverSidebar({
  tab,
  onTab,
  questsDone,
}: {
  tab: DiscoverTab
  onTab: (t: DiscoverTab) => void
  questsDone: number
}) {
  return (
    <div className="dm-sidebar">
      <div className="discover-head">Discover</div>
      <div className="dm-nav">
        <button
          className={'row nav' + (tab === 'servers' ? ' active' : '')}
          onClick={() => onTab('servers')}
        >
          <CompassIcon />
          <span className="row-name">Servers</span>
        </button>
        <button
          className={'row nav' + (tab === 'apps' ? ' active' : '')}
          onClick={() => onTab('apps')}
        >
          <AppsIcon />
          <span className="row-name">Apps</span>
        </button>
        <button
          className={'row nav' + (tab === 'quests' ? ' active' : '')}
          onClick={() => onTab('quests')}
        >
          <QuestsIcon />
          <span className="row-name">Quests</span>
          {questsDone > 0 ? <span className="row-badge">{questsDone}</span> : null}
        </button>
      </div>
    </div>
  )
}

function Hero({
  title,
  blurb,
  placeholder,
  query,
  onQuery,
}: {
  title: string
  blurb: string
  placeholder: string
  query: string
  onQuery: (v: string) => void
}) {
  return (
    <section className="discover-hero">
      <h1>{title}</h1>
      <p>{blurb}</p>
      <div className="discover-search">
        <input
          value={query}
          placeholder={placeholder}
          aria-label={placeholder}
          onChange={(e) => onQuery(e.target.value)}
        />
        <SearchIcon />
      </div>
    </section>
  )
}

/** The grid Discord fills from its directory, and what stands in its place. */
function Catalogue({ what, endpoint }: { what: string; endpoint: string }) {
  return (
    <div className="discover-empty">
      <EmptyArt kind="no-results" />
      <b>Nothing to browse from here</b>
      <p>
        Discord builds this list on its own servers and hands it over at{' '}
        <code>{endpoint}</code>. There is no such thing behind a static page, so there are no{' '}
        {what} to show — inventing some would make this the one page here that is not real.
      </p>
    </div>
  )
}

export function DiscoverPage({ tab }: { tab: Exclude<DiscoverTab, 'quests'> }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const cats = tab === 'servers' ? DISCOVERY_CATEGORIES : APP_CATEGORIES
  const shown = cats.filter((c) => c.toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <main className="chat discover">
      <div className="discover-body">
        {tab === 'servers' ? (
          <Hero
            title="Find your community on Discord"
            blurb="From gaming, to music, to learning, there's a place for you."
            placeholder="Explore communities"
            query={query}
            onQuery={setQuery}
          />
        ) : (
          <Hero
            title="Find the right app for your server"
            blurb="Apps add new things to your server — games, moderation, music, and more."
            placeholder="Search apps"
            query={query}
            onQuery={setQuery}
          />
        )}

        <div className="discover-cats" role="tablist" aria-label="Categories">
          {shown.map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={category === c}
              className={'discover-cat' + (category === c ? ' on' : '')}
              onClick={() => setCategory((v) => (v === c ? null : c))}
            >
              {c}
            </button>
          ))}
          {!shown.length ? <span className="discover-nocat">No category matches “{query}”.</span> : null}
        </div>

        <h2 className="discover-heading">
          {category
            ? category
            : tab === 'servers'
              ? 'Featured communities'
              : 'Featured apps'}
        </h2>
        <Catalogue
          what={tab === 'servers' ? 'communities' : 'apps'}
          endpoint={tab === 'servers' ? '/discoverable-guilds' : '/applications/directory'}
        />
      </div>
    </main>
  )
}
