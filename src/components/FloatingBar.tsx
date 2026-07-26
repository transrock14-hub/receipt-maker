import type { FieldKey, SelectedObjectProps, TextRole } from '../types/receipt'
import { FIELD_DEFS, RECEIPT_FONTS } from '../types/receipt'
import { fieldKeyToRole } from '../analysis/fields'
import './FloatingBar.css'

interface Props {
  selected: SelectedObjectProps | null
  anchor: { x: number; y: number } | null
  onChange: (patch: Partial<{
    fontSize: number
    fontWeight: string | number
    fill: string
    fontFamily: string
    text: string
    fieldKey: FieldKey
    role: TextRole
  }>) => void
  onDuplicate: () => void
  onDelete: () => void
  onEdit: () => void
}

export function FloatingBar({
  selected,
  anchor,
  onChange,
  onDuplicate,
  onDelete,
  onEdit,
}: Props) {
  if (!selected || selected.type !== 'text' || !anchor) return null

  const size = Math.round(selected.fontSize ?? 14)
  const bold = String(selected.fontWeight) === '700' || selected.fontWeight === 'bold'

  return (
    <div
      className="floating-bar"
      style={{ left: anchor.x, top: Math.max(8, anchor.y) }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button type="button" className="fb-btn" onClick={onEdit} title="Edit text">
        Edit
      </button>
      <span className="fb-sep" />
      <select
        className="fb-select"
        value={selected.fieldKey ?? 'other'}
        onChange={(e) => {
          const fieldKey = e.target.value as FieldKey
          onChange({ fieldKey, role: fieldKeyToRole(fieldKey) })
        }}
        title="Field"
      >
        {FIELD_DEFS.map((f) => (
          <option key={f.key} value={f.key}>
            {f.label}
          </option>
        ))}
      </select>
      <select
        className="fb-select"
        value={selected.fontFamily}
        onChange={(e) => onChange({ fontFamily: e.target.value })}
        title="Font"
      >
        {RECEIPT_FONTS.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="fb-btn"
        onClick={() => onChange({ fontSize: Math.max(6, size - 1) })}
      >
        A−
      </button>
      <span className="fb-size">{size}</span>
      <button
        type="button"
        className="fb-btn"
        onClick={() => onChange({ fontSize: Math.min(96, size + 1) })}
      >
        A+
      </button>
      <button
        type="button"
        className={`fb-btn${bold ? ' active' : ''}`}
        onClick={() => onChange({ fontWeight: bold ? 400 : 700 })}
        title="Bold"
      >
        B
      </button>
      <label className="fb-color" title="Color">
        <input
          type="color"
          value={normalizeHex(selected.fill)}
          onChange={(e) => onChange({ fill: e.target.value })}
        />
      </label>
      <span className="fb-sep" />
      <button type="button" className="fb-btn" onClick={onDuplicate} title="Duplicate">
        Dup
      </button>
      <button type="button" className="fb-btn danger" onClick={onDelete} title="Delete">
        Del
      </button>
    </div>
  )
}

function normalizeHex(color?: string) {
  if (!color) return '#000000'
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return color
  if (/^#[0-9a-fA-F]{3}$/.test(color)) {
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
  }
  return '#111111'
}
