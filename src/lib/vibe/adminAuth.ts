import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { cookies } from 'next/headers'
import { T, query, queryOne } from './db'
import { getAdminSessionEpoch } from './settings'
import { cookieName, nowSeconds, secureCookies, signToken, verifyToken } from './signing'

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
  opts: { N: number; r: number; p: number },
) => Promise<Buffer>

/**
 * Admin authentication.
 *
 * scrypt from node:crypto rather than bcrypt/argon2: no native dependency, and it
 * is memory-hard. N=16384, r=8, p=1 is 128*N*r = 16 MiB, which sits under Node's
 * 32 MiB `maxmem` default -- raising N past this REQUIRES passing maxmem too or it
 * throws.
 *
 * Always the async form. scryptSync would block the event loop for ~80ms per
 * login, stalling every in-flight SSE generation on the box.
 */
const SCRYPT = { N: 16_384, r: 8, p: 1 }
const KEYLEN = 64

export const ADMIN_COOKIE = 'hazl_vibe_admin'
const ADMIN_TTL_SECONDS = 8 * 60 * 60

/** Failed logins allowed per IP before the endpoint stops doing scrypt work. */
const MAX_FAILURES = 5
/** Across ALL IPs. The per-IP counter is only as good as the IP, so this is the
 *  backstop against a distributed guess -- and, more importantly, against
 *  unbounded 16 MiB scrypt work on the same box that serves generations. */
const MAX_GLOBAL_FAILURES = 50
const FAILURE_WINDOW = "15 minutes"
/** Longest address RFC 5321 permits. Without a cap, an attacker writes megabytes
 *  per attempt into a table nothing prunes. */
const MAX_EMAIL_CHARS = 254

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const dk = await scryptAsync(password.normalize('NFKC'), salt, KEYLEN, SCRYPT)
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64')}$${dk.toString('base64')}`
}

/** Smallest values we will accept from a stored hash. Guards against a truncated
 *  or hand-edited VIBE_ADMIN_PASSWORD_HASH turning into an accept-anything rule. */
const MIN_SALT_BYTES = 8
const MIN_KEY_BYTES = 16

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, N, r, p, saltB64, hashB64] = stored.split('$')
  if (scheme !== 'scrypt') return false
  try {
    const salt = Buffer.from(saltB64 ?? '', 'base64')
    const expected = Buffer.from(hashB64 ?? '', 'base64')

    // Without this, a stored value of `scrypt$16384$8$1$$` parses to two EMPTY
    // buffers, scrypt is asked for a zero-length key, and timingSafeEqual()
    // returns true for two empty buffers -- so every password would be accepted.
    if (salt.length < MIN_SALT_BYTES || expected.length < MIN_KEY_BYTES) return false

    const nNum = Number(N)
    const rNum = Number(r)
    const pNum = Number(p)
    if (!Number.isInteger(nNum) || !Number.isInteger(rNum) || !Number.isInteger(pNum)) return false
    // A stored N large enough to exceed maxmem would throw rather than fail.
    if (128 * nNum * rNum >= 32 * 1024 * 1024) return false

    const actual = await scryptAsync(password.normalize('NFKC'), salt, expected.length, {
      N: nNum,
      r: rNum,
      p: pNum,
    })
    // Length check first: timingSafeEqual THROWS on a mismatch, which would be an
    // unhandled rejection rather than a clean failure.
    return actual.length === expected.length && timingSafeEqual(actual, expected)
  } catch {
    return false
  }
}

/**
 * A fixed hash to verify against when the email is not an admin, so a wrong email
 * and a wrong password take the same wall-clock time and the endpoint does not
 * leak which addresses exist.
 */
let dummyHashPromise: Promise<string> | null = null
function dummyHash(): Promise<string> {
  dummyHashPromise ??= hashPassword(randomBytes(24).toString('hex'))
  return dummyHashPromise
}

export function adminEmails(): string[] {
  return (process.env.VIBE_ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminEmail(email: string): boolean {
  return adminEmails().includes(email.trim().toLowerCase())
}

export type LoginResult =
  | { ok: true; email: string; cookie: { name: string; value: string; options: Record<string, unknown> } }
  | { ok: false; status: 401 | 429 | 500; error: string }

export async function attemptLogin(args: { email: string; password: string; ipHash: string }): Promise<LoginResult> {
  const stored = process.env.VIBE_ADMIN_PASSWORD_HASH
  if (!stored) return { ok: false, status: 500, error: 'Admin access is not configured.' }

  // Counted BEFORE any scrypt work, so a flood of guesses cannot also be a
  // CPU-exhaustion attack against the box serving generations.
  const recent = await queryOne<{ mine: number; everyone: number }>(
    `SELECT count(*) FILTER (WHERE "ip_hash" = $1)::int AS mine,
            count(*)::int                               AS everyone
       FROM ${T.logins}
      WHERE "ok" = false AND "created_at" > now() - interval '${FAILURE_WINDOW}'`,
    [args.ipHash],
  )
  if (Number(recent?.mine ?? 0) >= MAX_FAILURES || Number(recent?.everyone ?? 0) >= MAX_GLOBAL_FAILURES) {
    return { ok: false, status: 429, error: 'Too many attempts. Try again in 15 minutes.' }
  }

  const email = args.email.trim().toLowerCase().slice(0, MAX_EMAIL_CHARS)
  const known = isAdminEmail(email)
  // Verify against a dummy hash for an unknown email so both paths cost the same.
  const passwordOk = await verifyPassword(args.password, known ? stored : await dummyHash())
  const success = known && passwordOk

  await query(`INSERT INTO ${T.logins} ("ip_hash","email","ok") VALUES ($1,$2,$3)`, [args.ipHash, email, success])

  if (!success) return { ok: false, status: 401, error: 'Email or password is incorrect.' }

  const iat = nowSeconds()
  const epoch = await getAdminSessionEpoch()
  return {
    ok: true,
    email,
    cookie: {
      name: cookieName(ADMIN_COOKIE),
      value: signToken('admin', { sub: email, iat, exp: iat + ADMIN_TTL_SECONDS, epoch }),
      options: {
        httpOnly: true,
        secure: secureCookies(),
        // Strict, not Lax: admins navigate here directly, so there is no
        // cross-site entry flow worth preserving.
        sameSite: 'strict' as const,
        path: '/',
        maxAge: ADMIN_TTL_SECONDS,
      },
    },
  }
}

export function adminCookieName(): string {
  return cookieName(ADMIN_COOKIE)
}

/** Resolves the signed-in admin, or null. Re-checks the revocation epoch on every
 *  call so "sign out all admins" takes effect immediately. */
export async function currentAdmin(): Promise<string | null> {
  const raw = cookies().get(adminCookieName())?.value
  const claims = verifyToken('admin', raw)
  if (!claims) return null
  if (!isAdminEmail(claims.sub)) return null

  const epoch = await getAdminSessionEpoch()
  if (Number(claims.epoch ?? 0) !== epoch) return null
  return claims.sub
}

export function clearAdminCookie(): { name: string; value: string; options: Record<string, unknown> } {
  return {
    name: adminCookieName(),
    value: '',
    options: { httpOnly: true, secure: secureCookies(), sameSite: 'strict' as const, path: '/', maxAge: 0 },
  }
}
