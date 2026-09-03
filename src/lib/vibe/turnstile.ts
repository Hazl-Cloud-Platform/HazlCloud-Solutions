/**
 * Cloudflare Turnstile verification.
 *
 * Fails CLOSED everywhere it matters: a network blip at Cloudflare must not become
 * an hour of unmetered LLM access on a public endpoint.
 */

const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
const TIMEOUT_MS = 5_000

export interface TurnstileResult {
  ok: boolean
  reason?: string
}

export function turnstileConfigured(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY)
}

/** Turnstile is required in production. In development it is skipped when unset so
 *  a contributor without keys can still run the studio. */
export function turnstileRequired(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Verifies one token. Tokens are SINGLE USE and live 300 seconds, so this must be
 * called exactly once per token; `idempotencyKey` makes a network-level retry safe
 * rather than turning it into a `timeout-or-duplicate` rejection.
 */
export async function verifyTurnstile(args: {
  token: string | null | undefined
  remoteIp?: string
  idempotencyKey: string
  expectedAction?: string
}): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    if (turnstileRequired()) return { ok: false, reason: 'not-configured' }
    return { ok: true }
  }
  if (!args.token) return { ok: false, reason: 'missing-input-response' }

  const body = new URLSearchParams({
    secret,
    response: args.token,
    idempotency_key: args.idempotencyKey,
  })
  if (args.remoteIp && args.remoteIp !== 'unknown') body.set('remoteip', args.remoteIp)

  let data: {
    success?: boolean
    hostname?: string
    action?: string
    'error-codes'?: string[]
  }
  try {
    const res = await fetch(SITEVERIFY, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    data = (await res.json()) as typeof data
  } catch {
    // Unreachable or slow: treat as failure, never as a pass.
    return { ok: false, reason: 'verification-unavailable' }
  }

  if (!data.success) return { ok: false, reason: data['error-codes']?.join(',') || 'failed' }

  // A valid token issued for someone else's site is still a valid token, so the
  // hostname has to be checked rather than assumed.
  const expectedHost = siteHostname()
  if (expectedHost && data.hostname && data.hostname !== expectedHost && data.hostname !== 'localhost') {
    return { ok: false, reason: `hostname-mismatch:${data.hostname}` }
  }
  if (args.expectedAction && data.action && data.action !== args.expectedAction) {
    return { ok: false, reason: `action-mismatch:${data.action}` }
  }

  return { ok: true }
}

function siteHostname(): string | null {
  const url = process.env.NEXT_PUBLIC_SITE_URL
  if (!url) return null
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}
