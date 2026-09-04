'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { DesignRow } from '@/types/vibe'

/**
 * Full-screen preview of a stored design.
 *
 * The frame runs `sandbox="allow-scripts"` -- the same flags as the visitor's own
 * preview, and deliberately so. Every mockup is styled entirely by the Tailwind
 * CDN, which is a SCRIPT: with scripts blocked the document renders as unstyled
 * markup on a white page, which is what this preview used to show. A preview that
 * does not look like the thing being previewed is not a preview.
 *
 * What makes that safe is the same thing that makes the visitor's frame safe:
 * `allow-scripts` WITHOUT `allow-same-origin` gives the frame an opaque origin, so
 * it cannot read cookies or storage, cannot reach `window.parent`, and cannot call
 * our own `/api/vibe/admin/*` routes with the admin's ambient session. The stored
 * document also carries its own CSP with `connect-src 'none'`, and no
 * `allow-top-navigation` means it cannot move the admin's tab. Never add
 * `allow-same-origin`: it cancels the sandbox outright, and this tab holds a
 * signed-in admin session.
 *
 * The residual risk, unchanged from the studio frame, is that a mockup's own
 * inline script can navigate ITS OWN frame -- so a hostile document could phone
 * home from an admin's browser. The `Scripts off` toggle exists for that: it
 * re-renders the document inert, at the cost of the styling.
 *
 * The HTML also arrives as JSON rather than from a text/html route, so there is no
 * endpoint that serves visitor-authored markup from our own origin.
 */
export function DesignPreview({ designId, onClose }: { designId: string; onClose: () => void }) {
  const [html, setHtml] = useState<string | null>(null)
  const [design, setDesign] = useState<DesignRow | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scripts, setScripts] = useState(true)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch(`/api/vibe/admin/designs/${designId}`)
        const data = (await res.json()) as { ok?: boolean; html?: string; design?: DesignRow; missing?: boolean; error?: string }
        if (cancelled) return
        if (data.missing) {
          setError('The file for this design is missing from disk. The record is still here.')
        } else if (data.ok && data.html) {
          setHtml(data.html)
          setDesign(data.design ?? null)
        } else {
          setError(data.error ?? 'Could not load that design.')
        }
      } catch {
        if (!cancelled) setError('Could not load that design.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [designId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 p-4 backdrop-blur-sm">
      <div className="mb-3 flex shrink-0 items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold">{design?.title ?? 'Design preview'}</p>
          <p className="text-[12px] text-white/40">
            {scripts
              ? 'Exactly what the visitor saw — sandboxed, with no access to this page or your session.'
              : 'Scripts off, so Tailwind cannot load and the document renders unstyled.'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {/* An action label, not a state label, and deliberately no aria-pressed:
              "Scripts off / not pressed" is the sort of thing a screen reader
              announces when a button tries to be both. The line on the left says
              what the frame is currently doing. */}
          <button
            onClick={() => setScripts((s) => !s)}
            title={
              scripts
                ? 'Render the document inert. Its styling comes from a script, so it will look unstyled.'
                : 'Run the document as the visitor saw it, inside the sandbox.'
            }
            className="btn-outline rounded-lg px-3 py-2 text-[12.5px] font-semibold"
          >
            {scripts ? 'Turn scripts off' : 'Turn scripts on'}
          </button>
          <button
            onClick={onClose}
            aria-label="Close preview"
            className="btn-outline rounded-lg px-3 py-2 text-[13px] font-semibold"
          >
            <X size={16} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {error ? (
        <div className="flex flex-1 items-center justify-center rounded-[12px] border border-white/10 text-[13.5px] text-white/50">
          {error}
        </div>
      ) : html ? (
        <iframe
          // Keyed on the mode: changing `sandbox` on a live frame does not
          // re-apply it to the document already loaded there, so the frame has to
          // be a new element for the toggle to mean anything.
          key={scripts ? 'scripts' : 'inert'}
          srcDoc={html}
          sandbox={scripts ? 'allow-scripts' : ''}
          referrerPolicy="no-referrer"
          title="Stored design preview"
          className="flex-1 rounded-[12px] border-0 bg-white"
        />
      ) : (
        <div className="flex flex-1 items-center justify-center text-[13.5px] text-white/40">Loading…</div>
      )}
    </div>
  )
}
