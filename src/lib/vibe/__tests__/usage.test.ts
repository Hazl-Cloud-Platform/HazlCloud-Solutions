import { describe, expect, it } from 'vitest'
import { computeCostUsd, normalizeUsage } from '../usage'
import { DEFAULT_PRICING } from '../settings'
import type { NormalizedUsage } from '@/types/vibe'

const zero: NormalizedUsage = {
  input_tokens: 0,
  output_tokens: 0,
  cache_creation_tokens: 0,
  cache_read_tokens: 0,
}

describe('computeCostUsd', () => {
  // Hand-computed against the verified Opus 4.8 card: $5 / $25 / $6.25 / $0.50
  // per MTok. If a rate is ever mistyped in DEFAULT_PRICING these fail loudly.
  it('prices one million input tokens at $5', () => {
    expect(computeCostUsd({ ...zero, input_tokens: 1_000_000 }, DEFAULT_PRICING)).toBe(5)
  })

  it('prices one million output tokens at $25', () => {
    expect(computeCostUsd({ ...zero, output_tokens: 1_000_000 }, DEFAULT_PRICING)).toBe(25)
  })

  it('prices cache writes at 1.25x input and cache reads at 0.1x', () => {
    expect(computeCostUsd({ ...zero, cache_creation_tokens: 1_000_000 }, DEFAULT_PRICING)).toBe(6.25)
    expect(computeCostUsd({ ...zero, cache_read_tokens: 1_000_000 }, DEFAULT_PRICING)).toBe(0.5)
  })

  it('sums all four buckets', () => {
    // A realistic edit turn: mostly cached input, a small patch out.
    const cost = computeCostUsd(
      { input_tokens: 7_500, output_tokens: 800, cache_creation_tokens: 0, cache_read_tokens: 1_500 },
      DEFAULT_PRICING,
    )
    // 7500*5 + 800*25 + 1500*0.5 = 37500 + 20000 + 750 = 58250 per 1e6 = $0.05825
    expect(cost).toBeCloseTo(0.05825, 6)
  })

  it('never returns a negative or NaN cost for empty usage', () => {
    expect(computeCostUsd(zero, DEFAULT_PRICING)).toBe(0)
  })

  it('rounds to six decimal places so numeric(12,6) never truncates silently', () => {
    const cost = computeCostUsd({ ...zero, output_tokens: 1 }, DEFAULT_PRICING)
    expect(cost).toBe(0.000025)
    expect(String(cost).split('.')[1]?.length ?? 0).toBeLessThanOrEqual(6)
  })
})

describe('normalizeUsage', () => {
  it('defaults every missing counter to 0 rather than undefined', () => {
    // A gateway that omits the cache fields would otherwise produce NaN costs.
    const u = normalizeUsage({ input_tokens: 10, output_tokens: 5 } as never)
    expect(u).toEqual({
      input_tokens: 10,
      output_tokens: 5,
      cache_creation_tokens: 0,
      cache_read_tokens: 0,
    })
    expect(computeCostUsd(u, DEFAULT_PRICING)).not.toBeNaN()
  })
})
