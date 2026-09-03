/**
 * Per-key promise-chain mutex, shared across bundles via globalThis so Next's
 * module reloading cannot hand out two independent lock tables.
 *
 * Ported from NDTG-IDI's src/lib/mutex.ts WITH A BUG FIX. The original wrote the
 * chained promise into the map but compared the RAW one when cleaning up:
 *
 *     map.set(key, prev.then(() => current))
 *     finally { if (map.get(key) === current) map.delete(key) }   // never equal
 *
 * so the delete never fired. There the key space was projects -- bounded, so it
 * never showed. Here the key is a fresh UUID per anonymous visitor on a
 * long-lived VM process, and the Map would grow forever.
 */

type Chain = Promise<void>

function locks(): Map<string, Chain> {
  const g = globalThis as typeof globalThis & { __hazlVibeLocks?: Map<string, Chain> }
  g.__hazlVibeLocks ??= new Map()
  return g.__hazlVibeLocks
}

export class LockTimeoutError extends Error {
  constructor(key: string) {
    super(`Timed out waiting for lock ${key}`)
    this.name = 'LockTimeoutError'
  }
}

/**
 * Runs `fn` with exclusive access to `key`, queueing behind anyone already holding
 * it. `timeoutMs` bounds the WAIT (not fn itself) so one hung upstream call cannot
 * wedge a session forever.
 */
export async function withLock<T>(key: string, fn: () => Promise<T>, timeoutMs = 120_000): Promise<T> {
  const map = locks()
  const prev = map.get(key) ?? Promise.resolve()

  let release!: () => void
  const current = new Promise<void>((r) => (release = r))
  const next = prev.then(() => current)
  map.set(key, next)

  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    await Promise.race([
      prev,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new LockTimeoutError(key)), timeoutMs)
      }),
    ])
  } catch (err) {
    // We never acquired it, but `next` is already in the map and the chain is
    // waiting on `current` -- release so the queue behind us is not stranded.
    release()
    if (timer) clearTimeout(timer)
    throw err
  }
  if (timer) clearTimeout(timer)

  try {
    return await fn()
  } finally {
    release()
    // Compare against the promise actually stored, not `current`.
    if (map.get(key) === next) map.delete(key)
  }
}

/**
 * Non-blocking variant. Returns null instead of queueing, so a double-submit is
 * rejected immediately rather than running later and spending budget twice.
 */
export async function tryWithLock<T>(key: string, fn: () => Promise<T>): Promise<T | null> {
  const map = locks()
  if (map.has(key)) return null
  return withLock(key, fn)
}

/**
 * Counting semaphore bounding concurrent LLM calls process-wide. Acquired AFTER
 * the per-session lock: the other order lets one visitor's rapid submits eat every
 * permit while they queue on their own session, returning `busy` to everyone else.
 */
export async function withGlobalSlot<T>(limit: number, fn: () => Promise<T>): Promise<T | null> {
  const g = globalThis as typeof globalThis & { __hazlVibeSlots?: { n: number } }
  g.__hazlVibeSlots ??= { n: 0 }
  const slots = g.__hazlVibeSlots
  if (slots.n >= limit) return null
  slots.n += 1
  try {
    return await fn()
  } finally {
    // Must be in `finally`: a throw that skipped this would permanently leak a
    // permit, and `limit` errors would wedge the studio at "busy" forever.
    slots.n -= 1
  }
}
