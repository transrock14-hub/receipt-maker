import { useMemo, useState } from 'react'
import type { DeviceId, GenerateValues, InstitutionCategory } from '../types/receipt'
import { DEVICES, devicesByManufacturer } from '../catalog/devices'
import { INSTITUTIONS, getInstitution } from '../catalog/institutions'
import type { ScreenTheme } from '../catalog/screenTheme'
import './GeneratePanel.css'

interface Props {
  values: GenerateValues
  onChange: (values: GenerateValues | Partial<GenerateValues>) => void
  templateName?: string
  disabled?: boolean
  deviceId: DeviceId
  institutionId: string
  onDeviceChange: (id: DeviceId) => void
  onInstitutionChange: (id: string) => void
  screenTheme: ScreenTheme
  onScreenThemeChange: (theme: ScreenTheme) => void
  onRefresh?: () => void
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

/** Left-rail setup: device, theme, and wallet — fields live on the right. */
export function GeneratePanel({
  templateName,
  disabled,
  deviceId,
  institutionId,
  onDeviceChange,
  onInstitutionChange,
  screenTheme,
  onScreenThemeChange,
  onRefresh,
  live = true,
  composing = false,
}: Props) {
  const institution = getInstitution(institutionId)
  const [categoryFilter, setCategoryFilter] = useState<InstitutionCategory | 'all'>(
    institution.category,
  )
  const recommended = institution.recommendedDeviceIds
  const onRecommended = recommended.includes(deviceId)
  const byMaker = devicesByManufacturer()
  const makerKeys = [
    ...MANUFACTURER_ORDER.filter((m) => byMaker[m]?.length),
    ...Object.keys(byMaker).filter((m) => !MANUFACTURER_ORDER.includes(m)),
  ]

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

  return (
    <div className="generate-panel generate-panel-setup">
      <div className="generate-heading">
        <h2>Setup</h2>
        {composing ? <span className="generate-live-pill">Updating…</span> : null}
      </div>
      <p className="generate-hint">
        {live ? (
          <>
            Device & wallet on the left — fields on the right
            {templateName ? (
              <>
                {' '}
                · <strong>{templateName}</strong>
              </>
            ) : null}
            .
          </>
        ) : (
          <>Pick a device and wallet.</>
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
          <select value={deviceId} onChange={(e) => onDeviceChange(e.target.value as DeviceId)}>
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
          {CATEGORY_LABEL[institution.category]} · edit amounts & status on the right →
        </p>
      </section>

      {onRefresh ? (
        <button type="button" className="generate-cta" disabled={disabled} onClick={onRefresh}>
          Refresh canvas
        </button>
      ) : null}
    </div>
  )
}
