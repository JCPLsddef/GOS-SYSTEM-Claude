'use client'

import { create } from 'zustand'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, Zap, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'

interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'hype'
  message: string
  duration?: number
}

interface ToastStore {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { ...toast, id: Math.random().toString(36).substring(2) },
      ],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))

export function toast(message: string, type: Toast['type'] = 'info', duration = 4000) {
  useToastStore.getState().addToast({ type, message, duration })
}

function ToastItem({ toast: t, onRemove }: { toast: Toast; onRemove: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onRemove, t.duration || 4000)
    return () => clearTimeout(timer)
  }, [t.duration, onRemove])

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-front-business" />,
    error: <AlertCircle className="w-5 h-5 text-danger" />,
    info: <Info className="w-5 h-5 text-front-school" />,
    hype: <Zap className="w-5 h-5 text-gold" />,
  }

  const borders = {
    success: 'border-front-business/30',
    error: 'border-danger/30',
    info: 'border-front-school/30',
    hype: 'border-gold/30',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={cn(
        'flex items-center gap-3 px-4 py-3 bg-bg-elevated border rounded-lg shadow-lg min-w-[300px]',
        borders[t.type]
      )}
    >
      {icons[t.type]}
      <span className="text-sm text-cream flex-1">{t.message}</span>
      <button onClick={onRemove} className="text-cream-muted hover:text-cream">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  )
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={() => removeToast(t.id)} />
        ))}
      </AnimatePresence>
    </div>
  )
}
