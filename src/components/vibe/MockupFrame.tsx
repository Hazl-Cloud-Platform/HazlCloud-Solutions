'use client'

import { Loader2, MonitorSmartphone } from 'lucide-react'

/**
 * The preview.
 *
 * `sandbox="allow-scripts"` and NOTHING else. Adding allow-same-origin would
 * cancel the sandbox entirely: srcDoc inherits the embedder's origin, so
 * model-written code -- driven by an anonymous stranger's prompt -- could read
 * document.cookie, call our own /api/vibe/admin/* routes with an admin's ambient
 * cookie, reach window.parent to plant a credential form under our TLS
 * certificate, and per spec even remove this attribute. With allow-scripts alone
 * the frame gets an opaque origin, and tab switching and modals still work.
 *
 * allow-downloads is also absent, which is what stops a download link the model
 * invents from handing the visitor a file.
 */
export function MockupFrame({ html, busy, progress }: { html: string | null; busy: boolean; progress: number }) {
  return (
    <section className="relative min-h-[60vh] flex-1 bg-[#0a0a0a] lg:min-h-0">
      {busy && (
        <div
          className="absolute left-0 top-0 z-20 h-0.5 bg-[var(--accent)] transition-[width] duration-500 ease-out"
          style={{ width: `${Math.max(4, progress)}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Building your design"
        />
      )}

      {html ? (
        <iframe
          srcDoc={html}
          sandbox="allow-scripts"
          referrerPolicy="no-referrer"
          title="Your generated mockup preview"
          className="h-full min-h-[60vh] w-full border-0 bg-white lg:min-h-0"
        />
      ) : (
        <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-3 px-8 text-center">
          {busy ? (
            <>
              <Loader2 size={28} strokeWidth={1.6} className="animate-spin text-[var(--accent)]" />
              <p className="text-[14px] text-white/55">Designing your screen…</p>
              <p className="max-w-xs text-[12.5px] leading-relaxed text-white/30">
                This takes about a minute. We only build the interface — the data is made up.
              </p>
            </>
          ) : (
            <>
              <MonitorSmartphone size={30} strokeWidth={1.4} className="text-white/20" />
              <p className="text-[14px] text-white/40">Your design will appear here.</p>
            </>
          )}
        </div>
      )}
    </section>
  )
}
