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
 * Resolves the caller's address from proxy headers.
 *
 * VIBE_TRUST_PROXY must only be set where a proxy we control rewrites these
 * headers -- otherwise they are attacker-supplied and every per-IP cap is bypassed
 * by sending a different X-Forwarded-For each time.
 */
export function clientIp(req: Request): string {
  const h = req.headers
  const trustProxy = process.env.VIBE_TRUST_PROXY === '1'

  if (trustProxy) {
    // Set by Cloudflare when the record is proxied (orange cloud). Ours is
    // DNS-only today, so this is normally absent -- but if the proxy is ever
    // switched on, nginx MUST also be given Cloudflare's ranges via
    // ngx_http_realip_module, or every visitor collapses to one edge IP.
    const cf = h.get('cf-connecting-ip')?.trim()
    if (cf) return cf
    const real = h.get('x-real-ip')?.trim()
    if (real) return real
  }

  const xff = h.get('x-forwarded-for')
  if (xff) {
    const first = xff.split(',')[0]?.trim()
    if (first) return first
  }
  return 'unknown'
}

export function hashIp(ip: string): string {
  return createHmac('sha256', requireSalt()).update(normalizeIp(ip)).digest('hex')
}

export function requestIpHash(req: Request): string {
  return hashIp(clientIp(req))
}
