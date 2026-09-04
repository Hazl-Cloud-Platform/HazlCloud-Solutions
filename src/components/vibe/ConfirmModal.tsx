'use client'

import { useEffect, useRef } from 'react'
import { TriangleAlert, X } from 'lucide-react'

/**
 * Confirmation for a destructive action.
 *
 * Presentational only: the caller owns the request and the success side-effects,
 * because those land in state this dialog does not hold. Structure and styling
 * follow ContactModal, with three divergences that exist because this one destroys
 * something -- see the comments below.
 */
export function ConfirmModal({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = 'Cancel',
  pending,
  error,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  children: React.ReactNode
  confirmLabel: string
  cancelLabel?: string
  pending: boolean
  error: string | null
  onConfirm: () => void
  onCancel: () => void
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    // Focus CANCEL, not the first focusable element and never the destructive
    // button: a stray Enter on an unread dialog must not delete anything.
    cancelRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      // Escape is ignored mid-request so the dialog cannot be dismissed out from
      // under a delete that is already on its way to the server.
      if (e.key === 'Escape' && !pending) onCancel()
      if (e.key !== 'Tab') return
      // Manual focus trap -- there is no dialog library in this repo.
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, pending, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && !pending && onCancel()}
    >
      <div
        ref={dialogRef}
        // alertdialog, not dialog: this interrupts to confirm a destructive act,
        // so the body should be announced with the title rather than on focus.
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="vibe-confirm-title"
        aria-describedby="vibe-confirm-body"
        className="relative w-full max-w-[420px] rounded-[14px] border border-white/12 bg-[#0b0b0b] p-6"
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          aria-label="Close"
          className="absolute right-4 top-4 text-white/35 transition-colors hover:text-white disabled:opacity-40"
        >
          <X size={18} strokeWidth={2} />
        </button>

        <TriangleAlert size={20} strokeWidth={2.2} className="text-[#f87171]" />
        <h2 id="vibe-confirm-title" className="mt-3 text-[19px] font-bold tracking-[-.02em]">
          {title}
        </h2>
        <div id="vibe-confirm-body" className="mt-2 space-y-2 text-[13.5px] leading-relaxed text-white/65">
          {children}
        </div>

        {error && (
          <p aria-live="polite" className="mt-3 text-[13px] text-[#f87171]">
            {error}
          </p>
        )}

        <div className="mt-5 flex gap-2.5">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="btn-outline flex-1 rounded-lg px-5 py-3 text-[13.5px] font-semibold disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            // Deliberately NOT btn-accent: the accent is the conversion colour and
            // a destructive action must not borrow it.
            className="flex-1 rounded-lg border border-[#f87171]/40 bg-[#f87171]/10 px-5 py-3 text-[13.5px] font-bold text-[#f87171] transition-colors hover:bg-[#f87171]/20 disabled:opacity-60"
          >
            {pending ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
