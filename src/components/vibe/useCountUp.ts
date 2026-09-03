'use client'

import { useEffect, useRef, useState } from 'react'

/** Longer than the server's ~500ms tick so the digits keep moving between ticks
 *  instead of animating, stopping, then animating again. */
const COUNT_UP_MS = 700

/**
 * Eases a figure toward `target` so an arriving tick reads as a counter running
 * up rather than a number that jumps. A tick every 500ms is far too coarse to look
 * live on its own; interpolating between them is what sells it.
 *
 * A new target mid-flight retargets from wherever the animation currently is, so
 * successive ticks chain into one continuous climb -- and a reset to 0 runs the
 * counter back down, which is exactly the "starting over" cue.
 */
export function useCountUp(target: number): number {
  const [display, setDisplay] = useState(0)
  const fromRef = useRef(0)

  useEffect(() => {
    const from = fromRef.current
    const started = performance.now()
    const duration =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : COUNT_UP_MS

    let raf = 0
    const step = (now: number) => {
      const t = duration > 0 ? Math.min(1, (now - started) / duration) : 1
      const value = Math.round(from + (target - from) * (1 - (1 - t) ** 3)) // easeOutCubic
      fromRef.current = value
      setDisplay(value)
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target])

  return display
}
