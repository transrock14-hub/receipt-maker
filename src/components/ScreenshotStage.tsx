import type { ReactNode } from 'react'
import './ScreenshotStage.css'

interface Props {
  editable: ReactNode
  analyzing?: boolean
  status?: string
  framedPreviewUrl?: string | null
  showFrame?: boolean
  composing?: boolean
  onCopyScreenshot?: () => void
  canCopy?: boolean
  copyDisabled?: boolean
}

/** Single screenshot workspace — live canvas is the source of truth. */
export function ScreenshotStage({
  editable,
  analyzing,
  status,
  framedPreviewUrl,
  showFrame,
  composing,
  onCopyScreenshot,
  canCopy = true,
  copyDisabled,
}: Props) {
  // Keep the last framed bitmap while soft field edits recompose — only fall back to
  // the live canvas when there is no frame yet (structural change cleared it).
  const showFramed = Boolean(showFrame && framedPreviewUrl && !analyzing)

  return (
    <div className={`screenshot-stage${analyzing || (composing && !showFramed) ? ' is-analyzing' : ''}`}>
      <section className="screenshot-pane">
        <header className="screenshot-pane-head">
          <span className="screenshot-badge">Screenshot</span>
          <div className="screenshot-head-actions">
            <span className="screenshot-caption">
              {showFramed
                ? composing
                  ? 'Framed preview · updating…'
                  : 'Framed preview'
                : composing
                  ? 'Updating live canvas…'
                  : 'Live canvas · edit & download'}
            </span>
            {onCopyScreenshot ? (
              <div className="screenshot-copy-widget" role="group" aria-label="Copy screenshot">
                <span className="screenshot-copy-hint">Clipboard</span>
                <button
                  type="button"
                  className="screenshot-copy-btn"
                  disabled={copyDisabled}
                  onClick={onCopyScreenshot}
                  title={
                    canCopy === false
                      ? 'Subscribe to unlock copy'
                      : 'Copy phone screenshot to clipboard · C'
                  }
                >
                  <svg
                    className="screenshot-copy-icon"
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden
                  >
                    <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                    <path
                      d="M10.5 5.5V4A1.5 1.5 0 0 0 9 2.5H4A1.5 1.5 0 0 0 2.5 4v5A1.5 1.5 0 0 0 4 10.5h1.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  Copy
                </button>
              </div>
            ) : null}
          </div>
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
