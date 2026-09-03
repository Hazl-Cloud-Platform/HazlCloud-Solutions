import { T, query, queryOne } from './db'
import { dayStartUtc, monthStartUtc, getDaySpendUsd, getMonthSpendUsd } from './budget'
import { getDailyBudgetUsd, getMonthlyBudgetUsd, getPricing } from './settings'
import { allDesignPaths } from './designs'
import { scanStorage } from './storage'
import type { AdminOverview, UsageDay } from '@/types/vibe'

export async function adminOverview(): Promise<AdminOverview> {
  const [monthSpendUsd, daySpendUsd, monthBudgetUsd, dayBudgetUsd, pricing] = await Promise.all([
    getMonthSpendUsd(),
    getDaySpendUsd(),
    getMonthlyBudgetUsd(),
    getDailyBudgetUsd(),
    getPricing(),
  ])

  const activity = await queryOne<{
    sessions_1d: number
    sessions_7d: number
    sessions_30d: number
    turns_total: number
  }>(
    `SELECT
       count(*) FILTER (WHERE "created_at" > now() - interval '1 day')::int   AS sessions_1d,
       count(*) FILTER (WHERE "created_at" > now() - interval '7 days')::int  AS sessions_7d,
       count(*) FILTER (WHERE "created_at" > now() - interval '30 days')::int AS sessions_30d,
       COALESCE(sum("turn_count"),0)::int AS turns_total
     FROM ${T.sessions}`,
  )

  const leads = await queryOne<{ total: number; recent: number; uncontacted: number }>(
    `SELECT count(*)::int AS total,
            count(*) FILTER (WHERE "created_at" > now() - interval '7 days')::int AS recent,
            count(*) FILTER (WHERE "contacted_at" IS NULL)::int AS uncontacted
       FROM ${T.leads}`,
  )

  // Disk is the source of truth for documents, so storage totals are measured by
  // walking the volume -- pg_total_relation_size would only report the index.
  const stats = await scanStorage(await allDesignPaths())

  return {
    monthSpendUsd,
    monthBudgetUsd,
    daySpendUsd,
    dayBudgetUsd,
    sessions1d: Number(activity?.sessions_1d ?? 0),
    sessions7d: Number(activity?.sessions_7d ?? 0),
    sessions30d: Number(activity?.sessions_30d ?? 0),
    turnsTotal: Number(activity?.turns_total ?? 0),
    leadsTotal: Number(leads?.total ?? 0),
    leadsRecent: Number(leads?.recent ?? 0),
    leadsUncontacted: Number(leads?.uncontacted ?? 0),
    designCount: stats.fileCount,
    diskBytes: stats.totalBytes,
    diskFreeBytes: Number.isFinite(stats.freeBytes) ? stats.freeBytes : 0,
    largestBytes: stats.largestBytes,
    pricing,
  }
}

/**
 * Per-day spend.
 *
 * The window BOUNDARY is computed in JS and bound as a parameter, matching
 * budget.ts. The per-row BUCKETING below uses `timestamptz AT TIME ZONE 'UTC'`,
 * which is a different operation and is deterministic: it converts a known
 * instant to UTC wall-clock. (The trap budget.ts documents is the reverse
 * direction -- comparing a bare timestamp back against a timestamptz, which
 * resolves against the session TimeZone.)
 */
export async function usageByDay(days: number): Promise<UsageDay[]> {
  const since = new Date(dayStartUtc().getTime() - (days - 1) * 86_400_000)
  const rows = await query<{
    day: string
    calls: number
    input_tokens: number
    output_tokens: number
    cache_read_tokens: number
    cache_creation_tokens: number
    cost_usd: number
    fallbacks: number
  }>(
    `SELECT to_char(date_trunc('day', "created_at" AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day,
            count(*)::int                                              AS calls,
            COALESCE(sum("input_tokens"),0)::int                       AS input_tokens,
            COALESCE(sum("output_tokens"),0)::int                      AS output_tokens,
            COALESCE(sum("cache_read_tokens"),0)::int                  AS cache_read_tokens,
            COALESCE(sum("cache_creation_tokens"),0)::int              AS cache_creation_tokens,
            COALESCE(sum("cost_usd"),0)                                AS cost_usd,
            count(*) FILTER (WHERE "kind" = 'edit_fallback')::int      AS fallbacks
       FROM ${T.usage}
      WHERE "created_at" >= $1
      GROUP BY 1 ORDER BY 1 DESC`,
    [since],
  )
  return rows.map((r) => ({
    day: r.day,
    calls: Number(r.calls),
    inputTokens: Number(r.input_tokens),
    outputTokens: Number(r.output_tokens),
    cacheReadTokens: Number(r.cache_read_tokens),
    cacheCreationTokens: Number(r.cache_creation_tokens),
    costUsd: Number(r.cost_usd),
    fallbacks: Number(r.fallbacks),
  }))
}

/** How often the cheap SEARCH/REPLACE path had to fall back to a full rewrite.
 *  Above roughly 35% the edit protocol is costing more than it saves. */
export async function fallbackRate(): Promise<{ edits: number; fallbacks: number; rate: number }> {
  const row = await queryOne<{ edits: number; fallbacks: number }>(
    // Denominator is edit TURNS (first attempts), not calls. A turn that falls
    // back writes two rows -- one 'edit', one 'edit_fallback' -- so counting both
    // kinds would cap the rate at 50% and make the 35% threshold unreachable.
    `SELECT count(*) FILTER (WHERE "kind" = 'edit' AND "attempt" = 1)::int AS edits,
            count(*) FILTER (WHERE "kind" = 'edit_fallback')::int          AS fallbacks
       FROM ${T.usage} WHERE "created_at" >= $1`,
    [monthStartUtc()],
  )
  const edits = Number(row?.edits ?? 0)
  const fallbacks = Number(row?.fallbacks ?? 0)
  return { edits, fallbacks, rate: edits ? fallbacks / edits : 0 }
}

export interface AdminLead {
  id: string
  email: string
  note: string | null
  created_at: string
  contacted_at: string | null
  design_id: string | null
  title: string | null
  bytes: number | null
  session_id: string
  first_prompt: string | null
  turn_count: number
}

export async function listLeads(limit: number, offset: number): Promise<AdminLead[]> {
  return query<AdminLead>(
    `SELECT l."id", l."email", l."note", l."created_at", l."contacted_at", l."design_id",
            d."title", d."bytes",
            s."id" AS session_id, s."first_prompt", s."turn_count"
       FROM ${T.leads} l
       LEFT JOIN ${T.designs}  d ON d."id" = l."design_id"
       JOIN      ${T.sessions} s ON s."id" = l."session_id"
      ORDER BY l."created_at" DESC
      LIMIT $1 OFFSET $2`,
    [limit, offset],
  )
}

export interface AdminDesign {
  id: string
  title: string
  bytes: number
  turn_index: number
  created_at: string
  session_id: string
  first_prompt: string | null
  has_lead: boolean
}

export async function listDesigns(limit: number, offset: number, withLeadOnly: boolean): Promise<AdminDesign[]> {
  return query<AdminDesign>(
    `SELECT d."id", d."title", d."bytes", d."turn_index", d."created_at", d."session_id",
            s."first_prompt",
            EXISTS (SELECT 1 FROM ${T.leads} l WHERE l."design_id" = d."id") AS has_lead
       FROM ${T.designs} d
       JOIN ${T.sessions} s ON s."id" = d."session_id"
      ${withLeadOnly ? `WHERE EXISTS (SELECT 1 FROM ${T.leads} l WHERE l."design_id" = d."id")` : ''}
      ORDER BY d."created_at" DESC
      LIMIT $1 OFFSET $2`,
    [limit, offset],
  )
}

/** Designs older than `days` with no lead attached. Nobody is coming back for
 *  these, and keeping visitor content forever is not a defensible default. */
export async function staleDesignIds(days: number): Promise<string[]> {
  const rows = await query<{ id: string }>(
    `SELECT d."id" FROM ${T.designs} d
      WHERE d."created_at" < now() - ($1::int * interval '1 day')
        AND NOT EXISTS (SELECT 1 FROM ${T.leads} l WHERE l."design_id" = d."id")`,
    [days],
  )
  return rows.map((r) => r.id)
}

/** Login attempts are only consulted over a 15-minute window, so anything older
 *  is dead weight in a table any anonymous caller can append to. */
export async function pruneLoginAttempts(days: number): Promise<number> {
  const rows = await query<{ id: string }>(
    `DELETE FROM ${T.logins} WHERE "created_at" < now() - ($1::int * interval '1 day') RETURNING "id"`,
    [days],
  )
  return rows.length
}
