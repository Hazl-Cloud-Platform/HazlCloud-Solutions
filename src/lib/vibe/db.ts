import fs from 'node:fs'
import pg from 'pg'
import { SUPABASE_ROOT_CA } from './supabaseCa'

/**
 * Postgres access for the Vibe Studio. Every quoted `"Sol-Vibe-Code_*"` identifier
 * in the app lives in this directory so the awkward prefix (capitals + a hyphen,
 * both of which force double-quoting) never leaks into feature code.
 */

// pg hands back numeric (OID 1700) and int8 (OID 20) as STRINGS, to avoid silent
// float truncation on values JS cannot represent. That default is a live hazard
// here: SUM(cost_usd) would arrive as "12.345600" and `"9" >= 100` is false, so
// the monthly budget gate would compare strings and never fire. Parse both, and
// still call Number() at every call site -- these parsers are global to the pg
// module, so a future dependency could reset them.
pg.types.setTypeParser(1700, (v) => (v === null ? null : Number.parseFloat(v)))
pg.types.setTypeParser(20, (v) => (v === null ? null : Number(v)))

export const T = {
  sessions: '"Sol-Vibe-Code_sessions"',
  turns: '"Sol-Vibe-Code_turns"',
  designs: '"Sol-Vibe-Code_designs"',
  leads: '"Sol-Vibe-Code_leads"',
  usage: '"Sol-Vibe-Code_usage_events"',
  logins: '"Sol-Vibe-Code_login_attempts"',
  settings: '"Sol-Vibe-Code_settings"',
} as const

/**
 * Supabase requires TLS. `pg` does not honour `sslmode=` from the URL the way
 * libpq does, so the config object is what actually decides. Verification stays
 * ON: this connection carries visitor email addresses and prompts.
 */
export function sslConfig(connectionString: string): pg.ClientConfig['ssl'] {
  const isSupabase = /supabase\.(co|com|net)/.test(connectionString)
  const needsSsl = isSupabase || /sslmode=(require|verify)/.test(connectionString)
  if (!needsSsl) return undefined

  // Escape hatch, deliberately loud and deliberately not the default: turning
  // verification off would make the link carrying visitor emails and prompts
  // trivially MITM-able.
  if (process.env.VIBE_DB_SSL_INSECURE === '1') {
    console.warn('[vibe] VIBE_DB_SSL_INSECURE=1 -- database TLS certificate verification is OFF')
    return { rejectUnauthorized: false }
  }

  const caPath = process.env.SUPABASE_CA_PATH
  if (caPath) return { ca: fs.readFileSync(caPath, 'utf8'), rejectUnauthorized: true }

  // Supabase signs its pooler certificate with a private root, so the system
  // trust store rejects it ("self-signed certificate in certificate chain").
  // Pin their published root instead of weakening verification.
  if (isSupabase) return { ca: SUPABASE_ROOT_CA, rejectUnauthorized: true }

  return { rejectUnauthorized: true }
}

type PoolCache = { pool?: pg.Pool }

function cache(): PoolCache {
  // Next's dev server re-evaluates modules on every hot reload. A module-scope
  // `new Pool()` would leak one pool per edit and exhaust Supabase's connection
  // limit within a few saves, so the pool hangs off globalThis instead.
  const g = globalThis as typeof globalThis & { __hazlVibePg?: PoolCache }
  g.__hazlVibePg ??= {}
  return g.__hazlVibePg
}

export function getPool(): pg.Pool {
  const c = cache()
  if (c.pool) return c.pool

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is not set (run under `doppler run -p hazl-general -c prd`)')

  const pool = new pg.Pool({
    connectionString,
    ssl: sslConfig(connectionString),
    // Each Node process gets its own pool and the app is a single VM process,
    // so a small ceiling is plenty and keeps room for the neighbouring app on
    // the same Supabase instance.
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 8_000,
  })

  // pg's most-hit footgun: when the server terminates an IDLE client, the pool
  // emits 'error' with no query to attach it to. Unhandled, that is an uncaught
  // exception and the whole process dies.
  pool.on('error', (err) => {
    console.error('[vibe] idle postgres client error:', err.message)
  })

  c.pool = pool
  return pool
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const res = await getPool().query<T>(text, params as never[])
  return res.rows
}

export async function queryOne<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params)
  return rows[0] ?? null
}

/** Runs `fn` inside a transaction on one client, rolling back on any throw. */
export async function transaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect()
  try {
    await client.query('BEGIN')
    const out = await fn(client)
    await client.query('COMMIT')
    return out
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

/**
 * Serializes a critical section across every app process on an arbitrary string
 * key. Uses the _xact_ variant deliberately: a session-level advisory lock is
 * tied to the connection, and under Supabase's transaction-mode pooler that
 * connection is handed to someone else the moment the transaction ends, so the
 * lock would leak. The xact form is released by COMMIT/ROLLBACK, always.
 */
export async function withAdvisoryLock<T>(client: pg.PoolClient, key: string, fn: () => Promise<T>): Promise<T> {
  await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [key])
  return fn()
}
