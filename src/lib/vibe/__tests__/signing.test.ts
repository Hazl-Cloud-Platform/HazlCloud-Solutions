import { beforeEach, describe, expect, it } from 'vitest'
import { nowSeconds, signToken, verifyToken } from '../signing'

beforeEach(() => {
  process.env.VIBE_SESSION_SECRET = 'a'.repeat(64)
  process.env.VIBE_ADMIN_SESSION_SECRET = 'b'.repeat(64)
})

const claims = () => ({ sub: 'someone', iat: nowSeconds(), exp: nowSeconds() + 3600 })

describe('signToken / verifyToken', () => {
  it('round-trips valid claims', () => {
    const t = signToken('sid', claims())
    expect(verifyToken('sid', t)?.sub).toBe('someone')
  })

  it('rejects a tampered payload', () => {
    const t = signToken('sid', claims())
    const [payload, sig] = t.split('.')
    const flipped = Buffer.from(payload, 'base64url').toString('utf8').replace('someone', 'someoneX')
    expect(verifyToken('sid', `${Buffer.from(flipped).toString('base64url')}.${sig}`)).toBeNull()
  })

  it('rejects a flipped signature character', () => {
    const t = signToken('sid', claims())
    const bad = t.slice(0, -1) + (t.at(-1) === 'A' ? 'B' : 'A')
    expect(verifyToken('sid', bad)).toBeNull()
  })

  it('rejects an expired token even though the cookie Max-Age is only advisory', () => {
    // A client can keep sending a cookie past Max-Age, so expiry must be signed
    // and verified rather than trusted to the browser.
    const t = signToken('sid', { sub: 'x', iat: nowSeconds() - 7200, exp: nowSeconds() - 60 })
    expect(verifyToken('sid', t)).toBeNull()
  })

  it('does not accept a visitor token as an admin token', () => {
    // Domain separation: different secret AND a purpose string in the MAC input.
    const visitor = signToken('sid', claims())
    expect(verifyToken('admin', visitor)).toBeNull()
  })

  it('does not accept an admin token as a visitor token', () => {
    expect(verifyToken('sid', signToken('admin', claims()))).toBeNull()
  })

  it('rejects malformed input without throwing', () => {
    for (const bad of ['', 'nodot', '.', 'a.b.c', 'x'.repeat(500), undefined, null]) {
      expect(() => verifyToken('sid', bad as string)).not.toThrow()
      expect(verifyToken('sid', bad as string)).toBeNull()
    }
  })

  it('rejects a token signed with a different secret', () => {
    const t = signToken('sid', claims())
    process.env.VIBE_SESSION_SECRET = 'c'.repeat(64)
    expect(verifyToken('sid', t)).toBeNull()
  })

  it('carries the admin epoch so all sessions can be revoked at once', () => {
    const t = signToken('admin', { ...claims(), epoch: 3 })
    expect(verifyToken('admin', t)?.epoch).toBe(3)
  })
})
