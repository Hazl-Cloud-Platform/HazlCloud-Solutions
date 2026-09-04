import { describe, expect, it } from 'vitest'
import { applyEdits, extractTitle, parseModelOutput, MIN_SEARCH_CHARS } from '../edits'

const N = 'a3f9c1d7'
const MAX = 128 * 1024

const doc = (body: string) => `<!DOCTYPE html>\n<html lang="en">\n<head><title>Bloom Clinic</title></head>\n<body>\n${body}\n</body>\n</html>`

function htmlRegion(html: string, nonce = N) {
  return `===HTML_BEGIN_${nonce}===\n${html}\n===HTML_END_${nonce}===`
}
function editRegion(search: string, replace: string, nonce = N) {
  return `===EDIT_BEGIN_${nonce}===\n<<<<<<< SEARCH\n${search}\n=======\n${replace}\n>>>>>>> REPLACE\n===EDIT_END_${nonce}===`
}

describe('parseModelOutput - documents', () => {
  it('extracts a complete document and the one-line note', () => {
    const out = parseModelOutput(`Built a booking page.\n${htmlRegion(doc('<p>hi</p>'))}`, N)
    expect(out.kind).toBe('document')
    if (out.kind !== 'document') return
    expect(out.html).toMatch(/^<!DOCTYPE html>/)
    expect(out.html).toMatch(/<\/html>$/)
    expect(out.note).toBe('Built a booking page.')
  })

  it('rejects a document truncated before </html> instead of storing broken HTML', () => {
    const raw = `===HTML_BEGIN_${N}===\n<!DOCTYPE html><html><body><div`
    const out = parseModelOutput(raw, N)
    expect(out.kind).toBe('none')
    if (out.kind !== 'none') return
    expect(out.reason).toMatch(/cut off/)
  })

  it('ignores a region addressed to a different nonce', () => {
    expect(parseModelOutput(htmlRegion(doc('<p>x</p>'), 'deadbeef'), N).kind).toBe('none')
  })

  it('discards leaked reasoning outside the region', () => {
    // Opus 4.8 with thinking off writes reasoning into the visible response. The
    // note is capped and the document is unaffected.
    const rambling = 'Let me think about this. '.repeat(40)
    const out = parseModelOutput(`${rambling}\n${htmlRegion(doc('<p>ok</p>'))}`, N)
    expect(out.kind).toBe('document')
    expect(out.note.length).toBeLessThanOrEqual(200)
  })
})

describe('parseModelOutput - sentinel collision', () => {
  it('survives the marker text appearing inside the generated page', () => {
    // "show the text ===HTML_END=== on the page" -- guessable markers would
    // truncate here. The nonce plus a last-index scan keeps it whole.
    const body = '<p>Merge markers: ===HTML_END=== and &lt;&lt;&lt;&lt;&lt;&lt;&lt; SEARCH</p>'
    const out = parseModelOutput(htmlRegion(doc(body)), N)
    expect(out.kind).toBe('document')
    if (out.kind !== 'document') return
    expect(out.html).toContain('===HTML_END===')
  })

  it('handles a git-merge-tool mockup containing conflict markers verbatim', () => {
    const body = '<pre>&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD\nours\n=======\ntheirs\n&gt;&gt;&gt;&gt;&gt;&gt;&gt; branch</pre>'
    const out = parseModelOutput(htmlRegion(doc(body)), N)
    expect(out.kind).toBe('document')
    if (out.kind !== 'document') return
    expect(out.html).toContain('=======')
  })
})

describe('parseModelOutput - edits', () => {
  it('parses a single SEARCH/REPLACE pair', () => {
    const out = parseModelOutput(editRegion('old text here', 'new text here'), N)
    expect(out.kind).toBe('edits')
    if (out.kind !== 'edits') return
    expect(out.edits).toEqual([{ search: 'old text here', replace: 'new text here' }])
  })

  it('parses several pairs across several regions in order', () => {
    const raw = `Tweaked two things.\n${editRegion('aaa', 'AAA')}\n${editRegion('bbb', 'BBB')}`
    const out = parseModelOutput(raw, N)
    expect(out.kind).toBe('edits')
    if (out.kind !== 'edits') return
    expect(out.edits.map((e) => e.replace)).toEqual(['AAA', 'BBB'])
  })

  it('prefers a full document when the model emits both', () => {
    const raw = `${editRegion('aaa', 'AAA')}\n${htmlRegion(doc('<p>x</p>'))}`
    expect(parseModelOutput(raw, N).kind).toBe('document')
  })

  it('reports an empty edit region rather than silently succeeding', () => {
    const out = parseModelOutput(`===EDIT_BEGIN_${N}===\nnothing useful\n===EDIT_END_${N}===`, N)
    expect(out.kind).toBe('none')
  })

  it('tolerates marker lines of varying length', () => {
    const raw = `===EDIT_BEGIN_${N}===\n<<<<<<<< SEARCH\nold\n========\nnew\n>>>>>>>> REPLACE\n===EDIT_END_${N}===`
    const out = parseModelOutput(raw, N)
    expect(out.kind).toBe('edits')
  })
})

describe('applyEdits', () => {
  const page = doc('<h1 class="text-2xl font-bold">Book an appointment today</h1>\n<p>Choose a therapist below.</p>')

  it('applies a unique patch', () => {
    const search = '<h1 class="text-2xl font-bold">Book an appointment today</h1>'
    const res = applyEdits(page, [{ search, replace: '<h1 class="text-3xl">Book now</h1>' }], MAX)
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.html).toContain('Book now')
    expect(res.html).not.toContain('Book an appointment today')
  })

  it('refuses a SEARCH block too short to be unique', () => {
    const res = applyEdits(page, [{ search: '<p>', replace: '<p class="x">' }], MAX)
    expect(res.ok).toBe(false)
    if (res.ok) return
    expect(res.reason).toMatch(/too short/)
    expect('<p>'.length).toBeLessThan(MIN_SEARCH_CHARS)
  })

  it('refuses a SEARCH that matches the same row on two pages', () => {
    // The multi-page failure mode, and the reason MIN_SEARCH_CHARS went 40 -> 60:
    // a table row or a card repeats across [data-page] sections, so a snippet that
    // looks specific is ambiguous. Failing here is correct -- it costs a rewrite,
    // whereas patching the wrong page silently would be worse.
    const row = '<tr><td class="px-4 py-3">Devon P.</td><td class="px-4 py-3">Active</td></tr>'
    const twoPages = doc(
      `<section data-page="pipeline">${row}</section>\n<section data-page="contacts" hidden>${row}</section>`,
    )
    const res = applyEdits(twoPages, [{ search: row, replace: '<tr><td>x</td></tr>' }], MAX)
    expect(res.ok).toBe(false)
    if (res.ok) return
    expect(res.reason).toMatch(/appears 2 times/)
    // Long enough to clear the length gate, so this is genuinely the ambiguity
    // branch and not the too-short one.
    expect(row.length).toBeGreaterThan(MIN_SEARCH_CHARS)
  })

  it('refuses an ambiguous SEARCH that appears twice', () => {
    // The card markup is longer than it looks it needs to be: it has to clear
    // MIN_SEARCH_CHARS so this exercises the ambiguity branch rather than the
    // length gate, which runs first.
    const card = '<div class="rounded-lg border border-slate-200 p-4 shadow-sm">card</div>'
    const twice = doc(`${card}\n${card}`)
    const res = applyEdits(twice, [{ search: card, replace: 'x' }], MAX)
    expect(res.ok).toBe(false)
    if (res.ok) return
    expect(res.reason).toMatch(/appears 2 times/)
    expect(card.length).toBeGreaterThan(MIN_SEARCH_CHARS)
  })

  it('reports a SEARCH that is not present', () => {
    const res = applyEdits(page, [{ search: 'a string that is definitely not in the document at all', replace: 'x' }], MAX)
    expect(res.ok).toBe(false)
  })

  it('recovers from trailing-whitespace drift instead of forcing a rewrite', () => {
    // The commonest near-miss: the model did not reproduce trailing spaces.
    const withTrailing = doc('<p class="mt-4 text-sm text-slate-500">Choose a therapist below.</p>   ')
    const res = applyEdits(
      withTrailing,
      [{ search: '<p class="mt-4 text-sm text-slate-500">Choose a therapist below.</p>', replace: '<p>Pick a time.</p>' }],
      MAX,
    )
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.html).toContain('Pick a time.')
  })

  it('applies patches sequentially against the evolving document', () => {
    const res = applyEdits(
      page,
      [
        // Both replacements carry a full class list rather than a minimal one, so
        // the second SEARCH -- which matches what the first edit just wrote --
        // still clears MIN_SEARCH_CHARS.
        {
          search: '<h1 class="text-2xl font-bold">Book an appointment today</h1>',
          replace: '<h1 id="headline" class="text-3xl font-bold tracking-tight">Step one heading</h1>',
        },
        {
          search: '<h1 id="headline" class="text-3xl font-bold tracking-tight">Step one heading</h1>',
          replace: '<h1 id="headline" class="text-3xl font-bold tracking-tight">Step two heading</h1>',
        },
      ],
      MAX,
    )
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.html).toContain('Step two heading')
  })

  it('aborts atomically when a later patch fails', () => {
    // Half-applying would leave a document that is neither old nor new.
    const res = applyEdits(
      page,
      [
        { search: '<h1 class="text-2xl font-bold">Book an appointment today</h1>', replace: '<h1>Changed</h1>' },
        { search: 'this text is absent from the document entirely, so it fails', replace: 'x' },
      ],
      MAX,
    )
    expect(res.ok).toBe(false)
    if (res.ok) return
    expect(res.reason).toMatch(/edit 2 of 2/)
  })

  it('rejects rather than truncates a result over the byte cap', () => {
    const res = applyEdits(
      page,
      [{ search: '<h1 class="text-2xl font-bold">Book an appointment today</h1>', replace: 'x'.repeat(300) }],
      200,
    )
    expect(res.ok).toBe(false)
    if (res.ok) return
    expect(res.reason).toMatch(/over the/)
  })

  it('measures the cap in UTF-8 bytes, not code units', () => {
    // Multi-byte content must not slip past a byte limit by counting as .length.
    const emoji = '🎨'.repeat(100) // 4 bytes each = 400 bytes
    const res = applyEdits(
      page,
      [{ search: '<h1 class="text-2xl font-bold">Book an appointment today</h1>', replace: emoji }],
      300,
    )
    expect(res.ok).toBe(false)
  })
})

describe('extractTitle', () => {
  it('reads the document title', () => {
    expect(extractTitle(doc('<p>x</p>'))).toBe('Bloom Clinic')
  })
  it('falls back when there is no title', () => {
    expect(extractTitle('<html><body>x</body></html>')).toBe('Untitled mockup')
  })
  it('collapses whitespace and caps the length', () => {
    expect(extractTitle(`<title>  A   very\n  spaced  title </title>`)).toBe('A very spaced title')
  })
})
