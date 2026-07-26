import { useEffect, useState } from 'react'
import type { FieldKey, GenerateValues, SelectedObjectProps, TextRole } from '../types/receipt'
import { FIELD_DEFS, RECEIPT_FONTS } from '../types/receipt'
import { fieldKeyToRole } from '../analysis/fields'
import { GenerateFields } from './GenerateFields'
import './PropertyPanel.css'
import './GeneratePanel.css'

type RightTab = 'fields' | 'text'

interface Props {
  selected: SelectedObjectProps | null
  palette: string[]
  generateValues: GenerateValues
  onGenerateValuesChange: (v: GenerateValues) => void
  fieldKeys?: FieldKey[]
  composing?: boolean
  onChange: (patch: Partial<{
    text: string
    fontFamily: string
    fontSize: number
    fill: string
    fontWeight: string | number
    textAlign: string
    opacity: number
    role: TextRole
    fieldKey: FieldKey
  }>) => void
}

export function PropertyPanel({
  selected,
  palette,
  generateValues,
  onGenerateValuesChange,
  fieldKeys,
  composing,
  onChange,
}: Props) {
  const hasText = Boolean(selected && selected.type === 'text')
  const [tab, setTab] = useState<RightTab>('fields')

  useEffect(() => {
    if (hasText) setTab('text')
  }, [hasText, selected?.id])

  return (
    <aside className="props-panel props-panel-wide">
      <div className="props-tabs" role="tablist" aria-label="Right panel">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'fields'}
          className={tab === 'fields' ? 'active' : ''}
          onClick={() => setTab('fields')}
        >
          Fields
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'text'}
          className={tab === 'text' ? 'active' : ''}
          onClick={() => setTab('text')}
        >
          Text
          {hasText ? <span className="props-tab-dot" aria-hidden /> : null}
        </button>
      </div>

      {tab === 'fields' ? (
        <GenerateFields
          values={generateValues}
          onChange={onGenerateValuesChange}
          fieldKeys={fieldKeys}
          composing={composing}
        />
      ) : !hasText || !selected ? (
        <div className="props-empty-card">
          <p>Select text on the canvas to edit style.</p>
          <ul>
            <li>Click any label or amount</li>
            <li>Double-click to type</li>
            <li>Use Fields for status bar & amounts</li>
          </ul>
        </div>
      ) : (
        <div className="props-text-body">
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

          <div className="field-row">
            <label className="field">
              <span>Align</span>
              <select
                value={selected.textAlign ?? 'left'}
                onChange={(e) => onChange({ textAlign: e.target.value })}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </label>
            <label className="field">
              <span>Opacity</span>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={selected.opacity ?? 1}
                onChange={(e) => onChange({ opacity: Number(e.target.value) })}
              />
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
