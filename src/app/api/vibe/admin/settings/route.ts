import { currentAdmin } from '@/lib/vibe/adminAuth'
import { assertSameOrigin, badRequest, forbidden, ok, serverError, unauthorized } from '@/lib/vibe/http'
import {
  bumpAdminSessionEpoch,
  getDailyBudgetUsd,
  getMonthlyBudgetUsd,
  getPricing,
  setSetting,
  validateBudget,
  validatePricing,
} from '@/lib/vibe/settings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await currentAdmin())) return unauthorized()
  try {
    const [monthlyBudgetUsd, dailyBudgetUsd, pricing] = await Promise.all([
      getMonthlyBudgetUsd(),
      getDailyBudgetUsd(),
      getPricing(),
    ])
    return ok({ monthlyBudgetUsd, dailyBudgetUsd, pricing })
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
      pricing?: unknown
      signOutAll?: unknown
    } | null
    if (!body) return badRequest('Nothing to update')

    if (body.signOutAll === true) {
      const epoch = await bumpAdminSessionEpoch()
      return ok({ signedOutAll: true, epoch })
    }

    // Range-checked server-side: a typo like 500 instead of 5 would mis-price
    // every later call by 100x and trip the budget gate into a lockout that would
    // look like an outage.
    if (body.monthlyBudgetUsd !== undefined) {
      const v = validateBudget(body.monthlyBudgetUsd, 'Monthly budget', 5_000)
      if (!v.ok) return badRequest(v.error)
      await setSetting('monthly_budget_usd', String(v.value))
    }
    if (body.dailyBudgetUsd !== undefined) {
      const v = validateBudget(body.dailyBudgetUsd, 'Daily budget', 1_000)
      if (!v.ok) return badRequest(v.error)
      await setSetting('daily_budget_usd', String(v.value))
    }
    if (body.pricing !== undefined) {
      const v = validatePricing(body.pricing)
      if (!v.ok) return badRequest(v.error)
      await setSetting('pricing', JSON.stringify(v.value))
    }

    return ok({})
  } catch (err) {
    console.error('[vibe] admin settings put:', err)
    return serverError()
  }
}
