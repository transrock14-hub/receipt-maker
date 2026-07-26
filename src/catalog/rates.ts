/**
 * Live USD rates for receipt coins.
 * Prefer API cache (/rates); fall back to CoinGecko if API unavailable.
 */
import { COINS, type CoinSymbol } from './coins'
import { api } from '../auth/api'

export type RatesMap = Record<string, number>

export type RatesPayload = {
  rates: RatesMap
  updated_at: string | null
  source: string
  stale?: boolean
}

const FALLBACK: RatesMap = {
  BTC: 95000,
  ETH: 3400,
  USDT: 1,
  USDC: 1,
  BNB: 620,
  SOL: 180,
  XRP: 2.4,
  DOGE: 0.18,
  TRX: 0.25,
  TON: 5.5,
  ADA: 0.75,
  AVAX: 28,
  LINK: 18,
  DOT: 7.5,
  MATIC: 0.45,
}

let cache: RatesPayload | null = null
let inflight: Promise<RatesPayload> | null = null

export function getCachedRates(): RatesPayload {
  return (
    cache || {
      rates: { ...FALLBACK },
      updated_at: null,
      source: 'fallback',
      stale: true,
    }
  )
}

export function usdRateFor(symbol: string, rates?: RatesMap): number {
  const map = rates || getCachedRates().rates
  const key = symbol.toUpperCase()
  if (key === 'USDT' || key === 'USDC') return map[key] ?? 1
  return map[key] ?? FALLBACK[key] ?? 1
}

export async function fetchRates(force = false): Promise<RatesPayload> {
  if (!force && cache?.updated_at) {
    const age = Date.now() - new Date(cache.updated_at).getTime()
    if (age < 60_000) return cache
  }
  if (inflight) return inflight

  inflight = (async () => {
    try {
      const res = await api.rates()
      cache = {
        rates: { ...FALLBACK, ...res.rates },
        updated_at: res.updated_at,
        source: res.source || 'api',
        stale: Boolean(res.stale),
      }
      return cache
    } catch {
      // Client-side fallback: CoinGecko simple price (may be CORS-blocked in some envs)
      try {
        const ids = COINS.map((c) => c.coingeckoId).join(',')
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
        const res = await fetch(url)
        if (!res.ok) throw new Error('coingecko failed')
        const data = (await res.json()) as Record<string, { usd?: number }>
        const rates: RatesMap = { ...FALLBACK }
        for (const coin of COINS) {
          const usd = data[coin.coingeckoId]?.usd
          if (typeof usd === 'number' && usd > 0) rates[coin.symbol] = usd
        }
        cache = {
          rates,
          updated_at: new Date().toISOString(),
          source: 'coingecko-client',
          stale: false,
        }
        return cache
      } catch {
        cache = {
          rates: { ...FALLBACK },
          updated_at: cache?.updated_at || null,
          source: 'fallback',
          stale: true,
        }
        return cache
      }
    } finally {
      inflight = null
    }
  })()

  return inflight
}

export function knownSymbols(): CoinSymbol[] {
  return COINS.map((c) => c.symbol)
}
