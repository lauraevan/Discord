import { useState } from 'react'
import { PremiumType, type PremiumTypeValue } from '../nitro'
import { CheckSmallIcon, LockIcon, OrbsIcon, ShopSparkleIcon, SparkleIcon } from '../ui/Icons'
import { Decoration, DECORATIONS } from '../ui/Decorations'

/**
 * The Shop tab.
 *
 * Discord's Shop sells collectibles — avatar decorations and profile effects —
 * for money or for Orbs, with a Nitro discount. That model is what is built
 * here: Orbs earned from Quests are the currency, the Nitro discount is the
 * client's SHOP_DISCOUNTS perk, and a bought decoration is worn on the real
 * avatar everywhere in the app.
 *
 * The decorations themselves are drawn in src/ui/Decorations.tsx. Discord's
 * own artwork is served from its CDN, which this page cannot reach and should
 * not pass off as its own, so these are named for what they are rather than
 * for a Discord SKU.
 */

/** Nitro's SHOP_DISCOUNTS perk. */
const NITRO_DISCOUNT = 0.15

export function ShopPage({
  orbs,
  premiumType,
  owned,
  equipped,
  onBuy,
  onEquip,
}: {
  orbs: number
  premiumType: PremiumTypeValue
  owned: string[]
  equipped?: string
  onBuy: (id: string, price: number) => void
  onEquip: (id: string) => void
}) {
  const [collection, setCollection] = useState<string>('all')
  const discounted = premiumType === PremiumType.TIER_2
  const collections = ['all', ...new Set(DECORATIONS.map((d) => d.collection))]
  const shown = DECORATIONS.filter((d) => collection === 'all' || d.collection === collection)

  const priceOf = (base: number) =>
    discounted ? Math.round((base * (1 - NITRO_DISCOUNT)) / 25) * 25 : base

  return (
    <main className="chat shop">
      <header className="shop-header">
        <div className="shop-title">
          <ShopSparkleIcon size={22} />
          <h2>Shop</h2>
        </div>
        <span className="shop-orbs">
          <OrbsIcon size={18} />
          {orbs.toLocaleString()}
        </span>
      </header>

      <div className="shop-body">
        <section className="shop-hero">
          <h1>Avatar Decorations</h1>
          <p>
            Spend the Orbs you earn from Quests. {discounted ? 'Nitro takes ' : 'Nitro takes '}
            {Math.round(NITRO_DISCOUNT * 100)}% off every collectible
            {discounted ? ' — already applied.' : '.'}
          </p>
        </section>

        <div className="shop-collections">
          {collections.map((c) => (
            <button
              key={c}
              className={'shop-collection' + (c === collection ? ' on' : '')}
              onClick={() => setCollection(c)}
            >
              {c === 'all' ? 'All' : c}
            </button>
          ))}
        </div>

        <div className="shop-grid">
          {shown.map((d) => {
            const price = priceOf(d.orbs)
            const have = owned.includes(d.id)
            const on = equipped === d.id
            return (
              <article key={d.id} className={'shop-item' + (on ? ' on' : '')}>
                <span className="shop-item-art">
                  <Decoration id={d.id} size={88} />
                </span>
                <b>{d.name}</b>
                <span className="shop-item-collection">{d.collection}</span>
                {have ? (
                  <button
                    className={'shop-buy' + (on ? ' equipped' : '')}
                    onClick={() => onEquip(on ? '' : d.id)}
                  >
                    {on ? (
                      <>
                        <CheckSmallIcon size={16} />
                        Worn
                      </>
                    ) : (
                      'Wear'
                    )}
                  </button>
                ) : (
                  <button
                    className="shop-buy"
                    disabled={orbs < price}
                    onClick={() => onBuy(d.id, price)}
                  >
                    {orbs < price ? <LockIcon size={14} /> : <OrbsIcon size={14} />}
                    {price.toLocaleString()}
                    {discounted ? <s>{d.orbs.toLocaleString()}</s> : null}
                  </button>
                )}
              </article>
            )
          })}
        </div>

        {orbs === 0 ? (
          <p className="shop-empty">
            <SparkleIcon size={16} />
            No Orbs yet — finish a Quest to earn some.
          </p>
        ) : null}
      </div>
    </main>
  )
}
