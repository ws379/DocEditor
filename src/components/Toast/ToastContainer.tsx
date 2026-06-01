import { useToastStore, type ToastType } from '../../stores/toastStore'

const typeStyles: Record<ToastType, string> = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  info: 'bg-gray-800',
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  const removeToast = useToastStore((s) => s.removeToast)

  if (toasts.length === 0) return null

  return (
    <div data-toast className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${typeStyles[t.type]} text-white text-sm px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in cursor-pointer`}
          onClick={() => removeToast(t.id)}
        >
          {t.type === 'success' && <span>✓</span>}
          {t.type === 'error' && <span>✕</span>}
          {t.type === 'info' && <span>ℹ</span>}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
