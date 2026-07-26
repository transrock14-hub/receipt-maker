import type { FieldKey, SelectedObjectProps, TextRole } from '../types/receipt'
import { FIELD_DEFS, RECEIPT_FONTS } from '../types/receipt'
import { fieldKeyToRole } from '../analysis/fields'
import './PropertyPanel.css'

interface Props {
  selected: SelectedObjectProps | null
  palette: string[]
  onChange: (patch: Partial<{
    text: string
    fontFamily: string
    fontSize: number
    fill: string
    fontWeight: string | number
    role: TextRole
    fieldKey: FieldKey
  }>) => void
}

export function PropertyPanel({ selected, palette, onChange }: Props) {
  if (!selected || selected.type !== 'text') {
    return (
      <aside className="props-panel">
        <h2>Properties</h2>
        <div className="props-empty-card">
          <p>Select text to edit — or assign a field type for Generate.</p>
          <ul>
            <li>Double-click text to type</li>
            <li>Set Field (time, battery, IBAN…)</li>
            <li>Save as template → Generate new receipts</li>
          </ul>
        </div>
      </aside>
    )
  }

  return (
    <aside className="props-panel">
      <h2>Text</h2>

      {selected.confidence != null && (
        <p className="confidence">OCR {Math.round(selected.confidence)}%</p>
      )}

      <label className="field">
        <span>Content</span>
        <textarea
          rows={3}
          value={selected.text ?? ''}
          onChange={(e) => onChange({ text: e.target.value })}
        />
      </label>

      <label className="field">
        <span>Template field</span>
        <select
          value={selected.fieldKey ?? 'other'}
          onChange={(e) => {
            const fieldKey = e.target.value as FieldKey
            onChange({ fieldKey, role: fieldKeyToRole(fieldKey) })
          }}
        >
          {FIELD_DEFS.map((f) => (
            <option key={f.key} value={f.key}>
              {f.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Font</span>
        <select
          value={selected.fontFamily}
          onChange={(e) => onChange({ fontFamily: e.target.value })}
        >
          {RECEIPT_FONTS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
          {selected.fontFamily &&
            !RECEIPT_FONTS.some((f) => f.value === selected.fontFamily) && (
              <option value={selected.fontFamily}>Custom</option>
            )}
        </select>
      </label>

      <div className="field-row">
        <label className="field">
          <span>Size</span>
          <input
            type="number"
            min={6}
            max={96}
            value={Math.round(selected.fontSize ?? 14)}
            onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
          />
        </label>
        <label className="field">
          <span>Weight</span>
          <select
            value={String(selected.fontWeight ?? 400)}
            onChange={(e) => {
              const v = e.target.value
              onChange({ fontWeight: v === 'bold' || v === '700' ? 700 : 400 })
            }}
          >
            <option value="400">Regular</option>
            <option value="700">Bold</option>
          </select>
        </label>
      </div>

      <label className="field">
        <span>Color</span>
        <div className="color-row">
          <input
            type="color"
            value={normalizeHex(selected.fill)}
            onChange={(e) => onChange({ fill: e.target.value })}
          />
          <input
            type="text"
            value={selected.fill ?? '#000000'}
            onChange={(e) => onChange({ fill: e.target.value })}
          />
        </div>
      </label>

      {palette.length > 0 && (
        <div className="field">
          <span>From design</span>
          <div className="mini-palette">
            {palette.map((c) => (
              <button
                key={c}
                type="button"
                className="swatch"
                style={{ background: c }}
                title={c}
                onClick={() => onChange({ fill: c })}
              />
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}

function normalizeHex(color?: string) {
  if (!color) return '#000000'
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return color
  if (/^#[0-9a-fA-F]{3}$/.test(color)) {
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
  }
  return '#000000'
}
