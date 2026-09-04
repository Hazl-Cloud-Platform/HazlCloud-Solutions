import { describe, expect, it } from 'vitest'
// Importing ../designs is safe despite its ./db import: db.ts only calls
// pg.types.setTypeParser at module scope and getPool() is lazy, so nothing tries
// to reach a database. partitionForDiscard is split out of discardSessionDesigns
// precisely so this decision can be tested without one.
import { partitionForDiscard } from '../designs'

const row = (id: string, has_lead: boolean) => ({ id, has_lead })

describe('partitionForDiscard', () => {
  it('returns nothing for a session that never generated', () => {
    expect(partitionForDiscard([])).toEqual({ remove: [], archive: [] })
  })

  it('destroys every design when no lead points at one', () => {
    // The ordinary case: the visitor discards, and it is genuinely unrecoverable.
    const result = partitionForDiscard([row('a', false), row('b', false), row('c', false)])
    expect(result).toEqual({ remove: ['a', 'b', 'c'], archive: [] })
  })

  it('destroys the whole lineage, not just the newest', () => {
    // latestDesign() orders by turn_index DESC, so removing only the last design
    // would promote the previous turn's page and turn this into an undo.
    const { remove } = partitionForDiscard([row('turn0', false), row('turn1', false)])
    expect(remove).toHaveLength(2)
  })

  it('archives rather than destroys a design a lead references', () => {
    // ContactModal promises "we've saved your design", and staleDesignIds() already
    // exempts lead-attached designs from the retention purge.
    const result = partitionForDiscard([row('a', true), row('b', true)])
    expect(result).toEqual({ remove: [], archive: ['a', 'b'] })
  })

  it('splits a mixed lineage and preserves turn order in each bucket', () => {
    // Order matters: discardSessionDesigns deletes oldest-first so a partial
    // failure leaves the NEWEST design intact and the UI still truthful.
    const result = partitionForDiscard([
      row('turn0', false),
      row('turn1', true),
      row('turn2', false),
      row('turn3', true),
    ])
    expect(result).toEqual({ remove: ['turn0', 'turn2'], archive: ['turn1', 'turn3'] })
  })
})
