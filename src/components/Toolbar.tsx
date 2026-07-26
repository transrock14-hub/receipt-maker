import './Toolbar.css'
import type { ScreenshotMode } from '../catalog/deviceFrame'
import { SupportCareMenu } from './SupportLinks'
import { NotificationBell } from './NotificationBell'

interface Props {
  hasImage: boolean
  analyzing: boolean
  progress: string
  hideOriginal: boolean
  zoom: number
  canUndo: boolean
  canRedo: boolean
  screenshotMode: ScreenshotMode
  deviceLabel?: string
  canDownload?: boolean
  userLabel?: string
  isAdmin?: boolean
  accessLabel?: string
  accessTone?: 'ok' | 'warn' | 'locked'
  onUpload: (file: File) => void
  onAnalyze: () => void
  onExport: () => void
  onCopyScreenshot?: () => void
  onScreenshotModeChange: (mode: ScreenshotMode) => void
  onSaveProject: () => void
  onSaveTemplate: () => void
  onAddText: () => void
  onDelete: () => void
  onDuplicate: () => void
  onUndo: () => void
  onRedo: () => void
  onHideOriginalChange: (v: boolean) => void
  onCrop: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomFit: () => void
  onBringForward: () => void
  onSendBackward: () => void
  onOpenBilling?: () => void
  onOpenAdmin?: () => void
  onLogout?: () => void
  onOpenShortcuts?: () => void
}

export function Toolbar(props: Props) {
  return (
    <header className="toolbar">
      <div className="toolbar-brand">
        <span className="brand-mark" aria-hidden />
        <div>
          <p className="brand-name">Receipt Maker</p>
          <p className="brand-tag">Screenshot studio for wallets & banks</p>
        </div>
      </div>

      <div className="toolbar-center">
        <div className="tool-group">
          <button type="button" className="icon-btn" disabled={!props.canUndo} onClick={props.onUndo} title="Undo (⌘Z)">
            ↶
          </button>
          <button type="button" className="icon-btn" disabled={!props.canRedo} onClick={props.onRedo} title="Redo (⌘⇧Z)">
            ↷
          </button>
        </div>

        <div className="tool-group">
          <button type="button" className="icon-btn" onClick={props.onZoomOut} title="Zoom out">−</button>
          <button type="button" className="zoom-label" onClick={props.onZoomFit} title="Fit to screen">
            {Math.round(props.zoom * 100)}%
          </button>
          <button type="button" className="icon-btn" onClick={props.onZoomIn} title="Zoom in">+</button>
        </div>

        <div className="tool-group">
          <button type="button" className="btn btn-ghost" onClick={props.onAddText}>Text</button>
          <button type="button" className="btn btn-ghost" onClick={props.onDuplicate} disabled={!props.hasImage}>Duplicate</button>
          <button type="button" className="btn btn-ghost" onClick={props.onDelete}>Delete</button>
          <button type="button" className="btn btn-ghost" onClick={props.onBringForward} title="Bring forward">↑</button>
          <button type="button" className="btn btn-ghost" onClick={props.onSendBackward} title="Send backward">↓</button>
        </div>
      </div>

      <div className="toolbar-actions">
        <label className="btn btn-ghost file-btn">
          Upload
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) props.onUpload(f)
              e.target.value = ''
            }}
          />
        </label>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!props.hasImage || props.analyzing}
          onClick={props.onAnalyze}
        >
          {props.analyzing ? 'Extracting…' : 'Magic edit'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={props.onSaveProject} title="Save project">
          Save project
        </button>
        <button type="button" className="btn btn-ghost" onClick={props.onSaveTemplate} title="Save as template">
          Save template
        </button>
        <label className="shot-mode" title="Phone screenshot = screen only. Device mockup adds bezel.">
          <select
            value={props.screenshotMode}
            onChange={(e) => props.onScreenshotModeChange(e.target.value as ScreenshotMode)}
          >
            <option value="screen">Phone screenshot</option>
            <option value="framed">Device mockup</option>
          </select>
        </label>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={!props.hasImage}
          onClick={props.onCopyScreenshot}
          title={
            props.canDownload === false
              ? 'Subscribe to unlock copy'
              : 'Copy phone screenshot to clipboard (no bezel) · C'
          }
        >
          Copy
        </button>
        <button
          type="button"
          className="btn btn-accent"
          disabled={!props.hasImage}
          onClick={props.onExport}
          title={
            props.canDownload === false
              ? 'Subscribe to unlock downloads'
              : props.screenshotMode === 'framed'
                ? `Download ${props.deviceLabel || 'device'} mockup (transparent PNG)`
                : 'Download phone screenshot (screen only)'
          }
        >
          {props.canDownload === false ? 'Unlock download' : 'Download'}
        </button>
        {(props.onOpenBilling || props.onLogout) && (
          <div className="tool-group account-group">
            {props.accessLabel && (
              <button
                type="button"
                className={`access-badge access-${props.accessTone || 'ok'}`}
                onClick={props.onOpenBilling}
                title="Open billing"
              >
                {props.accessLabel}
              </button>
            )}
            {props.onOpenShortcuts && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={props.onOpenShortcuts}
                title="Keyboard shortcuts (?)"
              >
                ?
              </button>
            )}
            {props.onOpenBilling && (
              <button type="button" className="btn btn-ghost" onClick={props.onOpenBilling} title="Billing">
                Billing
              </button>
            )}
            {props.isAdmin && props.onOpenAdmin && (
              <button type="button" className="btn btn-ghost" onClick={props.onOpenAdmin} title="Admin">
                Admin
              </button>
            )}
            {props.onLogout && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={props.onLogout}
                title={props.userLabel || 'Log out'}
              >
                Log out
              </button>
            )}
            <NotificationBell className="toolbar-notif" />
            <SupportCareMenu className="toolbar-support" />
          </div>
        )}
      </div>

      {(props.hasImage || props.analyzing) && (
        <div className="toolbar-adjust">
          {props.analyzing && <span className="progress-label">{props.progress}</span>}
          <label className="toggle">
            <input
              type="checkbox"
              checked={props.hideOriginal}
              onChange={(e) => props.onHideOriginalChange(e.target.checked)}
            />
            Hide original text
          </label>
          <button type="button" className="btn btn-ghost" disabled={!props.hasImage} onClick={props.onCrop}>
            Crop
          </button>
        </div>
      )}
    </header>
  )
}
