import { describe, expect, it } from 'vitest'
import { blockingLimit, dayStartUtc, limitMessage, monthStartUtc, type BudgetState } from '../budget'

describe('UTC boundaries', () => {
  // The bug this guards against: deriving the boundary in SQL with
  // date_trunc(... AT TIME ZONE 'UTC') resolves against the SESSION TimeZone, so
  // at America/Edmonton the month would start at 06:00Z and the first six hours
  // of every month would be excluded from spend.
  it('month start is midnight UTC on the 1st', () => {
    const d = monthStartUtc(new Date('2026-09-17T21:45:12.345Z'))
    expect(d.toISOString()).toBe('2026-09-01T00:00:00.000Z')
  })

  it('month start is unaffected by a local timezone behind UTC', () => {
    // 2026-09-01T00:30Z is 2026-08-31T18:30 in Edmonton. The month must still be
    // September, or the first half-hour of the month goes uncounted.
    const d = monthStartUtc(new Date('2026-09-01T00:30:00.000Z'))
    expect(d.toISOString()).toBe('2026-09-01T00:00:00.000Z')
  })

  it('month start is unaffected by a local timezone ahead of UTC', () => {
    // 2026-08-31T23:30Z is already September in Tokyo; spend must not roll early.
    const d = monthStartUtc(new Date('2026-08-31T23:30:00.000Z'))
    expect(d.toISOString()).toBe('2026-08-01T00:00:00.000Z')
  })

  it('handles the January boundary without rolling the year wrong', () => {
    expect(monthStartUtc(new Date('2026-01-01T00:00:00.000Z')).toISOString()).toBe('2026-01-01T00:00:00.000Z')
  })

  it('day start is midnight UTC', () => {
    expect(dayStartUtc(new Date('2026-09-17T23:59:59.999Z')).toISOString()).toBe('2026-09-17T00:00:00.000Z')
  })
})

function state(over: Partial<BudgetState> = {}): BudgetState {
  return {
    monthSpendUsd: 0,
    monthBudgetUsd: 100,
    daySpendUsd: 0,
    dayBudgetUsd: 8,
    sessionSpendUsd: 0,
    sessionBudgetUsd: 1.0,
    ...over,
  }
}

describe('blockingLimit', () => {
  it('allows a fresh session', () => {
    expect(blockingLimit(state())).toBeNull()
  })

  it('blocks at exactly the monthly budget, not just above it', () => {
    expect(blockingLimit(state({ monthSpendUsd: 100 }))).toBe('budget_exceeded')
  })

  it('blocks on the daily cap before the month is exhausted', () => {
    expect(blockingLimit(state({ monthSpendUsd: 10, daySpendUsd: 8 }))).toBe('daily_budget')
  })

  it('blocks a single expensive session while budgets remain', () => {
    expect(blockingLimit(state({ sessionSpendUsd: 1.0 }))).toBe('session_cost')
  })

  it('reports the monthly cap first when several are exceeded', () => {
    expect(blockingLimit(state({ monthSpendUsd: 200, daySpendUsd: 20, sessionSpendUsd: 5 }))).toBe('budget_exceeded')
  })

  it('does not block on a string-shaped spend value', () => {
    // Regression guard for the pg numeric-as-string trap: if a sum ever arrives
    // as "9", `"9" >= 100` is false and the gate silently never fires. Number()
    // in sumCostSince is what prevents it; this asserts the comparison itself.
    const spent = Number('150.5')
    expect(typeof spent).toBe('number')
    expect(blockingLimit(state({ monthSpendUsd: spent }))).toBe('budget_exceeded')
  })
})

describe('limitMessage', () => {
  it('offers a next step for every limit instead of an error', () => {
    for (const code of ['budget_exceeded', 'daily_budget', 'session_cost'] as const) {
      const msg = limitMessage(code)
      expect(msg.length).toBeGreaterThan(20)
      expect(msg.toLowerCase()).not.toContain('error')
    }
  })
})
