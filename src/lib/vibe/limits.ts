import { T, transaction, withAdvisoryLock } from './db'

/**
 * Caps for an anonymous, public, money-spending endpoint.
 *
 * The per-IP counters take a Postgres advisory lock before counting. Plain
 * count-then-insert under READ COMMITTED is a TOCTOU race: fire ten requests at
 * once and all ten read a count of zero before any insert lands, so the cap does
 * nothing precisely when someone is attacking it.
 */

export const MAX_PROMPT_CHARS = 1_200
export const MAX_SESSIONS_PER_IP = 3 // rolling 24h
/** Baseline for the rolling 24h per-IP turn cap. Not the final number -- read it
 *  through `ipTurnCap()`, which floors it against the session allowance. */
export const MAX_TURNS_PER_IP = 12
export const MAX_LEADS_PER_IP = 3 // rolling 24h
export const MAX_CONCURRENT_GLOBAL = 4
/** Re-challenge Turnstile once a session has had this many turns. Gating only the
 *  first generation leaves the cheap-to-solve, expensive-to-serve turns unguarded. */
export const TURNSTILE_RECHALLENGE_AFTER = 2

export type LimitKind = 'ip_sessions' | 'ip_turns' | 'ip_leads'

/**
 * Creates a session only if this IP is under its daily allowance, counting and
 * inserting inside one locked transaction so concurrency cannot slip past.
 */
export async function createSessionIfAllowed(args: {
  ipHash: string
  userAgent: string | null
  referrer: string | null
}): Promise<{ ok: true; sessionId: string } | { ok: false; kind: LimitKind }> {
  return transaction(async (client) =>
    withAdvisoryLock(client, `vibe:ip:${args.ipHash}`, async () => {
      const { rows } = await client.query<{ n: number }>(
        `SELECT count(*)::int AS n FROM ${T.sessions}
          WHERE "ip_hash" = $1 AND "created_at" > now() - interval '24 hours'`,
        [args.ipHash],
      )
      if (Number(rows[0]?.n ?? 0) >= MAX_SESSIONS_PER_IP) return { ok: false as const, kind: 'ip_sessions' as const }

      const inserted = await client.query<{ id: string }>(
        `INSERT INTO ${T.sessions} ("ip_hash","user_agent","referrer") VALUES ($1,$2,$3) RETURNING "id"`,
        [args.ipHash, args.userAgent, args.referrer],
      )
      return { ok: true as const, sessionId: inserted.rows[0].id }
    }),
  )
}

/** Rolling 24h user-turn count for an IP. Counts role='user' only: the table
 *  holds assistant rows too, so a naive count(*) would halve the real cap. */
export async function ipTurnsToday(ipHash: string): Promise<number> {
  return transaction(async (client) =>
    withAdvisoryLock(client, `vibe:ip:${ipHash}`, async () => {
      const { rows } = await client.query<{ n: number }>(
        `SELECT count(*)::int AS n FROM ${T.turns}
          WHERE "ip_hash" = $1 AND "role" = 'user' AND "created_at" > now() - interval '24 hours'`,
        [ipHash],
      )
      return Number(rows[0]?.n ?? 0)
    }),
  )
}

export async function ipLeadsToday(ipHash: string): Promise<number> {
  const rows = await transaction(async (client) =>
    withAdvisoryLock(client, `vibe:ip:${ipHash}`, async () => {
      const res = await client.query<{ n: number }>(
        `SELECT count(*)::int AS n FROM ${T.leads}
          WHERE "ip_hash" = $1 AND "created_at" > now() - interval '24 hours'`,
        [ipHash],
      )
      return Number(res.rows[0]?.n ?? 0)
    }),
  )
  return rows
}

/**
 * The rolling 24h per-IP turn cap actually in force.
 *
 * Floored against the session allowance on purpose. The two caps are independent
 * numbers, and an admin who raises changes-per-session past the per-IP baseline
 * would otherwise grant an allowance no single visitor could ever spend -- the
 * studio would refuse turns it had just been told to hand out, with a message
 * about a daily limit that names nothing the admin can see.
 */
export function ipTurnCap(maxTurnsPerSession: number): number {
  return Math.max(MAX_TURNS_PER_IP, maxTurnsPerSession)
}

/**
 * Claims one turn for a session. A single conditional UPDATE, so two concurrent
 * submits cannot both see turn_count = 4 and both proceed.
 *
 * `maxTurns` is passed in rather than read here: it is an admin-settable value,
 * and the caller has already loaded it to decide the pre-flight rejections and
 * the visitor-facing copy. Re-reading it inside the transaction would add a round
 * trip and, worse, let one request enforce two different caps.
 *
 * Called AFTER the pre-flight rejections (budget, busy) so a visitor never burns
 * one of their changes on a request that was refused before reaching the model.
 */
export async function claimTurn(
  sessionId: string,
  maxTurns: number,
): Promise<{ ok: true; turnIndex: number; turnsLeft: number } | { ok: false }> {
  const { rows } = await transaction(async (client) =>
    client.query<{ turn_count: number }>(
      `UPDATE ${T.sessions}
          SET "turn_count" = "turn_count" + 1, "last_turn_at" = now()
        WHERE "id" = $1 AND "turn_count" < $2
        RETURNING "turn_count"`,
      [sessionId, maxTurns],
    ),
  )
  if (!rows.length) return { ok: false }
  const turnCount = Number(rows[0].turn_count)
  return { ok: true, turnIndex: turnCount - 1, turnsLeft: Math.max(0, maxTurns - turnCount) }
}

/** Releases a claimed turn when the model never ran (e.g. the stream died before
 *  a single call). Keeps a failed request from costing the visitor a turn. */
export async function releaseTurn(sessionId: string): Promise<void> {
  await transaction(async (client) =>
    client.query(
      `UPDATE ${T.sessions} SET "turn_count" = GREATEST("turn_count" - 1, 0) WHERE "id" = $1`,
      [sessionId],
    ),
  )
}

export const LIMIT_MESSAGES: Record<LimitKind, string> = {
  ip_sessions: "You've used your free designs for today. Book a call and we'll build the real thing with you.",
  ip_turns: "You've used your free changes for today — they reset in 24 hours.",
  ip_leads: "We've already got your details. Someone from our team will be in touch shortly.",
}

/** Spelled out to twenty, because the allowance is admin-settable and "That's
 *  your 5 free changes" reads like a system message where the rest of this copy
 *  reads like a person. Anything above twenty falls back to digits. */
const NUMBER_WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen',
  'nineteen', 'twenty',
]

export function spellCount(n: number): string {
  return Number.isInteger(n) && n >= 0 && n < NUMBER_WORDS.length ? NUMBER_WORDS[n] : String(n)
}

/** The turn-cap message, built from the allowance actually in force. */
export function turnCapMessage(maxTurns: number): string {
  const count = `${spellCount(maxTurns)} free ${maxTurns === 1 ? 'change' : 'changes'}`
  return `That's your ${count}. Send this to our team and a real person will make it secure, scalable, and ready for customers.`
}
