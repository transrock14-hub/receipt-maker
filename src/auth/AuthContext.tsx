import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, getToken, setToken, type AuthUser } from './api'

type AuthState = {
  user: AuthUser | null
  loading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string, name?: string, invite?: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  setUser: (user: AuthUser | null) => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const res = await api.me()
      setUser(res.user)
      setError(null)
    } catch {
      setToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const onExpired = () => {
      setToken(null)
      setUser(null)
    }
    window.addEventListener('rm:auth-expired', onExpired)
    return () => window.removeEventListener('rm:auth-expired', onExpired)
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    setError(null)
    const res = await api.login(username, password)
    setToken(res.token)
    setUser(res.user)
  }, [])

  const register = useCallback(async (username: string, password: string, name?: string, invite?: string) => {
    setError(null)
    const res = await api.register(username, password, name, invite)
    setToken(res.token)
    setUser(res.user)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.logout()
    } catch {
      /* ignore */
    }
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, error, login, register, logout, refresh, setUser }),
    [user, loading, error, login, register, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth requires AuthProvider')
  return ctx
}
