import type { ReactNode } from 'react'
import './ScreenshotStage.css'

interface Props {
  editable: ReactNode
  analyzing?: boolean
  status?: string
  framedPreviewUrl?: string | null
  showFrame?: boolean
}

/** Single screenshot workspace — live canvas is the source of truth. */
export function ScreenshotStage({
  editable,
  analyzing,
  status,
  framedPreviewUrl,
  showFrame,
}: Props) {
  return (
    <div className={`screenshot-stage${analyzing ? ' is-analyzing' : ''}`}>
      <section className="screenshot-pane">
        <header className="screenshot-pane-head">
          <span className="screenshot-badge">Screenshot</span>
          <span className="screenshot-caption">
            {showFrame && framedPreviewUrl ? 'Framed preview' : 'Live canvas · edit & download'}
          </span>
        </header>
        {status ? <p className="screenshot-status">{status}</p> : null}
        <div className="screenshot-pane-body">
          {showFrame && framedPreviewUrl ? (
            <img
              src={framedPreviewUrl}
              alt="Framed device preview"
              className="screenshot-framed"
              draggable={false}
            />
          ) : (
            editable
          )}
        </div>
      </section>
    </div>
  )
}
