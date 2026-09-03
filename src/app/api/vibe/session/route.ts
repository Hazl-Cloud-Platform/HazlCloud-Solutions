import { cookies } from 'next/headers'
import { requestIpHash } from '@/lib/vibe/ip'
import { latestDesign } from '@/lib/vibe/designs'
import { readDesign } from '@/lib/vibe/storage'
import { MAX_TURNS_PER_SESSION, TURNSTILE_RECHALLENGE_AFTER } from '@/lib/vibe/limits'
import { requireSession } from '@/lib/vibe/session'
import { ok, serverError, vibeEnabled } from '@/lib/vibe/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Rehydrates the studio after a reload: the current document, how many turns are
 *  left, and whether Turnstile needs solving again. */
export async function GET(req: Request) {
  if (!vibeEnabled()) return ok({ enabled: false })

  try {
    const ipHash = requestIpHash(req)
    const session = await requireSession(ipHash)
    if (!session) {
      return ok({ enabled: true, session: null, turnsLeft: MAX_TURNS_PER_SESSION, needsTurnstile: true })
    }

    const design = await latestDesign(session.id)
    let html: string | null = null
    let missing = false
    if (design) {
      try {
        html = await readDesign(design.file_path)
      } catch {
        // The row exists but the file is gone. Say so plainly rather than
        // rendering an empty frame the visitor cannot explain.
        missing = true
      }
    }

    return ok({
      enabled: true,
      session: { id: session.id, turnCount: session.turn_count },
      turnsLeft: Math.max(0, MAX_TURNS_PER_SESSION - session.turn_count),
      needsTurnstile: session.turn_count >= TURNSTILE_RECHALLENGE_AFTER,
      design: design ? { id: design.id, title: design.title, bytes: design.bytes, missing } : null,
      html,
    })
  } catch (err) {
    console.error('[vibe] session route:', err)
    return serverError()
  }
}
