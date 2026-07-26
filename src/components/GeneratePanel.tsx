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
}

const CATEGORY_LABEL: Record<InstitutionCategory, string> = {
  crypto: 'Crypto',
  bank: 'Banks',
  fintech: 'Fintech / P2P',
  mobile: 'Mobile money',
  thermal: 'Thermal',
  custom: 'Custom',
}

const MANUFACTURER_ORDER = ['Apple', 'Samsung', 'Google', 'Xiaomi', 'OnePlus', 'Microsoft']

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
}: Props) {
  const set = (key: keyof GenerateValues, value: string) => {
    onChange({ ...values, [key]: value })
  }

  const institution = getInstitution(institutionId)
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

  const byCategory = INSTITUTIONS.reduce(
    (acc, inst) => {
      if (!acc[inst.category]) acc[inst.category] = []
      acc[inst.category].push(inst)
      return acc
    },
    {} as Record<string, typeof INSTITUTIONS>,
  )

  const chargingOn =
    values.charging === '1' ||
    values.charging === 'true' ||
    /charg/i.test(values.battery || '')

  return (
    <div className="generate-panel">
      <h2>Generate screenshot</h2>
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
        <label className="generate-field">
          <span>Institution screen</span>
          <select
            value={institutionId}
            onChange={(e) => onInstitutionChange(e.target.value)}
          >
            {Object.entries(byCategory).map(([cat, list]) => (
              <optgroup key={cat} label={CATEGORY_LABEL[cat as InstitutionCategory] || cat}>
                {list.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.brand} — {i.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      </section>

      {groups.map((g) => {
        const fields = FIELD_DEFS.filter((f) => f.group === g.id).filter(
          (f) => !allowed || allowed.has(f.key),
        )
        if (!fields.length && g.id !== 'device') return null
        return (
          <section key={g.id} className="generate-group">
            <h3>{g.title}</h3>
            {fields.map((f) => (
              <label key={f.key} className="generate-field">
                <span>{f.label}</span>
                <input
                  type="text"
                  value={values[f.key] ?? ''}
                  placeholder={f.placeholder}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              </label>
            ))}
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
