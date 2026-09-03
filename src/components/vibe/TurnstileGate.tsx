'use client'

import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'

export interface TurnstileHandle {
  /** Resolves the current token, waiting briefly if the widget is still solving. */
  getToken: () => Promise<string | null>
  reset: () => void
}

/**
 * Invisible bot check in front of the generate endpoint.
 *
 * Tokens are SINGLE USE with a 300-second lifetime, so the widget is reset after
 * every submit -- reusing one returns `timeout-or-duplicate` and the visitor would
 * see a mysterious failure on their second prompt.
 *
 * Cloudflare publishes no official React integration and explicitly endorses this
 * package, so it is used rather than hand-rolling explicit render, the React 18
 * StrictMode double-effect guard, and unmount cleanup.
 */
export const TurnstileGate = forwardRef<TurnstileHandle, { siteKey: string | null }>(function TurnstileGate(
  { siteKey },
  ref,
) {
  const widget = useRef<TurnstileInstance>(null)
  const [token, setToken] = useState<string | null>(null)

  useImperativeHandle(ref, () => ({
    async getToken() {
      if (!siteKey) return null
      if (token) return token
      // The widget may still be solving on a fast first submit.
      for (let i = 0; i < 30; i++) {
        const t = widget.current?.getResponse()
        if (t) return t
        await new Promise((r) => setTimeout(r, 100))
      }
      return null
    },
    reset() {
      setToken(null)
      widget.current?.reset()
    },
  }))

  if (!siteKey) return null

  return (
    <div className="mt-2">
      <Turnstile
        ref={widget}
        siteKey={siteKey}
        onSuccess={setToken}
        onError={() => setToken(null)}
        onExpire={() => setToken(null)}
        options={{ size: 'invisible', action: 'vibe_generate', theme: 'dark' }}
      />
    </div>
  )
})
