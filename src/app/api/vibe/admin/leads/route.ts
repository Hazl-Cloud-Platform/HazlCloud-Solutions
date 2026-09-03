import { currentAdmin } from '@/lib/vibe/adminAuth'
import { listLeads } from '@/lib/vibe/adminQueries'
import { ok, serverError, unauthorized } from '@/lib/vibe/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  if (!(await currentAdmin())) return unauthorized()
  try {
    const params = new URL(req.url).searchParams
    const limit = Math.min(100, Math.max(1, Number(params.get('limit')) || 50))
    const offset = Math.max(0, Number(params.get('offset')) || 0)
    return ok({ leads: await listLeads(limit, offset) })
  } catch (err) {
    console.error('[vibe] admin leads:', err)
    return serverError()
  }
}
