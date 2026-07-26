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
  // Keep the last framed bitmap while soft field edits recompose — only fall back to
  // the live canvas when there is no frame yet (structural change cleared it).
  const showFramed = Boolean(showFrame && framedPreviewUrl && !analyzing)

  return (
    <div className={`screenshot-stage${analyzing || (composing && !showFramed) ? ' is-analyzing' : ''}`}>
      <section className="screenshot-pane">
        <header className="screenshot-pane-head">
          <span className="screenshot-badge">Screenshot</span>
          <span className="screenshot-caption">
            {showFramed
              ? composing
                ? 'Framed preview · updating…'
                : 'Framed preview'
              : composing
                ? 'Updating live canvas…'
                : 'Live canvas · edit & download'}
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
