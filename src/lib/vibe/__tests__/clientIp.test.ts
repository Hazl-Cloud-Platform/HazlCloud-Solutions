import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { clientIp } from '../ip'

/**
 * These guard the finding that mattered most: forwarded headers are
 * attacker-supplied unless a proxy we control overwrites them, and reading them
 * anyway lets one person mint a fresh identity per request -- making every
 * per-IP cap and the admin login throttle decorative.
 */
const req = (headers: Record<string, string>) => new Request('https://example.test/api', { headers })

beforeEach(() => {
  delete process.env.VIBE_TRUST_PROXY
})
afterEach(() => {
  delete process.env.VIBE_TRUST_PROXY
})

describe('clientIp without a trusted proxy', () => {
  it('ignores X-Forwarded-For entirely', () => {
    expect(clientIp(req({ 'x-forwarded-for': '1.2.3.4' }))).toBe('unknown')
  })

  it('ignores CF-Connecting-IP', () => {
    expect(clientIp(req({ 'cf-connecting-ip': '1.2.3.4' }))).toBe('unknown')
  })

  it('ignores X-Real-IP', () => {
    expect(clientIp(req({ 'x-real-ip': '1.2.3.4' }))).toBe('unknown')
  })

  it('puts everyone in one bucket rather than giving everyone a free one', () => {
    const a = clientIp(req({ 'x-forwarded-for': '1.1.1.1' }))
    const b = clientIp(req({ 'x-forwarded-for': '2.2.2.2' }))
    expect(a).toBe(b)
  })
})

describe('clientIp behind a trusted proxy', () => {
  beforeEach(() => {
    process.env.VIBE_TRUST_PROXY = '1'
  })

  it('uses X-Real-IP, which nginx sets from $remote_addr', () => {
    expect(clientIp(req({ 'x-real-ip': '203.0.113.9' }))).toBe('203.0.113.9')
  })

  it('does NOT prefer a client-supplied CF-Connecting-IP over X-Real-IP', () => {
    // Cloudflare is grey-cloud, so nothing legitimate sets this header and nginx
    // clears it. Trusting it ahead of X-Real-IP was the actual bypass.
    expect(clientIp(req({ 'cf-connecting-ip': '9.9.9.9', 'x-real-ip': '203.0.113.9' }))).toBe('203.0.113.9')
  })

  it('does not fall back to X-Forwarded-For when X-Real-IP is absent', () => {
    // $proxy_add_x_forwarded_for APPENDS to the client's value, so the leftmost
    // entry stays attacker-controlled.
    expect(clientIp(req({ 'x-forwarded-for': '9.9.9.9, 203.0.113.9' }))).toBe('unknown')
  })
})
