import { discardSessionDesigns } from '@/lib/vibe/designs'
import { assertSameOrigin, badRequest, fail, forbidden, ok, serverError, vibeEnabled } from '@/lib/vibe/http'
import { requestIpHash } from '@/lib/vibe/ip'
import { MAX_TURNS_PER_SESSION } from '@/lib/vibe/limits'
import { tryWithLock } from '@/lib/vibe/mutex'
import { requireSession, resetTurnHistory } from '@/lib/vibe/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * "Start a new design": permanently discards the visitor's current document.
 *
 * No request body. The signed, IP-bound session cookie identifies the target
 * completely, and accepting a caller-supplied design id would only add a way to
 * name someone else's.
 */
export async function DELETE(req: Request) {
  if (!vibeEnabled()) return fail(503, 'The studio is not available right now.')
  if (!assertSameOrigin(req)) return forbidden('Cross-origin requests are not allowed')

  try {
    const ipHash = requestIpHash(req)
    const session = await requireSession(ipHash)
    if (!session) return badRequest('Your session has expired. Refresh the page and try again.')

    // The SAME key the chat route takes. Without it a delete can land mid-turn and
    // unlink the file that turn is about to record a row for, after which every
    // later turn dies on a missing document. tryWithLock rather than withLock: a
    // visitor mid-change should be told so, not queued behind a 4-minute LLM call.
    const outcome = await tryWithLock(`vibe:${session.id}`, async () => {
      const result = await discardSessionDesigns(session.id)
      // Designs first. If this second step fails the design is still gone, which is
      // what was asked for, and one stale conversation replays. The reverse order
      // would wipe the model's memory while leaving the document in place.
      await resetTurnHistory(session.id)
      return result
    })

    if (outcome === null) {
      return fail(409, 'A change is still running — wait for it to finish, then start a new design.', {
        code: 'busy',
      })
    }

    // turn_count is deliberately NOT reset: it is the only thing enforcing
    // MAX_TURNS_PER_SESSION, and zeroing it here would make the cap bypassable by
    // discarding on a loop. The confirmation dialog says so before the visitor commits.
    return ok({
      removed: outcome.removed,
      archived: outcome.archived,
      turnsLeft: Math.max(0, MAX_TURNS_PER_SESSION - session.turn_count),
    })
  } catch (err) {
    console.error('[vibe] design delete:', err)
    return serverError('We could not clear that design. Please try again.')
  }
}
