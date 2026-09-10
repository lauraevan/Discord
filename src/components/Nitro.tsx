import { useCallback, useEffect, useRef, useState } from 'react'
import {
  COMPARISON,
  GIFT_HOST,
  GIFT_LENGTHS,
  GIFT_PROMO,
  PERKS,
  PLANS,
  PremiumType,
  TENURE_MONTHS,
  TIERS,
  WHATS_NEW,
  tenureLabel,
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
import { NitroArt, tenureBadge } from '../ui/NitroArt'
import * as Icons from '../ui/Icons'
import {
  BoostIcon,
  CheckSmallIcon,
  ChevronDownIcon,
  CloseIcon,
  CopyIcon,
  GiftIcon,
  HeartIcon,
  HeartOutlineIcon,
  NitroIcon,
  OrbsIcon,
  SparkleIcon,
} from '../ui/Icons'
import { NitroWordmark } from '../ui/NitroArt'

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

/**
 * The Nitro tab is one long marketing surface, not a set of tabs: the client
 * routes it as a single page (`NITRO_HOME: "/store"`) and instruments it
 * section by section — page banner, hero CTA, the Orbs section, perk cards
 * that flip, the tenure rewards, tier cards, the comparison table, the gift
 * section, a footer CTA and a floating CTA once you have scrolled. Those are
 * the sections below, in that order.
 */

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
  const [gifting, setGifting] = useState(false)
  const [wishlisted, setWishlisted] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const type = currentType(subscription)
  const active = isActive(subscription)
  const body = useRef<HTMLDivElement>(null)
  const plans = useRef<HTMLDivElement>(null)

  const toPlans = () => plans.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <main className="chat nitro">
      <header className="nitro-header">
        <NitroIcon size={22} className="nitro-mark" />
        <h2 className="nitro-title">Nitro</h2>
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

      <div
        className="nitro-body"
        ref={body}
        onScroll={(e) => {
          const el = e.currentTarget
          // the floating CTA rides in once the hero is gone and drops out
          // again over the footer's own CTA, so the two never stack
          const nearFoot = el.scrollTop + el.clientHeight > el.scrollHeight - 300
          setScrolled(el.scrollTop > 420 && !nearFoot)
        }}
      >
        {active ? null : (
          <section className="nitro-banner">
            <NitroArt name="yearly-upsell" className="nitro-banner-art" />
            <SparkleIcon size={18} />
            <b>Subscribe &amp; get a bonus bundle</b>
            <span>
              {GIFT_PROMO.orbs.toLocaleString()} Orbs land with your first month, to spend in the
              Shop.
            </span>
            <button className="nitro-banner-cta" onClick={toPlans}>
              Subscribe
            </button>
          </section>
        )}

        <NitroHero
          type={type}
          subscription={subscription}
          onSubscribe={toPlans}
          onCancel={onCancel}
        />

        <OrbsSection type={type} orbs={orbs} active={active} />

        <Bento />

        <Perks />

        <Tenure subscription={subscription} />

        <WhatsNew />

        <div ref={plans}>
          <Plans subscription={subscription} onSubscribe={onSubscribe} onCancel={onCancel} />
        </div>

        <Compare />

        <GiftInventory gifts={gifts} onRedeem={onRedeem} />

        {active ? null : (
          <section className="nitro-footer-cta">
            <h2>Get more out of every server</h2>
            <p>Cancel any time. The perks apply the moment you subscribe.</p>
            <button className="nitro-cta" onClick={toPlans}>
              Subscribe — {money(TIERS[0].monthly)}/month
            </button>
          </section>
        )}
      </div>

      {!active && scrolled ? (
        <div className="nitro-floating-cta">
          <NitroIcon size={18} />
          <b>Nitro</b>
          <span>{money(TIERS[0].monthly)}/month</span>
          <button onClick={toPlans}>Subscribe</button>
        </div>
      ) : null}

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

/** The hero, with the page's one primary CTA. */
function NitroHero({
  type,
  subscription,
  onSubscribe,
  onCancel,
}: {
  type: number
  subscription: Subscription | null
  onSubscribe: () => void
  onCancel: () => void
}) {
  const active = isActive(subscription)
  return (
    <section className="nitro-hero">
      {/* the cover is Discord's own artwork, not a drawing of it */}
      <NitroArt name="cover" className="nitro-hero-cover" />
      <NitroArt name="clouds" className="nitro-hero-clouds" />
      <NitroArt name="sparkles-pink" className="nitro-hero-sparkle one" />
      <NitroArt name="sparkles-green" className="nitro-hero-sparkle two" />
      <NitroArt name="plan-nitro" className="nitro-hero-wumpus" />
      <div className="nitro-hero-body">
        <NitroWordmark />
        <p>
          Bigger uploads, custom emoji everywhere, a profile that looks like you — and Orbs to
          spend in the Shop.
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
          <div className="nitro-hero-actions">
            <button className="nitro-cta" onClick={onSubscribe}>
              Subscribe — {money(TIERS[0].monthly)}/month
            </button>
            <button className="nitro-cta ghost" onClick={onSubscribe}>
              Compare plans
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

/** The Orbs section, and what the subscription is currently worth. */
function OrbsSection({ type, orbs, active }: { type: number; orbs: number; active: boolean }) {
  return (
    <section className="nitro-status">
      <div className="nitro-status-card">
        <OrbsIcon size={22} />
        <b>{orbs.toLocaleString()}</b>
        <span>Orbs</span>
      </div>
      <div className="nitro-status-card">
        <BoostIcon size={22} />
        <b>{type === PremiumType.TIER_2 ? 2 : 0}</b>
        <span>Server Boosts included</span>
      </div>
      <div className="nitro-status-card">
        <SparkleIcon size={22} />
        <b>{uploadLimitMb(type as 0 | 1 | 2 | 3)}MB</b>
        <span>Upload limit</span>
      </div>
      <div className="nitro-status-card">
        <NitroIcon size={22} />
        <b>{active ? 'Active' : 'None'}</b>
        <span>Subscription</span>
      </div>
    </section>
  )
}

/**
 * The bento box.
 *
 * The client instruments a `premium marketing bento box` above the perk cards,
 * and these are the illustrations Discord runs in it — its own, off the Nitro
 * page, vendored by tools/fetch-nitro-web-art.mjs.
 */
const BENTO: { art: string; title: string; body: string; wide?: boolean }[] = [
  {
    art: 'bento-uploads',
    title: 'Send it whole',
    body: 'Files up to 500MB, so a clip goes up as a clip and not as a link.',
    wide: true,
  },
  {
    art: 'bento-emoji',
    title: 'Every emoji, everywhere',
    body: 'Custom emoji and stickers from every server you are in, in any server and in DMs.',
  },
  {
    art: 'bento-profile',
    title: 'A profile that looks like you',
    body: 'Animated avatar, banner, decorations, and a different look per server.',
  },
  {
    art: 'bento-collectibles',
    title: 'Collectibles, kept',
    body: 'Decorations and effects stay yours, at 15% off in the Shop.',
  },
  {
    art: 'bento-themes',
    title: 'Paint the whole app',
    body: 'Ten background gradients over Light or Dark, and custom app icons on the dock.',
  },
  {
    art: 'bento-sounds',
    title: 'Bring the soundboard',
    body: 'Use any server’s sounds in every server, and upload your own.',
  },
  {
    art: 'bento-super',
    title: 'Super Reactions, uncapped',
    body: 'Free accounts get a handful a week. Nitro takes the cap off.',
  },
  {
    art: 'bento-video',
    title: 'Go live in HD',
    body: 'Stream and screen share up to 4K at 60fps, for as long as you like.',
    wide: true,
  },
]

function Bento() {
  return (
    <section className="nitro-section">
      <div className="nitro-bento">
        {BENTO.map((b) => (
          <article key={b.art} className={'nitro-bento-tile' + (b.wide ? ' wide' : '')}>
            <NitroArt name={b.art} className="nitro-bento-art" />
            <div className="nitro-bento-copy">
              <b>{b.title}</b>
              <span>{b.body}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

/**
 * The perk cards.
 *
 * They flip — the client tracks a `premium_marketing_perk_card_flipped` event
 * — and the page shows a first row until "See all perks" opens the rest.
 */
function Perks() {
  const [flipped, setFlipped] = useState<string | null>(null)
  const [all, setAll] = useState(false)
  const shown = all ? PERKS : PERKS.slice(0, 8)
  return (
    <section className="nitro-section">
      <div className="nitro-section-head">
        <h2 className="nitro-h2">Everything you get</h2>
        <button className="nitro-seeall" onClick={() => setAll((v) => !v)}>
          {all ? 'Show less' : 'See all perks'}
          <ChevronDownIcon size={16} className={all ? 'up' : undefined} />
        </button>
      </div>
      <div className="nitro-perks">
        {shown.map((perk) => {
          const Icon = (Icons as Record<string, typeof NitroIcon>)[perk.icon] ?? SparkleIcon
          const on = flipped === perk.id
          return (
            <button
              key={perk.id}
              className={'nitro-perk' + (on ? ' flipped' : '')}
              style={{ ['--perk' as string]: perk.color }}
              onClick={() => setFlipped(on ? null : perk.id)}
            >
              <span className="nitro-perk-face">
                <span className="nitro-perk-icon">
                  <Icon size={20} />
                </span>
                <b>{perk.title}</b>
                <span>{perk.body}</span>
              </span>
              <span className="nitro-perk-back">{perk.detail}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

/** The tenure ladder: the badge levels the client actually carries. */
function Tenure({ subscription }: { subscription: Subscription | null }) {
  const months = isActive(subscription)
    ? Math.max(
        1,
        Math.round(
          (Date.now() - (subscription!.until - (subscription!.interval === 2 ? 365 : 30) * 864e5)) /
            (30 * 864e5),
        ),
      )
    : 0
  const reached = TENURE_MONTHS.filter((m) => m <= months).length
  const pct = Math.min(100, (reached / TENURE_MONTHS.length) * 100)
  return (
    <section className="nitro-section">
      <h2 className="nitro-h2">Tenure rewards</h2>
      <p className="nitro-lede">
        The badge on your profile levels up the longer the subscription runs.
      </p>
      <div className="nitro-tenure">
        <span className="nitro-tenure-rail">
          <i style={{ width: `${pct}%` }} />
        </span>
        <ol>
          {TENURE_MONTHS.map((m, i) => (
            <li key={m} className={i < reached ? 'on' : ''}>
              <span className="nitro-tenure-node">
                <NitroArt name={tenureBadge(m)} />
              </span>
              {tenureLabel(m)}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function WhatsNew() {
  return (
    <section className="nitro-section">
      <h2 className="nitro-h2">What’s new</h2>
      <div className="nitro-news">
        {WHATS_NEW.map((n) => (
          <article key={n.title} className="nitro-news-item">
            <span className={'nitro-news-tag' + (n.tag === 'New' ? ' new' : '')}>{n.tag}</span>
            <div>
              <h3>{n.title}</h3>
              <p>{n.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
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
              {t.key === 'nitro' ? (
                <NitroArt name="tag-popular" className="nitro-popular" />
              ) : null}
              <NitroArt
                name={t.key === 'nitro' ? 'plan-nitro' : 'plan-basic'}
                className="nitro-plan-art"
              />
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
      <h2 className="nitro-h2">Compare Our Plans</h2>
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
            <NitroArt name={g.redeemedAt ? 'gift-box' : 'gift-chest'} className="nitro-gift-art" />
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
          <NitroArt name="gift-chest" className="gift-art" />
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
