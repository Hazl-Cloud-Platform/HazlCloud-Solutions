'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { DesignRow } from '@/types/vibe'

/**
 * Full-screen preview of a stored design.
 *
 * The iframe has `sandbox` with NO `allow-scripts`. This is the single most
 * important difference from the visitor's preview: these documents were written by
 * a model following an anonymous stranger's instructions, and this tab holds a
 * signed-in admin session. Rendering them inert means no amount of hostile content
 * in a stored design can act while an admin is looking at it -- so the design loses
 * its interactivity here, which is the right trade.
 *
 * The HTML also arrives as JSON rather than from a text/html route, so there is no
 * endpoint that serves visitor-authored markup from our own origin.
 */
export function DesignPreview({ designId, onClose }: { designId: string; onClose: () => void }) {
  const [html, setHtml] = useState<string | null>(null)
  const [design, setDesign] = useState<DesignRow | null>(null)
  const [error, setError] = useState<string | null>(null)

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
            Scripts are disabled in this preview — it is a stored visitor document.
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close preview"
          className="btn-outline shrink-0 rounded-lg px-3 py-2 text-[13px] font-semibold"
        >
          <X size={16} strokeWidth={2.2} />
        </button>
      </div>

      {error ? (
        <div className="flex flex-1 items-center justify-center rounded-[12px] border border-white/10 text-[13.5px] text-white/50">
          {error}
        </div>
      ) : html ? (
        <iframe
          srcDoc={html}
          sandbox=""
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
