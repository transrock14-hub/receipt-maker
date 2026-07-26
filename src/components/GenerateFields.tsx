import { useEffect, useMemo, useState } from 'react'
import type { FieldKey, GenerateValues } from '../types/receipt'
import { FIELD_DEFS } from '../types/receipt'
import {
  COINS,
  applyCoinQuote,
  getCoin,
  parseCryptoAmount,
  resolveNetwork,
  type AmountSign,
} from '../catalog/coins'
import { fetchRates, getCachedRates, usdRateFor } from '../catalog/rates'
import './GeneratePanel.css'

type Props = {
  values: GenerateValues
  onChange: (values: GenerateValues | Partial<GenerateValues>) => void
  fieldKeys?: FieldKey[]
  composing?: boolean
}

function clampBattery(raw: string): string {
  const n = Number.parseInt(raw.replace(/%/g, ''), 10)
  if (Number.isNaN(n)) return raw
  return String(Math.max(0, Math.min(100, n)))
}

const GROUPS = [
  { id: 'device', title: 'Status bar' },
  { id: 'account', title: 'Account' },
  { id: 'transaction', title: 'Transaction' },
] as const

const SKIP_IN_LOOP: FieldKey[] = ['coin', 'network', 'amountCrypto', 'amountFiat', 'price', 'fee']

export function GenerateFields({ values, onChange, fieldKeys, composing }: Props) {
  const [ratesUpdated, setRatesUpdated] = useState<string | null>(null)
  const [ratesSource, setRatesSource] = useState('…')
  const [autoFiat, setAutoFiat] = useState(true)

  const allowed = fieldKeys?.length ? new Set(fieldKeys) : null
  const hasPrice = !allowed || allowed.has('price')
  const hasFee = !allowed || allowed.has('fee')
  const hasFiat = !allowed || allowed.has('amountFiat')
  const useApproxFiat = /≈/.test(values.amountFiat || '')
  const priceLabel = /deposit/i.test(values.title || '') ? 'Deposit amount' : 'Withdraw amount'

  useEffect(() => {
    let alive = true
    const load = () => {
      void fetchRates().then((r) => {
        if (!alive) return
        setRatesUpdated(r.updated_at)
        setRatesSource(r.source + (r.stale ? ' · stale' : ''))
      })
    }
    load()
    const id = window.setInterval(load, 60_000)
    return () => {
      alive = false
      window.clearInterval(id)
    }
  }, [])

  const coin = getCoin(values.coin || detectCoinFallback(values.amountCrypto))
  const resolvedNet = useMemo(
    () => resolveNetwork(coin.symbol, values.network),
    [coin.symbol, values.network],
  )
  const networkId = resolvedNet.id

  const unitUsd = usdRateFor(coin.symbol)

  const set = (key: keyof GenerateValues, value: string) => {
    onChange({ [key]: value })
  }

  const applyQuote = (symbol: string, netId: string, qty: number, sign: AmountSign) => {
    const rate = usdRateFor(symbol, getCachedRates().rates)
    const quoted = applyCoinQuote({
      symbol,
      networkId: netId,
      networkLabel: values.network,
      qty,
      sign,
      usdPerCoin: rate,
      updateFee: hasFee,
      approxFiat: useApproxFiat || hasPrice,
    })
    const patch: Partial<GenerateValues> = {
      coin: quoted.coin,
      network: quoted.network,
      amountCrypto: quoted.amountCrypto,
    }
    if (autoFiat && hasFiat) patch.amountFiat = quoted.amountFiat
    if (autoFiat && hasPrice) patch.price = quoted.price
    if (hasFee && quoted.fee) {
      const feeLooksCoinUnit =
        /^\d/.test(String(values.fee || '')) && !/\$/.test(values.fee || '')
      if (feeLooksCoinUnit || hasPrice) patch.fee = quoted.fee
    }
    onChange(patch)
  }

  const onCoinChange = (symbol: string) => {
    const next = getCoin(symbol)
    const parsed = parseCryptoAmount(values.amountCrypto)
    const qty = parsed.qty > 0 ? parsed.qty : symbol === 'USDT' || symbol === 'USDC' ? 45 : 0.01
    const net = resolveNetwork(next.symbol, values.network)
    applyQuote(next.symbol, net.id, qty, parsed.sign)
  }

  const onNetworkChange = (netId: string) => {
    const parsed = parseCryptoAmount(values.amountCrypto)
    const qty = parsed.qty > 0 ? parsed.qty : 45
    const net = coin.networks.find((n) => n.id === netId) || coin.networks[0]
    const rate = usdRateFor(coin.symbol, getCachedRates().rates)
    const quoted = applyCoinQuote({
      symbol: coin.symbol,
      networkId: net.id,
      qty,
      sign: parsed.sign,
      usdPerCoin: rate,
      updateFee: hasFee,
      approxFiat: useApproxFiat || hasPrice,
    })
    const patch: Partial<GenerateValues> = {
      coin: quoted.coin,
      network: net.label,
      amountCrypto: quoted.amountCrypto,
    }
    if (autoFiat && hasFiat) patch.amountFiat = quoted.amountFiat
    if (autoFiat && hasPrice) patch.price = quoted.price
    if (hasFee && (hasPrice || !/\$/.test(values.fee || ''))) patch.fee = quoted.fee
    onChange(patch)
  }

  const onAmountBlur = () => {
    if (!autoFiat) return
    const parsed = parseCryptoAmount(values.amountCrypto)
    if (parsed.qty <= 0) return
    applyQuote(coin.symbol, networkId, parsed.qty, parsed.sign)
  }

  const chargingOn = values.charging === '1' || values.charging === 'true'

  const batteryPct = (() => {
    const n = Number.parseInt(String(values.battery || '87').replace(/%/g, ''), 10)
    return Number.isNaN(n) ? 87 : Math.max(0, Math.min(100, n))
  })()

  const showCoinControls = !allowed || allowed.has('coin') || allowed.has('amountCrypto')

  return (
    <div className="generate-fields">
      <div className="generate-heading">
        <h2>Receipt fields</h2>
        {composing ? <span className="generate-live-pill">Updating…</span> : null}
      </div>
      <p className="generate-hint">
        Status bar, account, and amounts — edits update live.
        {showCoinControls ? (
          <>
            {' '}
            Rates · {ratesSource}
            {ratesUpdated ? ` · ${new Date(ratesUpdated).toLocaleTimeString()}` : ''}
          </>
        ) : null}
      </p>

      {GROUPS.map((g) => {
        const fields = FIELD_DEFS.filter((f) => f.group === g.id)
          .filter((f) => !allowed || allowed.has(f.key))
          .filter((f) => g.id !== 'transaction' || !SKIP_IN_LOOP.includes(f.key))
        if (!fields.length && g.id !== 'device' && g.id !== 'transaction') return null
        if (g.id === 'transaction' && !fields.length && !showCoinControls) return null
        return (
          <section key={g.id} className="generate-group">
            <h3>{g.title}</h3>

            {g.id === 'transaction' && showCoinControls ? (
              <>
                <label className="generate-field">
                  <span>Coin</span>
                  <select value={coin.symbol} onChange={(e) => onCoinChange(e.target.value)}>
                    {COINS.map((c) => (
                      <option key={c.symbol} value={c.symbol}>
                        {c.symbol} — {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="generate-field">
                  <span>Network</span>
                  <select value={networkId} onChange={(e) => onNetworkChange(e.target.value)}>
                    {coin.networks.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.label}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="device-meta">
                  Live · 1 {coin.symbol} ≈ $
                  {unitUsd.toLocaleString('en-US', {
                    maximumFractionDigits: unitUsd >= 1 ? 2 : 6,
                  })}
                </p>
                <label className="generate-field">
                  <span>Crypto amount</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="mono-input"
                    value={values.amountCrypto ?? ''}
                    placeholder="-45 USDT"
                    onChange={(e) => set('amountCrypto', e.target.value)}
                    onBlur={onAmountBlur}
                  />
                </label>
                {hasFiat ? (
                  <label className="side-check">
                    <input
                      type="checkbox"
                      checked={autoFiat}
                      onChange={(e) => setAutoFiat(e.target.checked)}
                    />
                    Auto fiat from live rate
                  </label>
                ) : null}
                {hasFiat ? (
                  <label className="generate-field">
                    <span>Fiat amount</span>
                    <input
                      type="text"
                      className="mono-input"
                      value={values.amountFiat ?? ''}
                      onChange={(e) => set('amountFiat', e.target.value)}
                      disabled={autoFiat}
                    />
                  </label>
                ) : null}
                {hasPrice ? (
                  <label className="generate-field">
                    <span>{priceLabel}</span>
                    <input
                      type="text"
                      className="mono-input"
                      value={values.price ?? ''}
                      onChange={(e) => set('price', e.target.value)}
                      disabled={autoFiat}
                    />
                  </label>
                ) : null}
                {hasFee ? (
                  <label className="generate-field">
                    <span>Network fee</span>
                    <input
                      type="text"
                      className="mono-input"
                      value={values.fee ?? ''}
                      onChange={(e) => set('fee', e.target.value)}
                    />
                  </label>
                ) : null}
              </>
            ) : null}

            {fields.map((f) => {
              if (f.key === 'battery') {
                return (
                  <label key={f.key} className="generate-field">
                    <span>Battery · {batteryPct}%</span>
                    <input
                      type="range"
                      min={1}
                      max={100}
                      value={batteryPct}
                      onChange={(e) => set('battery', e.target.value)}
                      onBlur={() =>
                        set('battery', clampBattery(values.battery || String(batteryPct)))
                      }
                    />
                  </label>
                )
              }
              if (f.key === 'time') {
                return (
                  <label key={f.key} className="generate-field">
                    <span>{f.label}</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={values[f.key] ?? ''}
                      placeholder={f.placeholder}
                      onChange={(e) => set(f.key, e.target.value)}
                    />
                  </label>
                )
              }
              return (
                <label key={f.key} className="generate-field">
                  <span>{f.label}</span>
                  <input
                    type="text"
                    value={values[f.key] ?? ''}
                    placeholder={f.placeholder}
                    onChange={(e) => set(f.key, e.target.value)}
                  />
                </label>
              )
            })}
            {g.id === 'device' ? (
              <div className="chrome-controls">
                <label className="generate-field">
                  <span>Cellular</span>
                  <select
                    value={values.cellular || '5G'}
                    onChange={(e) => set('cellular', e.target.value)}
                  >
                    <option value="5G">5G</option>
                    <option value="5G+">5G+</option>
                    <option value="LTE">LTE</option>
                    <option value="4G">4G</option>
                    <option value="3G">3G</option>
                    <option value="off">Hide</option>
                  </select>
                </label>
                <label className="generate-field">
                  <span>Signal bars</span>
                  <select
                    value={values.signal || '4'}
                    onChange={(e) => set('signal', e.target.value)}
                  >
                    <option value="4">Full (4)</option>
                    <option value="3">Strong (3)</option>
                    <option value="2">Medium (2)</option>
                    <option value="1">Weak (1)</option>
                  </select>
                </label>
                <label className="generate-field">
                  <span>Wi‑Fi</span>
                  <select value={values.wifi || '3'} onChange={(e) => set('wifi', e.target.value)}>
                    <option value="3">Full</option>
                    <option value="2">Good</option>
                    <option value="1">Weak</option>
                    <option value="0">Off</option>
                  </select>
                </label>
                <label className={`side-check${chargingOn ? ' is-on' : ''}`}>
                  <input
                    type="checkbox"
                    checked={chargingOn}
                    onChange={(e) => set('charging', e.target.checked ? '1' : '')}
                  />
                  Charging{chargingOn ? ' · on' : ''}
                </label>
              </div>
            ) : null}
          </section>
        )
      })}
    </div>
  )
}

function detectCoinFallback(amountCrypto: string): string {
  const m = String(amountCrypto || '').toUpperCase().match(/\b([A-Z]{2,10})\b/)
  return m?.[1] || 'USDT'
}
