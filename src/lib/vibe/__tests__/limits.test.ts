import { describe, expect, it } from 'vitest'
import { MAX_TURNS_PER_IP, ipTurnCap, spellCount, turnCapMessage } from '../limits'
import {
  DEFAULT_MAX_TURNS_PER_SESSION,
  MAX_TURNS_PER_SESSION_CEILING,
  validateMaxTurnsPerSession,
} from '../settings'

describe('ipTurnCap', () => {
  it('keeps the baseline while the session allowance is under it', () => {
    expect(ipTurnCap(DEFAULT_MAX_TURNS_PER_SESSION)).toBe(MAX_TURNS_PER_IP)
  })

  it('rises with a session allowance above the baseline', () => {
    // The bug this exists to prevent: an admin sets 20 changes per session, the
    // per-IP daily cap stays at 12, and the studio refuses turn 13 with a message
    // about a daily limit that appears nowhere in the console.
    expect(ipTurnCap(MAX_TURNS_PER_SESSION_CEILING)).toBe(MAX_TURNS_PER_SESSION_CEILING)
  })
})

describe('turnCapMessage', () => {
  it('names the allowance actually in force', () => {
    expect(turnCapMessage(5)).toContain('five free changes')
    expect(turnCapMessage(8)).toContain('eight free changes')
  })

  it('is singular at one', () => {
    expect(turnCapMessage(1)).toContain('one free change')
  })

  it('falls back to digits past the words it knows', () => {
    expect(spellCount(20)).toBe('twenty')
    expect(spellCount(21)).toBe('21')
    expect(spellCount(2.5)).toBe('2.5')
  })
})

describe('validateMaxTurnsPerSession', () => {
  it('accepts a whole number in range', () => {
    expect(validateMaxTurnsPerSession(7)).toEqual({ ok: true, value: 7 })
    expect(validateMaxTurnsPerSession('7')).toEqual({ ok: true, value: 7 })
  })

  it('rejects a fraction', () => {
    // 2.5 would let a session claim its third change and then refuse the fourth.
    expect(validateMaxTurnsPerSession(2.5).ok).toBe(false)
  })

  it('rejects zero, negatives and anything past the ceiling', () => {
    expect(validateMaxTurnsPerSession(0).ok).toBe(false)
    expect(validateMaxTurnsPerSession(-1).ok).toBe(false)
    expect(validateMaxTurnsPerSession(MAX_TURNS_PER_SESSION_CEILING + 1).ok).toBe(false)
  })

  it('rejects junk rather than coercing it', () => {
    expect(validateMaxTurnsPerSession('lots').ok).toBe(false)
    expect(validateMaxTurnsPerSession(null).ok).toBe(false)
    expect(validateMaxTurnsPerSession(undefined).ok).toBe(false)
  })
})
