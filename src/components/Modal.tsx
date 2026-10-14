import { useEffect, useRef, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { lockScroll } from '../lib/scroll'

/** Accessible dialog: focus trap, Escape to close, focus restored on close */
export function Modal({
  open,
  onClose,
  label,
  children,
  tone = 'dark',
}: {
  open: boolean
  onClose: () => void
  label: string
  children: ReactNode
  tone?: 'dark' | 'light'
}) {
  const panel = useRef<HTMLDivElement>(null)
  const restore = useRef<HTMLElement | null>(null)
  const close = useRef(onClose)
  close.current = onClose

  useEffect(() => {
    if (!open) return
    restore.current = document.activeElement as HTMLElement
    lockScroll(true)
    const t = window.setTimeout(() => panel.current?.querySelector<HTMLElement>('[data-autofocus], button, a, input, select')?.focus(), 60)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close.current()
      if (e.key !== 'Tab' || !panel.current) return
      const f = panel.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])')
      if (!f.length) return
      const first = f[0]
      const last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('keydown', onKey)
      lockScroll(false)
      restore.current?.focus?.({ preventScroll: true })
    }
  }, [open])

  const dark = tone === 'dark'
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          <button aria-label="Close dialog" tabIndex={-1} className="absolute inset-0 bg-midnight/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className={`relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[1.75rem] p-7 sm:rounded-[1.75rem] sm:p-10 ${
              dark ? 'glass text-ice' : 'bg-linen text-ink'
            }`}
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            data-lenis-prevent
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className={`absolute right-5 top-5 grid size-10 place-items-center rounded-full transition-colors ${
                dark ? 'hover:bg-ice/10' : 'hover:bg-ink/10'
              }`}
            >
              <X size={18} />
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
