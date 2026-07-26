import { useEffect, useState } from 'react'
import { api, type Plan } from '../auth/api'
import { useAuth } from '../auth/AuthContext'
import './AccountPages.css'

type Props = {
  onBack: () => void
}

export function BillingPage({ onBack }: Props) {
  const { user, setUser, refresh, logout } = useAuth()
  const [plans, setPlans] = useState<Plan[]>([])
  const [payments, setPayments] = useState<Array<Record<string, unknown>>>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null)
  const [demoPaymentId, setDemoPaymentId] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const [p, mine] = await Promise.all([api.plans(), api.myPayments()])
        setPlans(p.plans)
        setPayments(mine.payments)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load billing')
      }
    })()
  }, [])

  const access = user?.access

  const startPay = async (planId: string) => {
    setBusy(true)
    setError(null)
    setInvoiceUrl(null)
    setDemoPaymentId(null)
    try {
      const res = await api.createPayment(planId)
      setInvoiceUrl(res.payment.invoice_url)
      if (res.payment.demo) {
        setDemoPaymentId(res.payment.provider_payment_id)
      } else if (res.payment.invoice_url) {
        window.open(res.payment.invoice_url, '_blank', 'noopener,noreferrer')
      }
      const mine = await api.myPayments()
      setPayments(mine.payments)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed')
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
      const mine = await api.myPayments()
      setPayments(mine.payments)
      await refresh()
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
        <div className="plan-grid">
          {plans.map((plan) => (
            <article key={plan.id} className="plan-card">
              <h3>{plan.name}</h3>
              <p className="plan-price">
                {Number(plan.price_usdt).toFixed(2)} <span>USDT</span>
              </p>
              <p className="plan-meta">{plan.days} days access</p>
              <button
                type="button"
                className="account-btn primary"
                disabled={busy}
                onClick={() => void startPay(plan.id)}
              >
                Pay with crypto
              </button>
            </article>
          ))}
        </div>
        {invoiceUrl && (
          <div className="invoice-box">
            <p>Invoice ready.</p>
            <a href={invoiceUrl} target="_blank" rel="noreferrer">
              Open payment page
            </a>
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
        {payments.length === 0 ? (
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

      {error && <p className="account-error">{error}</p>}
    </div>
  )
}
