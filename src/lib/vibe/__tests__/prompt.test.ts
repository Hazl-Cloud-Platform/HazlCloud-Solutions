import { describe, expect, it } from 'vitest'
import { SYSTEM_PROMPT, fallbackInstruction, truncationInstruction } from '../prompt'
import { MIN_SEARCH_CHARS } from '../edits'

describe('SYSTEM_PROMPT invariants', () => {
  it('stays above the minimum cacheable prefix', () => {
    // The prompt is the only cached block of every request. Below Opus 4.8's
    // 1024-token minimum, caching stops SILENTLY -- no error, just a ~10x rise in
    // per-turn input cost that nothing else in the system would report.
    expect(SYSTEM_PROMPT.length).toBeGreaterThan(4_500)
  })

  it('quotes the same SEARCH minimum the parser enforces', () => {
    // The number lives in two files ~100 lines apart and nothing else keeps them
    // equal. Drift means the model is told a rule the code will not honour, and
    // every violation costs a full rewrite instead of a cheap edit.
    expect(SYSTEM_PROMPT).toContain(`at least ${MIN_SEARCH_CHARS} characters`)
  })

  it('names the routing techniques that are dead in the preview frame', () => {
    // All three fail SILENTLY in a sandboxed opaque-origin srcdoc frame. If a
    // future edit tidies this explanation away, the model will happily go back to
    // :target routing and every nav item will stop working with no error anywhere.
    expect(SYSTEM_PROMPT).toContain('pushState')
    expect(SYSTEM_PROMPT).toContain('hashchange')
    expect(SYSTEM_PROMPT).toContain(':target')
  })

  it('specifies exactly one page-switching mechanism', () => {
    expect(SYSTEM_PROMPT).toContain('data-page')
    expect(SYSTEM_PROMPT).toContain('data-nav')
    expect(SYSTEM_PROMPT).toContain('aria-current')
    // The router must be in the body: sanitizeMockupHtml rebuilds <head> and a
    // script placed there is dropped without a trace.
    expect(SYSTEM_PROMPT).toContain('END of the body')
  })

  it('requires every nav item to lead somewhere', () => {
    // The whole point of the feature. Without this the model draws the sidebar as
    // decoration, which is the bug being fixed.
    expect(SYSTEM_PROMPT).toContain('must lead somewhere real')
  })

  it('is a valid template literal body -- no stray backtick or dollar', () => {
    // A backtick would end the literal and a `${` would become an interpolation.
    // The prompt now carries ~2k chars of HTML and JavaScript, which is exactly
    // where one gets typed.
    expect(SYSTEM_PROMPT).not.toContain('`')
    expect(SYSTEM_PROMPT).not.toContain('${')
  })
})

describe('truncationInstruction', () => {
  it('carries the nonce and asks for a complete document', () => {
    const out = truncationInstruction('abc123')
    expect(out).toContain('===HTML_BEGIN_abc123===')
    expect(out).toContain('===HTML_END_abc123===')
  })

  it('names a page count rather than asking for "shorter"', () => {
    // The model cannot judge its own remaining output budget, so a concrete
    // ceiling is the only instruction that reliably changes the outcome.
    expect(truncationInstruction('n')).toContain('AT MOST TWO')
  })

  it('repeats the nav invariant so cutting pages does not strand nav items', () => {
    expect(truncationInstruction('n')).toContain('only the pages you actually build')
  })

  it('is distinct from the edit fallback', () => {
    expect(truncationInstruction('n')).not.toEqual(fallbackInstruction('n', 'x'))
  })
})
