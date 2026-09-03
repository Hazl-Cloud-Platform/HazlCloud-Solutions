import { describe, expect, it } from 'vitest'
import { LockTimeoutError, SLOTS_FULL, tryWithLock, withGlobalSlot, withLock } from '../mutex'

const tick = (ms = 5) => new Promise((r) => setTimeout(r, ms))

describe('withLock', () => {
  it('serializes concurrent callers on the same key', async () => {
    const order: string[] = []
    await Promise.all([
      withLock('k1', async () => {
        order.push('a-start')
        await tick(20)
        order.push('a-end')
      }),
      withLock('k1', async () => {
        order.push('b-start')
        order.push('b-end')
      }),
    ])
    expect(order).toEqual(['a-start', 'a-end', 'b-start', 'b-end'])
  })

  it('does not serialize different keys', async () => {
    const order: string[] = []
    await Promise.all([
      withLock('x', async () => {
        await tick(20)
        order.push('x')
      }),
      withLock('y', async () => {
        order.push('y')
      }),
    ])
    expect(order).toEqual(['y', 'x'])
  })

  it('releases the lock when the body throws', async () => {
    await expect(withLock('boom', async () => { throw new Error('nope') })).rejects.toThrow('nope')
    // If the release were skipped this would hang rather than resolve.
    await expect(withLock('boom', async () => 'ok')).resolves.toBe('ok')
  })

  it('frees the key after a wait timeout instead of wedging it forever', async () => {
    // The bug: the timeout path threw without removing its own map entry, so the
    // key stayed occupied for the life of the process and tryWithLock refused it.
    const held = withLock('slow', async () => {
      await tick(60)
      return 'done'
    })
    await expect(withLock('slow', async () => 'never', 10)).rejects.toThrow(LockTimeoutError)
    await expect(held).resolves.toBe('done')
    await tick(20)
    await expect(tryWithLock('slow', async () => 'reusable')).resolves.toBe('reusable')
  })
})

describe('tryWithLock', () => {
  it('returns null instead of queueing behind a running turn', async () => {
    let release: () => void = () => {}
    const gate = new Promise<void>((r) => (release = r))
    const running = tryWithLock('busy', async () => {
      await gate
      return 'first'
    })
    await tick()
    expect(await tryWithLock('busy', async () => 'second')).toBeNull()
    release()
    expect(await running).toBe('first')
  })
})

describe('withGlobalSlot', () => {
  it('returns a distinct sentinel when full, not null', async () => {
    // tryWithLock also returns null; collapsing the two made "the studio is
    // busy" unreachable and told visitors the wrong thing.
    let release: () => void = () => {}
    const gate = new Promise<void>((r) => (release = r))
    const held = withGlobalSlot(1, async () => {
      await gate
      return 'held'
    })
    await tick()
    expect(await withGlobalSlot(1, async () => 'nope')).toBe(SLOTS_FULL)
    release()
    await held
  })

  it('returns the permit even when the body throws', async () => {
    await expect(withGlobalSlot(1, async () => { throw new Error('x') })).rejects.toThrow('x')
    // A leaked permit would wedge the studio at "busy" permanently.
    expect(await withGlobalSlot(1, async () => 'ok')).toBe('ok')
  })
})
