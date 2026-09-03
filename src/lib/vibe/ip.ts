import { createHmac } from 'node:crypto'

/**
 * Client IP handling. Raw addresses are never stored -- only an HMAC -- which keeps
 * per-IP rate limiting working without holding personal data about visitors who
 * never gave us anything.
 */

function requireSalt(): string {
  const salt = process.env.VIBE_IP_SALT
  if (!salt) throw new Error('VIBE_IP_SALT is not set')
  return salt
}

/**
 * Collapses an address to the block a single customer actually controls.
 *
 * This is what makes per-IP caps mean anything. A residential IPv6 customer is
 * handed a /64 -- 2^64 addresses -- and can present a fresh one on every request
 * for free, so hashing the full address would make every cap decorative. IPv4 is
 * already effectively per-host.
 */
export function normalizeIp(raw: string): string {
  const ip = raw.trim().toLowerCase()
  if (!ip) return 'unknown'

  // ::ffff:1.2.3.4 -- IPv4 wearing an IPv6 hat.
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(ip)
  if (mapped) return mapped[1]

  if (!ip.includes(':')) return ip // IPv4: /32

  // IPv6 -> /64. Expand '::' just far enough to read the first four groups.
  const [head, tail = ''] = ip.split('::')
  const headGroups = head ? head.split(':').filter(Boolean) : []
  const tailGroups = tail ? tail.split(':').filter(Boolean) : []
  const missing = 8 - headGroups.length - tailGroups.length
  const groups = ip.includes('::')
    ? [...headGroups, ...Array(Math.max(0, missing)).fill('0'), ...tailGroups]
    : ip.split(':')
  const prefix = groups.slice(0, 4).map((g) => (g || '0').padStart(4, '0'))
  return prefix.length === 4 ? `${prefix.join(':')}::/64` : ip
}

/**
 * Resolves the caller's address.
 *
 * Forwarded headers are attacker-supplied unless a proxy WE control overwrites
 * them, so this is deliberately exclusive rather than a fallback chain: reading
 * `x-forwarded-for` when we are not behind a trusted proxy would let anyone mint
 * a fresh identity per request and make every per-IP cap decorative.
 *
 * VIBE_TRUST_PROXY=1 requires nginx to SET (not append) the header:
 *
 *   proxy_set_header X-Real-IP        $remote_addr;
 *   proxy_set_header X-Forwarded-For  $remote_addr;
 *   proxy_set_header CF-Connecting-IP "";
 *
 * `$proxy_add_x_forwarded_for` APPENDS to whatever the client sent, so the
 * left-most entry would still be attacker-controlled -- which is why only
 * `x-real-ip` is trusted here.
 */
export function clientIp(req: Request): string {
  if (process.env.VIBE_TRUST_PROXY !== '1') {
    // Direct exposure (or an untrusted proxy). There is no header we can believe,
    // so everyone shares one bucket rather than everyone getting a free one.
    return 'unknown'
  }

  const real = req.headers.get('x-real-ip')?.trim()
  if (real) return real

  // Only meaningful once nginx's real_ip block is enabled for Cloudflare's
  // ranges; until then $remote_addr already IS the visitor and x-real-ip covers
  // it. Deliberately not consulted before x-real-ip: an unproxied deployment
  // forwards this header verbatim from the client.
  return 'unknown'
}

export function hashIp(ip: string): string {
  return createHmac('sha256', requireSalt()).update(normalizeIp(ip)).digest('hex')
}

export function requestIpHash(req: Request): string {
  return hashIp(clientIp(req))
}
