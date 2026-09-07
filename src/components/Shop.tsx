import { useMemo, useState } from 'react'
import type { Account } from '../data'
import { PremiumType, type PremiumTypeValue } from '../nitro'
import { COLLECTIONS, money, type ShopCollection, type ShopProduct } from '../shop'
import {
  CheckSmallIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  HeartIcon,
  HeartOutlineIcon,
  LockIcon,
  OrbsIcon,
  SearchIcon,
  ShopSparkleIcon,
} from '../ui/Icons'
import { DECORATIONS, Decoration } from '../ui/Decorations'
import { DefaultAvatar, WumpusMark } from '../ui/Art'

/**
 * The Shop tab.
 *
 * Everything named and priced here is Discord's: the collections, their
 * summaries, their gradients and confetti colours, the decorations, the
 * profile effects and the bundles, with both prices — what Discord charges and
 * the lower price a Nitro subscriber pays. It is generated into src/shop.ts
 * from Discord's own catalogue; see tools/fetch-shop.py.
 *
 * The decorations are the real artwork too, vendored by
 * tools/fetch-decorations.py and worn on the real avatar once bought. Profile
 * effects are the exception: their layers live on Discord's CDN, which this
 * page cannot reach, so an effect shows its collection's confetti colours
 * rather than pretending to be the effect.
 *
 * Orbs are the currency, since Orbs are what Quests pay — see orbsOf.
 */

/** Nitro's SHOP_DISCOUNTS perk. */
const NITRO_DISCOUNT = 0.15

type Tab = 'featured' | 'browse' | 'orbs' | 'games'
type Sort = 'popular' | 'newest' | 'price'

const SORTS: Record<Sort, string> = {
  popular: 'Popular',
  newest: 'Newest',
  price: 'Price',
}

const byId = Object.fromEntries(DECORATIONS.map((d) => [d.id, d]))

/** The collection a decoration belongs to, as the catalogue files it. */
const collectionOf = (id: string) =>
  COLLECTIONS.find((c) => c.decorations.some((d) => d.id === id))

/**
 * A collection's two background stops.
 *
 * A few of the older collections ship no style block at all, and the client
 * falls back on its own colours for those, so this does too rather than
 * painting a transparent banner.
 */
const stops = (c: ShopCollection) =>
  c.colors.length ? c.colors : [c.button, '#111214']

/** `linear-gradient(...)` from a collection's own two background colours. */
const gradient = (c: ShopCollection) => {
  const [from, to] = stops(c)
  return `linear-gradient(140deg, ${from}, ${to ?? from})`
}

export function ShopPage({
  account,
  orbs,
  premiumType,
  owned,
  equipped,
  onBuy,
  onEquip,
}: {
  account: Account
  orbs: number
  premiumType: PremiumTypeValue
  owned: string[]
  equipped?: string
  onBuy: (id: string, price: number) => void
  onEquip: (id: string) => void
}) {
  const [tab, setTab] = useState<Tab>('featured')
  const [openId, setOpenId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>('popular')
  const [sortOpen, setSortOpen] = useState(false)
  const [shuffled, setShuffled] = useState(0)
  const [wishlist, setWishlist] = useState<string[]>([])

  const discounted = premiumType === PremiumType.TIER_2
  const open = COLLECTIONS.find((c) => c.id === openId) ?? null

  /** The Orbs a decoration costs, with the Nitro discount if it applies. */
  const priceOf = (base: number) =>
    discounted ? Math.round((base * (1 - NITRO_DISCOUNT)) / 25) * 25 : base

  const items = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = DECORATIONS.filter(
      (d) => !q || d.name.toLowerCase().includes(q) || d.collection.toLowerCase().includes(q),
    )
    if (sort === 'price') return [...list].sort((a, b) => a.orbs - b.orbs)
    if (sort === 'newest') return [...list].reverse()
    if (shuffled) {
      // a stable shuffle: the seed changes only when Shuffle! is pressed
      return [...list].sort(
        (a, b) => hash(a.id + shuffled) - hash(b.id + shuffled),
      )
    }
    return list
  }, [query, sort, shuffled])

  const card = (d: (typeof DECORATIONS)[number]) => (
    <ItemCard
      key={d.id}
      account={account}
      id={d.id}
      name={d.name}
      collection={d.collection}
      orbs={priceOf(d.orbs)}
      full={d.orbs}
      discounted={discounted}
      owned={owned.includes(d.id)}
      worn={equipped === d.id}
      affordable={orbs >= priceOf(d.orbs)}
      wished={wishlist.includes(d.id)}
      onWish={() =>
        setWishlist((w) => (w.includes(d.id) ? w.filter((x) => x !== d.id) : [...w, d.id]))
      }
      onBuy={() => onBuy(d.id, priceOf(d.orbs))}
      onEquip={() => onEquip(equipped === d.id ? '' : d.id)}
    />
  )

  return (
    <main className="chat shop">
      <header className="shop-header">
        <ShopSparkleIcon size={24} className="shop-mark" />
        <nav className="shop-tabs">
          {(
            [
              ['featured', 'Featured', false],
              ['browse', 'Browse', true],
              ['orbs', 'Orbs Exclusives', false],
              ['games', 'Game Shops', true],
            ] as [Tab, string, boolean][]
          ).map(([id, label, caret]) => (
            <button
              key={id}
              className={'shop-tab' + (tab === id ? ' on' : '')}
              onClick={() => {
                setTab(id)
                setOpenId(null)
              }}
            >
              {label}
              {caret ? <ChevronDownIcon size={14} /> : null}
            </button>
          ))}
        </nav>
        <div className="shop-header-right">
          <label className="shop-search">
            <input
              value={query}
              placeholder="Search the Shop"
              onChange={(e) => setQuery(e.target.value)}
            />
            <SearchIcon size={16} />
          </label>
          <button
            className={'shop-heart' + (wishlist.length ? ' on' : '')}
            aria-label="Wishlist"
          >
            {wishlist.length ? <HeartIcon size={20} /> : <HeartOutlineIcon size={20} />}
          </button>
          <span className="shop-orbs">
            <OrbsIcon size={18} />
            {orbs.toLocaleString()}
          </span>
        </div>
      </header>

      <div className="shop-body">
        {open ? (
          <CollectionPage
            c={open}
            discounted={discounted}
            onBack={() => setOpenId(null)}
            card={card}
          />
        ) : query.trim() ? (
          <>
            <h2 className="shop-heading">
              {items.length} result{items.length === 1 ? '' : 's'} for “{query.trim()}”
            </h2>
            <div className="shop-grid">{items.map(card)}</div>
            {items.length === 0 ? (
              <Empty
                pose="shrug"
                line="Wumpus looked everywhere and found nothing."
              />
            ) : null}
          </>
        ) : tab === 'games' ? (
          <Empty
            pose="waiting"
            line="No game shops yet — they show up here once you play a game with one."
          />
        ) : tab === 'browse' ? (
          <>
            <h2 className="shop-heading">Collections</h2>
            <div className="shop-collections">
              {COLLECTIONS.map((c) => (
                <CollectionTile key={c.id} c={c} onOpen={() => setOpenId(c.id)} />
              ))}
            </div>
          </>
        ) : tab === 'orbs' ? (
          <>
            <section className="shop-orbs-hero">
              <OrbsIcon size={38} />
              <div>
                <h1>Orbs Exclusives</h1>
                <p>Spend the Orbs you earn from Quests on collectibles you can only get here.</p>
              </div>
            </section>
            <div className="shop-grid">{items.map(card)}</div>
          </>
        ) : (
          <>
            <FeaturedHero c={COLLECTIONS[0]} onOpen={() => setOpenId(COLLECTIONS[0].id)} />

            <h2 className="shop-heading">Bundles</h2>
            <div className="shop-bundles">
              {COLLECTIONS.flatMap((c) =>
                c.bundles.map((b) => (
                  <BundleCard key={b.id} c={c} b={b} discounted={discounted} />
                )),
              ).slice(0, 4)}
            </div>

            <div className="shop-bar">
              <h2 className="shop-heading">Find your style</h2>
              <div className="shop-controls">
                <span className="shop-sort-label">Sort by</span>
                <div className="quests-select">
                  <button className="quests-select-btn" onClick={() => setSortOpen((v) => !v)}>
                    {SORTS[sort]}
                    <ChevronDownIcon size={16} />
                  </button>
                  {sortOpen ? (
                    <>
                      <div className="quests-select-away" onClick={() => setSortOpen(false)} />
                      <ul className="quests-select-menu">
                        {(Object.keys(SORTS) as Sort[]).map((s) => (
                          <li key={s}>
                            <button
                              className={s === sort ? 'on' : ''}
                              onClick={() => {
                                setSort(s)
                                setSortOpen(false)
                              }}
                            >
                              {SORTS[s]}
                              {s === sort ? <CheckSmallIcon size={16} /> : null}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </div>
                <button className="shop-shuffle" onClick={() => setShuffled(Date.now())}>
                  Shuffle!
                </button>
              </div>
            </div>
            <div className="shop-grid">{items.map(card)}</div>

            <h2 className="shop-heading">More collections</h2>
            <div className="shop-strips">
              {COLLECTIONS.slice(1).map((c) => (
                <CollectionStrip key={c.id} c={c} onOpen={() => setOpenId(c.id)} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}

/** A small stable hash, so Shuffle! reorders without reordering on every render. */
function hash(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return h
}

/**
 * A decoration worn on an avatar, the way the Shop previews one: over your own
 * avatar rather than a stock face, at the 1.2x Discord wears it at.
 */
function Preview({
  id,
  color,
  size,
}: {
  id: string
  color?: string
  size: number
}) {
  return (
    <span className="shop-avatar" style={{ width: size, height: size }}>
      <DefaultAvatar color={color ?? '#5865f2'} />
      <span className="avatar-decoration">
        <Decoration id={id} size={Math.round(size * 1.2)} />
      </span>
    </span>
  )
}

/** Three of a collection's decorations, worn — how Discord previews one. */
function Worn({ ids, size = 72 }: { ids: string[]; size?: number }) {
  return (
    <div className="shop-worn">
      {ids.map((id) => (
        <Preview key={id} id={id} size={size} />
      ))}
    </div>
  )
}

/**
 * The collection's own confetti colours, thrown behind its banner.
 *
 * Discord's banners are artwork; the closest honest thing here is the colour
 * the collection actually carries — `styles.confetti_colors` is what the client
 * bursts when you buy from it — so a collection whose gradient is two near-black
 * stops still reads as itself rather than as a black slab.
 */
function Confetti({ c }: { c: ShopCollection }) {
  const colors = c.confetti.length ? c.confetti : stops(c)
  return (
    <span className="shop-hero-glow" aria-hidden="true">
      {colors.slice(0, 6).map((col, i) => (
        <i key={i} style={{ background: col }} />
      ))}
    </span>
  )
}

/** The collection Discord leads the Shop with. */
function FeaturedHero({ c, onOpen }: { c: ShopCollection; onOpen: () => void }) {
  return (
    <section className="shop-hero" style={{ background: gradient(c) }}>
      <Confetti c={c} />
      <div className="shop-hero-body">
        <span className="shop-hero-tag">Featured collection</span>
        <h1>{c.name}</h1>
        <p>{c.summary}</p>
        <button className="shop-hero-cta" style={{ background: c.button }} onClick={onOpen}>
          Shop the Collection
        </button>
      </div>
      <Worn ids={c.decorations.slice(0, 3).map((d) => d.id)} size={84} />
    </section>
  )
}

/** A bundle, previewed the way the Shop previews one: on profile cards. */
function BundleCard({
  c,
  b,
  discounted,
}: {
  c: ShopCollection
  b: ShopProduct
  discounted: boolean
}) {
  const ids = c.decorations.slice(0, 2).map((d) => d.id)
  const price = discounted ? b.nitro : b.price
  return (
    <article className="shop-bundle" style={{ background: gradient(c) }}>
      <span className="shop-bundle-art">
        {ids.map((id, i) => (
          <span key={id} className={'shop-bundle-card c' + i}>
            <Preview id={id} size={48} />
            <b>{byId[id]?.name}</b>
            <em>{c.name}</em>
          </span>
        ))}
      </span>
      <span className="shop-bundle-foot">
        <b>{b.name}</b>
        <span className="shop-bundle-price">
          {price != null ? money(price) : '—'}
          {discounted && b.price != null ? <s>{money(b.price)}</s> : null}
        </span>
      </span>
    </article>
  )
}

/** A collection, as a tile on the Browse tab. */
function CollectionTile({ c, onOpen }: { c: ShopCollection; onOpen: () => void }) {
  return (
    <button className="shop-tile" onClick={onOpen}>
      <span className="shop-tile-art" style={{ background: gradient(c) }}>
        <Confetti c={c} />
        <Worn ids={c.decorations.slice(0, 3).map((d) => d.id)} size={52} />
      </span>
      <b>{c.name}</b>
      <span className="shop-tile-summary">{c.summary}</span>
      <span className="shop-tile-count">
        {c.decorations.length + c.effects.length} collectibles
      </span>
    </button>
  )
}

/** The wide banner Discord runs under the shelves, with "Take me there". */
function CollectionStrip({ c, onOpen }: { c: ShopCollection; onOpen: () => void }) {
  return (
    <section className="shop-strip" style={{ background: gradient(c) }}>
      <Confetti c={c} />
      <div className="shop-strip-body">
        <h3>{c.name}</h3>
        <p>{c.summary}</p>
        <button className="shop-strip-cta" onClick={onOpen}>
          Take me there
        </button>
      </div>
      <Worn ids={c.decorations.slice(0, 3).map((d) => d.id)} size={60} />
    </section>
  )
}

/** One collection's own page: everything in it, priced. */
function CollectionPage({
  c,
  discounted,
  onBack,
  card,
}: {
  c: ShopCollection
  discounted: boolean
  onBack: () => void
  card: (d: (typeof DECORATIONS)[number]) => React.ReactNode
}) {
  return (
    <>
      <button className="shop-back" onClick={onBack}>
        <ChevronLeftIcon size={16} />
        Shop
      </button>
      <section className="shop-hero tall" style={{ background: gradient(c) }}>
        <Confetti c={c} />
        <div className="shop-hero-body">
          <h1>{c.name}</h1>
          <p>{c.summary}</p>
        </div>
        <Worn ids={c.decorations.slice(0, 3).map((d) => d.id)} size={84} />
      </section>

      {c.bundles.length ? (
        <>
          <h2 className="shop-heading">Bundles</h2>
          <div className="shop-bundles">
            {c.bundles.map((b) => (
              <BundleCard key={b.id} c={c} b={b} discounted={discounted} />
            ))}
          </div>
        </>
      ) : null}

      <h2 className="shop-heading">Avatar Decorations</h2>
      <div className="shop-grid">
        {c.decorations.map((d) => byId[d.id]).filter(Boolean).map(card)}
      </div>

      {c.effects.length ? (
        <>
          <h2 className="shop-heading">Profile Effects</h2>
          <div className="shop-grid">
            {c.effects.map((e) => (
              <EffectCard key={e.id} c={c} e={e} discounted={discounted} />
            ))}
          </div>
        </>
      ) : null}
    </>
  )
}

/**
 * A profile effect.
 *
 * Discord animates these over the profile from layered sprites on its CDN.
 * Those pixels are out of reach here, so the card shows the effect's own
 * confetti colours drifting rather than a drawing pretending to be it.
 */
function EffectCard({
  c,
  e,
  discounted,
}: {
  c: ShopCollection
  e: ShopProduct
  discounted: boolean
}) {
  const price = discounted ? e.nitro : e.price
  return (
    <article className="shop-item effect">
      <span className="shop-item-art" style={{ background: gradient(c) }}>
        <span className="shop-effect">
          {(c.confetti.length ? c.confetti : stops(c)).map((col, i) => (
            <i key={i} style={{ background: col, animationDelay: `${i * 0.42}s` }} />
          ))}
        </span>
      </span>
      <b>{e.name}</b>
      <span className="shop-item-collection">{e.summary}</span>
      <button className="shop-buy" disabled>
        {price != null ? money(price) : '—'}
      </button>
    </article>
  )
}

/** A decoration, priced in Orbs, buyable and wearable. */
function ItemCard({
  account,
  id,
  name,
  collection,
  orbs,
  full,
  discounted,
  owned,
  worn,
  affordable,
  wished,
  onWish,
  onBuy,
  onEquip,
}: {
  account: Account
  id: string
  name: string
  collection: string
  orbs: number
  full: number
  discounted: boolean
  owned: boolean
  worn: boolean
  affordable: boolean
  wished: boolean
  onWish: () => void
  onBuy: () => void
  onEquip: () => void
}) {
  const c = collectionOf(id)
  return (
    <article className={'shop-item' + (worn ? ' on' : '')}>
      <span
        className="shop-item-art"
        style={c ? { background: gradient(c) } : undefined}
      >
        <Preview id={id} color={account.color} size={100} />
        <button
          className={'shop-wish' + (wished ? ' on' : '')}
          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={onWish}
        >
          {wished ? <HeartIcon size={16} /> : <HeartOutlineIcon size={16} />}
        </button>
      </span>
      <b>{name}</b>
      <span className="shop-item-collection">{collection}</span>
      {owned ? (
        <button className={'shop-buy' + (worn ? ' equipped' : '')} onClick={onEquip}>
          {worn ? (
            <>
              <CheckSmallIcon size={16} />
              Worn
            </>
          ) : (
            'Wear'
          )}
        </button>
      ) : (
        <button className="shop-buy" disabled={!affordable} onClick={onBuy}>
          {affordable ? <OrbsIcon size={14} /> : <LockIcon size={14} />}
          {orbs.toLocaleString()}
          {discounted ? <s>{full.toLocaleString()}</s> : null}
        </button>
      )}
    </article>
  )
}

function Empty({ pose, line }: { pose: 'shrug' | 'waiting'; line: string }) {
  return (
    <div className="shop-emptystate">
      <WumpusMark pose={pose} />
      <p>{line}</p>
    </div>
  )
}
