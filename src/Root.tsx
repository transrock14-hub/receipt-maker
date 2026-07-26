import { useState } from 'react'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { AuthScreen } from './auth/AuthScreen'
import App from './App'
import { BillingPage } from './pages/Billing'
import { AdminPage } from './pages/Admin'
import { ToastProvider } from './ui/Toast'
import { ErrorBoundary } from './ui/ErrorBoundary'

type View = 'studio' | 'billing' | 'admin'

function Gate() {
  const { user, loading } = useAuth()
  const [view, setView] = useState<View>('studio')

  if (loading) {
    return (
      <div className="boot-shell" role="status" aria-live="polite">
        <div className="boot-card">
          <span className="boot-mark" aria-hidden />
          <p className="boot-label">Loading Receipt Maker…</p>
        </div>
      </div>
    )
  }

  if (!user) return <AuthScreen />

  if (view === 'billing') {
    return <BillingPage onBack={() => setView('studio')} />
  }
  if (view === 'admin') {
    return <AdminPage onBack={() => setView('studio')} />
  }

  return (
    <ErrorBoundary title="Studio crashed">
      <App
        onOpenBilling={() => setView('billing')}
        onOpenAdmin={user.role === 'admin' ? () => setView('admin') : undefined}
      />
    </ErrorBoundary>
  )
}

export function Root() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <Gate />
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
