import type { FieldKey, GenerateValues } from '../types/receipt'
import { FIELD_DEFS } from '../types/receipt'
import './GeneratePanel.css'

type Props = {
  values: GenerateValues
  onChange: (values: GenerateValues) => void
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

export function GenerateFields({ values, onChange, fieldKeys, composing }: Props) {
  const set = (key: keyof GenerateValues, value: string) => {
    onChange({ ...values, [key]: value })
  }

  const allowed = fieldKeys?.length ? new Set(fieldKeys) : null
  const chargingOn =
    values.charging === '1' ||
    values.charging === 'true' ||
    /charg/i.test(values.battery || '')

  const batteryPct = (() => {
    const n = Number.parseInt(String(values.battery || '87').replace(/%/g, ''), 10)
    return Number.isNaN(n) ? 87 : Math.max(0, Math.min(100, n))
  })()

  return (
    <div className="generate-fields">
      <div className="generate-heading">
        <h2>Receipt fields</h2>
        {composing ? <span className="generate-live-pill">Updating…</span> : null}
      </div>
      <p className="generate-hint">Status bar, account, and amounts — edits update live.</p>

      {GROUPS.map((g) => {
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
    </div>
  )
}
