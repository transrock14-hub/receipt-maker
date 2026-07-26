/**
 * Supported coins + withdrawal networks for receipt generation.
 */
export type CoinSymbol =
  | 'BTC'
  | 'ETH'
  | 'USDT'
  | 'USDC'
  | 'BNB'
  | 'SOL'
  | 'XRP'
  | 'DOGE'
  | 'TRX'
  | 'TON'
  | 'ADA'
  | 'AVAX'
  | 'LINK'
  | 'DOT'
  | 'MATIC'

export type NetworkOption = {
  id: string
  label: string
  /** Typical fee string hint in coin units (display only until rate applied). */
  feeHint: string
}

export type CoinDef = {
  symbol: CoinSymbol
  name: string
  /** CoinGecko asset id for fallback pricing. */
  coingeckoId: string
  /** Binance spot symbol vs USDT, if listed. */
  binanceSymbol: string | null
  color: string
  decimals: number
  networks: NetworkOption[]
}

export const COINS: CoinDef[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    coingeckoId: 'bitcoin',
    binanceSymbol: 'BTCUSDT',
    color: '#F7931A',
    decimals: 8,
    networks: [
      { id: 'bitcoin', label: 'Bitcoin', feeHint: '0.00005' },
      { id: 'bep20', label: 'BNB Smart Chain (BEP20)', feeHint: '0.00001' },
    ],
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    coingeckoId: 'ethereum',
    binanceSymbol: 'ETHUSDT',
    color: '#627EEA',
    decimals: 6,
    networks: [
      { id: 'erc20', label: 'Ethereum (ERC20)', feeHint: '0.001' },
      { id: 'bep20', label: 'BNB Smart Chain (BEP20)', feeHint: '0.0002' },
      { id: 'arbitrum', label: 'Arbitrum One', feeHint: '0.0001' },
      { id: 'base', label: 'Base', feeHint: '0.00005' },
    ],
  },
  {
    symbol: 'USDT',
    name: 'Tether',
    coingeckoId: 'tether',
    binanceSymbol: null,
    color: '#26A17B',
    decimals: 2,
    networks: [
      { id: 'trc20', label: 'Tron (TRC20)', feeHint: '1' },
      { id: 'erc20', label: 'Ethereum (ERC20)', feeHint: '3' },
      { id: 'bep20', label: 'BNB Smart Chain (BEP20)', feeHint: '0.29' },
      { id: 'sol', label: 'Solana', feeHint: '0.5' },
      { id: 'ton', label: 'TON', feeHint: '0.3' },
    ],
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    coingeckoId: 'usd-coin',
    binanceSymbol: 'USDCUSDT',
    color: '#2775CA',
    decimals: 2,
    networks: [
      { id: 'erc20', label: 'Ethereum (ERC20)', feeHint: '3' },
      { id: 'bep20', label: 'BNB Smart Chain (BEP20)', feeHint: '0.3' },
      { id: 'sol', label: 'Solana', feeHint: '0.5' },
      { id: 'base', label: 'Base', feeHint: '0.1' },
    ],
  },
  {
    symbol: 'BNB',
    name: 'BNB',
    coingeckoId: 'binancecoin',
    binanceSymbol: 'BNBUSDT',
    color: '#F3BA2F',
    decimals: 4,
    networks: [
      { id: 'bep20', label: 'BNB Smart Chain (BEP20)', feeHint: '0.0005' },
      { id: 'bep2', label: 'BNB Beacon Chain (BEP2)', feeHint: '0.0005' },
    ],
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    coingeckoId: 'solana',
    binanceSymbol: 'SOLUSDT',
    color: '#9945FF',
    decimals: 4,
    networks: [{ id: 'sol', label: 'Solana', feeHint: '0.001' }],
  },
  {
    symbol: 'XRP',
    name: 'XRP',
    coingeckoId: 'ripple',
    binanceSymbol: 'XRPUSDT',
    color: '#23292F',
    decimals: 2,
    networks: [{ id: 'xrp', label: 'XRP Ledger', feeHint: '0.25' }],
  },
  {
    symbol: 'DOGE',
    name: 'Dogecoin',
    coingeckoId: 'dogecoin',
    binanceSymbol: 'DOGEUSDT',
    color: '#C2A633',
    decimals: 2,
    networks: [{ id: 'dogecoin', label: 'Dogecoin', feeHint: '4' }],
  },
  {
    symbol: 'TRX',
    name: 'TRON',
    coingeckoId: 'tron',
    binanceSymbol: 'TRXUSDT',
    color: '#FF0013',
    decimals: 2,
    networks: [{ id: 'trc20', label: 'Tron (TRC20)', feeHint: '1' }],
  },
  {
    symbol: 'TON',
    name: 'Toncoin',
    coingeckoId: 'the-open-network',
    binanceSymbol: 'TONUSDT',
    color: '#0098EA',
    decimals: 4,
    networks: [{ id: 'ton', label: 'TON', feeHint: '0.05' }],
  },
  {
    symbol: 'ADA',
    name: 'Cardano',
    coingeckoId: 'cardano',
    binanceSymbol: 'ADAUSDT',
    color: '#0033AD',
    decimals: 2,
    networks: [{ id: 'cardano', label: 'Cardano', feeHint: '1' }],
  },
  {
    symbol: 'AVAX',
    name: 'Avalanche',
    coingeckoId: 'avalanche-2',
    binanceSymbol: 'AVAXUSDT',
    color: '#E84142',
    decimals: 4,
    networks: [
      { id: 'avax-c', label: 'Avalanche C-Chain', feeHint: '0.01' },
      { id: 'bep20', label: 'BNB Smart Chain (BEP20)', feeHint: '0.005' },
    ],
  },
  {
    symbol: 'LINK',
    name: 'Chainlink',
    coingeckoId: 'chainlink',
    binanceSymbol: 'LINKUSDT',
    color: '#2A5ADA',
    decimals: 4,
    networks: [
      { id: 'erc20', label: 'Ethereum (ERC20)', feeHint: '0.1' },
      { id: 'bep20', label: 'BNB Smart Chain (BEP20)', feeHint: '0.02' },
    ],
  },
  {
    symbol: 'DOT',
    name: 'Polkadot',
    coingeckoId: 'polkadot',
    binanceSymbol: 'DOTUSDT',
    color: '#E6007A',
    decimals: 4,
    networks: [{ id: 'polkadot', label: 'Polkadot', feeHint: '0.05' }],
  },
  {
    symbol: 'MATIC',
    name: 'Polygon',
    coingeckoId: 'matic-network',
    binanceSymbol: 'MATICUSDT',
    color: '#8247E5',
    decimals: 2,
    networks: [
      { id: 'polygon', label: 'Polygon', feeHint: '0.1' },
      { id: 'erc20', label: 'Ethereum (ERC20)', feeHint: '5' },
    ],
  },
]

export function getCoin(symbol: string): CoinDef {
  const c = COINS.find((x) => x.symbol === symbol.toUpperCase())
  return c || COINS.find((x) => x.symbol === 'USDT')!
}

export function detectCoinFromAmount(amountCrypto: string): CoinSymbol | null {
  const m = String(amountCrypto || '').toUpperCase().match(/\b([A-Z]{2,10})\b/)
  if (!m) return null
  const hit = COINS.find((c) => c.symbol === m[1])
  return hit?.symbol || null
}

export function parseCryptoAmount(amountCrypto: string): { qty: number; negative: boolean } {
  const raw = String(amountCrypto || '').trim()
  const negative = raw.startsWith('-') || raw.includes('-')
  const num = raw.replace(/[^0-9.]/g, '')
  const qty = Number.parseFloat(num)
  return { qty: Number.isFinite(qty) ? qty : 0, negative }
}

export function formatCryptoAmount(qty: number, symbol: string, negative = true): string {
  const coin = getCoin(symbol)
  const decimals = Math.min(8, Math.max(2, coin.decimals))
  let body = qty.toFixed(decimals)
  body = body.replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, '')
  const text = `${body} ${coin.symbol}`
  return negative ? `-${text}` : text
}

export function formatFiatUsd(usd: number, approx = true): string {
  const abs = Math.abs(usd)
  const norm =
    usd < 0
      ? `-$${abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : `$${abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  return approx ? `≈ ${norm}` : norm
}

export function formatUnitPrice(usd: number): string {
  if (usd >= 1000) {
    return `$${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  if (usd >= 1) {
    return `$${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
  }
  return `$${usd.toPrecision(4)}`
}

/** Build amount/fiat/fee/network fields from coin + qty + live USD rate. */
export function applyCoinQuote(opts: {
  symbol: string
  networkId?: string
  qty: number
  negative?: boolean
  usdPerCoin: number
}): {
  coin: string
  network: string
  amountCrypto: string
  amountFiat: string
  price: string
  fee: string
  unitPrice: string
} {
  const coin = getCoin(opts.symbol)
  const network =
    coin.networks.find((n) => n.id === opts.networkId) || coin.networks[0]
  const negative = opts.negative !== false
  const qty = Math.abs(opts.qty)
  const usd = qty * opts.usdPerCoin
  const feeQty = Number.parseFloat(network.feeHint) || 0
  return {
    coin: coin.symbol,
    network: network.label,
    amountCrypto: formatCryptoAmount(qty, coin.symbol, negative),
    amountFiat: formatFiatUsd(negative ? -usd : usd, true),
    price: formatCryptoAmount(qty, coin.symbol, false),
    fee: `${feeQty} ${coin.symbol}`,
    unitPrice: formatUnitPrice(opts.usdPerCoin),
  }
}
