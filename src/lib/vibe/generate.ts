import type Anthropic from '@anthropic-ai/sdk'
import { randomUUID, randomBytes } from 'node:crypto'
import { cacheEnabled, getAnthropic, getModel, isUnsupportedParamError, llmEffort, maxOutputTokens } from './anthropic'
import { checkBudget, limitMessage } from './budget'
import { applyEdits, extractTitle, parseModelOutput } from './edits'
import { latestDesignHtml, saveDesign } from './designs'
import { currentDocumentBlock, fallbackInstruction, nonceInstruction, SYSTEM_PROMPT } from './prompt'
import { sanitizeMockupHtml } from './sanitizeHtml'
import { appendTurn, loadTurns, recordFirstPrompt } from './session'
import { MAX_HTML_BYTES } from './storage'
import { recordUsage, UsageWriteError } from './usage'
import type { UsageKind, VibeEvent } from '@/types/vibe'

export type Emit = (e: VibeEvent) => void

/** Streamed characters per output token. Display only. */
const CHARS_PER_TOKEN = 4
/**
 * Divisor used when an aborted call has to be billed from streamed characters.
 * NDTG-IDI uses 5 here to under-count deliberately, which is right for a per-user
 * budget. This is a single shared pot open to anonymous visitors, so a systematic
 * discount for always aborting is an exploit rather than a kindness -- but the
 * figure must stay non-zero, or repeated disconnects become free output.
 */
const BILLED_CHARS_PER_TOKEN = 4
const USAGE_TICK_MS = 500

/** Roughly 24k tokens of document. Beyond this an adversarial "make it much
 *  longer" sequence starts costing real money on input alone, every turn. */
const MAX_SNAPSHOT_CHARS = 90_000

export interface GenerateArgs {
  sessionId: string
  ipHash: string
  turnIndex: number
  userMessage: string
  signal?: AbortSignal
  emit: Emit
}

export interface GenerateResult {
  changed: boolean
  designId: string | null
}

/** One fallback per SESSION, not per turn: per-turn would let a visitor whose
 *  edits keep missing double the cost of every remaining turn. */
function fallbackKey(sessionId: string): string {
  return `vibe:fallback:${sessionId}`
}
function usedFallback(sessionId: string): boolean {
  const g = globalThis as typeof globalThis & { __hazlVibeFallbacks?: Set<string> }
  g.__hazlVibeFallbacks ??= new Set()
  return g.__hazlVibeFallbacks.has(fallbackKey(sessionId))
}
function markFallbackUsed(sessionId: string): void {
  const g = globalThis as typeof globalThis & { __hazlVibeFallbacks?: Set<string> }
  g.__hazlVibeFallbacks ??= new Set()
  g.__hazlVibeFallbacks.add(fallbackKey(sessionId))
}

/** Set once per process when the gateway rejects output_config, so we stop
 *  re-sending a parameter it does not implement. */
let effortRejected = false

export async function runTurn(args: GenerateArgs): Promise<GenerateResult> {
  const { sessionId, ipHash, turnIndex, userMessage, signal, emit } = args
  const client = getAnthropic()
  const model = getModel()
  const nonce = randomBytes(4).toString('hex')

  // Read the current document from disk. A missing file throws, which fails the
  // turn -- far better than silently rewriting from scratch at full price.
  const existing = await latestDesignHtml(sessionId)
  const mode: 'create' | 'edit' = existing ? 'edit' : 'create'

  if (existing && existing.html.length > MAX_SNAPSHOT_CHARS) {
    emit({
      type: 'error',
      code: 'bad_output',
      message: 'This design has grown too large to keep editing. Send it to our team and we will take it from here.',
    })
    return { changed: false, designId: null }
  }

  await recordFirstPrompt(sessionId, userMessage)
  await appendTurn({ sessionId, ipHash, role: 'user', content: userMessage })

  const history = await loadTurns(sessionId, 20)
  const messages: Anthropic.MessageParam[] = history.slice(0, -1).map((t) => ({
    role: t.role,
    content: t.content,
  }))

  // The document snapshot is rebuilt from disk every turn and the superseded
  // copies never enter history. Without this, history grows quadratically and the
  // fifth turn costs more than the first four combined.
  const parts = [
    existing ? currentDocumentBlock(existing.html) : null,
    nonceInstruction(nonce, mode),
    userMessage,
  ].filter(Boolean) as string[]
  messages.push({ role: 'user', content: parts.join('\n\n') })

  let attempt = 1
  let kind: UsageKind = mode === 'create' ? 'generate' : 'edit'

  for (let iteration = 0; iteration < 2; iteration++) {
    // Re-checked before EVERY call, including the fallback, reading live spend --
    // so two visitors generating at once cannot each sail past the ceiling.
    const { block } = await checkBudget(sessionId)
    if (block) {
      emit({ type: 'error', code: block, message: limitMessage(block) })
      return { changed: false, designId: null }
    }

    emit({
      type: 'status',
      phase: iteration === 0 ? 'thinking' : 'writing',
      label: iteration === 0 ? (mode === 'create' ? 'Designing your screen' : 'Making the change') : 'Rewriting the page',
    })

    const raw = await streamOnce({ client, model, messages, signal, emit, sessionId, turnIndex, kind, attempt })
    if (raw === null) return { changed: false, designId: null }

    const parsed = parseModelOutput(raw.text, nonce)
    if (parsed.note) emit({ type: 'note', delta: parsed.note })
    if (process.env.VIBE_DEBUG === '1') {
      console.log(
        `[vibe] parsed kind=${parsed.kind}` +
          (parsed.kind === 'edits' ? ` edits=${parsed.edits.length}` : '') +
          (parsed.kind === 'none' ? ` reason=${parsed.reason}` : ''),
      )
    }

    if (parsed.kind === 'document') {
      const saved = await persist(sessionId, turnIndex, parsed.html, emit)
      await appendTurn({ sessionId, ipHash, role: 'assistant', content: parsed.note || 'Updated the page.' })
      return { changed: true, designId: saved }
    }

    if (parsed.kind === 'edits' && existing) {
      emit({ type: 'status', phase: 'applying', label: 'Applying the change' })
      const applied = applyEdits(existing.html, parsed.edits, MAX_HTML_BYTES)
      if (applied.ok) {
        const saved = await persist(sessionId, turnIndex, applied.html, emit)
        await appendTurn({ sessionId, ipHash, role: 'assistant', content: parsed.note || 'Updated the page.' })
        return { changed: true, designId: saved }
      }

      // Logged unconditionally: the edit-vs-rewrite ratio is the single biggest
      // driver of what a session costs, and a silent fallback is invisible spend.
      console.warn(`[vibe] edit failed for session ${sessionId} turn ${turnIndex}: ${applied.reason}`)

      if (usedFallback(sessionId)) {
        emit({
          type: 'error',
          code: 'bad_output',
          message: "That change did not apply cleanly. Try describing it a different way.",
        })
        return { changed: false, designId: null }
      }

      // Recover by asking for a full rewrite, as a plain USER turn. Appending to
      // `messages` never invalidates the cached system prefix, so the
      // mid-conversation system message this originally used bought nothing and
      // is not supported on every gateway.
      markFallbackUsed(sessionId)
      messages.push({ role: 'assistant', content: raw.text.slice(0, 4_000) })
      messages.push({ role: 'user', content: fallbackInstruction(nonce, applied.reason) })
      kind = 'edit_fallback'
      attempt = 2
      continue
    }

    // Neither shape came back (or edits arrived with no document to patch).
    if (usedFallback(sessionId) || mode === 'create') {
      emit({ type: 'error', code: 'bad_output', message: 'The design came back malformed. Please try again.' })
      return { changed: false, designId: null }
    }
    markFallbackUsed(sessionId)
    const why = parsed.kind === 'none' ? parsed.reason : 'the reply contained edits but there is no page to edit yet'
    messages.push({ role: 'assistant', content: raw.text.slice(0, 4_000) })
    messages.push({ role: 'user', content: fallbackInstruction(nonce, why) })
    kind = 'edit_fallback'
    attempt = 2
  }

  emit({ type: 'error', code: 'bad_output', message: 'The design came back malformed. Please try again.' })
  return { changed: false, designId: null }
}

/** Sanitizes, writes to disk, records the row, and pushes the result to the client. */
async function persist(sessionId: string, turnIndex: number, html: string, emit: Emit): Promise<string> {
  const clean = sanitizeMockupHtml(html, { allowImageCdn: process.env.VIBE_ALLOW_IMAGE_CDN !== '0' })
  const title = extractTitle(html)
  const designId = randomUUID()
  const row = await saveDesign({ sessionId, turnIndex, designId, html: clean.html, title })
  emit({ type: 'html', designId: row.id, html: clean.html, title: row.title, bytes: clean.bytes })
  return row.id
}

interface StreamArgs {
  client: Anthropic
  model: string
  messages: Anthropic.MessageParam[]
  signal?: AbortSignal
  emit: Emit
  sessionId: string
  turnIndex: number
  kind: UsageKind
  attempt: number
}

/** One API call, fully billed whether or not it completes. Returns null when the
 *  turn cannot continue (the caller has already been told why). */
async function streamOnce(args: StreamArgs): Promise<{ text: string } | null> {
  const { client, model, messages, signal, emit } = args

  const system: Anthropic.TextBlockParam[] = [
    {
      type: 'text',
      text: SYSTEM_PROMPT,
      ...(cacheEnabled() ? { cache_control: { type: 'ephemeral' as const } } : {}),
    },
  ]

  const effort = effortRejected ? null : llmEffort()
  const params = {
    model,
    max_tokens: maxOutputTokens(),
    system,
    messages,
    thinking: { type: 'adaptive' as const },
    ...(effort ? { output_config: { effort } } : {}),
  } as Anthropic.MessageStreamParams

  let stream: ReturnType<Anthropic['messages']['stream']>
  try {
    stream = client.messages.stream(params, { signal })
  } catch (err) {
    if (isUnsupportedParamError(err, 'output_config', 'effort')) {
      effortRejected = true
      return streamOnce(args)
    }
    throw err
  }

  let text = ''
  stream.on('text', (delta: string) => {
    text += delta
  })

  const streamed: { usage: Anthropic.Usage | null; chars: number } = { usage: null, chars: 0 }
  let lastTick = 0
  const tick = (extraOutput: number, force = false) => {
    const now = Date.now()
    if (!force && now - lastTick < USAGE_TICK_MS) return
    lastTick = now
    const u = streamed.usage
    const input = u?.input_tokens ?? 0
    const cacheRead = u?.cache_read_input_tokens ?? 0
    const cacheWrite = u?.cache_creation_input_tokens ?? 0
    const output = (u?.output_tokens ?? 0) + extraOutput
    emit({
      type: 'usage_tick',
      inputTokens: input,
      outputTokens: output,
      cacheReadTokens: cacheRead,
      cacheCreationTokens: cacheWrite,
      totalTokens: input + output + cacheRead + cacheWrite,
    })
  }

  stream.on('streamEvent', (event: Anthropic.MessageStreamEvent) => {
    if (event.type === 'message_start') {
      streamed.usage = event.message.usage
      tick(0, true)
    } else if (event.type === 'message_delta' && streamed.usage) {
      streamed.usage = { ...streamed.usage, output_tokens: event.usage.output_tokens }
      streamed.chars = 0
      tick(0, true)
    } else if (event.type === 'content_block_delta') {
      const d = event.delta
      streamed.chars +=
        d.type === 'text_delta'
          ? d.text.length
          : d.type === 'input_json_delta'
            ? d.partial_json.length
            : d.type === 'thinking_delta'
              ? d.thinking.length
              : 0
      // message_delta only arrives at the very end, so without a character-based
      // estimate the counter would sit frozen through the whole generation.
      tick(Math.round(streamed.chars / CHARS_PER_TOKEN))
      emit({
        type: 'progress',
        bytes: text.length,
        pct: Math.min(96, Math.round((text.length / 18_000) * 100)),
      })
    }
  })

  let msg: Anthropic.Message
  try {
    msg = await stream.finalMessage()
  } catch (err) {
    if (isUnsupportedParamError(err, 'output_config', 'effort')) {
      effortRejected = true
      return streamOnce(args)
    }

    // The provider charged for whatever was streamed before the client hung up,
    // so bill an estimate. message_delta never arrived, so the only real figure
    // available is the near-zero one from message_start -- billing that would make
    // repeated disconnects a way to generate output for free.
    const partial = streamed.usage
    if (partial) {
      const estimated = Math.min(Math.floor(streamed.chars / BILLED_CHARS_PER_TOKEN), maxOutputTokens())
      await recordUsage({
        sessionId: args.sessionId,
        model,
        kind: args.kind,
        turnIndex: args.turnIndex,
        attempt: args.attempt,
        usage: { ...partial, output_tokens: Math.max(partial.output_tokens ?? 0, estimated) },
      }).catch((e: unknown) => console.error('[vibe] usage write failed on aborted stream:', e))
    }
    throw err
  }

  try {
    const { costUsd, usage } = await recordUsage({
      sessionId: args.sessionId,
      model,
      kind: args.kind,
      turnIndex: args.turnIndex,
      attempt: args.attempt,
      usage: msg.usage,
    })
    emit({ type: 'usage', costUsd, inputTokens: usage.input_tokens, outputTokens: usage.output_tokens })
  } catch (err) {
    // The budget gate sums this same table, so a swallowed write failure would
    // make spend invisible AND the gate blind at the same moment. Refuse to
    // continue rather than keep spending unmetered.
    if (err instanceof UsageWriteError) {
      console.error('[vibe]', err.message)
      emit({
        type: 'error',
        code: 'internal',
        message: 'We could not record usage for this request, so the studio has paused. Please try again shortly.',
      })
      return null
    }
    throw err
  }

  if (msg.stop_reason === 'max_tokens') {
    emit({
      type: 'error',
      code: 'max_tokens',
      message: 'That design got too large to finish. Try asking for something a little simpler.',
    })
    return null
  }

  return { text }
}
