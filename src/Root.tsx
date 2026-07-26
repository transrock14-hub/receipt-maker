import { useState } from 'react'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { AuthScreen } from './auth/AuthScreen'
import App from './App'
import { BillingPage } from './pages/Billing'
import { AdminPage } from './pages/Admin'

type View = 'studio' | 'billing' | 'admin'

function Gate() {
  const { user, loading } = useAuth()
  const [view, setView] = useState<View>('studio')

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#e8e6e1',
          color: '#6b6680',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        Loading…
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
    <App
      onOpenBilling={() => setView('billing')}
      onOpenAdmin={user.role === 'admin' ? () => setView('admin') : undefined}
    />
  )
}

export function Root() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}
