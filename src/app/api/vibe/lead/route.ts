import { latestDesign } from '@/lib/vibe/designs'
import { assertSameOrigin, badRequest, fail, forbidden, ok, serverError, vibeEnabled } from '@/lib/vibe/http'
import { requestIpHash } from '@/lib/vibe/ip'
import { LIMIT_MESSAGES, MAX_LEADS_PER_IP, ipLeadsToday } from '@/lib/vibe/limits'
import { createLead, normalizeEmail } from '@/lib/vibe/leads'
import { requireSession } from '@/lib/vibe/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** "Contact our team": the conversion step the whole studio exists to reach. */
export async function POST(req: Request) {
  if (!vibeEnabled()) return fail(503, 'The studio is not available right now.')
  if (!assertSameOrigin(req)) return forbidden('Cross-origin requests are not allowed')

  try {
    const body = (await req.json().catch(() => null)) as { email?: unknown; note?: unknown } | null
    const email = typeof body?.email === 'string' ? normalizeEmail(body.email) : null
    if (!email) return badRequest('That email address does not look right.')

    const note = typeof body?.note === 'string' ? body.note.trim().slice(0, 2_000) : null

    const ipHash = requestIpHash(req)
    const session = await requireSession(ipHash)
    if (!session) return badRequest('Your session has expired. Refresh the page and try again.')

    if ((await ipLeadsToday(ipHash)) >= MAX_LEADS_PER_IP) {
      return fail(429, LIMIT_MESSAGES.ip_leads, { code: 'ip_cap' })
    }

    // Snapshot whichever design is current, so the team sees exactly what the
    // visitor was looking at when they asked for help.
    const design = await latestDesign(session.id)
    const lead = await createLead({
      sessionId: session.id,
      designId: design?.id ?? null,
      email,
      note,
      ipHash,
    })

    return ok({ leadId: lead.id })
  } catch (err) {
    console.error('[vibe] lead route:', err)
    return serverError('We could not save that. Please try again.')
  }
}
