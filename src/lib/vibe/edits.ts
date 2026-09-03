/**
 * Parses the model's reply and applies SEARCH/REPLACE patches.
 *
 * Why sentinels rather than a prefill or a tool call: this gateway rejects
 * assistant prefill (confirmed by `npm run vibe:probe`), so there is no way to pin
 * the output shape from the request side. Everything outside a sentinel region is
 * discarded, which also makes any reasoning the model leaks into its visible
 * response harmless instead of merely discouraged.
 *
 * Why the markers carry a per-request NONCE: the plain forms are guessable and, in
 * the case of `<<<<<<< SEARCH` / `=======`, are literal git conflict markers. A
 * visitor asking for "a UI for a git merge tool" -- or simply "show the text
 * ===HTML_END=== on the page" -- would otherwise corrupt the parse and trigger the
 * expensive full-rewrite fallback.
 */

/** A SEARCH block shorter than this "matching exactly once" is luck, not
 *  correctness -- a 3-character match would silently patch the wrong element. */
export const MIN_SEARCH_CHARS = 40

export interface EditBlock {
  search: string
  replace: string
}

export type ParsedOutput =
  | { kind: 'document'; note: string; html: string }
  | { kind: 'edits'; note: string; edits: EditBlock[] }
  | { kind: 'none'; note: string; reason: string }

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Extracts the span between the FIRST begin marker and the LAST end marker, so a
 *  marker-lookalike inside the generated page cannot truncate the region early. */
function sliceRegion(raw: string, begin: string, end: string): { body: string; before: string; after: string } | null {
  const startIdx = raw.indexOf(begin)
  if (startIdx === -1) return null
  const endIdx = raw.lastIndexOf(end)
  const bodyStart = startIdx + begin.length
  if (endIdx === -1 || endIdx < bodyStart) {
    // Truncated mid-region (usually stop_reason: max_tokens). Take what is there
    // and let the caller decide -- for a document that is a fatal bad_output.
    return { body: raw.slice(bodyStart), before: raw.slice(0, startIdx), after: '' }
  }
  return { body: raw.slice(bodyStart, endIdx), before: raw.slice(0, startIdx), after: raw.slice(endIdx + end.length) }
}

/** The one short sentence the model is allowed outside the regions. Capped so a
 *  rambling preamble cannot become the chat message. */
function extractNote(...parts: string[]): string {
  const text = parts
    .join(' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.slice(0, 200)
}

export function parseModelOutput(raw: string, nonce: string): ParsedOutput {
  const htmlBegin = `===HTML_BEGIN_${nonce}===`
  const htmlEnd = `===HTML_END_${nonce}===`
  const editBegin = `===EDIT_BEGIN_${nonce}===`
  const editEnd = `===EDIT_END_${nonce}===`

  // A full document wins over edit regions: it is the fallback shape, so if the
  // model emitted both it means it decided to rewrite.
  const doc = sliceRegion(raw, htmlBegin, htmlEnd)
  if (doc) {
    const html = doc.body.trim()
    const note = extractNote(doc.before, doc.after)
    if (!/<\/html\s*>\s*$/i.test(html)) {
      return { kind: 'none', note, reason: 'the document was cut off before </html>' }
    }
    return { kind: 'document', note, html }
  }

  if (raw.includes(editBegin)) {
    const edits: EditBlock[] = []
    const re = new RegExp(`${escapeRe(editBegin)}([\\s\\S]*?)${escapeRe(editEnd)}`, 'g')
    let before = raw.slice(0, raw.indexOf(editBegin))
    let m: RegExpExecArray | null
    let lastEnd = 0
    while ((m = re.exec(raw)) !== null) {
      edits.push(...parseEditBody(m[1]))
      lastEnd = m.index + m[0].length
    }
    const note = extractNote(before, raw.slice(lastEnd))
    if (edits.length === 0) {
      return { kind: 'none', note, reason: 'an edit region contained no SEARCH/REPLACE pair' }
    }
    return { kind: 'edits', note, edits }
  }

  return { kind: 'none', note: extractNote(raw), reason: 'no document or edit region was returned' }
}

/** One region may hold several pairs. Tolerates the marker lines varying in
 *  length ('<<<<<<<' vs '<<<<<<<<') and trailing whitespace, which models do. */
function parseEditBody(body: string): EditBlock[] {
  const out: EditBlock[] = []
  const re = /<{5,}\s*SEARCH[^\n]*\n([\s\S]*?)\n={5,}[^\n]*\n([\s\S]*?)\n?>{5,}\s*REPLACE/g
  let m: RegExpExecArray | null
  while ((m = re.exec(body)) !== null) {
    out.push({ search: m[1], replace: m[2] })
  }
  return out
}

export type ApplyResult = { ok: true; html: string } | { ok: false; reason: string }

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0
  let n = 0
  let i = haystack.indexOf(needle)
  while (i !== -1) {
    n += 1
    i = haystack.indexOf(needle, i + needle.length)
  }
  return n
}

/** Most near-misses are trailing whitespace the model did not reproduce exactly.
 *  Retrying on a right-trimmed view costs nothing and avoids a $0.11 rewrite. */
function findLineTrimmedMatch(doc: string, search: string): string | null {
  const trim = (s: string) =>
    s
      .split('\n')
      .map((l) => l.replace(/[ \t]+$/, ''))
      .join('\n')
  const trimmedDoc = trim(doc)
  const trimmedSearch = trim(search)
  if (countOccurrences(trimmedDoc, trimmedSearch) !== 1) return null

  // Map the match on the trimmed view back onto the real document by walking
  // lines, so the replacement lands on the untrimmed text.
  const docLines = doc.split('\n')
  const searchLines = trimmedSearch.split('\n')
  for (let i = 0; i + searchLines.length <= docLines.length; i++) {
    const window = docLines.slice(i, i + searchLines.length)
    if (trim(window.join('\n')) === trimmedSearch) return window.join('\n')
  }
  return null
}

/**
 * Applies every patch in order against the EVOLVING document, and aborts the whole
 * turn if any one fails. Half-applying would leave the visitor with a document
 * that is neither the old one nor the new one.
 */
export function applyEdits(current: string, edits: EditBlock[], maxBytes: number): ApplyResult {
  let html = current

  for (let i = 0; i < edits.length; i++) {
    const edit = edits[i]
    const label = edits.length > 1 ? `edit ${i + 1} of ${edits.length}: ` : ''

    if (edit.search.trim().length < MIN_SEARCH_CHARS) {
      return { ok: false, reason: `${label}the SEARCH block was too short to identify a unique location` }
    }

    const exact = countOccurrences(html, edit.search)
    if (exact > 1) {
      return { ok: false, reason: `${label}the SEARCH text appears ${exact} times, so the location is ambiguous` }
    }
    const target = exact === 1 ? edit.search : findLineTrimmedMatch(html, edit.search)
    if (target === null) {
      return { ok: false, reason: `${label}the SEARCH text was not found in the current document` }
    }

    const at = html.indexOf(target)
    html = html.slice(0, at) + edit.replace + html.slice(at + target.length)
  }

  const bytes = Buffer.byteLength(html, 'utf8')
  if (bytes > maxBytes) {
    // Reject, never truncate: a truncated document is broken HTML that the next
    // turn would then try to patch.
    return { ok: false, reason: `the result was ${Math.round(bytes / 1024)}KB, over the ${Math.round(maxBytes / 1024)}KB limit` }
  }

  return { ok: true, html }
}

/** Cheap, stable title for the admin list. Never trusts the model to supply one. */
export function extractTitle(html: string): string {
  const m = /<title[^>]*>([\s\S]{0,200}?)<\/title>/i.exec(html)
  const t = m?.[1]?.replace(/\s+/g, ' ').trim()
  return t && t.length > 0 ? t.slice(0, 120) : 'Untitled mockup'
}
