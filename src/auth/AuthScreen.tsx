import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from './AuthContext'
import './AuthScreens.css'

const REMEMBER_KEY = 'rm_remember_username'

function passwordStrength(pw: string): { score: number; label: string } {
  let score = 0
  if (pw.length >= 8) score += 1
  if (pw.length >= 12) score += 1
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1
  if (/\d/.test(pw)) score += 1
  if (/[^A-Za-z0-9]/.test(pw)) score += 1
  const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent']
  return { score, label: labels[Math.min(score, labels.length - 1)] }
}

export function AuthScreen() {
  const { login, register, error } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState(() => localStorage.getItem(REMEMBER_KEY) || '')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(() => Boolean(localStorage.getItem(REMEMBER_KEY)))
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    setLocalError(null)
  }, [mode])

  const strength = mode === 'register' ? passwordStrength(password) : null

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setLocalError(null)
    try {
      if (mode === 'login') await login(username, password)
      else await register(username, password, name)
      if (remember) localStorage.setItem(REMEMBER_KEY, username.trim())
      else localStorage.removeItem(REMEMBER_KEY)
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-mark" aria-hidden />
          <div>
            <h1>Receipt Maker</h1>
            <p>Screenshot studio for wallets & banks</p>
          </div>
        </div>

        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={mode === 'login' ? 'active' : ''}
            onClick={() => setMode('login')}
          >
            Log in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={mode === 'register' ? 'active' : ''}
            onClick={() => setMode('register')}
          >
            Register
          </button>
        </div>

        <form className="auth-form" onSubmit={(e) => void submit(e)}>
          {mode === 'register' && (
            <label>
              Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex"
                autoComplete="name"
              />
            </label>
          )}
          <label>
            Username
            <input
              type="text"
              required
              minLength={3}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
            />
          </label>
          <label>
            Password
            <div className="auth-password-row">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                className="auth-show-pw"
                onClick={() => setShowPassword((v) => !v)}
                aria-pressed={showPassword}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>
          {strength && password.length > 0 && (
            <div className="auth-strength" aria-live="polite">
              <div className="auth-strength-bar" data-score={strength.score}>
                <span style={{ width: `${(strength.score / 5) * 100}%` }} />
              </div>
              <span>{strength.label}</span>
            </div>
          )}
          {mode === 'login' && (
            <label className="auth-remember">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Remember username
            </label>
          )}
          {(localError || error) && <p className="auth-error">{localError || error}</p>}
          <button type="submit" className="auth-submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>

        <p className="auth-note">
          New accounts get a short free trial. Pay with crypto (USDT) to unlock downloads.
          For mockups & demos only.
        </p>
      </div>
    </div>
  )
}
