import { currentAdmin } from '@/lib/vibe/adminAuth'
import { assertSameOrigin, forbidden, ok, serverError, unauthorized } from '@/lib/vibe/http'
import { deleteLead, markContacted } from '@/lib/vibe/leads'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Params = { params: { leadId: string } }

export async function PATCH(req: Request, { params }: Params) {
  if (!(await currentAdmin())) return unauthorized()
  if (!assertSameOrigin(req)) return forbidden('Cross-origin requests are not allowed')
  try {
    const body = (await req.json().catch(() => null)) as { contacted?: unknown } | null
    await markContacted(params.leadId, body?.contacted === true)
    return ok({})
  } catch (err) {
    console.error('[vibe] admin lead patch:', err)
    return serverError()
  }
}

export async function DELETE(req: Request, { params }: Params) {
  if (!(await currentAdmin())) return unauthorized()
  if (!assertSameOrigin(req)) return forbidden('Cross-origin requests are not allowed')
  try {
    await deleteLead(params.leadId)
    return ok({})
  } catch (err) {
    console.error('[vibe] admin lead delete:', err)
    return serverError()
  }
}
