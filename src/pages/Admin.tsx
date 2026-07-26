import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api, type ActivityEvent, type AppNotification, type AuthUser, type Invite, type Plan } from '../auth/api'
import { useAuth } from '../auth/AuthContext'
import { useToast } from '../ui/Toast'
import './AccountPages.css'

type Props = {
  onBack: () => void
}

type Credentials = { username: string; password: string; name: string }

type PlanDraft = {
  id: string
  name: string
  price_usdt: string
  days: string
  sort_order: string
  featuresText: string
  recommended: boolean
  active: boolean
}

const DEFAULT_FEATURES = [
  'Download & copy screenshots',
  'Batch export',
  'All wallets & banks',
]

function planToDraft(p: Plan): PlanDraft {
  return {
    id: p.id,
    name: p.name,
    price_usdt: String(Number(p.price_usdt)),
    days: String(p.days),
    sort_order: String(p.sort_order ?? p.days),
    featuresText: (p.features?.length ? p.features : DEFAULT_FEATURES).join('\n'),
    recommended: Boolean(p.recommended),
    active: p.active !== false,
  }
}

function featuresFromText(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function randomPassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$'
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}

function actionLabel(action: string): string {
  const map: Record<string, string> = {
    login: 'Login',
    login_failed: 'Failed login',
    login_blocked: 'Blocked login',
    logout: 'Logout',
    register: 'Register',
    download_screenshot: 'Download',
    copy_screenshot: 'Copy',
    batch_export: 'Batch export',
    generate_receipt: 'Generate',
    save_project: 'Save',
    open_billing: 'Billing',
    payment_create: 'Payment started',
    payment_finished: 'Payment done',
    admin_user_create: 'Admin · create user',
    admin_user_update: 'Admin · update user',
    admin_invite_create: 'Admin · invite',
    admin_invite_revoke: 'Admin · revoke invite',
    admin_support_update: 'Admin · support',
    admin_notification_send: 'Admin · notify',
    admin_plan_create: 'Admin · plan create',
    admin_plan_update: 'Admin · plan update',
  }
  return map[action] || action.replace(/_/g, ' ')
}

export function AdminPage({ onBack }: Props) {
  const { logout } = useAuth()
  const toast = useToast()
  const [users, setUsers] = useState<AuthUser[]>([])
  const [payments, setPayments] = useState<Array<Record<string, unknown>>>([])
  const [activity, setActivity] = useState<ActivityEvent[]>([])
  const [activitySummary, setActivitySummary] = useState<{
    total: number
    logins_24h: number
    failed_24h: number
    unique_ips_24h: number
  } | null>(null)
  const [stats, setStats] = useState<{
    users: number
    active_paid: number
    active_trials: number
    payments_finished: number
    revenue_usdt: number
  } | null>(null)
  const [q, setQ] = useState('')
  const [activityQ, setActivityQ] = useState('')
  const [activityAction, setActivityAction] = useState('all')
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const [credentials, setCredentials] = useState<Credentials | null>(null)
  const [copied, setCopied] = useState(false)
  const [liveRefresh, setLiveRefresh] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const [newName, setNewName] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState(() => randomPassword())
  const [paidDays, setPaidDays] = useState(30)

  const [invites, setInvites] = useState<Invite[]>([])
  const [inviteNote, setInviteNote] = useState('')
  const [inviteMaxUses, setInviteMaxUses] = useState(1)
  const [inviteDays, setInviteDays] = useState(14)
  const [inviteBusy, setInviteBusy] = useState(false)
  const [lastInvite, setLastInvite] = useState<Invite | null>(null)

  const [supportTelegram, setSupportTelegram] = useState('')
  const [supportWhatsapp, setSupportWhatsapp] = useState('')
  const [supportMessage, setSupportMessage] = useState('Need help? Chat with support.')
  const [supportBusy, setSupportBusy] = useState(false)

  const [notifTitle, setNotifTitle] = useState('')
  const [notifBody, setNotifBody] = useState('')
  const [notifTarget, setNotifTarget] = useState<'all' | string>('all')
  const [notifBusy, setNotifBusy] = useState(false)
  const [sentNotifs, setSentNotifs] = useState<AppNotification[]>([])

  const [planDrafts, setPlanDrafts] = useState<PlanDraft[]>([])
  const [planBusyId, setPlanBusyId] = useState<string | null>(null)
  const [newPlanName, setNewPlanName] = useState('')
  const [newPlanPrice, setNewPlanPrice] = useState('29')
  const [newPlanDays, setNewPlanDays] = useState('30')
  const [newPlanFeatures, setNewPlanFeatures] = useState(DEFAULT_FEATURES.join('\n'))
  const [newPlanRecommended, setNewPlanRecommended] = useState(false)
  const [newPlanBusy, setNewPlanBusy] = useState(false)

  const loadActivity = useCallback(async (query?: string, action?: string) => {
    const res = await api.adminActivity({
      q: query || undefined,
      action: action && action !== 'all' ? action : undefined,
      limit: 200,
    })
    setActivity(res.events)
    setActivitySummary(res.summary)
  }, [])

  const load = useCallback(async (query?: string) => {
    try {
      const [u, p, s, inv, support, notifs, plans] = await Promise.all([
        api.adminUsers(query),
        api.adminPayments(),
        api.adminStats(),
        api.adminInvites(),
        api.adminSupport(),
        api.adminNotifications(),
        api.adminPlans(),
      ])
      setUsers(u.users)
      setPayments(p.payments)
      setStats(s.stats)
      setInvites(inv.invites)
      setSupportTelegram(support.raw.telegram || '')
      setSupportWhatsapp(support.raw.whatsapp || '')
      setSupportMessage(support.raw.message || 'Need help? Chat with support.')
      setSentNotifs(notifs.notifications)
      setPlanDrafts(plans.plans.map(planToDraft))
      setError(null)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Admin load failed')
    }
  }, [])

  const refreshAll = useCallback(async () => {
    await load(q || undefined)
    await loadActivity(activityQ || undefined, activityAction).catch((err) =>
      setError(err instanceof Error ? err.message : 'Activity load failed'),
    )
  }, [load, loadActivity, q, activityQ, activityAction])

  useEffect(() => {
    void refreshAll()
  }, [refreshAll])

  useEffect(() => {
    if (!liveRefresh) return
    const id = window.setInterval(() => {
      void refreshAll()
    }, 30000)
    return () => window.clearInterval(id)
  }, [liveRefresh, refreshAll])

  const updateUser = async (
    id: number,
    patch: { status?: 'active' | 'banned'; extend_days?: number; password?: string },
  ) => {
    setBusyId(id)
    try {
      const res = await api.adminUpdateUser({ user_id: id, ...patch })
      if (res.credentials) setCredentials(res.credentials)
      await load(q || undefined)
      if (patch.status === 'banned') toast.success('User banned · sessions revoked')
      else if (patch.password) toast.success('Password reset · sessions revoked')
      else if (patch.extend_days) toast.success(`Extended +${patch.extend_days} days`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
      toast.error(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setBusyId(null)
    }
  }

  const saveSupport = async (e: FormEvent) => {
    e.preventDefault()
    setSupportBusy(true)
    setError(null)
    try {
      const res = await api.adminSaveSupport({
        telegram: supportTelegram.trim(),
        whatsapp: supportWhatsapp.trim(),
        message: supportMessage.trim(),
      })
      setSupportTelegram(res.raw.telegram || '')
      setSupportWhatsapp(res.raw.whatsapp || '')
      setSupportMessage(res.raw.message || '')
      toast.success('Support contacts saved')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Support save failed')
      toast.error(err instanceof Error ? err.message : 'Support save failed')
    } finally {
      setSupportBusy(false)
    }
  }

  const patchPlanDraft = (id: string, patch: Partial<PlanDraft>) => {
    setPlanDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)))
  }

  const savePlan = async (draft: PlanDraft) => {
    setPlanBusyId(draft.id)
    setError(null)
    try {
      await api.adminUpdatePlan({
        id: draft.id,
        name: draft.name.trim(),
        price_usdt: Number(draft.price_usdt),
        days: Number(draft.days),
        sort_order: Number(draft.sort_order) || Number(draft.days),
        features: featuresFromText(draft.featuresText),
        recommended: draft.recommended,
        active: draft.active,
      })
      const list = await api.adminPlans()
      setPlanDrafts(list.plans.map(planToDraft))
      toast.success(`Saved ${draft.name.trim() || draft.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Plan save failed')
      toast.error(err instanceof Error ? err.message : 'Plan save failed')
    } finally {
      setPlanBusyId(null)
    }
  }

  const createPlan = async (e: FormEvent) => {
    e.preventDefault()
    if (!newPlanName.trim()) {
      toast.error('Plan name is required')
      return
    }
    setNewPlanBusy(true)
    setError(null)
    try {
      await api.adminCreatePlan({
        name: newPlanName.trim(),
        price_usdt: Number(newPlanPrice),
        days: Number(newPlanDays),
        features: featuresFromText(newPlanFeatures),
        recommended: newPlanRecommended,
        active: true,
      })
      setNewPlanName('')
      setNewPlanPrice('29')
      setNewPlanDays('30')
      setNewPlanFeatures(DEFAULT_FEATURES.join('\n'))
      setNewPlanRecommended(false)
      const list = await api.adminPlans()
      setPlanDrafts(list.plans.map(planToDraft))
      toast.success('Plan created')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Plan create failed')
      toast.error(err instanceof Error ? err.message : 'Plan create failed')
    } finally {
      setNewPlanBusy(false)
    }
  }

  const sendNotification = async (e: FormEvent) => {
    e.preventDefault()
    if (!notifTitle.trim() || !notifBody.trim()) {
      toast.error('Title and message are required')
      return
    }
    setNotifBusy(true)
    setError(null)
    try {
      const userId = notifTarget === 'all' ? null : Number(notifTarget)
      await api.adminSendNotification({
        title: notifTitle.trim(),
        body: notifBody.trim(),
        user_id: userId && Number.isFinite(userId) ? userId : null,
      })
      setNotifTitle('')
      setNotifBody('')
      setNotifTarget('all')
      const list = await api.adminNotifications()
      setSentNotifs(list.notifications)
      toast.success(userId ? 'Notification sent to user' : 'Notification sent to all users')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Notification failed')
      toast.error(err instanceof Error ? err.message : 'Notification failed')
    } finally {
      setNotifBusy(false)
    }
  }

  const createInvite = async (e: FormEvent) => {
    e.preventDefault()
    setInviteBusy(true)
    setError(null)
    try {
      const res = await api.adminCreateInvite({
        note: inviteNote.trim() || undefined,
        max_uses: inviteMaxUses,
        expires_days: inviteDays > 0 ? inviteDays : undefined,
      })
      setLastInvite(res.invite)
      setInviteNote('')
      setInviteMaxUses(1)
      setInviteDays(14)
      await load(q || undefined)
      toast.success(`Invite ${res.invite.code} created`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invite create failed')
      toast.error(err instanceof Error ? err.message : 'Invite create failed')
    } finally {
      setInviteBusy(false)
    }
  }

  const copyInvite = async (inv: Invite) => {
    const link = `${window.location.origin}/?invite=${encodeURIComponent(inv.code)}`
    const text = `Receipt Maker invite\nCode: ${inv.code}\nLink: ${link}`
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Invite copied')
    } catch {
      setError('Could not copy invite')
    }
  }

  const revokeInvite = async (inv: Invite) => {
    if (!window.confirm(`Revoke invite ${inv.code}?`)) return
    try {
      await api.adminRevokeInvite(inv.id)
      await load(q || undefined)
      toast.success('Invite revoked')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Revoke failed')
    }
  }

  const createUser = async (e: FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError(null)
    setCopied(false)
    try {
      const res = await api.adminCreateUser({
        username: newUsername.trim(),
        password: newPassword,
        name: newName.trim() || undefined,
        paid_days: paidDays > 0 ? paidDays : 0,
      })
      setCredentials(res.credentials)
      setNewName('')
      setNewUsername('')
      setNewPassword(randomPassword())
      setPaidDays(30)
      await load(q || undefined)
      toast.success('Account created')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed')
      toast.error(err instanceof Error ? err.message : 'Create failed')
    } finally {
      setCreating(false)
    }
  }

  const copyCredentials = async () => {
    if (!credentials) return
    const text = [
      `Receipt Maker login`,
      `Username: ${credentials.username}`,
      `Password: ${credentials.password}`,
      credentials.name ? `Name: ${credentials.name}` : '',
    ]
      .filter(Boolean)
      .join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('Login details copied')
    } catch {
      setError('Could not copy — select the details manually')
    }
  }

  const resetPassword = (u: AuthUser) => {
    const pwd = randomPassword()
    if (
      !window.confirm(
        `Reset password for ${u.username}?\n\nNew password will be shown so you can send it.`,
      )
    ) {
      return
    }
    void updateUser(u.id, { password: pwd })
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
        <h1>Admin</h1>
        <p>
          Plans, customer support, in-app notifications, invite-only signup, accounts, activity, and
          payments.
        </p>
      </header>

      {stats && (
        <section className="stats-row">
          <div>
            <strong>{stats.users}</strong>
            <span>Users</span>
          </div>
          <div>
            <strong>{stats.active_paid}</strong>
            <span>Paid</span>
          </div>
          <div>
            <strong>{stats.active_trials}</strong>
            <span>Trials</span>
          </div>
          <div>
            <strong>{stats.payments_finished}</strong>
            <span>Payments</span>
          </div>
          <div>
            <strong>{Number(stats.revenue_usdt).toFixed(2)}</strong>
            <span>USDT</span>
          </div>
        </section>
      )}

      <section className="account-panel">
        <h2>Plans</h2>
        <p className="muted create-hint">
          Edit prices and durations shown on Billing, or add a new plan. Deactivate to hide without
          deleting payment history. Only one plan can be Recommended.
        </p>
        <form className="create-user-form" onSubmit={(e) => void createPlan(e)}>
          <label>
            New plan name
            <input
              value={newPlanName}
              onChange={(e) => setNewPlanName(e.target.value)}
              placeholder="Pro · 90 days"
              required
            />
          </label>
          <label>
            Price (USDT)
            <input
              type="number"
              min={0}
              step="0.01"
              value={newPlanPrice}
              onChange={(e) => setNewPlanPrice(e.target.value)}
              required
            />
          </label>
          <label>
            Days
            <input
              type="number"
              min={1}
              value={newPlanDays}
              onChange={(e) => setNewPlanDays(e.target.value)}
              required
            />
          </label>
          <label className="plan-check-label">
            <input
              type="checkbox"
              checked={newPlanRecommended}
              onChange={(e) => setNewPlanRecommended(e.target.checked)}
            />
            Recommended
          </label>
          <label className="plan-features-label">
            Features (one per line)
            <textarea
              value={newPlanFeatures}
              onChange={(e) => setNewPlanFeatures(e.target.value)}
              rows={3}
            />
          </label>
          <button type="submit" className="account-btn primary" disabled={newPlanBusy}>
            {newPlanBusy ? 'Creating…' : 'Add plan'}
          </button>
        </form>

        <div className="plan-admin-list">
          {planDrafts.length === 0 ? (
            <p className="muted">No plans yet.</p>
          ) : (
            planDrafts.map((draft) => (
              <div key={draft.id} className={`plan-admin-card${!draft.active ? ' is-inactive' : ''}`}>
                <div className="plan-admin-card-top">
                  <code>{draft.id}</code>
                  <div className="plan-admin-toggles">
                    <label>
                      <input
                        type="checkbox"
                        checked={draft.recommended}
                        onChange={(e) => patchPlanDraft(draft.id, { recommended: e.target.checked })}
                      />
                      Recommended
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={draft.active}
                        onChange={(e) => patchPlanDraft(draft.id, { active: e.target.checked })}
                      />
                      Active
                    </label>
                  </div>
                </div>
                <div className="create-user-form plan-admin-fields">
                  <label>
                    Name
                    <input
                      value={draft.name}
                      onChange={(e) => patchPlanDraft(draft.id, { name: e.target.value })}
                    />
                  </label>
                  <label>
                    Price (USDT)
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={draft.price_usdt}
                      onChange={(e) => patchPlanDraft(draft.id, { price_usdt: e.target.value })}
                    />
                  </label>
                  <label>
                    Days
                    <input
                      type="number"
                      min={1}
                      value={draft.days}
                      onChange={(e) => patchPlanDraft(draft.id, { days: e.target.value })}
                    />
                  </label>
                  <label>
                    Sort
                    <input
                      type="number"
                      value={draft.sort_order}
                      onChange={(e) => patchPlanDraft(draft.id, { sort_order: e.target.value })}
                    />
                  </label>
                  <label className="plan-features-label">
                    Features (one per line)
                    <textarea
                      value={draft.featuresText}
                      onChange={(e) => patchPlanDraft(draft.id, { featuresText: e.target.value })}
                      rows={3}
                    />
                  </label>
                  <button
                    type="button"
                    className="account-btn primary"
                    disabled={planBusyId === draft.id}
                    onClick={() => void savePlan(draft)}
                  >
                    {planBusyId === draft.id ? 'Saving…' : 'Save plan'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="account-panel">
        <h2>Customer support</h2>
        <p className="muted create-hint">
          Shown on login, in the studio toolbar, and on Billing. Leave a field blank to hide that channel.
        </p>
        <form className="create-user-form" onSubmit={(e) => void saveSupport(e)}>
          <label>
            Telegram (@username or t.me link)
            <input
              value={supportTelegram}
              onChange={(e) => setSupportTelegram(e.target.value)}
              placeholder="@yoursupport or https://t.me/yoursupport"
              autoComplete="off"
            />
          </label>
          <label>
            WhatsApp (number with country code)
            <input
              value={supportWhatsapp}
              onChange={(e) => setSupportWhatsapp(e.target.value)}
              placeholder="+971501234567 or https://wa.me/971501234567"
              autoComplete="off"
            />
          </label>
          <label>
            Short message
            <input
              value={supportMessage}
              onChange={(e) => setSupportMessage(e.target.value)}
              placeholder="Need help? Chat with support."
              maxLength={200}
            />
          </label>
          <button type="submit" className="account-btn primary" disabled={supportBusy}>
            {supportBusy ? 'Saving…' : 'Save support links'}
          </button>
        </form>
      </section>

      <section className="account-panel">
        <h2>Send notification</h2>
        <p className="muted create-hint">
          Push a message to all users or one account. It shows in the studio notification bell.
        </p>
        <form className="create-user-form" onSubmit={(e) => void sendNotification(e)}>
          <label>
            Audience
            <select value={notifTarget} onChange={(e) => setNotifTarget(e.target.value)}>
              <option value="all">All users</option>
              {users.map((u) => (
                <option key={u.id} value={String(u.id)}>
                  @{u.username}
                  {u.name ? ` · ${u.name}` : ''}
                </option>
              ))}
            </select>
          </label>
          <label>
            Title
            <input
              value={notifTitle}
              onChange={(e) => setNotifTitle(e.target.value)}
              placeholder="Plan renewal reminder"
              maxLength={120}
              required
            />
          </label>
          <label>
            Message
            <textarea
              value={notifBody}
              onChange={(e) => setNotifBody(e.target.value)}
              placeholder="Your Pro plan renews in 3 days. Open Billing to extend."
              rows={3}
              maxLength={2000}
              required
            />
          </label>
          <button type="submit" className="account-btn primary" disabled={notifBusy}>
            {notifBusy ? 'Sending…' : 'Send notification'}
          </button>
        </form>
        {sentNotifs.length > 0 && (
          <div className="notif-admin-list">
            <h3 className="notif-admin-heading">Recently sent</h3>
            <ul>
              {sentNotifs.slice(0, 8).map((n) => (
                <li key={n.id}>
                  <strong>{n.title}</strong>
                  <span className="muted">
                    {n.audience === 'all'
                      ? 'All users'
                      : `@${n.target_username || n.target_user_id}`}
                    {n.created_at ? ` · ${new Date(n.created_at.includes('T') ? n.created_at : n.created_at.replace(' ', 'T') + 'Z').toLocaleString()}` : ''}
                  </span>
                  <p>{n.body}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="account-panel">
        <h2>Invite codes</h2>
        <p className="muted create-hint">
          Registration requires an invite. Create a code, copy the link, and send it to the customer.
        </p>
        <form className="create-user-form" onSubmit={(e) => void createInvite(e)}>
          <label>
            Note (optional)
            <input
              value={inviteNote}
              onChange={(e) => setInviteNote(e.target.value)}
              placeholder="For Alex · agency"
            />
          </label>
          <label>
            Max uses
            <input
              type="number"
              min={1}
              max={100}
              value={inviteMaxUses}
              onChange={(e) => setInviteMaxUses(Number(e.target.value) || 1)}
            />
          </label>
          <label>
            Expires (days, 0 = never)
            <input
              type="number"
              min={0}
              max={3650}
              value={inviteDays}
              onChange={(e) => setInviteDays(Number(e.target.value))}
            />
          </label>
          <button type="submit" className="account-btn primary" disabled={inviteBusy}>
            {inviteBusy ? 'Creating…' : 'Create invite'}
          </button>
        </form>
        {lastInvite && (
          <div className="credentials-box" style={{ marginTop: '0.85rem' }}>
            <p>
              <strong>Latest invite:</strong> <code>{lastInvite.code}</code>
            </p>
            <button type="button" className="account-btn" onClick={() => void copyInvite(lastInvite)}>
              Copy code + link
            </button>
          </div>
        )}
        <div className="monitor-table-wrap" style={{ marginTop: '1rem' }}>
          <table className="account-table monitor-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Status</th>
                <th>Uses</th>
                <th>Note</th>
                <th>Expires</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {invites.length === 0 ? (
                <tr>
                  <td colSpan={6} className="muted">
                    No invites yet — create one above.
                  </td>
                </tr>
              ) : (
                invites.map((inv) => (
                  <tr key={inv.id}>
                    <td className="mono">
                      <strong>{inv.code}</strong>
                    </td>
                    <td>
                      <span className={`action-pill action-${inv.status}`}>{inv.status}</span>
                    </td>
                    <td className="mono">
                      {inv.uses}/{inv.max_uses}
                    </td>
                    <td>{inv.note || '—'}</td>
                    <td className="tiny-time">
                      {inv.expires_at ? new Date(inv.expires_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="row-actions">
                      <button type="button" className="account-btn" onClick={() => void copyInvite(inv)}>
                        Copy
                      </button>
                      {inv.status === 'active' ? (
                        <button
                          type="button"
                          className="account-btn danger"
                          onClick={() => void revokeInvite(inv)}
                        >
                          Revoke
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="account-panel">
        <div className="panel-toolbar">
          <h2>Platform monitor</h2>
          <form
            className="search-row"
            onSubmit={(e) => {
              e.preventDefault()
              void loadActivity(activityQ || undefined, activityAction).catch((err) =>
                setError(err instanceof Error ? err.message : 'Activity load failed'),
              )
            }}
          >
            <select
              value={activityAction}
              onChange={(e) => setActivityAction(e.target.value)}
              aria-label="Filter by action"
            >
              <option value="all">All actions</option>
              <option value="login">Logins</option>
              <option value="login_failed">Failed logins</option>
              <option value="logout">Logouts</option>
              <option value="register">Registers</option>
              <option value="download_screenshot">Downloads</option>
              <option value="copy_screenshot">Copies</option>
              <option value="batch_export">Batch export</option>
              <option value="generate_receipt">Generate</option>
              <option value="payment_create">Payments</option>
              <option value="admin_user_create">Admin creates</option>
              <option value="admin_user_update">Admin updates</option>
            </select>
            <input
              value={activityQ}
              onChange={(e) => setActivityQ(e.target.value)}
              placeholder="Search user, IP, city…"
            />
            <button type="submit" className="account-btn">
              Filter
            </button>
            <button
              type="button"
              className="account-btn"
              onClick={() => void refreshAll()}
            >
              Refresh
            </button>
            <label className="live-toggle">
              <input
                type="checkbox"
                checked={liveRefresh}
                onChange={(e) => setLiveRefresh(e.target.checked)}
              />
              Live 30s
            </label>
          </form>
        </div>

        {lastRefresh && (
          <p className="muted refresh-meta">
            Updated {lastRefresh.toLocaleTimeString()}
            {liveRefresh ? ' · auto-refresh on' : ''}
          </p>
        )}

        {activitySummary && (
          <div className="monitor-summary">
            <div>
              <strong>{activitySummary.logins_24h}</strong>
              <span>Logins · 24h</span>
            </div>
            <div>
              <strong>{activitySummary.failed_24h}</strong>
              <span>Failed · 24h</span>
            </div>
            <div>
              <strong>{activitySummary.unique_ips_24h}</strong>
              <span>Unique IPs · 24h</span>
            </div>
            <div>
              <strong>{activitySummary.total}</strong>
              <span>Shown</span>
            </div>
          </div>
        )}

        <div className="monitor-table-wrap">
          <table className="account-table monitor-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Action</th>
                <th>Location</th>
                <th>IP</th>
                <th>What they did</th>
              </tr>
            </thead>
            <tbody>
              {activity.length === 0 ? (
                <tr>
                  <td colSpan={6} className="muted">
                    No activity yet — logins and downloads will appear here.
                  </td>
                </tr>
              ) : (
                activity.map((ev) => (
                  <tr key={ev.id} className={ev.action === 'login_failed' ? 'row-warn' : undefined}>
                    <td className="mono tiny-time">
                      {ev.created_at ? new Date(ev.created_at).toLocaleString() : '—'}
                    </td>
                    <td>
                      {ev.username ? (
                        <span className="user-cell">
                          <strong>@{ev.username}</strong>
                        </span>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td>
                      <span className={`action-pill action-${ev.action}`}>{actionLabel(ev.action)}</span>
                    </td>
                    <td className="loc-cell">{ev.location || 'Unknown'}</td>
                    <td className="mono">{ev.ip || '—'}</td>
                    <td>
                      <div className="detail-cell">{ev.detail || actionLabel(ev.action)}</div>
                      {ev.user_agent ? (
                        <div className="tiny ua-cell" title={ev.user_agent}>
                          {ev.user_agent}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="account-panel">
        <h2>Create user</h2>
        <form className="create-user-form" onSubmit={(e) => void createUser(e)}>
          <label>
            Name
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Customer name"
            />
          </label>
          <label>
            Username
            <input
              type="text"
              required
              minLength={3}
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="username"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
            />
          </label>
          <label>
            Password
            <div className="password-row">
              <input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="account-btn"
                onClick={() => setNewPassword(randomPassword())}
              >
                Generate
              </button>
            </div>
          </label>
          <label>
            Paid access (days)
            <input
              type="number"
              min={0}
              max={3650}
              value={paidDays}
              onChange={(e) => setPaidDays(Number(e.target.value))}
            />
          </label>
          <button type="submit" className="account-btn primary" disabled={creating}>
            {creating ? 'Creating…' : 'Create account'}
          </button>
        </form>
        <p className="muted create-hint">
          After create, copy the login details below and send them to the customer.
        </p>
      </section>

      {credentials && (
        <section className="account-panel credentials-box">
          <h2>Login details to send</h2>
          <dl className="cred-grid">
            <div>
              <dt>Username</dt>
              <dd className="mono">{credentials.username}</dd>
            </div>
            <div>
              <dt>Password</dt>
              <dd className="mono">{credentials.password}</dd>
            </div>
            {credentials.name ? (
              <div>
                <dt>Name</dt>
                <dd>{credentials.name}</dd>
              </div>
            ) : null}
          </dl>
          <div className="actions-cell">
            <button type="button" className="account-btn primary" onClick={() => void copyCredentials()}>
              {copied ? 'Copied' : 'Copy login details'}
            </button>
            <button type="button" className="account-btn" onClick={() => setCredentials(null)}>
              Dismiss
            </button>
          </div>
          <p className="muted create-hint">Password is only shown once here — it is stored hashed.</p>
        </section>
      )}

      <section className="account-panel">
        <div className="panel-toolbar">
          <h2>Users</h2>
          <form
            className="search-row"
            onSubmit={(e) => {
              e.preventDefault()
              void load(q || undefined)
            }}
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search username or name"
            />
            <button type="submit" className="account-btn">
              Search
            </button>
          </form>
        </div>
        <table className="account-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Access</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="user-cell">
                    <strong>{u.name}</strong>
                    <span>@{u.username}</span>
                  </div>
                </td>
                <td>{u.role}</td>
                <td>
                  {u.status === 'banned'
                    ? 'Banned'
                    : u.access.can_download
                      ? 'Unlocked'
                      : 'Locked'}
                  {u.access.paid_until ? (
                    <div className="tiny">Paid → {new Date(u.access.paid_until).toLocaleDateString()}</div>
                  ) : null}
                </td>
                <td className="actions-cell">
                  {u.status === 'banned' ? (
                    <button
                      type="button"
                      className="account-btn"
                      disabled={busyId === u.id}
                      onClick={() => void updateUser(u.id, { status: 'active' })}
                    >
                      Unban
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="account-btn danger"
                      disabled={busyId === u.id || u.role === 'admin'}
                      onClick={() => void updateUser(u.id, { status: 'banned' })}
                    >
                      Ban
                    </button>
                  )}
                  <button
                    type="button"
                    className="account-btn"
                    disabled={busyId === u.id}
                    onClick={() => void updateUser(u.id, { extend_days: 30 })}
                  >
                    +30 days
                  </button>
                  <button
                    type="button"
                    className="account-btn"
                    disabled={busyId === u.id}
                    onClick={() => resetPassword(u)}
                  >
                    Reset password
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="account-panel">
        <h2>Recent payments</h2>
        <table className="account-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Plan</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.slice(0, 40).map((p) => (
              <tr key={String(p.id)}>
                <td>{String(p.user_username || p.user_email || p.user_id)}</td>
                <td>{String(p.plan_id)}</td>
                <td>{Number(p.amount_usdt).toFixed(2)}</td>
                <td>{String(p.status)}</td>
                <td>{p.created_at ? new Date(String(p.created_at)).toLocaleString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {error && <p className="account-error">{error}</p>}
    </div>
  )
}
