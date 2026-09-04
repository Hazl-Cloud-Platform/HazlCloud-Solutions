import Anthropic from '@anthropic-ai/sdk'

/**
 * The LLM client. Credentials come from Doppler `dr-keys` / `prd_llm_opus4-8`,
 * which points at the company Azure AI Foundry endpoint -- an Anthropic-compatible
 * gateway, not api.anthropic.com. Two consequences run through this whole module:
 *
 *  1. ANTHROPIC_MODEL is a Foundry DEPLOYMENT NAME, not a public model id. Pass it
 *     through verbatim -- never normalise it, lowercase it, or append a date.
 *  2. The gateway does not implement every first-party feature. Anything optional
 *     is probed (`npm run vibe:probe`) and degrades rather than throwing.
 */

export function getModel(): string {
  const model = process.env.ANTHROPIC_MODEL
  if (!model) throw new Error('ANTHROPIC_MODEL is not set (run under `doppler run -p dr-keys -c prd_llm_opus4-8`)')
  return model
}

export function getAnthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY
  const baseURL = process.env.ANTHROPIC_BASE_URL
  if (!apiKey || !baseURL) {
    throw new Error('Missing ANTHROPIC_API_KEY / ANTHROPIC_BASE_URL (run under `doppler run -p dr-keys -c prd_llm_opus4-8`)')
  }
  return new Anthropic({
    apiKey,
    baseURL,
    defaultHeaders: process.env.ANTHROPIC_VERSION ? { 'anthropic-version': process.env.ANTHROPIC_VERSION } : undefined,
    maxRetries: 2,
  })
}

/** Prompt caching. Opus 4.8's minimum cacheable prefix is 1024 tokens, and a
 *  shorter one fails SILENTLY -- no error, just no cache. */
export function cacheEnabled(): boolean {
  return process.env.LLM_ENABLE_CACHE !== '0'
}

/** `low` keeps a mockup cheap. Empty string disables the parameter entirely, for
 *  a gateway that rejects `output_config`. */
export function llmEffort(): string | null {
  const raw = process.env.VIBE_LLM_EFFORT
  if (raw === undefined) return 'low'
  const v = raw.trim()
  return v === '' ? null : v
}

/**
 * Sized for a multi-page mockup, and it must stay that way.
 *
 * A landing screen plus four secondary pages is ~28KB of document, which bills
 * ~11k output tokens (~315 per KB, plus 1.5-2.5k of adaptive thinking). At the
 * old 12k ceiling that shape truncated more often than not, and a truncated
 * CREATE is the worst failure in the system: billed in full, one of five turns
 * gone, nothing rendered. 18k puts the target at 54-67% and survives an overrun.
 * Verified accepted by the Foundry deployment.
 */
export function maxOutputTokens(): number {
  const n = Number(process.env.LLM_MAX_TOKENS)
  return Number.isInteger(n) && n > 0 ? n : 18_000
}

/** True when an API error is the gateway rejecting a parameter it does not
 *  implement, rather than a real failure worth surfacing. */
export function isUnsupportedParamError(err: unknown, ...params: string[]): boolean {
  if (!(err instanceof Anthropic.APIError) || err.status !== 400) return false
  const msg = String(err.message ?? '').toLowerCase()
  return params.some((p) => msg.includes(p.toLowerCase()))
}
