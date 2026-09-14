import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'

export interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
  'aria-label'?: string
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function BottomSheet({ open, onClose, children, className, ...rest }: BottomSheetProps) {
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false)
  const [prevOpen, setPrevOpen] = useState(open)
  const sheetRef = useRef<HTMLDivElement>(null)

  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) setMounted(true)
    else setVisible(false)
  }

  useEffect(() => {
    if (!open || !mounted) return
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [open, mounted])

  useEffect(() => {
    if (open || !mounted) return
    const timeout = setTimeout(() => setMounted(false), 400)
    return () => clearTimeout(timeout)
  }, [open, mounted])

  // Trava de scroll e foco inicial dependem só de `mounted` — se
  // dependessem de `onClose` (quase sempre uma arrow inline, identidade
  // nova a cada render do pai), o foco voltaria pro container do sheet a
  // cada re-render, roubando o cursor de quem estivesse digitando dentro.
  useEffect(() => {
    if (!mounted) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    sheetRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mounted])

  useEffect(() => {
    if (!mounted) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab' || !sheetRef.current) return

      const focusable = Array.from(sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mounted, onClose])

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[var(--mesa-z-modal-backdrop)]">
      <div
        aria-hidden
        onClick={onClose}
        className={clsx(
          'absolute inset-0 bg-[var(--mesa-color-overlay)] transition-opacity duration-[var(--mesa-duration-medium)] ease-mesa-standard',
          '[backdrop-filter:blur(var(--mesa-overlay-blur))]',
          visible ? 'opacity-100' : 'opacity-0',
        )}
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={rest['aria-label']}
        tabIndex={-1}
        className={clsx(
          'absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-mesa-2xl bg-mesa-surface px-6 pb-6 pt-3 shadow-mesa-3',
          'outline-none transition-transform duration-[var(--mesa-duration-medium)] ease-mesa-decelerate',
          visible ? 'translate-y-0' : 'translate-y-full',
          className,
        )}
      >
        <div className="mb-4 flex justify-center">
          <span className="h-1 w-10 rounded-mesa-full bg-mesa-neutral-300 dark:bg-mesa-neutral-600" />
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
