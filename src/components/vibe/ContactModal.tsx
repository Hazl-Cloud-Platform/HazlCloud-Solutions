'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, X } from 'lucide-react'

/**
 * The conversion step. Everything the studio does leads here, so it stays short:
 * one field, one button, and a plain statement of what happens next.
 */
export function ContactModal({ open, onClose, hasDesign }: { open: boolean; onClose: () => void; hasDesign: boolean }) {
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const firstFieldRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    firstFieldRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
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
  }, [open, onClose])

  if (!open) return null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (state === 'sending') return
    setState('sending')
    setError(null)
    try {
      const res = await fetch('/api/vibe/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, note }),
      })
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? 'We could not save that. Please try again.')
        setState('idle')
        return
      }
      setState('done')
    } catch {
      setError('We could not reach the server. Please try again.')
      setState('idle')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="vibe-contact-title"
        className="relative w-full max-w-[440px] rounded-[14px] border border-white/12 bg-[#0b0b0b] p-6"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-white/35 transition-colors hover:text-white"
        >
          <X size={18} strokeWidth={2} />
        </button>

        {state === 'done' ? (
          <div className="py-4 text-center">
            <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent)]">
              <Check size={22} strokeWidth={2.6} className="text-black" />
            </div>
            <h2 id="vibe-contact-title" className="text-[19px] font-bold tracking-[-.02em]">
              Got it — we&apos;ve saved your design.
            </h2>
            <p className="mx-auto mt-2.5 max-w-[330px] text-[13.5px] leading-relaxed text-white/60">
              Someone from our team will email you within one business day to talk through what it would take to build
              this properly.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="btn-outline mt-5 rounded-lg px-5 py-2.5 text-[13.5px] font-semibold"
            >
              Back to the studio
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <h2 id="vibe-contact-title" className="pr-6 text-[19px] font-bold leading-snug tracking-[-.02em]">
              Let&apos;s make this real.
            </h2>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-white/65">
              What you&apos;ve built is a picture of the product. A real person from HAZL will take it from here and
              build the version that&apos;s secure, scalable, and ready to charge customers for.
            </p>

            {!hasDesign && (
              <p className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-[12.5px] text-white/50">
                You haven&apos;t generated a design yet — we&apos;ll just get in touch about your idea.
              </p>
            )}

            <label htmlFor="vibe-email" className="mt-5 block text-[12px] font-bold uppercase tracking-[.12em] text-white/40">
              Your email
            </label>
            <input
              ref={firstFieldRef}
              id="vibe-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="mt-2 w-full rounded-[10px] border border-white/15 bg-white/[0.03] px-3.5 py-3 text-[14px] text-white placeholder:text-white/25 focus:border-white/35 focus:outline-none"
            />

            <label htmlFor="vibe-note" className="mt-4 block text-[12px] font-bold uppercase tracking-[.12em] text-white/40">
              Anything we should know? <span className="font-medium normal-case tracking-normal text-white/25">(optional)</span>
            </label>
            <textarea
              id="vibe-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 2000))}
              placeholder="Timeline, budget, who it's for…"
              className="mt-2 w-full resize-none rounded-[10px] border border-white/15 bg-white/[0.03] px-3.5 py-3 text-[13.5px] leading-relaxed text-white placeholder:text-white/25 focus:border-white/35 focus:outline-none"
            />

            {error && <p className="mt-3 text-[13px] text-[#f87171]">{error}</p>}

            <button
              type="submit"
              disabled={state === 'sending'}
              className="btn-accent mt-5 w-full rounded-lg px-5 py-3.5 text-[14.5px] font-bold disabled:opacity-60"
            >
              {state === 'sending' ? 'Sending…' : 'Send it to the team'}
            </button>

            <p className="mt-3 text-center text-[11.5px] leading-relaxed text-white/30">
              We&apos;ll use your email only to reply about this design. No list, no newsletter. See our{' '}
              <a href="/startup#faq" className="underline underline-offset-2 hover:text-white/50">
                privacy note
              </a>
              .
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
