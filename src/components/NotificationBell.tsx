import { useCallback, useEffect, useRef, useState } from 'react'
import { api, type AppNotification } from '../auth/api'
import './NotificationBell.css'

function formatWhen(raw: string | null): string {
  if (!raw) return ''
  const d = new Date(raw.includes('T') ? raw : raw.replace(' ', 'T') + 'Z')
  if (Number.isNaN(d.getTime())) return raw
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function NotificationBell({ className }: { className?: string }) {
  const [items, setItems] = useState<AppNotification[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    try {
      const res = await api.notifications()
      setItems(res.notifications)
      setUnread(res.unread)
    } catch {
      /* ignore — bell stays quiet if API unavailable */
    }
  }, [])

  useEffect(() => {
    void load()
    const id = window.setInterval(() => void load(), 45000)
    return () => window.clearInterval(id)
  }, [load])

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

  const openPanel = async () => {
    const next = !open
    setOpen(next)
    if (next) {
      await load()
      if (unread > 0) {
        setBusy(true)
        try {
          const res = await api.markNotificationsRead({ all: true })
          setItems(res.notifications)
          setUnread(res.unread)
        } catch {
          /* keep unread badge if mark-read fails */
        } finally {
          setBusy(false)
        }
      }
    }
  }

  return (
    <div
      className={`notif-bell${open ? ' is-open' : ''}${className ? ` ${className}` : ''}`}
      ref={rootRef}
    >
      <button
        type="button"
        className="notif-bell-btn"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        onClick={() => void openPanel()}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 3a5.5 5.5 0 0 0-5.5 5.5v2.2c0 .7-.2 1.4-.6 2L4.6 15a1 1 0 0 0 .8 1.6h13.2a1 1 0 0 0 .8-1.6l-1.3-2.3c-.4-.6-.6-1.3-.6-2V8.5A5.5 5.5 0 0 0 12 3Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M9.5 18.2a2.5 2.5 0 0 0 5 0"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
        {unread > 0 ? <span className="notif-bell-dot">{unread > 9 ? '9+' : unread}</span> : null}
      </button>
      {open ? (
        <div className="notif-bell-panel" role="dialog" aria-label="Notifications">
          <div className="notif-bell-head">
            <strong>Notifications</strong>
            {busy ? <span className="notif-bell-muted">Updating…</span> : null}
          </div>
          {items.length === 0 ? (
            <p className="notif-bell-empty">No notifications yet.</p>
          ) : (
            <ul className="notif-bell-list">
              {items.map((n) => (
                <li key={n.id} className={n.read ? 'is-read' : 'is-unread'}>
                  <strong>{n.title}</strong>
                  <p>{n.body}</p>
                  <time>{formatWhen(n.created_at)}</time>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
