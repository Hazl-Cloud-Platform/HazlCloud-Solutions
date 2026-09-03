import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { assertSameOrigin } from '../http'

const SITE = 'https://www.hazlsolutions.com'
const post = (headers: Record<string, string>) => new Request(`${SITE}/api/vibe/chat`, { method: 'POST', headers })

beforeEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = SITE
})
afterEach(() => {
  delete process.env.NEXT_PUBLIC_SITE_URL
  delete process.env.NODE_ENV_OVERRIDE
})

describe('assertSameOrigin', () => {
  it('accepts a matching Origin', () => {
    expect(assertSameOrigin(post({ origin: SITE }))).toBe(true)
  })

  it('rejects a different origin', () => {
    expect(assertSameOrigin(post({ origin: 'https://evil.test' }))).toBe(false)
  })

  it('rejects an origin that merely starts with ours', () => {
    // A startsWith() check would accept this.
    expect(assertSameOrigin(post({ origin: 'https://www.hazlsolutions.com.evil.tld' }))).toBe(false)
  })

  it('rejects a subdomain', () => {
    expect(assertSameOrigin(post({ origin: 'https://x.www.hazlsolutions.com' }))).toBe(false)
  })

  it('rejects a scheme downgrade', () => {
    expect(assertSameOrigin(post({ origin: 'http://www.hazlsolutions.com' }))).toBe(false)
  })

  it('rejects a request with no Origin and no Referer', () => {
    expect(assertSameOrigin(post({}))).toBe(false)
  })

  it('falls back to a same-origin Referer', () => {
    expect(assertSameOrigin(post({ referer: `${SITE}/startup/studio` }))).toBe(true)
  })

  it('rejects a cross-origin Referer', () => {
    expect(assertSameOrigin(post({ referer: 'https://evil.test/page' }))).toBe(false)
  })

  it('rejects garbage in the Origin header without throwing', () => {
    expect(() => assertSameOrigin(post({ origin: 'not a url' }))).not.toThrow()
    expect(assertSameOrigin(post({ origin: 'not a url' }))).toBe(false)
  })

  it('is permissive only when the site URL is unconfigured outside production', () => {
    // Failing OPEN in production would silently disable the check on every
    // mutating route, which is the thing this function exists to prevent.
    delete process.env.NEXT_PUBLIC_SITE_URL
    expect(assertSameOrigin(post({ origin: 'https://evil.test' }))).toBe(true) // test env
  })
})
