import { useCallback, useState } from 'react'
import type { DragEvent } from 'react'
import type { StudyReference } from '../study/types'
import { RECEIPT_STYLE_KITS, type ReceiptStyleKit } from '../study/styleKits'
import './StudyPanel.css'

interface Props {
  studies: StudyReference[]
  studying: boolean
  progress?: string
  onAddFiles: (files: File[]) => void
  onToggleActive: (id: string, active: boolean) => void
  onRemove: (id: string) => void
  onApplyToGenerate: () => void
  onApplyKit: (kit: ReceiptStyleKit) => void
}

function pickImageFiles(files: FileList | null | undefined): File[] {
  if (!files?.length) return []
  return Array.from(files).filter((f) => f.type.startsWith('image/'))
}

export function StudyPanel({
  studies,
  studying,
  progress,
  onAddFiles,
  onToggleActive,
  onRemove,
  onApplyToGenerate,
  onApplyKit,
}: Props) {
  const [dragging, setDragging] = useState(false)
  const activeCount = studies.filter((s) => s.active).length

  const onDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(true)
  }, [])

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'copy'
    setDragging(true)
  }, [])

  const onDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setDragging(false)
  }, [])

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragging(false)
      const list = pickImageFiles(e.dataTransfer.files)
      if (list.length) onAddFiles(list)
    },
    [onAddFiles],
  )

  return (
    <section className="study-panel">
      <h2>Research kits</h2>
      <p className="study-hint">
        Distilled from real Binance, Coinbase, Trust, MetaMask, Cash App & PayPal receipt UIs.
        Apply a kit — canvas updates live.
      </p>
      <ul className="kit-list">
        {RECEIPT_STYLE_KITS.map((kit) => (
          <li key={kit.id} className="kit-card">
            <div className="kit-head">
              <span className="kit-brand">{kit.brand}</span>
              <span className="kit-name">{kit.name}</span>
            </div>
            <div className="study-swatches">
              {kit.palette.slice(0, 6).map((c) => (
                <span key={c} className="study-swatch" style={{ background: c }} title={c} />
              ))}
            </div>
            <p className="kit-note">{kit.notes[0]}</p>
            {kit.layout ? (
              <p className="kit-layout">
                Layout · inset {kit.layout.topInset}px · {kit.layout.rowDensity} ·{' '}
                {kit.layout.darkChrome ? 'dark chrome' : 'light chrome'}
              </p>
            ) : null}
            <button type="button" className="study-apply" onClick={() => onApplyKit(kit)}>
              Apply kit → Generate
            </button>
          </li>
        ))}
      </ul>

      <h2 className="spaced">Your screenshots</h2>
      <p className="study-hint">
        Drop real receipts to learn extra colors, time, battery, and amounts.
      </p>

      <label
        className={`study-dropzone${dragging ? ' active' : ''}${studying ? ' busy' : ''}`}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <span className="study-drop-title">
          {studying ? progress || 'Studying…' : dragging ? 'Drop to study' : 'Drop screenshots or click'}
        </span>
        <span className="study-drop-sub">Multiple PNG / JPG · analyzed locally</span>
        <input
          type="file"
          accept="image/*"
          multiple
          hidden
          disabled={studying}
          onChange={(e) => {
            const list = pickImageFiles(e.target.files)
            if (list.length) onAddFiles(list)
            e.target.value = ''
          }}
        />
      </label>

      {studies.length === 0 && !studying ? (
        <div className="study-empty">
          <p className="study-empty-title">No personal screenshots yet</p>
          <p className="study-empty-body">
            Drop a Binance, Coinbase, or bank receipt above. We extract palette, time, battery, and
            amounts locally — nothing leaves this browser.
          </p>
        </div>
      ) : null}

      {studies.length > 0 && (
        <>
          <div className="study-toolbar">
            <span className="study-count">
              {activeCount} active · {studies.length} total
            </span>
            <button
              type="button"
              className="study-apply"
              disabled={!activeCount}
              onClick={onApplyToGenerate}
            >
              Apply to Generate fields
            </button>
          </div>

          <ul className="study-grid">
            {studies.map((s) => (
              <li key={s.id} className={`study-card${s.active ? ' active' : ''}`}>
                <button
                  type="button"
                  className="study-thumb-btn"
                  title={s.active ? 'Active for Generate' : 'Click to activate'}
                  onClick={() => onToggleActive(s.id, !s.active)}
                >
                  {s.thumbnail ? (
                    <img src={s.thumbnail} alt="" className="study-thumb" />
                  ) : (
                    <span className="study-thumb placeholder" />
                  )}
                  {s.active && <span className="study-check">✓</span>}
                </button>
                <div className="study-meta">
                  <span className="study-name">{s.name}</span>
                  <span className="study-summary">{s.summary}</span>
                  <div className="study-swatches">
                    {s.palette.slice(0, 5).map((c) => (
                      <span key={c} className="study-swatch" style={{ background: c }} title={c} />
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  className="study-remove"
                  aria-label={`Remove ${s.name}`}
                  onClick={() => onRemove(s.id)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
