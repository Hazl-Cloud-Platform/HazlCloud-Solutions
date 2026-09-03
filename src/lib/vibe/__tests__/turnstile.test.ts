import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { turnstileRequired, verifyTurnstile } from '../turnstile'

const ORIGINAL_ENV = { ...process.env }

function mockSiteverify(body: Record<string, unknown>) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } })),
  )
}

beforeEach(() => {
  process.env.TURNSTILE_SECRET_KEY = 'test-secret'
  process.env.NEXT_PUBLIC_SITE_URL = 'https://www.hazlsolutions.com'
})

afterEach(() => {
  vi.unstubAllGlobals()
  process.env = { ...ORIGINAL_ENV }
})

const verify = () =>
  verifyTurnstile({ token: 'tok', idempotencyKey: 'k', expectedAction: 'vibe_generate' })

describe('hostname binding', () => {
  it('accepts a token minted on our own host', async () => {
    mockSiteverify({ success: true, hostname: 'www.hazlsolutions.com', action: 'vibe_generate' })
    await expect(verify()).resolves.toMatchObject({ ok: true })
  })

  it('rejects a token minted on someone else’s host', async () => {
    mockSiteverify({ success: true, hostname: 'attacker.test', action: 'vibe_generate' })
    await expect(verify()).resolves.toMatchObject({ ok: false })
  })

  it('rejects a localhost token in production', async () => {
    // The widget allowlists localhost so development works, which means anyone
    // can render OUR public site key locally and mint real tokens. Accepting
    // hostname 'localhost' in production is a trivial bypass of the whole check.
    vi.stubEnv('NODE_ENV', 'production')
    expect(turnstileRequired()).toBe(true)
    mockSiteverify({ success: true, hostname: 'localhost', action: 'vibe_generate' })
    const res = await verify()
    expect(res.ok).toBe(false)
    expect(res.reason).toContain('hostname-mismatch')
  })

  it('accepts a localhost token outside production', async () => {
    mockSiteverify({ success: true, hostname: 'localhost', action: 'vibe_generate' })
    await expect(verify()).resolves.toMatchObject({ ok: true })
  })
})

describe('fail-closed behaviour', () => {
  it('rejects a missing token', async () => {
    await expect(
      verifyTurnstile({ token: null, idempotencyKey: 'k' }),
    ).resolves.toMatchObject({ ok: false, reason: 'missing-input-response' })
  })

  it('treats an unreachable siteverify as a failure, never a pass', async () => {
    // A Cloudflare blip must not become an hour of unmetered LLM access.
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network down') }))
    await expect(verify()).resolves.toMatchObject({ ok: false, reason: 'verification-unavailable' })
  })

  it('surfaces Cloudflare error codes', async () => {
    mockSiteverify({ success: false, 'error-codes': ['timeout-or-duplicate'] })
    await expect(verify()).resolves.toMatchObject({ ok: false, reason: 'timeout-or-duplicate' })
  })

  it('rejects a mismatched action', async () => {
    mockSiteverify({ success: true, hostname: 'www.hazlsolutions.com', action: 'something_else' })
    await expect(verify()).resolves.toMatchObject({ ok: false })
  })

  it('requires the secret in production rather than skipping the check', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    delete process.env.TURNSTILE_SECRET_KEY
    await expect(verify()).resolves.toMatchObject({ ok: false, reason: 'not-configured' })
  })
})
