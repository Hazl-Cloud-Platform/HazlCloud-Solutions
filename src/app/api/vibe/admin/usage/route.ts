import { currentAdmin } from '@/lib/vibe/adminAuth'
import { usageByDay } from '@/lib/vibe/adminQueries'
import { ok, serverError, unauthorized } from '@/lib/vibe/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  if (!(await currentAdmin())) return unauthorized()
  try {
    const raw = Number(new URL(req.url).searchParams.get('days'))
    const days = [30, 90, 365].includes(raw) ? raw : 30
    return ok({ days, rows: await usageByDay(days) })
  } catch (err) {
    console.error('[vibe] admin usage:', err)
    return serverError()
  }
}
