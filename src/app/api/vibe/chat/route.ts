import { cookies } from 'next/headers'
import { checkBudget, limitMessage } from '@/lib/vibe/budget'
import { runTurn } from '@/lib/vibe/generate'
import { assertSameOrigin, badRequest, fail, forbidden, ok, vibeEnabled } from '@/lib/vibe/http'
import { clientIp, requestIpHash } from '@/lib/vibe/ip'
import {
  LIMIT_MESSAGES,
  MAX_CONCURRENT_GLOBAL,
  MAX_PROMPT_CHARS,
  MAX_TURNS_PER_IP,
  MAX_TURNS_PER_SESSION,
  TURNSTILE_RECHALLENGE_AFTER,
  claimTurn,
  createSessionIfAllowed,
  ipTurnsToday,
  releaseTurn,
} from '@/lib/vibe/limits'
import { tryWithLock, withGlobalSlot } from '@/lib/vibe/mutex'
import { markTurnstileVerified, mintSessionCookie, requireSession } from '@/lib/vibe/session'
import { verifyTurnstile } from '@/lib/vibe/turnstile'
import type { VibeEvent } from '@/types/vibe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
/** Vercel-only hint; on `next start` the real bound is nginx's proxy_read_timeout
 *  plus the AbortSignal below. */
export const maxDuration = 300

const TURN_DEADLINE_MS = 240_000
/** SSE keepalive. Turn 1 can spend tens of seconds thinking before the first
 *  token, and intermediaries (Cloudflare's origin read timeout is 100s measured
 *  BETWEEN BYTES) will cut an idle connection. readSse ignores frames with no
 *  `data:` line, so a comment frame costs nothing on the client. */
const KEEPALIVE_MS = 15_000

export async function POST(req: Request) {
  if (!vibeEnabled()) return fail(503, 'The studio is not available right now.')
  if (!assertSameOrigin(req)) return forbidden('Cross-origin requests are not allowed')

  const body = (await req.json().catch(() => null)) as { message?: unknown; turnstileToken?: unknown } | null
  const message = typeof body?.message === 'string' ? body.message.trim() : ''
  const turnstileToken = typeof body?.turnstileToken === 'string' ? body.turnstileToken : null

  if (!message) return badRequest('Describe what you want to build.')
  if (message.length > MAX_PROMPT_CHARS) {
    return badRequest(`Keep it under ${MAX_PROMPT_CHARS} characters — a sentence or two works best.`)
  }

  const ip = clientIp(req)
  const ipHash = requestIpHash(req)

  let session = await requireSession(ipHash)
  let setCookie: ReturnType<typeof mintSessionCookie> | null = null

  // Turnstile gates the first generation of a session and is re-challenged part
  // way through: gating only the very first turn leaves the expensive turns
  // unguarded behind a challenge that costs a bot fractions of a cent.
  const needsTurnstile = !session || session.turn_count >= TURNSTILE_RECHALLENGE_AFTER
  if (needsTurnstile) {
    const verdict = await verifyTurnstile({
      token: turnstileToken,
      remoteIp: ip,
      idempotencyKey: crypto.randomUUID(),
      expectedAction: 'vibe_generate',
    })
    if (!verdict.ok) {
      return fail(403, "We could not verify that you're human. Refresh the page and try again.", {
        code: 'turnstile',
        reason: verdict.reason,
      })
    }
  }

  if (!session) {
    const created = await createSessionIfAllowed({
      ipHash,
      userAgent: req.headers.get('user-agent'),
      referrer: req.headers.get('referer'),
    })
    if (!created.ok) return fail(429, LIMIT_MESSAGES[created.kind], { code: 'ip_cap' })
    setCookie = mintSessionCookie(created.sessionId)
    session = await requireSession(ipHash)
    if (!session) return fail(500, 'Could not start a session.')
    await markTurnstileVerified(session.id)
  } else if (needsTurnstile) {
    await markTurnstileVerified(session.id)
  }

  const sessionId = session.id

  if (session.turn_count >= MAX_TURNS_PER_SESSION) {
    return fail(429, LIMIT_MESSAGES.turn_cap, { code: 'turn_cap' })
  }
  if ((await ipTurnsToday(ipHash)) >= MAX_TURNS_PER_IP) {
    return fail(429, LIMIT_MESSAGES.ip_turns, { code: 'ip_cap' })
  }

  // Pre-flight spend check, before a turn is claimed, so a refused request never
  // costs the visitor one of their five.
  const { block } = await checkBudget(sessionId)
  if (block) return fail(429, limitMessage(block), { code: block })

  if (setCookie) {
    cookies().set(setCookie.name, setCookie.value, setCookie.options)
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false
      const write = (chunk: string) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(chunk))
        } catch {
          closed = true
        }
      }
      const emit = (e: VibeEvent) => write(`event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`)
      const keepalive = setInterval(() => write(': keepalive\n\n'), KEEPALIVE_MS)

      const deadline = AbortSignal.timeout(TURN_DEADLINE_MS)
      const signal = AbortSignal.any([req.signal, deadline])

      let turnsLeft = 0
      let changed = false
      let claimed = false

      try {
        // Session lock FIRST, then the global semaphore. The other order lets one
        // visitor's rapid submits eat every permit while they queue behind their
        // own lock, returning "busy" to everyone else. tryWithLock rejects a
        // double-submit outright rather than queueing a duplicate that would run
        // later and spend budget twice.
        const outcome = await tryWithLock(`vibe:${sessionId}`, async () =>
          withGlobalSlot(MAX_CONCURRENT_GLOBAL, async () => {
            const claim = await claimTurn(sessionId)
            if (!claim.ok) {
              emit({ type: 'error', code: 'turn_cap', message: LIMIT_MESSAGES.turn_cap })
              return { ran: false as const }
            }
            claimed = true
            turnsLeft = claim.turnsLeft
            emit({ type: 'accepted', sessionId, turnIndex: claim.turnIndex, turnsLeft: claim.turnsLeft })

            const result = await runTurn({
              sessionId,
              ipHash,
              turnIndex: claim.turnIndex,
              userMessage: message,
              signal,
              emit,
            })
            // The model never produced anything, so do not charge a turn for it.
            if (!result.changed) {
              await releaseTurn(sessionId).catch(() => {})
              turnsLeft = claim.turnsLeft + 1
            }
            return { ran: true as const, changed: result.changed }
          }),
        )

        if (outcome === null) {
          emit({ type: 'error', code: 'busy', message: 'You already have a change in progress — hang tight.' })
        } else if (outcome === undefined) {
          emit({ type: 'error', code: 'busy', message: 'The studio is busy right now. Try again in a few seconds.' })
        } else if (outcome.ran) {
          changed = outcome.changed
        }
      } catch (err) {
        if (claimed) await releaseTurn(sessionId).catch(() => {})
        const aborted = err instanceof Error && (err.name === 'AbortError' || err.name === 'TimeoutError')
        console.error('[vibe] chat turn failed:', err)
        emit({
          type: 'error',
          code: aborted ? 'internal' : 'internal',
          message: aborted
            ? 'That took longer than expected and was stopped. Please try again.'
            : 'Something went wrong building that. Please try again.',
        })
      } finally {
        clearInterval(keepalive)
        emit({ type: 'done', turnsLeft, changed })
        closed = true
        try {
          controller.close()
        } catch {
          // already closed by the client
        }
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      // nginx buffers proxied responses by default, which would hold the whole
      // stream until the end and make every turn look frozen.
      'X-Accel-Buffering': 'no',
    },
  })
}
