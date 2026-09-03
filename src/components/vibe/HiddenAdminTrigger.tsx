'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const CLICKS_REQUIRED = 7
const WINDOW_MS = 3_000
const MAX_GAP_MS = 800

/**
 * The way in to the admin console.
 *
 * It is DISCOVERY, not security -- /vibe/admin/login is reachable by typing the
 * URL, and the password is what actually protects it. This just keeps the link
 * off a public marketing surface.
 *
 * aria-hidden and tabIndex -1 so it is invisible to screen readers and to tab
 * order rather than being an unlabelled control people stumble into.
 */
export function HiddenAdminTrigger() {
  const router = useRouter()
  const clicks = useRef<number[]>([])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.altKey && e.key.toLowerCase() === 'h') {
        e.preventDefault()
        router.push('/vibe/admin/login')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [router])

  const onClick = () => {
    const now = Date.now()
    const prev = clicks.current
    // Reset on any pause, so ordinary stray clicks never accumulate into a hit.
    if (prev.length && now - prev[prev.length - 1] > MAX_GAP_MS) prev.length = 0
    prev.push(now)
    while (prev.length && now - prev[0] > WINDOW_MS) prev.shift()
    if (prev.length >= CLICKS_REQUIRED) {
      prev.length = 0
      router.push('/vibe/admin/login')
    }
  }

  return (
    <span
      aria-hidden="true"
      tabIndex={-1}
      onClick={onClick}
      className="inline-block h-1.5 w-1.5 rounded-full bg-white/20"
    />
  )
}
