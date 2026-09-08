/**
 * Connections.
 *
 * Discord's Connections page is a grid of platform tiles you click to link an
 * account, and a list of the accounts you have linked. The services below are
 * the client's own `ConnectionService` list, keyed by the id Discord uses in
 * its API (`spotify`, `leagueoflegends`, `riotgames`, and `twitter` for X,
 * which kept its old id through the rename), and each one's logo is Discord's
 * own file, vendored out of the Android APK by tools/fetch-android-art.py.
 */

const logos = import.meta.glob('./assets/platforms/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

export type ConnectionService = {
  id: string
  name: string
  /** Discord lets a few services pull your friends across */
  friendSync?: boolean
  /** Spotify is the one connection that can drive your status */
  status?: boolean
  /** the brand colour Discord tints the tile's hover state with */
  color: string
}

export const SERVICES: ConnectionService[] = [
  { id: 'battlenet', name: 'Battle.net', color: '#148eff' },
  { id: 'crunchyroll', name: 'Crunchyroll', color: '#f47521' },
  { id: 'ebay', name: 'eBay', color: '#e53238' },
  { id: 'epic', name: 'Epic Games', color: '#2a2a2a' },
  { id: 'facebook', name: 'Facebook', friendSync: true, color: '#1877f2' },
  { id: 'github', name: 'GitHub', color: '#181717' },
  { id: 'instagram', name: 'Instagram', color: '#e4405f' },
  { id: 'leagueoflegends', name: 'League of Legends', color: '#c8aa6e' },
  { id: 'paypal', name: 'PayPal', color: '#003087' },
  { id: 'playstation', name: 'PlayStation Network', color: '#0070d1' },
  { id: 'reddit', name: 'Reddit', color: '#ff4500' },
  { id: 'riotgames', name: 'Riot Games', color: '#d13639' },
  { id: 'samsung', name: 'Samsung Galaxy', color: '#1428a0' },
  { id: 'skype', name: 'Skype', color: '#00aff0' },
  { id: 'spotify', name: 'Spotify', status: true, color: '#1db954' },
  { id: 'steam', name: 'Steam', friendSync: true, color: '#00adee' },
  { id: 'tiktok', name: 'TikTok', color: '#000000' },
  { id: 'twitch', name: 'Twitch', color: '#9146ff' },
  { id: 'twitter', name: 'X', color: '#000000' },
  { id: 'xbox', name: 'Xbox', color: '#107c10' },
  { id: 'youtube', name: 'YouTube', color: '#ff0000' },
]

export const serviceOf = (id: string) => SERVICES.find((s) => s.id === id)

export const logoOf = (id: string) => logos[`./assets/platforms/${id}.webp`]

/** One account linked to a service. */
export type Connection = {
  service: string
  /** the name that platform knows you by */
  name: string
  /** Discord shows a check on connections the platform confirmed */
  verified: boolean
  /** shown as a chip on your profile */
  onProfile: boolean
  /** pulls that platform's friends into your Discord friend suggestions */
  syncFriends: boolean
  /** Spotify only: drives the "Listening to" status line */
  showActivity: boolean
}

export const connect = (service: string, name: string): Connection => ({
  service,
  name,
  verified: true,
  onProfile: true,
  syncFriends: false,
  showActivity: service === 'spotify',
})
