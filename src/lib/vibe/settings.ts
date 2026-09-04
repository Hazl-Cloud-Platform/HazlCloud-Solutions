import { T, query, queryOne } from './db'
import type { Pricing } from '@/types/vibe'

/** Verified Opus 4.8 rate card, per MTok: $5 in, $25 out, cache write 1.25x,
 *  cache read 0.1x. Overridable from the admin page for a re-priced deployment. */
export const DEFAULT_PRICING: Pricing = {
  input_per_mtok: 5,
  output_per_mtok: 25,
  cache_write_per_mtok: 6.25,
  cache_read_per_mtok: 0.5,
}

export const DEFAULT_MONTHLY_BUDGET_USD = 100
/**
 * A monthly-only cap would let one good day burn the whole month and leave the
 * primary conversion page showing "at capacity" for the other 29. This allows a
 * genuine burst (roughly 15-25 sessions) while the monthly ceiling still governs
 * the total. Adjustable from the admin page.
 *
 * Raised from $8 with multi-page mockups: at ~$0.76 a session, $8 bought 10 and
 * broke the promise in the line above. $12 restores ~16.
 */
export const DEFAULT_DAILY_BUDGET_USD = 12

export async function getSetting(key: string): Promise<string | null> {
  const row = await queryOne<{ value: string }>(`SELECT "value" FROM ${T.settings} WHERE "key" = $1`, [key])
  return row?.value ?? null
}

export async function setSetting(key: string, value: string): Promise<void> {
  await query(
    `INSERT INTO ${T.settings} ("key","value","updated_at") VALUES ($1,$2,now())
     ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "updated_at" = now()`,
    [key, value],
  )
}

async function getNumberSetting(key: string, fallback: number): Promise<number> {
  const raw = await getSetting(key)
  const n = raw === null ? Number.NaN : Number(raw)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

export async function getMonthlyBudgetUsd(): Promise<number> {
  return getNumberSetting('monthly_budget_usd', DEFAULT_MONTHLY_BUDGET_USD)
}

export async function getDailyBudgetUsd(): Promise<number> {
  return getNumberSetting('daily_budget_usd', DEFAULT_DAILY_BUDGET_USD)
}

export async function getAdminSessionEpoch(): Promise<number> {
  return getNumberSetting('admin_session_epoch', 1)
}

/** Bumping the epoch invalidates every issued admin cookie at once. A web request
 *  cannot rotate a Doppler secret, so this is what "sign out all admins" uses. */
export async function bumpAdminSessionEpoch(): Promise<number> {
  const next = (await getAdminSessionEpoch()) + 1
  await setSetting('admin_session_epoch', String(next))
  return next
}

export async function getPricing(): Promise<Pricing> {
  const raw = await getSetting('pricing')
  if (!raw) return DEFAULT_PRICING
  try {
    return { ...DEFAULT_PRICING, ...(JSON.parse(raw) as Partial<Pricing>) }
  } catch {
    return DEFAULT_PRICING
  }
}

/**
 * Guards the admin pricing form. A fat-fingered `500` instead of `5` would
 * mis-price every later call by 100x and trip the budget gate into a lockout
 * nobody could explain, so the range check is deliberately tight.
 */
export function validatePricing(input: unknown): { ok: true; value: Pricing } | { ok: false; error: string } {
  if (typeof input !== 'object' || input === null) return { ok: false, error: 'pricing must be an object' }
  const out = {} as Pricing
  for (const key of Object.keys(DEFAULT_PRICING) as (keyof Pricing)[]) {
    const v = (input as Record<string, unknown>)[key]
    const n = typeof v === 'number' ? v : Number(v)
    if (!Number.isFinite(n)) return { ok: false, error: `${key} must be a number` }
    if (n < 0 || n > 200) return { ok: false, error: `${key} must be between 0 and 200 USD per MTok` }
    out[key] = n
  }
  return { ok: true, value: out }
}

export function validateBudget(input: unknown, label: string, max: number): { ok: true; value: number } | { ok: false; error: string } {
  const n = typeof input === 'number' ? input : Number(input)
  if (!Number.isFinite(n)) return { ok: false, error: `${label} must be a number` }
  if (n < 0 || n > max) return { ok: false, error: `${label} must be between 0 and ${max}` }
  return { ok: true, value: Math.round(n * 100) / 100 }
}
