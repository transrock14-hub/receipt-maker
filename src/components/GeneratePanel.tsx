import { useMemo, useState } from 'react'
import type { DeviceId, FieldKey, GenerateValues, InstitutionCategory } from '../types/receipt'
import { FIELD_DEFS } from '../types/receipt'
import { DEVICES, devicesByManufacturer } from '../catalog/devices'
import { INSTITUTIONS, getInstitution } from '../catalog/institutions'
import type { ScreenTheme } from '../catalog/screenTheme'
import './GeneratePanel.css'

interface Props {
  values: GenerateValues
  onChange: (values: GenerateValues) => void
  templateName?: string
  disabled?: boolean
  deviceId: DeviceId
  institutionId: string
  onDeviceChange: (id: DeviceId) => void
  onInstitutionChange: (id: string) => void
  screenTheme: ScreenTheme
  onScreenThemeChange: (theme: ScreenTheme) => void
  /** Live preview is automatic — optional force refresh. */
  onRefresh?: () => void
  fieldKeys?: FieldKey[]
  live?: boolean
  composing?: boolean
}

const CATEGORY_LABEL: Record<InstitutionCategory, string> = {
  crypto: 'Crypto',
  bank: 'Banks',
  fintech: 'Fintech',
  mobile: 'Mobile',
  thermal: 'Thermal',
  custom: 'Custom',
}

const MANUFACTURER_ORDER = ['Apple', 'Samsung', 'Google', 'Xiaomi', 'OnePlus', 'Microsoft']

function clampBattery(raw: string): string {
  const n = Number.parseInt(raw.replace(/%/g, ''), 10)
  if (Number.isNaN(n)) return raw
  return String(Math.max(0, Math.min(100, n)))
}

export function GeneratePanel({
  values,
  onChange,
  templateName,
  disabled,
  deviceId,
  institutionId,
  onDeviceChange,
  onInstitutionChange,
  screenTheme,
  onScreenThemeChange,
  onRefresh,
  fieldKeys,
  live = true,
  composing = false,
}: Props) {
  const set = (key: keyof GenerateValues, value: string) => {
    onChange({ ...values, [key]: value })
  }

  const institution = getInstitution(institutionId)
  const [categoryFilter, setCategoryFilter] = useState<InstitutionCategory | 'all'>(
    institution.category,
  )
  const allowed = fieldKeys?.length ? new Set(fieldKeys) : null
  const recommended = institution.recommendedDeviceIds
  const onRecommended = recommended.includes(deviceId)
  const byMaker = devicesByManufacturer()
  const makerKeys = [
    ...MANUFACTURER_ORDER.filter((m) => byMaker[m]?.length),
    ...Object.keys(byMaker).filter((m) => !MANUFACTURER_ORDER.includes(m)),
  ]

  const groups = [
    { id: 'device', title: 'Status bar' },
    { id: 'account', title: 'Account' },
    { id: 'transaction', title: 'Transaction' },
  ] as const

  const filteredInstitutions = useMemo(() => {
    if (categoryFilter === 'all') return INSTITUTIONS
    return INSTITUTIONS.filter((i) => i.category === categoryFilter)
  }, [categoryFilter])

  const categories = useMemo(() => {
    const setCats = new Set(INSTITUTIONS.map((i) => i.category))
    return (['crypto', 'bank', 'fintech', 'mobile', 'thermal'] as InstitutionCategory[]).filter(
      (c) => setCats.has(c),
    )
  }, [])

  const chargingOn =
    values.charging === '1' ||
    values.charging === 'true' ||
    /charg/i.test(values.battery || '')

  const batteryPct = (() => {
    const n = Number.parseInt(String(values.battery || '87').replace(/%/g, ''), 10)
    return Number.isNaN(n) ? 87 : Math.max(0, Math.min(100, n))
  })()

  return (
    <div className="generate-panel">
      <div className="generate-heading">
        <h2>Generate screenshot</h2>
        {composing ? <span className="generate-live-pill">Updating…</span> : null}
      </div>
      <p className="generate-hint">
        {live ? (
          <>
            Changes update the canvas live
            {templateName ? (
              <>
                {' '}
                — <strong>{templateName}</strong>
              </>
            ) : null}
            .
          </>
        ) : (
          <>Pick a device and wallet, then refresh the canvas.</>
        )}
      </p>

      <section className="generate-group">
        <h3>Device</h3>
        {recommended.length > 0 && (
          <div className="chip-row" role="group" aria-label="Recommended devices">
            {recommended.map((id) => {
              const d = DEVICES.find((x) => x.id === id)
              if (!d) return null
              return (
                <button
                  key={id}
                  type="button"
                  className={deviceId === id ? 'chip active' : 'chip'}
                  onClick={() => onDeviceChange(id)}
                >
                  {d.name.replace(/^iPhone /, 'iP ').replace(/ Ultra$/, ' U')}
                </button>
              )
            })}
          </div>
        )}
        <label className="generate-field">
          <span>Phone / desktop</span>
          <select
            value={deviceId}
            onChange={(e) => onDeviceChange(e.target.value as DeviceId)}
          >
            {makerKeys.map((maker) => (
              <optgroup key={maker} label={maker}>
                {(byMaker[maker] || []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} · {d.width}×{d.height}
                    {recommended.includes(d.id) ? ' ★' : ''}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <div className="theme-toggle-wrap">
          <span className="theme-toggle-label">Theme</span>
          <div className="theme-toggle" role="group" aria-label="Screen theme">
            <button
              type="button"
              className={screenTheme === 'light' ? 'theme-btn active' : 'theme-btn'}
              onClick={() => onScreenThemeChange('light')}
            >
              Light
            </button>
            <button
              type="button"
              className={screenTheme === 'dark' ? 'theme-btn active' : 'theme-btn'}
              onClick={() => onScreenThemeChange('dark')}
            >
              Dark
            </button>
          </div>
        </div>
        {!onRecommended && (
          <button
            type="button"
            className="generate-fill"
            onClick={() => onDeviceChange(recommended[0])}
          >
            Use recommended ({DEVICES.find((d) => d.id === recommended[0])?.name})
          </button>
        )}
        <p className="device-meta">
          {DEVICES.find((d) => d.id === deviceId)?.manufacturer || 'Device'} viewport — export uses
          device DPR and optional bezel.
        </p>
      </section>

      <section className="generate-group">
        <h3>Wallet / bank</h3>
        <div className="chip-row" role="group" aria-label="Institution category">
          <button
            type="button"
            className={categoryFilter === 'all' ? 'chip active' : 'chip'}
            onClick={() => setCategoryFilter('all')}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={categoryFilter === cat ? 'chip active' : 'chip'}
              onClick={() => setCategoryFilter(cat)}
            >
              {CATEGORY_LABEL[cat]}
            </button>
          ))}
        </div>
        <label className="generate-field">
          <span>Institution screen</span>
          <select
            value={institutionId}
            onChange={(e) => {
              const id = e.target.value
              const next = getInstitution(id)
              setCategoryFilter(next.category)
              onInstitutionChange(id)
            }}
          >
            {filteredInstitutions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.brand} — {i.name}
              </option>
            ))}
            {!filteredInstitutions.some((i) => i.id === institutionId) && (
              <option value={institutionId}>
                {institution.brand} — {institution.name}
              </option>
            )}
          </select>
        </label>
        <p className="device-meta">
          {CATEGORY_LABEL[institution.category]} · {institution.fields?.length || 'dynamic'} fields
        </p>
      </section>

      {groups.map((g) => {
        const fields = FIELD_DEFS.filter((f) => f.group === g.id).filter(
          (f) => !allowed || allowed.has(f.key),
        )
        if (!fields.length && g.id !== 'device') return null
        return (
          <section key={g.id} className="generate-group">
            <h3>{g.title}</h3>
            {fields.map((f) => {
              if (f.key === 'battery') {
                return (
                  <label key={f.key} className="generate-field">
                    <span>
                      Battery · {batteryPct}%
                    </span>
                    <input
                      type="range"
                      min={1}
                      max={100}
                      value={batteryPct}
                      onChange={(e) => set('battery', e.target.value)}
                      onBlur={() => set('battery', clampBattery(values.battery || String(batteryPct)))}
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
              if (f.key === 'amountFiat' || f.key === 'amountCrypto') {
                return (
                  <label key={f.key} className="generate-field">
                    <span>{f.label}</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={values[f.key] ?? ''}
                      placeholder={f.placeholder}
                      onChange={(e) => set(f.key, e.target.value)}
                      className="mono-input"
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
                <label className="side-check">
                  <input
                    type="checkbox"
                    checked={chargingOn}
                    onChange={(e) => set('charging', e.target.checked ? '1' : '')}
                  />
                  Charging
                </label>
              </div>
            ) : null}
          </section>
        )
      })}

      {onRefresh ? (
        <button
          type="button"
          className="generate-cta"
          disabled={disabled}
          onClick={onRefresh}
        >
          Refresh canvas
        </button>
      ) : null}
    </div>
  )
}
