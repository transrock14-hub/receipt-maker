import { useEffect, useState } from 'react'
import { api, type SupportInfo } from '../auth/api'
import './SupportLinks.css'

type Props = {
  compact?: boolean
  /** Fixed bottom-right chat-style widget (auth screens). */
  floating?: boolean
  className?: string
}

export function SupportLinks({ compact, floating, className }: Props) {
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

  const rootClass = [
    'support-links',
    compact ? 'support-compact' : '',
    floating ? 'support-floating' : '',
    className || '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rootClass} role="complementary" aria-label="Customer support">
      {!compact && <p className="support-message">{support.message}</p>}
      {floating && compact ? <p className="support-message">{support.message}</p> : null}
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
