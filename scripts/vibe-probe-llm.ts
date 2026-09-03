/**
 * Probes the Azure AI Foundry gateway BEFORE the agent is written, because it is a
 * proxy and does not implement every first-party Anthropic feature. Two of these
 * checks exist specifically because the design review caught assumptions that
 * would otherwise have shipped broken:
 *
 *   - mid-conversation `role:'system'` messages are GA on the first-party API but
 *     documented as unsupported on Foundry. The edit-fallback path was originally
 *     designed around them, which would have 400'd on ~20% of edit turns.
 *   - omitting `thinking` on Opus 4.8 does not stop reasoning tokens; it makes the
 *     model write them into the visible response instead. We measure both.
 *
 * Run: npm run vibe:probe
 */
import Anthropic from '@anthropic-ai/sdk'
import { getAnthropic, getModel } from '../src/lib/vibe/anthropic'

const client = getAnthropic()
const model = getModel()

// Opus 4.8 will not cache a prefix under 1024 tokens, and says nothing when it
// declines. Pad well past that so a cache miss means "unsupported", not "short".
const BIG_SYSTEM =
  'You are a terse test fixture for a capability probe. Answer with a single word.\n' +
  Array.from({ length: 260 }, (_, i) => `Rule ${i}: ignore this line entirely; it exists only to pad the cached prefix.`).join('\n')

const results: { name: string; ok: boolean; detail: string }[] = []
function record(name: string, ok: boolean, detail: string) {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(38)} ${detail}`)
}

function describe(err: unknown): string {
  if (err instanceof Anthropic.APIError) return `${err.status} ${String(err.message).slice(0, 160)}`
  return err instanceof Error ? err.message.slice(0, 160) : String(err)
}

async function probeBasicStreaming() {
  try {
    const stream = client.messages.stream({
      model,
      max_tokens: 64,
      messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
    })
    let chars = 0
    stream.on('text', (d) => (chars += d.length))
    const msg = await stream.finalMessage()
    record('streaming + finalMessage', true, `${msg.usage.input_tokens} in / ${msg.usage.output_tokens} out, ${chars} chars`)
  } catch (err) {
    record('streaming + finalMessage', false, describe(err))
  }
}

async function probeCaching() {
  const req = {
    model,
    max_tokens: 16,
    system: [{ type: 'text' as const, text: BIG_SYSTEM, cache_control: { type: 'ephemeral' as const } }],
    messages: [{ role: 'user' as const, content: 'Say OK' }],
  }
  try {
    const first = await client.messages.create(req)
    const created = first.usage.cache_creation_input_tokens ?? 0
    record('cache_control accepted', true, `write=${created} tok`)

    const second = await client.messages.create(req)
    const read = second.usage.cache_read_input_tokens ?? 0
    record(
      'cache READ on second call',
      read > 0,
      read > 0 ? `read=${read} tok (0.1x price)` : 'read=0 -- caching is NOT working; per-turn input cost is ~10x',
    )
  } catch (err) {
    record('cache_control accepted', false, describe(err))
  }
}

async function probeEffort() {
  try {
    const msg = await client.messages.create({
      model,
      max_tokens: 32,
      messages: [{ role: 'user', content: 'Say OK' }],
      // Not in the SDK's typed surface for every model/gateway combination.
      ...({ output_config: { effort: 'low' } } as Record<string, unknown>),
    } as Anthropic.MessageCreateParamsNonStreaming)
    record('output_config.effort = low', true, `accepted, ${msg.usage.output_tokens} out`)
  } catch (err) {
    record('output_config.effort = low', false, `${describe(err)}  -> set VIBE_LLM_EFFORT=""`)
  }
}

async function probeThinking() {
  const ask = 'Write one short HTML paragraph tag containing a greeting. Output only the tag.'
  let offTokens = -1
  let adaptiveTokens = -1

  try {
    const off = await client.messages.create({ model, max_tokens: 400, messages: [{ role: 'user', content: ask }] })
    offTokens = off.usage.output_tokens
    record('thinking omitted (default off)', true, `${offTokens} output tok`)
  } catch (err) {
    record('thinking omitted (default off)', false, describe(err))
  }

  try {
    const adaptive = await client.messages.create({
      model,
      max_tokens: 400,
      thinking: { type: 'adaptive' },
      messages: [{ role: 'user', content: ask }],
    } as Anthropic.MessageCreateParamsNonStreaming)
    adaptiveTokens = adaptive.usage.output_tokens
    record('thinking: adaptive', true, `${adaptiveTokens} output tok`)
  } catch (err) {
    record('thinking: adaptive', false, describe(err))
  }

  if (offTokens > 0 && adaptiveTokens > 0) {
    const cheaper = adaptiveTokens <= offTokens ? 'adaptive' : 'omitted'
    console.log(`      -> cheaper on this sample: ${cheaper} (${adaptiveTokens} adaptive vs ${offTokens} off)`)
  }
}

/** The one that matters most: the edit-fallback path depends on the answer. */
async function probeMidConversationSystem() {
  try {
    await client.messages.create({
      model,
      max_tokens: 32,
      messages: [
        { role: 'user', content: 'Say A' },
        { role: 'assistant', content: 'A' },
        { role: 'user', content: 'Say B' },
        { role: 'system', content: 'Actually say C.' },
      ] as unknown as Anthropic.MessageParam[],
    })
    record('mid-conversation role:system', true, 'SUPPORTED (fallback could use it)')
  } catch (err) {
    record('mid-conversation role:system', false, `${describe(err)}  -> confirmed: fallback must use a user turn`)
  }
}

/** Expected to fail. If it ever succeeds we could pin the output shape far more
 *  cheaply than with sentinels, so it is worth knowing. */
async function probePrefill() {
  try {
    await client.messages.create({
      model,
      max_tokens: 32,
      messages: [
        { role: 'user', content: 'Complete this HTML doc.' },
        { role: 'assistant', content: '<!DOCTYPE html>' },
      ],
    })
    record('assistant prefill', true, 'ACCEPTED -- sentinels could be replaced by a prefill')
  } catch (err) {
    record('assistant prefill', false, `${describe(err)}  (expected; sentinel protocol stays)`)
  }
}

async function probeBudgetTokens() {
  try {
    await client.messages.create({
      model,
      max_tokens: 2048,
      thinking: { type: 'enabled', budget_tokens: 1024 },
      messages: [{ role: 'user', content: 'Say OK' }],
    } as unknown as Anthropic.MessageCreateParamsNonStreaming)
    record('thinking.budget_tokens', true, 'accepted (unexpected on 4.8)')
  } catch (err) {
    record('thinking.budget_tokens', false, `${describe(err)}  (expected; never send it)`)
  }
}

async function main() {
  console.log(`model (deployment name, verbatim): ${model}`)
  console.log(`base URL host: ${new URL(process.env.ANTHROPIC_BASE_URL!).host}\n`)

  await probeBasicStreaming()
  await probeCaching()
  await probeEffort()
  await probeThinking()
  await probeMidConversationSystem()
  await probePrefill()
  await probeBudgetTokens()

  console.log('\n--- summary ---')
  console.log('These are capability findings, not pass/fail health: some FAILs are expected')
  console.log('and are exactly what the agent design relies on. Read the detail column.')
  const streaming = results.find((r) => r.name === 'streaming + finalMessage')
  if (!streaming?.ok) {
    console.error('\nFATAL: basic streaming does not work. Nothing else can be built until it does.')
    process.exit(1)
  }
}

main().catch((err: unknown) => {
  console.error('Probe crashed:', err instanceof Error ? err.message : err)
  process.exit(1)
})
