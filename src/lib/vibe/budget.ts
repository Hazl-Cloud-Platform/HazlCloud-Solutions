import { T, queryOne } from './db'
import { getDailyBudgetUsd, getMonthlyBudgetUsd } from './settings'

/**
 * Spend gates. The studio is anonymous and public, so these are the only thing
 * standing between a bad day and an unbounded LLM bill.
 */

/**
 * Hard ceiling on one visitor's whole session, independent of the turn cap.
 *
 * Sized from MEASURED costs against the live gateway, not an estimate:
 *   first generation      ~$0.15-0.17  (5.2k-6.2k output tokens)
 *   surgical edit          ~$0.04      (169 output tokens)
 *   broad restyle          ~$0.19      (the model rewrites, correctly)
 *   failed edit + fallback ~$0.43      (two calls; the case worth avoiding)
 *
 * A legitimate five-turn session therefore lands around $0.45-0.70, so this is a
 * ceiling on abuse rather than a limit a real visitor should ever meet.
 */
export const MAX_SESSION_COST_USD = 1.0

/**
 * Start of the current calendar month, in UTC.
 *
 * Computed in JS and bound as a parameter, NOT as
 * `date_trunc('month', now() AT TIME ZONE 'UTC')`. That SQL looks right and is
 * not: `now() AT TIME ZONE 'UTC'` yields a bare `timestamp`, and comparing it
 * against a `timestamptz` column coerces it back using the SESSION's TimeZone
 * setting -- which, on a shared Supabase instance behind a transaction pooler, is
 * not ours to rely on. At America/Edmonton the boundary would land at 06:00Z and
 * every usage row from the month's first six hours would be excluded from spend,
 * silently, for the whole month.
 */
export function monthStartUtc(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
}

/** Start of the current UTC day, same reasoning as above. */
export function dayStartUtc(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

async function sumCostSince(since: Date): Promise<number> {
  const row = await queryOne<{ spent: number | string }>(
    `SELECT COALESCE(sum("cost_usd"), 0) AS spent FROM ${T.usage} WHERE "created_at" >= $1`,
    [since],
  )
  // Number() even though db.ts installs a numeric parser: that parser is global to
  // the pg module and a future dependency could reset it, at which point
  // `"9" >= 100` would be false and this gate would silently never fire.
  return Number(row?.spent ?? 0)
}

export async function getMonthSpendUsd(): Promise<number> {
  return sumCostSince(monthStartUtc())
}

export async function getDaySpendUsd(): Promise<number> {
  return sumCostSince(dayStartUtc())
}

export async function getSessionSpendUsd(sessionId: string): Promise<number> {
  const row = await queryOne<{ spent: number | string }>(
    `SELECT COALESCE(sum("cost_usd"), 0) AS spent FROM ${T.usage} WHERE "session_id" = $1`,
    [sessionId],
  )
  return Number(row?.spent ?? 0)
}

export interface BudgetState {
  monthSpendUsd: number
  monthBudgetUsd: number
  daySpendUsd: number
  dayBudgetUsd: number
  sessionSpendUsd: number
  sessionBudgetUsd: number
}

export type BudgetBlock = 'budget_exceeded' | 'daily_budget' | 'session_cost' | null

export async function getBudgetState(sessionId: string | null): Promise<BudgetState> {
  const [monthBudgetUsd, dayBudgetUsd, monthSpendUsd, daySpendUsd, sessionSpendUsd] = await Promise.all([
    getMonthlyBudgetUsd(),
    getDailyBudgetUsd(),
    getMonthSpendUsd(),
    getDaySpendUsd(),
    sessionId ? getSessionSpendUsd(sessionId) : Promise.resolve(0),
  ])
  return {
    monthSpendUsd,
    monthBudgetUsd,
    daySpendUsd,
    dayBudgetUsd,
    sessionSpendUsd,
    sessionBudgetUsd: MAX_SESSION_COST_USD,
  }
}

export function blockingLimit(state: BudgetState): BudgetBlock {
  if (state.monthSpendUsd >= state.monthBudgetUsd) return 'budget_exceeded'
  if (state.daySpendUsd >= state.dayBudgetUsd) return 'daily_budget'
  if (state.sessionSpendUsd >= state.sessionBudgetUsd) return 'session_cost'
  return null
}

/**
 * Visitor-facing copy. A person who hits a spend ceiling did nothing wrong and is
 * on the primary conversion page, so every one of these ends in an invitation
 * rather than an error.
 */
export function limitMessage(block: NonNullable<BudgetBlock>): string {
  switch (block) {
    case 'budget_exceeded':
      return "Our free studio has hit its limit for this month. Book a call and we'll build your idea with you instead."
    case 'daily_budget':
      return "The studio is at capacity for today — it resets tomorrow. If you'd rather not wait, book a call and we'll pick it up with you."
    case 'session_cost':
      return "You've had a good run with this design. Send it to our team and a real person will take it from here."
  }
}

/**
 * Re-checked before EVERY API call, not just at the start of a turn, so two
 * visitors generating at once cannot each sail past the ceiling.
 *
 * Honest bound: this caps the START of a call, so the true ceiling is the budget
 * plus whatever is already in flight (at most MAX_CONCURRENT_GLOBAL calls).
 */
export async function checkBudget(sessionId: string | null): Promise<{ block: BudgetBlock; state: BudgetState }> {
  const state = await getBudgetState(sessionId)
  return { block: blockingLimit(state), state }
}
