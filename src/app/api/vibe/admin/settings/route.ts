import { currentAdmin } from '@/lib/vibe/adminAuth'
import { assertSameOrigin, badRequest, forbidden, ok, serverError, unauthorized } from '@/lib/vibe/http'
import {
  bumpAdminSessionEpoch,
  getDailyBudgetUsd,
  getMaxTurnsPerSession,
  getMonthlyBudgetUsd,
  getPricing,
  setSetting,
  validateBudget,
  validateMaxTurnsPerSession,
  validatePricing,
} from '@/lib/vibe/settings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await currentAdmin())) return unauthorized()
  try {
    const [monthlyBudgetUsd, dailyBudgetUsd, pricing, maxTurnsPerSession] = await Promise.all([
      getMonthlyBudgetUsd(),
      getDailyBudgetUsd(),
      getPricing(),
      getMaxTurnsPerSession(),
    ])
    return ok({ monthlyBudgetUsd, dailyBudgetUsd, pricing, maxTurnsPerSession })
  } catch (err) {
    console.error('[vibe] admin settings get:', err)
    return serverError()
  }
}

export async function PUT(req: Request) {
  if (!(await currentAdmin())) return unauthorized()
  if (!assertSameOrigin(req)) return forbidden('Cross-origin requests are not allowed')
  try {
    const body = (await req.json().catch(() => null)) as {
      monthlyBudgetUsd?: unknown
      dailyBudgetUsd?: unknown
      maxTurnsPerSession?: unknown
      pricing?: unknown
      signOutAll?: unknown
    } | null
    if (!body) return badRequest('Nothing to update')

    if (body.signOutAll === true) {
      const epoch = await bumpAdminSessionEpoch()
      return ok({ signedOutAll: true, epoch })
    }

    // EVERY field is validated before ANY of them is written. The console saves
    // the budgets and the change allowance with one button, and validate-then-write
    // interleaved would half-apply the form: an out-of-range allowance -- which is
    // an easy mistake, the field is a tight 1..20 with no <form> to enforce it --
    // would return 400 with the budgets already moved, and the toast would tell the
    // admin nothing had saved.
    //
    // Range-checked server-side: a typo like 500 instead of 5 would mis-price
    // every later call by 100x and trip the budget gate into a lockout that would
    // look like an outage.
    const writes: [key: string, value: string][] = []

    if (body.monthlyBudgetUsd !== undefined) {
      const v = validateBudget(body.monthlyBudgetUsd, 'Monthly budget', 5_000)
      if (!v.ok) return badRequest(v.error)
      writes.push(['monthly_budget_usd', String(v.value)])
    }
    if (body.dailyBudgetUsd !== undefined) {
      const v = validateBudget(body.dailyBudgetUsd, 'Daily budget', 1_000)
      if (!v.ok) return badRequest(v.error)
      writes.push(['daily_budget_usd', String(v.value)])
    }
    // Applies to sessions in flight as well as new ones: a visitor mid-session
    // gains or loses changes the moment this is saved, which is the behaviour the
    // admin expects from a live limit. Lowering it below a session's spent count
    // simply leaves that session with none.
    if (body.maxTurnsPerSession !== undefined) {
      const v = validateMaxTurnsPerSession(body.maxTurnsPerSession)
      if (!v.ok) return badRequest(v.error)
      writes.push(['max_turns_per_session', String(v.value)])
    }
    if (body.pricing !== undefined) {
      const v = validatePricing(body.pricing)
      if (!v.ok) return badRequest(v.error)
      writes.push(['pricing', JSON.stringify(v.value)])
    }

    // Sequential, not concurrent: these are four independent upserts and the
    // failure mode worth avoiding was validation, not write contention.
    for (const [key, value] of writes) await setSetting(key, value)

    return ok({ saved: writes.map(([key]) => key) })
  } catch (err) {
    console.error('[vibe] admin settings put:', err)
    return serverError()
  }
}
