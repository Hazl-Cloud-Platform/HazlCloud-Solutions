import type Anthropic from '@anthropic-ai/sdk'
import { T, query } from './db'
import { getPricing } from './settings'
import type { NormalizedUsage, Pricing, UsageKind } from '@/types/vibe'

export function normalizeUsage(usage: Anthropic.Usage): NormalizedUsage {
  return {
    input_tokens: usage.input_tokens ?? 0,
    output_tokens: usage.output_tokens ?? 0,
    cache_creation_tokens: usage.cache_creation_input_tokens ?? 0,
    cache_read_tokens: usage.cache_read_input_tokens ?? 0,
  }
}

export function computeCostUsd(u: NormalizedUsage, p: Pricing): number {
  const cost =
    (u.input_tokens * p.input_per_mtok +
      u.output_tokens * p.output_per_mtok +
      u.cache_creation_tokens * p.cache_write_per_mtok +
      u.cache_read_tokens * p.cache_read_per_mtok) /
    1_000_000
  return Math.round(cost * 1e6) / 1e6
}

export class UsageWriteError extends Error {
  constructor(cause: string) {
    super(`Failed to record usage: ${cause}`)
    this.name = 'UsageWriteError'
  }
}

/**
 * One row per Anthropic API call, priced with the pricing in force RIGHT NOW so a
 * later correction never rewrites history.
 *
 * This throws on failure rather than swallowing. The budget gate sums this same
 * table, so a silent write failure would make spend invisible AND the gate blind
 * at the same moment -- the caller decides how many consecutive failures to
 * tolerate before refusing to spend anything more.
 */
export async function recordUsage(args: {
  sessionId: string | null
  model: string
  kind: UsageKind
  turnIndex: number
  attempt: number
  usage: Anthropic.Usage
}): Promise<{ costUsd: number; usage: NormalizedUsage }> {
  const normalized = normalizeUsage(args.usage)
  const pricing = await getPricing()
  const costUsd = computeCostUsd(normalized, pricing)

  try {
    await query(
      `INSERT INTO ${T.usage}
         ("session_id","model","kind","turn_index","attempt",
          "input_tokens","output_tokens","cache_creation_tokens","cache_read_tokens","cost_usd")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        args.sessionId,
        args.model,
        args.kind,
        args.turnIndex,
        args.attempt,
        normalized.input_tokens,
        normalized.output_tokens,
        normalized.cache_creation_tokens,
        normalized.cache_read_tokens,
        costUsd,
      ],
    )
  } catch (err) {
    throw new UsageWriteError(err instanceof Error ? err.message : String(err))
  }

  return { costUsd, usage: normalized }
}
