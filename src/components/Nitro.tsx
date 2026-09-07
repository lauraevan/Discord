import { useCallback, useEffect, useState } from 'react'
import {
  BOOST_DISCOUNT,
  BOOST_PRICE,
  COMPARISON,
  GIFT_HOST,
  GIFT_LENGTHS,
  GIFT_PROMO,
  PERKS,
  PLANS,
  PremiumType,
  TIERS,
  WHATS_NEW,
  currentType,
  giftCode,
  giftLength,
  isActive,
  money,
  uploadLimitMb,
  type Gift,
  type Subscription,
  type Tier,
} from '../nitro'
import {
  BoostIcon,
  CheckSmallIcon,
  CloseIcon,
  CopyIcon,
  GiftIcon,
  HeartIcon,
  HeartOutlineIcon,
  NitroIcon,
  OrbsIcon,
  SparkleIcon,
} from '../ui/Icons'
import { NitroHeroArt, NitroWordmark, PerkArt } from '../ui/NitroArt'

/**
 * The Nitro tab.
 *
 * Tabs, plan table, perk copy, prices and the Send a Gift dialog are
 * Discord's; the premium type numbers, SKU ids, billing intervals, feature
 * flags and brand hexes come from the shipped client bundle (see src/nitro.ts
 * and docs/discord-reference.md). Subscribing here is real in the only sense
 * a page can make it real: it sets the account's premium type, which is what
 * the rest of the app gates its perks on.
 */

const TABS = ['Home', "What's New", 'Best of Nitro', 'Plans', 'Compare'] as const
type Tab = (typeof TABS)[number]

export function NitroPage({
  subscription,
  gifts,
  orbs,
  onSubscribe,
  onCancel,
  onGift,
  onRedeem,
}: {
  subscription: Subscription | null
  gifts: Gift[]
  orbs: number
  onSubscribe: (s: Subscription) => void
  onCancel: () => void
  onGift: (g: Gift) => void
  onRedeem: (code: string) => void
}) {
  const [tab, setTab] = useState<Tab>('Home')
  const [gifting, setGifting] = useState(false)
  const [wishlisted, setWishlisted] = useState(false)
  const type = currentType(subscription)

  return (
    <main className="chat nitro">
      <header className="nitro-header">
        <nav className="nitro-tabs">
          {TABS.map((t) => (
            <button
              key={t}
              className={'nitro-tab' + (t === tab ? ' on' : '')}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </nav>
        <div className="nitro-header-actions">
          <button
            className={'nitro-heart' + (wishlisted ? ' on' : '')}
            aria-label="Add Nitro to your wishlist"
            aria-pressed={wishlisted}
            onClick={() => setWishlisted((v) => !v)}
          >
            {wishlisted ? <HeartIcon size={20} /> : <HeartOutlineIcon size={20} />}
          </button>
          <button className="nitro-gift-btn" onClick={() => setGifting(true)}>
            <GiftIcon size={18} />
            Gift Nitro
          </button>
        </div>
      </header>

      <div className="nitro-body">
        {tab === 'Home' ? (
          <NitroHome
            type={type}
            subscription={subscription}
            orbs={orbs}
            onSubscribe={() => setTab('Plans')}
            onCancel={onCancel}
          />
        ) : tab === "What's New" ? (
          <WhatsNew />
        ) : tab === 'Best of Nitro' ? (
          <BestOfNitro />
        ) : tab === 'Plans' ? (
          <Plans subscription={subscription} onSubscribe={onSubscribe} onCancel={onCancel} />
        ) : (
          <Compare />
        )}

        <GiftInventory gifts={gifts} onRedeem={onRedeem} />
      </div>

      {gifting ? (
        <SendGiftModal
          onClose={() => setGifting(false)}
          onGift={(g) => {
            onGift(g)
            setGifting(false)
          }}
        />
      ) : null}
    </main>
  )
}

function NitroHome({
  type,
  subscription,
  orbs,
  onSubscribe,
  onCancel,
}: {
  type: number
  subscription: Subscription | null
  orbs: number
  onSubscribe: () => void
  onCancel: () => void
}) {
  const active = isActive(subscription)
  return (
    <>
      <section className="nitro-hero">
        <NitroHeroArt />
        <div className="nitro-hero-body">
        <NitroWordmark />
        <p>
          Show off a new look, upload bigger files, and get more out of every server you are in.
        </p>
        {active ? (
          <div className="nitro-hero-active">
            <span className="nitro-chip">
              <NitroIcon size={16} />
              {type === PremiumType.TIER_2 ? 'Nitro' : 'Nitro Basic'} · renews{' '}
              {new Date(subscription!.until).toLocaleDateString(undefined, {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            <button className="nitro-cancel" onClick={onCancel}>
              Cancel subscription
            </button>
          </div>
        ) : (
          <button className="nitro-cta" onClick={onSubscribe}>
            Subscribe — {money(TIERS[0].monthly)}/month
          </button>
        )}
        </div>
      </section>

      {active ? (
        <section className="nitro-status">
          <div className="nitro-status-card">
            <OrbsIcon size={24} />
            <b>{orbs.toLocaleString()}</b>
            <span>Orbs</span>
          </div>
          <div className="nitro-status-card">
            <BoostIcon size={24} />
            <b>{type === PremiumType.TIER_2 ? 2 : 0}</b>
            <span>Server Boosts included</span>
          </div>
          <div className="nitro-status-card">
            <SparkleIcon size={24} />
            <b>{uploadLimitMb(type as 0 | 1 | 2 | 3)}MB</b>
            <span>Upload limit</span>
          </div>
        </section>
      ) : null}

      <h2 className="nitro-h2">Everything you get</h2>
      <section className="nitro-perks">
        {PERKS.map((p) => (
          <article key={p.title} className="nitro-perk">
            <PerkArt kind={p.art} />
            <h3>{p.title}</h3>
            <p>{p.body}</p>
          </article>
        ))}
      </section>
    </>
  )
}

function WhatsNew() {
  return (
    <>
      <h2 className="nitro-h2">What’s new in Nitro</h2>
      <section className="nitro-news">
        {WHATS_NEW.map((n) => (
          <article key={n.title} className="nitro-news-item">
            <span className={'nitro-news-tag' + (n.tag === 'New' ? ' new' : '')}>{n.tag}</span>
            <div>
              <h3>{n.title}</h3>
              <p>{n.body}</p>
            </div>
          </article>
        ))}
      </section>
    </>
  )
}

function BestOfNitro() {
  return (
    <>
      <h2 className="nitro-h2">Best of Nitro</h2>
      <p className="nitro-lede">
        The perks people use most, and what they actually change day to day.
      </p>
      <section className="nitro-best">
        <article className="nitro-best-card wide">
          <h3>500MB uploads</h3>
          <p>
            Free accounts stop at {uploadLimitMb(PremiumType.NONE)}MB. Nitro takes it to{' '}
            {uploadLimitMb(PremiumType.TIER_2)}MB, so a clip goes up as a file instead of a link.
          </p>
        </article>
        <article className="nitro-best-card">
          <h3>Two boosts, and 30% off the rest</h3>
          <p>
            A boost costs {money(BOOST_PRICE)} a month. Nitro includes two and takes{' '}
            {Math.round(BOOST_DISCOUNT * 100)}% off every extra one —{' '}
            {money(BOOST_PRICE * (1 - BOOST_DISCOUNT))} each.
          </p>
        </article>
        <article className="nitro-best-card">
          <h3>Emoji and stickers everywhere</h3>
          <p>Every custom emoji from every server you are in, in any server and in DMs.</p>
        </article>
        <article className="nitro-best-card">
          <h3>4,000 character messages</h3>
          <p>Twice the limit, so a long post stays one message instead of three.</p>
        </article>
        <article className="nitro-best-card">
          <h3>Bonus Orbs every month</h3>
          <p>Plus a multiplier on every Quest you finish, to spend in the Shop.</p>
        </article>
      </section>
    </>
  )
}

function Plans({
  subscription,
  onSubscribe,
  onCancel,
}: {
  subscription: Subscription | null
  onSubscribe: (s: Subscription) => void
  onCancel: () => void
}) {
  const [interval, setInterval] = useState<1 | 2>(1)
  const active = isActive(subscription)
  return (
    <>
      <h2 className="nitro-h2">Choose your plan</h2>
      <div className="nitro-interval">
        <button className={interval === 1 ? 'on' : ''} onClick={() => setInterval(1)}>
          Monthly
        </button>
        <button className={interval === 2 ? 'on' : ''} onClick={() => setInterval(2)}>
          Yearly
          <span className="nitro-save">Save 16%</span>
        </button>
      </div>

      <section className="nitro-plans">
        {TIERS.map((t) => {
          const price = interval === 1 ? t.monthly : t.yearly
          const mine = active && subscription!.premiumType === t.premiumType
          return (
            <article key={t.key} className={'nitro-plan ' + t.key}>
              {t.key === 'nitro' ? <span className="nitro-popular">Popular</span> : null}
              <h3>{t.name}</h3>
              <p className="nitro-price">
                <b>{money(price)}</b>
                <span>/{interval === 1 ? 'month' : 'year'}</span>
              </p>
              <ul className="nitro-perklist">
                {t.perks.map((p) => (
                  <li key={p}>
                    <CheckSmallIcon size={18} />
                    {p}
                  </li>
                ))}
              </ul>
              {mine ? (
                <button className="nitro-plan-btn current" onClick={onCancel}>
                  Cancel
                </button>
              ) : (
                <button
                  className="nitro-plan-btn"
                  onClick={() =>
                    onSubscribe({
                      premiumType: t.premiumType,
                      interval,
                      source: 'purchase',
                      until: Date.now() + giftLength(interval),
                    })
                  }
                >
                  {active ? 'Switch to this plan' : 'Subscribe'}
                </button>
              )}
            </article>
          )
        })}
      </section>

      <details className="nitro-skus">
        <summary>Every plan Discord bills, and the SKU behind it</summary>
        <table className="nitro-sku-table">
          <thead>
            <tr>
              <th>Plan</th>
              <th>premium_type</th>
              <th>Interval</th>
              <th>SKU</th>
              <th>Sold today</th>
            </tr>
          </thead>
          <tbody>
            {PLANS.map((p) => (
              <tr key={p.label}>
                <td>{p.label}</td>
                <td>{p.premiumType}</td>
                <td>
                  {p.intervalCount} × {p.interval === 1 ? 'month' : 'year'}
                </td>
                <td className="mono">{p.skuId}</td>
                <td>{p.sold ? 'yes' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </>
  )
}

function Compare() {
  const cell = (v: string | null) =>
    v === null ? (
      <span className="nitro-no">—</span>
    ) : v === 'yes' ? (
      <CheckSmallIcon size={20} className="nitro-yes" />
    ) : (
      <span>{v}</span>
    )
  return (
    <>
      <h2 className="nitro-h2">Compare plans</h2>
      <table className="nitro-compare">
        <thead>
          <tr>
            <th />
            <th>Free</th>
            <th>Nitro Basic</th>
            <th className="hi">Nitro</th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON.map((row) => (
            <tr key={row.feature}>
              <th scope="row">{row.feature}</th>
              <td>{cell(row.free)}</td>
              <td>{cell(row.basic)}</td>
              <td className="hi">{cell(row.nitro)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

function GiftInventory({ gifts, onRedeem }: { gifts: Gift[]; onRedeem: (code: string) => void }) {
  const [code, setCode] = useState('')
  if (gifts.length === 0 && code === '') {
    return (
      <section className="nitro-redeem">
        <h2 className="nitro-h2">Redeem a gift</h2>
        <div className="nitro-redeem-row">
          <input
            className="field"
            placeholder={`Enter a code or a ${GIFT_HOST} link`}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button className="btn-primary" disabled={!code.trim()} onClick={() => onRedeem(code.trim())}>
            Redeem
          </button>
        </div>
      </section>
    )
  }
  return (
    <section className="nitro-redeem">
      <h2 className="nitro-h2">Your gifts</h2>
      <div className="nitro-redeem-row">
        <input
          className="field"
          placeholder={`Enter a code or a ${GIFT_HOST} link`}
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button className="btn-primary" disabled={!code.trim()} onClick={() => onRedeem(code.trim())}>
          Redeem
        </button>
      </div>
      <ul className="nitro-gifts">
        {gifts.map((g) => (
          <li key={g.code} className={g.redeemedAt ? 'used' : ''}>
            <GiftIcon size={20} />
            <div>
              <b>
                {g.tier === 'nitro' ? 'Nitro' : 'Nitro Basic'} ·{' '}
                {g.interval === 2 ? '1 Year' : '1 Month'}
              </b>
              <span className="mono">
                {GIFT_HOST}/{g.code}
              </span>
            </div>
            {g.redeemedAt ? (
              <span className="nitro-used">Redeemed</span>
            ) : (
              <>
                <button
                  className="btn-secondary"
                  onClick={() => navigator.clipboard?.writeText(`https://${GIFT_HOST}/${g.code}`)}
                >
                  <CopyIcon size={16} />
                  Copy link
                </button>
                <button className="btn-primary" onClick={() => onRedeem(g.code)}>
                  Redeem
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * Send a Gift — the dialog Discord opens from the Gift Nitro button: the two
 * tiers side by side with their perk lists, monthly and yearly prices, the
 * Orbs promotion inside the Nitro column, and the badge progress strip along
 * the bottom.
 */
export function SendGiftModal({
  onClose,
  onGift,
}: {
  onClose: () => void
  onGift: (g: Gift) => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const buy = useCallback(
    (tier: Tier, interval: 1 | 2) =>
      onGift({ code: giftCode(), tier: tier.key, interval, createdAt: Date.now() }),
    [onGift],
  )

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="gift" onMouseDown={(e) => e.stopPropagation()}>
        <div className="gift-head">
          <h2>Send a Gift</h2>
          <button className="gift-close" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className="gift-cols">
          {TIERS.map((t) => (
            <section key={t.key} className={'gift-col ' + t.key}>
              <header>
                <NitroIcon size={20} />
                <h3>{t.name.toUpperCase()}</h3>
                {t.key === 'nitro' ? <span className="gift-popular">POPULAR</span> : null}
              </header>
              <div className="gift-prices">
                {GIFT_LENGTHS.map((g) => (
                  <button key={g.interval} className="gift-price" onClick={() => buy(t, g.interval)}>
                    <b>{money(g.interval === 1 ? t.monthly : t.yearly)}</b>
                    <span>/{g.interval === 1 ? 'month' : 'year'}</span>
                  </button>
                ))}
              </div>
              <ul className="gift-perks">
                {t.perks.map((p) => (
                  <li key={p}>
                    <CheckSmallIcon size={16} />
                    {p}
                  </li>
                ))}
              </ul>
              {t.key === 'nitro' ? (
                <div className="gift-promo">
                  <span className="gift-promo-pill">{GIFT_PROMO.endsInDays}D LEFT</span>
                  <b>Get {GIFT_PROMO.orbs.toLocaleString()} Orbs</b>
                  <span>When you gift Nitro</span>
                  <OrbsIcon size={28} />
                </div>
              ) : null}
            </section>
          ))}
        </div>

        <footer className="gift-foot">
          <GiftIcon size={20} />
          <span>1 gift away from the Patron Badge!</span>
        </footer>
      </div>
    </div>
  )
}
