import { useEffect, useState } from 'react'
import { api, type SupportInfo } from '../auth/api'
import './SupportLinks.css'

type Props = {
  compact?: boolean
  className?: string
}

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
