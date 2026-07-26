import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { api, type SupportInfo } from '../auth/api'
import './SupportLinks.css'

type Props = {
  compact?: boolean
  className?: string
}

/** Inline Telegram / WhatsApp buttons (toolbar, billing, etc.). */
export function SupportLinks({ compact, className }: Props) {
  const [support, setSupport] = useState<SupportInfo | null>(null)

  useEffect(() => {
    let alive = true
    void api
      .support()
      .then((res) => {
        if (alive) setSupport(res.support)
      })
      .catch(() => {
        if (alive) setSupport(null)
      })
    return () => {
      alive = false
    }
  }, [])

  if (!support?.enabled) return null

  return (
    <div className={`support-links${compact ? ' support-compact' : ''}${className ? ` ${className}` : ''}`}>
      {!compact && <p className="support-message">{support.message}</p>}
      <div className="support-actions">
        {support.telegram_url ? (
          <a
            className="support-btn support-telegram"
            href={support.telegram_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Telegram
          </a>
        ) : null}
        {support.whatsapp_url ? (
          <a
            className="support-btn support-whatsapp"
            href={support.whatsapp_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp
          </a>
        ) : null}
      </div>
    </div>
  )
}

/**
 * Floating chat widget — portaled to document.body so it always sits
 * bottom-right of the viewport (auth login/register).
 */
export function SupportWidget() {
  const [support, setSupport] = useState<SupportInfo | null>(null)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let alive = true
    void api
      .support()
      .then((res) => {
        if (alive) setSupport(res.support)
      })
      .catch(() => {
        if (alive) setSupport(null)
      })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!support?.enabled || typeof document === 'undefined') return null

  return createPortal(
    <div className={`support-widget${open ? ' is-open' : ''}`} ref={rootRef}>
      {open ? (
        <div className="support-widget-panel" role="dialog" aria-label="Contact support">
          <p className="support-widget-title">Contact support</p>
          <p className="support-widget-msg">{support.message}</p>
          <div className="support-widget-actions">
            {support.telegram_url ? (
              <a
                className="support-btn support-telegram"
                href={support.telegram_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Telegram
              </a>
            ) : null}
            {support.whatsapp_url ? (
              <a
                className="support-btn support-whatsapp"
                href={support.whatsapp_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
      <button
        type="button"
        className="support-widget-fab"
        aria-expanded={open}
        aria-label={open ? 'Close support' : 'Contact support'}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <span className="support-widget-fab-close" aria-hidden>
            ×
          </span>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16H9l-3.8 3.2A.8.8 0 0 1 4 18.6V6.5Z"
                fill="currentColor"
              />
            </svg>
            <span>Contact support</span>
          </>
        )}
      </button>
    </div>,
    document.body,
  )
}

/** Header dropdown — “Contact support” → Telegram / WhatsApp. */
export function SupportCareMenu({ className }: { className?: string }) {
  const [support, setSupport] = useState<SupportInfo | null>(null)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let alive = true
    void api
      .support()
      .then((res) => {
        if (alive) setSupport(res.support)
      })
      .catch(() => {
        if (alive) setSupport(null)
      })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!support?.enabled) return null

  return (
    <div
      className={`support-care${open ? ' is-open' : ''}${className ? ` ${className}` : ''}`}
      ref={rootRef}
    >
      <button
        type="button"
        className="support-care-btn"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
      >
        Contact support
      </button>
      {open ? (
        <div className="support-care-panel" role="dialog" aria-label="Contact support">
          <p className="support-widget-title">Contact support</p>
          <p className="support-widget-msg">{support.message}</p>
          <div className="support-widget-actions">
            {support.telegram_url ? (
              <a
                className="support-btn support-telegram"
                href={support.telegram_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Telegram
              </a>
            ) : null}
            {support.whatsapp_url ? (
              <a
                className="support-btn support-whatsapp"
                href={support.whatsapp_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
