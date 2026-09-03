import { cookies } from 'next/headers'
import { T, query, queryOne } from './db'
import { cookieName, nowSeconds, secureCookies, signToken, verifyToken } from './signing'
import type { SessionRow } from '@/types/vibe'

/**
 * The anonymous visitor's session.
 *
 * The cookie is SIGNED, not just a bare uuid. Without a signature anyone could
 * POST someone else's session id and read or mutate their document -- session ids
 * are handed out freely, so they are an identifier, not a secret.
 */

export const SID_COOKIE = 'hazl_vibe_sid'
const SID_TTL_SECONDS = 24 * 60 * 60

export function sidCookieName(): string {
  return cookieName(SID_COOKIE)
}

export function mintSessionCookie(sessionId: string): { name: string; value: string; options: Record<string, unknown> } {
  const iat = nowSeconds()
  return {
    name: sidCookieName(),
    value: signToken('sid', { sub: sessionId, iat, exp: iat + SID_TTL_SECONDS }),
    options: {
      httpOnly: true,
      secure: secureCookies(),
      sameSite: 'lax' as const,
      path: '/',
      maxAge: SID_TTL_SECONDS,
    },
  }
}

/** Reads and verifies the session id from the request cookie. */
export function readSessionId(): string | null {
  const raw = cookies().get(sidCookieName())?.value
  return verifyToken('sid', raw)?.sub ?? null
}

export async function getSession(sessionId: string): Promise<SessionRow | null> {
  return queryOne<SessionRow>(
    `SELECT "id","ip_hash","turn_count","first_prompt","turnstile_verified_at","created_at","last_turn_at"
       FROM ${T.sessions} WHERE "id" = $1`,
    [sessionId],
  )
}

/**
 * Resolves the caller's session, verifying it still belongs to the same IP block.
 * A stolen cookie replayed from elsewhere resolves to nothing rather than to
 * someone else's design.
 */
export async function requireSession(ipHash: string): Promise<SessionRow | null> {
  const id = readSessionId()
  if (!id) return null
  const session = await getSession(id)
  if (!session) return null
  if (session.ip_hash !== ipHash) return null
  return session
}

/** True once this session has spent its single full-rewrite rescue. */
export async function hasUsedFallback(sessionId: string): Promise<boolean> {
  const row = await queryOne<{ fallback_used: boolean }>(
    `SELECT "fallback_used" FROM ${T.sessions} WHERE "id" = $1`,
    [sessionId],
  )
  return Boolean(row?.fallback_used)
}

export async function markFallbackUsed(sessionId: string): Promise<void> {
  await query(`UPDATE ${T.sessions} SET "fallback_used" = true WHERE "id" = $1`, [sessionId])
}

export async function markTurnstileVerified(sessionId: string): Promise<void> {
  await query(`UPDATE ${T.sessions} SET "turnstile_verified_at" = now() WHERE "id" = $1`, [sessionId])
}

export async function recordFirstPrompt(sessionId: string, prompt: string): Promise<void> {
  await query(`UPDATE ${T.sessions} SET "first_prompt" = $2 WHERE "id" = $1 AND "first_prompt" IS NULL`, [
    sessionId,
    prompt.slice(0, 500),
  ])
}

/** Appends to the conversation. Stores the visitor's prompt and the model's short
 *  note ONLY -- never document HTML, which lives on disk and is re-injected fresh
 *  each turn so superseded copies never accumulate in the prompt. */
export async function appendTurn(args: {
  sessionId: string
  ipHash: string
  role: 'user' | 'assistant'
  content: string
}): Promise<void> {
  await query(`INSERT INTO ${T.turns} ("session_id","ip_hash","role","content") VALUES ($1,$2,$3,$4)`, [
    args.sessionId,
    args.ipHash,
    args.role,
    args.content.slice(0, 4_000),
  ])
}

export async function loadTurns(sessionId: string, limit = 20): Promise<{ role: 'user' | 'assistant'; content: string }[]> {
  const rows = await query<{ role: 'user' | 'assistant'; content: string }>(
    `SELECT "role","content" FROM (
       SELECT "id","role","content" FROM ${T.turns} WHERE "session_id" = $1 ORDER BY "id" DESC LIMIT $2
     ) recent ORDER BY "id" ASC`,
    [sessionId, limit],
  )
  // The API requires the window to open on a user turn.
  while (rows.length && rows[0].role !== 'user') rows.shift()
  return rows
}
