import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const maxW = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-xl', xl: 'max-w-2xl', '2xl': 'max-w-3xl' }[size] || 'max-w-lg'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-navy/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${maxW} rounded-t-[32px] sm:rounded-[28px] bg-white dark:bg-[#101a2e] shadow-hero max-h-[92svh] flex flex-col animate-slide-up`}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/10 flex-shrink-0">
            <h2 className="font-bold text-slate-900 dark:text-white text-lg">{title}</h2>
            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-2xl bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white hover:bg-slate-200 dark:hover:bg-white/20 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
