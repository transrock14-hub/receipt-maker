import { useEffect, useState } from 'react'
import { api, type Plan } from '../auth/api'
import { useAuth } from '../auth/AuthContext'
import { useToast } from '../ui/Toast'
import { SupportLinks } from '../components/SupportLinks'
import './AccountPages.css'

type Props = {
  onBack: () => void
}

export function BillingPage({ onBack }: Props) {
  const { user, setUser, refresh, logout } = useAuth()
  const toast = useToast()
  const [plans, setPlans] = useState<Plan[]>([])
  const [payments, setPayments] = useState<Array<Record<string, unknown>>>([])
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null)
  const [demoPaymentId, setDemoPaymentId] = useState<string | null>(null)
  const [awaitingPayment, setAwaitingPayment] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        const [p, mine] = await Promise.all([api.plans(), api.myPayments()])
        setPlans(p.plans)
        setPayments(mine.payments)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load billing')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // Poll while waiting for crypto invoice completion
  useEffect(() => {
    if (!awaitingPayment || demoPaymentId) return
    const id = window.setInterval(() => {
      void (async () => {
        try {
          const me = await api.me()
          setUser(me.user)
          const mine = await api.myPayments()
          setPayments(mine.payments)
          if (me.user.access.can_download) {
            setAwaitingPayment(false)
            setInvoiceUrl(null)
            toast.success('Payment confirmed — downloads unlocked')
          }
        } catch {
          /* ignore transient poll errors */
        }
      })()
    }, 8000)
    return () => window.clearInterval(id)
  }, [awaitingPayment, demoPaymentId, setUser, toast])

  const access = user?.access

  const startPay = async (planId: string) => {
    setBusy(true)
    setError(null)
    setInvoiceUrl(null)
    setDemoPaymentId(null)
    setAwaitingPayment(false)
    try {
      const res = await api.createPayment(planId)
      setInvoiceUrl(res.payment.invoice_url)
      if (res.payment.demo) {
        setDemoPaymentId(res.payment.provider_payment_id)
      } else if (res.payment.invoice_url) {
        setAwaitingPayment(true)
        window.open(res.payment.invoice_url, '_blank', 'noopener,noreferrer')
        toast.info('Waiting for payment confirmation…')
      }
      const mine = await api.myPayments()
      setPayments(mine.payments)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed')
      toast.error(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setBusy(false)
    }
  }

  const completeDemo = async () => {
    if (!demoPaymentId) return
    setBusy(true)
    setError(null)
    try {
      const res = await api.demoComplete(demoPaymentId)
      setUser(res.user)
      setDemoPaymentId(null)
      setInvoiceUrl(null)
      setAwaitingPayment(false)
      const mine = await api.myPayments()
      setPayments(mine.payments)
      await refresh()
      toast.success('Demo payment complete — unlocked')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo complete failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="account-page">
      <header className="account-header">
        <div className="account-header-row">
          <button type="button" className="account-back" onClick={onBack}>
            ← Studio
          </button>
          <button type="button" className="account-btn" onClick={() => void logout()}>
            Log out
          </button>
        </div>
        <h1>Billing</h1>
        <p>Pay with crypto (USDT). Downloads unlock while your plan is active.</p>
      </header>

      <section className="account-panel">
        <h2>Your access</h2>
        <dl className="access-grid">
          <div>
            <dt>Status</dt>
            <dd>{access?.can_download ? 'Downloads unlocked' : 'Locked — subscribe or wait for trial'}</dd>
          </div>
          <div>
            <dt>Trial ends</dt>
            <dd>{access?.trial_ends_at ? new Date(access.trial_ends_at).toLocaleString() : '—'}</dd>
          </div>
          <div>
            <dt>Paid until</dt>
            <dd>{access?.paid_until ? new Date(access.paid_until).toLocaleString() : '—'}</dd>
          </div>
        </dl>
      </section>

      <section className="account-panel">
        <h2>Plans</h2>
        {loading ? (
          <div className="plan-grid">
            {[0, 1, 2].map((i) => (
              <div key={i} className="plan-card plan-skeleton" aria-hidden />
            ))}
          </div>
        ) : (
          <div className="plan-grid">
            {plans.map((plan) => {
              const recommended =
                Boolean(plan.recommended) ||
                (plans.every((p) => !p.recommended) &&
                  plan.id === (plans.find((p) => p.days >= 30)?.id || plans[0]?.id))
              const features =
                plan.features && plan.features.length > 0
                  ? plan.features
                  : [
                      'Download & copy screenshots',
                      'Batch export',
                      'All wallets & banks',
                    ]
              return (
                <article key={plan.id} className={`plan-card${recommended ? ' plan-recommended' : ''}`}>
                  {recommended ? <span className="plan-badge">Recommended</span> : null}
                  <h3>{plan.name}</h3>
                  <p className="plan-price">
                    {Number(plan.price_usdt).toFixed(2)} <span>USDT</span>
                  </p>
                  <p className="plan-meta">{plan.days} days access</p>
                  <ul className="plan-perks">
                    {features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="account-btn primary"
                    disabled={busy}
                    onClick={() => void startPay(plan.id)}
                  >
                    Pay with crypto
                  </button>
                </article>
              )
            })}
          </div>
        )}
        {(invoiceUrl || awaitingPayment) && (
          <div className="invoice-box">
            <p>{awaitingPayment ? 'Waiting for payment…' : 'Invoice ready.'}</p>
            {invoiceUrl && (
              <a href={invoiceUrl} target="_blank" rel="noreferrer">
                Open payment page
              </a>
            )}
            {awaitingPayment && !demoPaymentId && (
              <p className="muted">This page checks every few seconds after you pay.</p>
            )}
            {demoPaymentId && (
              <button type="button" className="account-btn" disabled={busy} onClick={() => void completeDemo()}>
                Simulate payment (demo mode)
              </button>
            )}
          </div>
        )}
      </section>

      <section className="account-panel">
        <h2>Payment history</h2>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : payments.length === 0 ? (
          <p className="muted">No payments yet.</p>
        ) : (
          <table className="account-table">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={String(p.id)}>
                  <td>{String(p.plan_id)}</td>
                  <td>
                    {Number(p.amount_usdt).toFixed(2)} {String(p.pay_currency || 'USDT')}
                  </td>
                  <td>{String(p.status)}</td>
                  <td>{p.created_at ? new Date(String(p.created_at)).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="account-panel">
        <h2>Customer support</h2>
        <SupportLinks />
      </section>

      {error && <p className="account-error">{error}</p>}
    </div>
  )
}
