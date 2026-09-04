/** Shared types for the Vibe Studio (public UI-mockup builder). */

/** Per-MTok rates. Stored in settings so they can be corrected without a deploy. */
export interface Pricing {
  input_per_mtok: number
  output_per_mtok: number
  cache_write_per_mtok: number
  cache_read_per_mtok: number
}

export interface NormalizedUsage {
  input_tokens: number
  output_tokens: number
  cache_creation_tokens: number
  cache_read_tokens: number
}

/** Why an API call happened. `attempt` separates the two calls of one failed edit
 *  turn. `generate_retry` is a rebuild after the first attempt was cut off at the
 *  output ceiling -- kept distinct from `edit_fallback` so the admin fallback-rate
 *  metric stays clean and the truncation rate is separately visible. */
export type UsageKind = 'generate' | 'edit' | 'edit_fallback' | 'generate_retry'

export interface SessionRow {
  id: string
  ip_hash: string
  turn_count: number
  first_prompt: string | null
  turnstile_verified_at: Date | null
  created_at: Date
  last_turn_at: Date | null
}

export interface DesignRow {
  id: string
  session_id: string
  turn_index: number
  title: string
  file_path: string
  bytes: number
  sha256: string
  created_at: Date
  /** Non-null once the visitor discarded it but a lead still references it. */
  archived_at: Date | null
}

export interface LeadRow {
  id: string
  session_id: string
  design_id: string | null
  email: string
  note: string | null
  created_at: Date
  contacted_at: Date | null
}

/** Error codes the client switches on to pick a message and a next action. */
export type VibeErrorCode =
  | 'budget_exceeded'
  | 'daily_budget'
  | 'session_cost'
  | 'turn_cap'
  | 'ip_cap'
  | 'too_long'
  | 'busy'
  | 'max_tokens'
  | 'bad_output'
  | 'turnstile'
  | 'disabled'
  | 'internal'

/**
 * SSE frames from /api/vibe/chat. `html` arrives once per turn, on completion:
 * edit turns have no partial document to show, and re-assigning srcDoc would
 * reload the Tailwind CDN bundle on every chunk.
 */
export type VibeEvent =
  | { type: 'accepted'; sessionId: string; turnIndex: number; turnsLeft: number }
  | { type: 'status'; phase: 'thinking' | 'writing' | 'applying'; label: string }
  | { type: 'note'; delta: string }
  | { type: 'progress'; bytes: number; pct: number }
  | {
      type: 'usage_tick'
      inputTokens: number
      outputTokens: number
      cacheReadTokens: number
      cacheCreationTokens: number
      totalTokens: number
    }
  | { type: 'usage'; costUsd: number; inputTokens: number; outputTokens: number }
  | { type: 'html'; designId: string; html: string; title: string; bytes: number }
  | { type: 'error'; code?: VibeErrorCode; message: string }
  | { type: 'done'; turnsLeft: number; changed: boolean }

export interface AdminOverview {
  monthSpendUsd: number
  monthBudgetUsd: number
  daySpendUsd: number
  dayBudgetUsd: number
  sessions1d: number
  sessions7d: number
  sessions30d: number
  turnsTotal: number
  leadsTotal: number
  leadsRecent: number
  leadsUncontacted: number
  designCount: number
  diskBytes: number
  diskFreeBytes: number
  largestBytes: number
  pricing: Pricing
  /** Changes one visitor session gets. Admin-settable, so never assume 5. */
  maxTurnsPerSession: number
  /** The rolling 24h per-IP turn cap in force, floored against the above. */
  maxTurnsPerIpDay: number
}

export interface UsageDay {
  day: string
  calls: number
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheCreationTokens: number
  costUsd: number
  fallbacks: number
}
