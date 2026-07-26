import type { ReactNode } from 'react'
import './ScreenshotStage.css'

interface Props {
  editable: ReactNode
  analyzing?: boolean
  status?: string
  framedPreviewUrl?: string | null
  showFrame?: boolean
  composing?: boolean
}

/** Single screenshot workspace — live canvas is the source of truth. */
export function ScreenshotStage({
  editable,
  analyzing,
  status,
  framedPreviewUrl,
  showFrame,
  composing,
}: Props) {
  // Never keep a stale framed bitmap while setup is changing — fall back to live canvas
  const showFramed = Boolean(showFrame && framedPreviewUrl && !composing && !analyzing)

  return (
    <div className={`screenshot-stage${analyzing || composing ? ' is-analyzing' : ''}`}>
      <section className="screenshot-pane">
        <header className="screenshot-pane-head">
          <span className="screenshot-badge">Screenshot</span>
          <span className="screenshot-caption">
            {showFramed ? 'Framed preview' : composing ? 'Updating live canvas…' : 'Live canvas · edit & download'}
          </span>
        </header>
        {status ? <p className="screenshot-status">{status}</p> : null}
        <div className="screenshot-pane-body">
          {showFramed ? (
            <img
              src={framedPreviewUrl!}
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
