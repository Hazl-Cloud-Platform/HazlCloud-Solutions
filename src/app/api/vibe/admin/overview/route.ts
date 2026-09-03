import { currentAdmin } from '@/lib/vibe/adminAuth'
import { adminOverview, fallbackRate } from '@/lib/vibe/adminQueries'
import { ok, serverError, unauthorized } from '@/lib/vibe/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await currentAdmin())) return unauthorized()
  try {
    const [overview, fallback] = await Promise.all([adminOverview(), fallbackRate()])
    return ok({ overview, fallback })
  } catch (err) {
    console.error('[vibe] admin overview:', err)
    return serverError()
  }
}
