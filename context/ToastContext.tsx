'use client'
import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react'
import clsx from 'clsx'

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastContextValue {
  toast: (opts: Omit<Toast, 'id'>) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}

// ─── Toast Config ─────────────────────────────────────────────────────────────

const TOAST_CONFIG: Record<ToastType, { icon: React.ElementType; bg: string; border: string; iconColor: string }> = {
  success: { icon: CheckCircle, bg: 'bg-white', border: 'border-l-4 border-success', iconColor: 'text-success' },
  error:   { icon: XCircle,     bg: 'bg-white', border: 'border-l-4 border-danger',  iconColor: 'text-danger' },
  warning: { icon: AlertTriangle, bg: 'bg-white', border: 'border-l-4 border-warning', iconColor: 'text-warning' },
  info:    { icon: Info,         bg: 'bg-white', border: 'border-l-4 border-info',    iconColor: 'text-info' },
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counter = useRef(0)

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((opts: Omit<Toast, 'id'>) => {
    const id = `toast-${++counter.current}`
    setToasts(prev => [...prev.slice(-4), { ...opts, id }]) // max 5 toasts
    setTimeout(() => remove(id), opts.duration ?? 3500)
  }, [remove])

  const success = useCallback((title: string, message?: string) => toast({ type: 'success', title, message }), [toast])
  const error   = useCallback((title: string, message?: string) => toast({ type: 'error',   title, message }), [toast])
  const warning = useCallback((title: string, message?: string) => toast({ type: 'warning', title, message }), [toast])
  const info    = useCallback((title: string, message?: string) => toast({ type: 'info',    title, message }), [toast])

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(t => {
          const cfg = TOAST_CONFIG[t.type]
          const Icon = cfg.icon
          return (
            <div
              key={t.id}
              className={clsx(
                'flex items-start gap-3 px-4 py-3 rounded-2xl shadow-lg pointer-events-auto',
                'animate-slide-up',
                cfg.bg, cfg.border,
                'border border-gray-100'
              )}
              style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
            >
              <Icon size={18} className={clsx('flex-shrink-0 mt-0.5', cfg.iconColor)} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-primary leading-tight">{t.title}</p>
                {t.message && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{t.message}</p>}
              </div>
              <button
                onClick={() => remove(t.id)}
                className="flex-shrink-0 p-0.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={13} className="text-gray-400" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
