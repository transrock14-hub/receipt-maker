import { useEffect, useRef, type ReactNode } from 'react'
import { Canvas } from 'fabric'
import { createEditorCanvas } from '../editor/canvasOps'
import './EditorCanvas.css'

interface Props {
  onReady: (canvas: Canvas) => void
  onSelectionChange: () => void
  zoom: number
  analyzing?: boolean
  progress?: string
  compact?: boolean
  children?: ReactNode
}

export function EditorCanvas({
  onReady,
  onSelectionChange,
  zoom,
  analyzing,
  progress,
  compact,
  children,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onReadyRef = useRef(onReady)
  const onSelectionRef = useRef(onSelectionChange)
  onReadyRef.current = onReady
  onSelectionRef.current = onSelectionChange

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const el = document.createElement('canvas')
    container.appendChild(el)
    const canvas = createEditorCanvas(el, 360, 640)
    onReadyRef.current(canvas)

    const bump = () => onSelectionRef.current()
    canvas.on('selection:created', bump)
    canvas.on('selection:updated', bump)
    canvas.on('selection:cleared', bump)
    canvas.on('object:modified', bump)
    canvas.on('object:moving', bump)
    canvas.on('text:changed', bump)

    return () => {
      canvas.off('selection:created', bump)
      canvas.off('selection:updated', bump)
      canvas.off('selection:cleared', bump)
      canvas.off('object:modified', bump)
      canvas.off('object:moving', bump)
      canvas.off('text:changed', bump)
      canvas.dispose()
      el.remove()
    }
  }, [])

  return (
    <div
      className={`editor-stage${compact ? ' editor-stage-compact' : ''}`}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="editor-viewport">
        <div className="editor-frame">
          <div
            className="editor-paper"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center top' }}
          >
            <div ref={containerRef} className="editor-canvas-host" />
          </div>
          {children}
        </div>
      </div>

      {analyzing && (
        <div className="magic-overlay" role="status">
          <div className="magic-card">
            <div className="magic-spinner" />
            <p className="magic-title">Magic Edit</p>
            <p className="magic-sub">{progress || 'Extracting editable text…'}</p>
          </div>
        </div>
      )}

      {!compact && (
        <p className="editor-hint">
          Drag to move · arrows nudge 1px · ⇧ arrows 10px · pink guides snap · ⌘Z undo
        </p>
      )}
    </div>
  )
}
