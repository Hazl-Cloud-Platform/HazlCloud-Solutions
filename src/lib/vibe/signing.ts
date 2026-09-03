import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * HMAC-signed cookie payloads, shared by the anonymous visitor session and the
 * admin session.
 *
 * Two properties matter and are easy to get wrong:
 *
 *  - `exp` lives INSIDE the signed payload. A cookie's Max-Age is a request from
 *    the server that the client is free to ignore, so expiry has to be something
 *    we verify, not something we hope for.
 *  - Purposes are domain-separated. The two cookie types are signed with
 *    different secrets AND a purpose string, so a token minted for one can never
 *    be replayed as the other.
 */

export type TokenPurpose = 'sid' | 'admin'

function b64url(buf: Buffer): string {
  return buf.toString('base64url')
}

function secretFor(purpose: TokenPurpose): string {
  const name = purpose === 'admin' ? 'VIBE_ADMIN_SESSION_SECRET' : 'VIBE_SESSION_SECRET'
  const secret = process.env[name]
  if (!secret) throw new Error(`${name} is not set`)
  return secret
}

function mac(purpose: TokenPurpose, payload: string): string {
  return b64url(createHmac('sha256', secretFor(purpose)).update(`vibe.${purpose}:${payload}`).digest())
}

export interface TokenClaims {
  /** Subject: a session uuid, or an admin email. */
  sub: string
  /** Issued-at and expiry, epoch seconds. */
  iat: number
  exp: number
  /** Admin only: invalidates every cookie at once when bumped. */
  epoch?: number
}

export function signToken(purpose: TokenPurpose, claims: TokenClaims): string {
  const payload = b64url(Buffer.from(JSON.stringify(claims), 'utf8'))
  return `${payload}.${mac(purpose, payload)}`
}

export function verifyToken(purpose: TokenPurpose, token: string | undefined | null): TokenClaims | null {
  if (!token) return null
  const dot = token.lastIndexOf('.')
  if (dot <= 0) return null

  const payload = token.slice(0, dot)
  const provided = token.slice(dot + 1)
  const expected = mac(purpose, payload)

  // timingSafeEqual THROWS on a length mismatch, which would surface as an
  // unhandled rejection rather than a clean 401, so compare lengths first.
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  let claims: TokenClaims
  try {
    claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as TokenClaims
  } catch {
    return null
  }

  if (typeof claims.sub !== 'string' || typeof claims.exp !== 'number') return null
  if (claims.exp * 1000 <= Date.now()) return null
  return claims
}

export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000)
}

/**
 * `__Host-` locks a cookie to this exact origin: it cannot be set by a sibling
 * subdomain and must be Secure with Path=/. That rules out cookie fixation from
 * anything else under hazlsolutions.com. It requires HTTPS, so plain-HTTP local
 * development falls back to the unprefixed name.
 */
export function cookieName(base: string): string {
  return secureCookies() ? `__Host-${base}` : base
}

export function secureCookies(): boolean {
  const url = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  return url.startsWith('https://') || process.env.NODE_ENV === 'production'
}
