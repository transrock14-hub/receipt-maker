export type AccessInfo = {
  active: boolean
  banned: boolean
  trial_active: boolean
  paid_active: boolean
  trial_ends_at: string | null
  paid_until: string | null
  can_download: boolean
}

export type AuthUser = {
  id: number
  username: string
  email?: string | null
  name: string
  role: 'user' | 'admin'
  status: 'active' | 'banned'
  access: AccessInfo
}

export type Plan = {
  id: string
  name: string
  price_usdt: string | number
  days: number
}

const TOKEN_KEY = 'rm_session_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

function apiBase(): string {
  return (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '/api'
}

export function clientTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || ''
  } catch {
    return ''
  }
}

async function request<T>(
  path: string,
  opts: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const headers = new Headers(opts.headers || {})
  headers.set('Accept', 'application/json')
  if (opts.json !== undefined) {
    headers.set('Content-Type', 'application/json')
  }
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${apiBase()}${path}`, {
    ...opts,
    headers,
    body: opts.json !== undefined ? JSON.stringify(opts.json) : opts.body,
  })
  const data = await res.json().catch(() => ({}))
  const hadToken = Boolean(token)
  const isAuthForm = path.startsWith('/auth/login') || path.startsWith('/auth/register')

  if (res.status === 401 && hadToken && !isAuthForm) {
    setToken(null)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rm:auth-expired'))
    }
  }

  if (!res.ok || data.ok === false) {
    const serverMsg = typeof data.error === 'string' ? data.error : null
    throw new Error(
      serverMsg ||
        (res.status === 401 && hadToken && !isAuthForm
          ? 'Session expired — log in again'
          : `Request failed (${res.status})`),
    )
  }
  return data as T
}

export type ActivityEvent = {
  id: number
  user_id: number | null
  username: string | null
  action: string
  detail: string | null
  meta: Record<string, unknown> | null
  ip: string | null
  user_agent: string | null
  country: string | null
  region: string | null
  city: string | null
  timezone: string | null
  location: string
  created_at: string
}

export type ActivityAction =
  | 'download_screenshot'
  | 'copy_screenshot'
  | 'batch_export'
  | 'generate_receipt'
  | 'save_project'
  | 'open_billing'

export type Invite = {
  id: number
  code: string
  note: string | null
  max_uses: number
  uses: number
  expires_at: string | null
  revoked_at: string | null
  created_at: string | null
  last_used_at: string | null
  status: 'active' | 'used' | 'expired' | 'revoked'
}

export type SupportInfo = {
  telegram_url: string | null
  whatsapp_url: string | null
  message: string
  enabled: boolean
}

export type SupportRaw = {
  telegram: string
  whatsapp: string
  message: string
}

export const api = {
  health: () => request<{ ok: boolean }>('/health'),
  register: (username: string, password: string, name?: string, invite?: string) =>
    request<{ ok: true; token: string; user: AuthUser }>('/auth/register', {
      method: 'POST',
      json: { username, password, name, invite, timezone: clientTimezone() },
    }),
  login: (username: string, password: string) =>
    request<{ ok: true; token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      json: { username, password, timezone: clientTimezone() },
    }),
  logout: () => request<{ ok: true }>('/auth/logout', { method: 'POST' }),
  me: () => request<{ ok: true; user: AuthUser }>('/auth/me'),
  trackActivity: (action: ActivityAction, detail?: string, meta?: Record<string, unknown>) =>
    request<{ ok: true }>('/activity', {
      method: 'POST',
      json: {
        action,
        detail,
        meta,
        timezone: clientTimezone(),
      },
    }).catch(() => ({ ok: true as const })),
  /** Server entitlement check before download/copy (banned / expired accounts fail here). */
  assertExportAllowed: (kind: 'download' | 'copy' | 'batch', meta?: Record<string, unknown>) =>
    request<{ ok: true; can_download: true; username: string }>('/export/check', {
      method: 'POST',
      json: {
        kind,
        timezone: clientTimezone(),
        ...meta,
      },
    }),
  plans: () => request<{ ok: true; plans: Plan[] }>('/plans'),
  createPayment: (plan_id: string) =>
    request<{
      ok: true
      payment: {
        id: number
        invoice_url: string
        provider_payment_id: string
        amount_usdt: number
        pay_currency: string
        provider: string
        demo?: boolean
      }
    }>('/payments/create', { method: 'POST', json: { plan_id } }),
  myPayments: () =>
    request<{ ok: true; payments: Array<Record<string, unknown>> }>('/payments/mine'),
  demoComplete: (provider_payment_id: string) =>
    request<{ ok: true; user: AuthUser }>('/payments/demo-complete', {
      method: 'POST',
      json: { provider_payment_id },
    }),
  adminUsers: (q?: string) =>
    request<{ ok: true; users: AuthUser[] }>(
      `/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`,
    ),
  adminCreateUser: (body: {
    username: string
    password: string
    name?: string
    paid_days?: number
    role?: 'user' | 'admin'
  }) =>
    request<{
      ok: true
      user: AuthUser
      credentials: { username: string; password: string; name: string }
    }>('/admin/users/create', { method: 'POST', json: body }),
  adminUpdateUser: (body: Record<string, unknown>) =>
    request<{
      ok: true
      user: AuthUser
      credentials?: { username: string; password: string; name: string }
    }>('/admin/users/update', {
      method: 'POST',
      json: body,
    }),
  adminInvites: () =>
    request<{ ok: true; invites: Invite[]; invite_only: boolean }>('/admin/invites'),
  adminCreateInvite: (body?: { note?: string; max_uses?: number; expires_days?: number; code?: string }) =>
    request<{ ok: true; invite: Invite }>('/admin/invites/create', {
      method: 'POST',
      json: body || {},
    }),
  adminRevokeInvite: (invite_id: number) =>
    request<{ ok: true; invite: Invite }>('/admin/invites/revoke', {
      method: 'POST',
      json: { invite_id },
    }),
  support: () => request<{ ok: true; support: SupportInfo }>('/support'),
  adminSupport: () =>
    request<{ ok: true; support: SupportInfo; raw: SupportRaw }>('/admin/support'),
  adminSaveSupport: (body: { telegram?: string; whatsapp?: string; message?: string }) =>
    request<{ ok: true; support: SupportInfo; raw: SupportRaw }>('/admin/support', {
      method: 'POST',
      json: body,
    }),
  adminPayments: () =>
    request<{ ok: true; payments: Array<Record<string, unknown>> }>('/admin/payments'),
  adminStats: () =>
    request<{
      ok: true
      stats: {
        users: number
        active_paid: number
        active_trials: number
        payments_finished: number
        revenue_usdt: number
      }
    }>('/admin/stats'),
  adminActivity: (opts?: { q?: string; action?: string; limit?: number }) => {
    const params = new URLSearchParams()
    if (opts?.q) params.set('q', opts.q)
    if (opts?.action) params.set('action', opts.action)
    if (opts?.limit) params.set('limit', String(opts.limit))
    const qs = params.toString()
    return request<{
      ok: true
      events: ActivityEvent[]
      summary: {
        total: number
        logins_24h: number
        failed_24h: number
        unique_ips_24h: number
      }
    }>(`/admin/activity${qs ? `?${qs}` : ''}`)
  },
  rates: () =>
    request<{
      ok: true
      rates: Record<string, number>
      updated_at: string | null
      source: string
      stale?: boolean
    }>('/rates'),
}
