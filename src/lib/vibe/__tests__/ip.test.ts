import { describe, expect, it } from 'vitest'
import { normalizeIp } from '../ip'

describe('normalizeIp', () => {
  it('keeps IPv4 addresses intact', () => {
    expect(normalizeIp('203.0.113.7')).toBe('203.0.113.7')
  })

  it('unwraps IPv4-mapped IPv6', () => {
    expect(normalizeIp('::ffff:203.0.113.7')).toBe('203.0.113.7')
  })

  it('collapses IPv6 to a /64 so a single customer cannot rotate past the cap', () => {
    // A residential IPv6 customer holds a whole /64 -- 2^64 addresses, free to
    // change per request. Hashing the full address makes every per-IP cap
    // decorative; these two must land on the same bucket.
    const a = normalizeIp('2001:db8:abcd:1234:0000:0000:0000:0001')
    const b = normalizeIp('2001:db8:abcd:1234:ffff:ffff:ffff:9999')
    expect(a).toBe(b)
    expect(a).toBe('2001:0db8:abcd:1234::/64')
  })

  it('separates genuinely different /64s', () => {
    expect(normalizeIp('2001:db8:abcd:1234::1')).not.toBe(normalizeIp('2001:db8:abcd:9999::1'))
  })

  it('expands :: shorthand before slicing the prefix', () => {
    expect(normalizeIp('2001:db8::1')).toBe('2001:0db8:0000:0000::/64')
  })

  it('is case-insensitive so one host cannot occupy two buckets', () => {
    expect(normalizeIp('2001:DB8:ABCD:1234::1')).toBe(normalizeIp('2001:db8:abcd:1234::1'))
  })

  it('degrades to a stable token for a missing address', () => {
    expect(normalizeIp('')).toBe('unknown')
  })
})
