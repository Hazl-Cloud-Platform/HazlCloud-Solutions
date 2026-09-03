import { NextResponse } from 'next/server'

/**
 * Shared helpers for the /api/vibe/* route handlers, following the envelope this
 * repo already uses in src/app/api/revalidate/route.ts: `{ ok, error? }`, a named
 * method export, and an env guard that fails before doing any work.
 */

export function ok<T extends Record<string, unknown>>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, ...data }, init)
}

export function fail(status: number, error: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, error, ...extra }, { status })
}

export const badRequest = (error: string) => fail(400, error)
export const unauthorized = (error = 'Not signed in') => fail(401, error)
export const forbidden = (error = 'Forbidden') => fail(403, error)
export const notFound = (error = 'Not found') => fail(404, error)
export const tooMany = (error: string) => fail(429, error)
export const serverError = (error = 'Something went wrong') => fail(500, error)

/** The studio is off until the VM deployment is live: it needs a persistent
 *  filesystem, and generation runs far past a serverless function's ceiling. */
export function vibeEnabled(): boolean {
  return process.env.VIBE_ENABLED === '1'
}

export function siteOrigin(): string | null {
  const url = process.env.NEXT_PUBLIC_SITE_URL
  if (!url) return null
  try {
    return new URL(url).origin
  } catch {
    return null
  }
}

/**
 * Rejects cross-origin mutating requests.
 *
 * Compares parsed ORIGINS for exact equality rather than doing a prefix test --
 * `https://hazlsolutions.com.evil.tld` passes a startsWith() check.
 *
 * Applied to the public generate/lead routes too, not just the admin: without it,
 * any third-party page could drive our LLM from its own visitors' browsers, which
 * are real distinct IPs and so defeat every per-IP cap while spending our budget.
 */
export function assertSameOrigin(req: Request): boolean {
  const expected = siteOrigin()
  if (!expected) return true // unconfigured (local dev): nothing to compare against

  const origin = req.headers.get('origin')
  if (origin) {
    try {
      return new URL(origin).origin === expected
    } catch {
      return false
    }
  }

  // No Origin header on a mutating request: allow only same-origin Referer, so a
  // plain cross-site form post cannot slip through.
  const referer = req.headers.get('referer')
  if (referer) {
    try {
      return new URL(referer).origin === expected
    } catch {
      return false
    }
  }
  return false
}

export function clientRequestId(): string {
  return crypto.randomUUID()
}
