import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from '../adminAuth'

describe('password hashing', () => {
  it('round-trips a correct password', async () => {
    const hash = await hashPassword('correct horse battery staple')
    await expect(verifyPassword('correct horse battery staple', hash)).resolves.toBe(true)
  })

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('correct horse battery staple')
    await expect(verifyPassword('Correct horse battery staple', hash)).resolves.toBe(false)
  })

  it('produces a different hash each time (per-hash salt)', async () => {
    const [a, b] = await Promise.all([hashPassword('same'), hashPassword('same')])
    expect(a).not.toBe(b)
    await expect(verifyPassword('same', a)).resolves.toBe(true)
    await expect(verifyPassword('same', b)).resolves.toBe(true)
  })

  it('normalises unicode so a differently-composed password still matches', async () => {
    const hash = await hashPassword('café-pass')
    await expect(verifyPassword('café-pass', hash)).resolves.toBe(true)
  })

  it('returns false rather than throwing on a malformed stored hash', async () => {
    for (const bad of ['', 'garbage', 'bcrypt$1$2$3$4', 'scrypt$notanumber$8$1$AAAA$BBBB']) {
      await expect(verifyPassword('anything', bad)).resolves.toBe(false)
    }
  })

  it('rejects an empty salt/key, which would otherwise accept ANY password', async () => {
    // Both fields empty parse to zero-length buffers; scrypt returns a
    // zero-length key and timingSafeEqual(empty, empty) is true. A truncated or
    // hand-edited VIBE_ADMIN_PASSWORD_HASH would become an open door.
    await expect(verifyPassword('literally anything', 'scrypt$16384$8$1$$')).resolves.toBe(false)
    await expect(verifyPassword('x', 'scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$')).resolves.toBe(false)
    await expect(verifyPassword('x', 'scrypt$16384$8$1$$QUJD')).resolves.toBe(false)
  })

  it('rejects parameters that would exceed Node maxmem instead of throwing', async () => {
    await expect(verifyPassword('x', 'scrypt$1048576$8$1$QUJDREVGR0g=$QUJDREVGR0hJSktMTU5PUA==')).resolves.toBe(false)
  })

  it('rejects a hash claiming a different scheme', async () => {
    const hash = (await hashPassword('x')).replace('scrypt$', 'argon2$')
    await expect(verifyPassword('x', hash)).resolves.toBe(false)
  })

  it('uses parameters that stay under Node default maxmem', async () => {
    // 128 * N * r must be < 32 MiB or scrypt throws at runtime rather than at
    // review time.
    const [, N, r] = (await hashPassword('x')).split('$')
    expect(128 * Number(N) * Number(r)).toBeLessThan(32 * 1024 * 1024)
  })
})
