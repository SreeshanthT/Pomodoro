import { create } from 'zustand'

export interface ToastItem {
  id: string
  message: string
}

interface ToastStore {
  toasts: ToastItem[]
  pushError: (message: string) => void
  dismiss: (id: string) => void
}

const AUTO_DISMISS_MS = 5000

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  pushError: (message) => {
    const id = crypto.randomUUID()
    set((state) => ({ toasts: [...state.toasts, { id, message }] }))
    setTimeout(() => get().dismiss(id), AUTO_DISMISS_MS)
  },

  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
}))
