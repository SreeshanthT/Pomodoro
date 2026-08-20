import { useToastStore } from '../../state/toastStore'
import './toastContainer.css'

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  if (toasts.length === 0) return null

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast toast-error">
          <span>{toast.message}</span>
          <button className="toast-dismiss" onClick={() => dismiss(toast.id)} aria-label="Dismiss">
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
