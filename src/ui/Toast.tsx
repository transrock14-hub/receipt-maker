import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import './Toast.css'

export type ToastTone = 'info' | 'success' | 'error'

export type ToastItem = {
  id: string
  message: string
  tone: ToastTone
}

type ToastApi = {
  push: (message: string, tone?: ToastTone) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

let toastSeq = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      const id = `t-${++toastSeq}`
      setItems((prev) => [...prev.slice(-4), { id, message, tone }])
      window.setTimeout(() => dismiss(id), 3800)
    },
    [dismiss],
  )

  const api = useMemo<ToastApi>(
    () => ({
      push,
      success: (m) => push(m, 'success'),
      error: (m) => push(m, 'error'),
      info: (m) => push(m, 'info'),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-relevant="additions">
        {items.map((t) => (
          <div key={t.id} className={`toast toast-${t.tone}`} role="status">
            <span>{t.message}</span>
            <button type="button" className="toast-dismiss" onClick={() => dismiss(t.id)} aria-label="Dismiss">
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    return {
      push: () => undefined,
      success: () => undefined,
      error: () => undefined,
      info: () => undefined,
    }
  }
  return ctx
}
