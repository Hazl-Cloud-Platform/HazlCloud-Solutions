/**
 * Insights seed builder.
 *
 *   npx tsx scripts/insights-seed/build.tsx [--include-sample]
 *
 * 1. Validates every scripts/insights-seed/content/*.json against the schema and
 *    limits in README.md (throws loudly on the first file that fails).
 * 2. Renders each article's poster to out/posters/<quarter>.png at 2x
 *    (1260×1734) with headless Google Chrome, and verifies the dimensions.
 * 3. Writes out/insights.ndjson — one author doc plus one insight doc per
 *    article, ready for `sanity dataset import`.
 *
 * Files whose name starts with "_" are skipped unless --include-sample is given.
 * This script never touches a Sanity dataset; it only writes to out/.
 */
import { execFileSync } from 'node:child_process'
import * as crypto from 'node:crypto'
import * as fs from 'node:fs'
import * as path from 'node:path'

import {
  CARD_CROP_HEIGHT,
  POSTER_HEIGHT,
  POSTER_WIDTH,
  assertPosterFits,
  renderPosterHtml,
  type PosterContent,
} from './poster'

/* ---------------------------------------------------------------- config -- */

const SEED_DIR = __dirname
const CONTENT_DIR = path.join(SEED_DIR, 'content')
const OUT_DIR = path.join(SEED_DIR, 'out')
const POSTER_DIR = path.join(OUT_DIR, 'posters')
const TMP_DIR = path.join(OUT_DIR, '.tmp')
const NDJSON_PATH = path.join(OUT_DIR, 'insights.ndjson')

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const SCALE = 2
const EXPECTED_PNG_WIDTH = POSTER_WIDTH * SCALE
const EXPECTED_PNG_HEIGHT = POSTER_HEIGHT * SCALE

const AUTHOR_ID = 'author-hazl-team'
const MAX_PUBLISHED_AT = Date.parse('2026-10-20T23:59:59Z')

const LIMITS = {
  title: { min: 10, max: 120 },
  slug: { max: 96 },
  excerpt: { min: 40, max: 220 },
  seoTitle: { max: 60 },
  seoDescription: { min: 150, max: 170, idealMax: 160 },
  tags: { min: 3, max: 5 },
  words: { min: 700, max: 1100 },
} as const

const BODY_STYLES = new Set(['normal', 'h2', 'h3', 'blockquote', 'bullet'])

/* ----------------------------------------------------------------- types -- */

interface BodyEntry {
  style: string
  text: string
}

interface Source {
  label: string
  url: string
  date: string
}

interface Article {
  quarter: string
  publishedAt: string
  title: string
  slug: string
  excerpt: string
  seoTitle: string
  seoDescription: string
  tags: string[]
  body: BodyEntry[]
  poster: PosterContent
  sources: Source[]
}

interface Loaded {
  file: string
  label: string
  article: Article
}

/* ------------------------------------------------------------------ util -- */

const warnings: string[] = []

function warn(message: string): void {
  warnings.push(message)
  console.warn(`  ! ${message}`)
}

function fail(label: string, message: string): never {
  throw new Error(`${label}: ${message}`)
}

/**
 * Deterministic 12-char hex key: first 12 hex chars of the sha1 of the parts.
 * Keeping keys content-position-derived (rather than random) means rebuilding
 * produces byte-identical NDJSON.
 */
function key(...parts: (string | number)[]): string {
  return crypto.createHash('sha1').update(parts.join(':')).digest('hex').slice(0, 12)
}

const len = (value: string) => Array.from(value).length

function expectString(label: string, field: string, value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') {
    fail(label, `${field} must be a non-empty string`)
  }
  return value
}

function checkLength(
  label: string,
  field: string,
  value: string,
  bounds: { min?: number; max?: number },
): void {
  const n = len(value)
  if (bounds.min !== undefined && n < bounds.min) {
    fail(label, `${field} is ${n} chars, min ${bounds.min}`)
  }
  if (bounds.max !== undefined && n > bounds.max) {
    fail(label, `${field} is ${n} chars, max ${bounds.max}`)
  }
}

/** Quarter → [startMs, endMs] (inclusive end). */
function quarterRange(quarter: string): [number, number] {
  const match = /^(\d{4})-Q([1-4])$/.exec(quarter)
  if (!match) throw new Error(`Invalid quarter "${quarter}"`)
  const year = Number(match[1])
  const q = Number(match[2])
  const startMonth = (q - 1) * 3
  const start = Date.UTC(year, startMonth, 1, 0, 0, 0, 0)
  const end = Date.UTC(year, startMonth + 3, 1, 0, 0, 0, 0) - 1
  return [start, end]
}

/* ------------------------------------------------------------ validation -- */

function validate(loaded: Loaded): void {
  const { label, article: a, file } = loaded

  // quarter + filename agreement
  const quarter = expectString(label, 'quarter', a.quarter)
  if (!/^\d{4}-Q[1-4]$/.test(quarter)) {
    fail(label, `quarter "${quarter}" must look like 2023-Q1`)
  }
  // Sample/fixture files (leading "_") are exempt from the filename convention.
  if (!file.startsWith('_') && path.basename(file, '.json') !== quarter.toLowerCase()) {
    fail(label, `filename should be ${quarter.toLowerCase()}.json to match quarter "${quarter}"`)
  }

  // publishedAt
  const publishedAt = expectString(label, 'publishedAt', a.publishedAt)
  const ms = Date.parse(publishedAt)
  if (Number.isNaN(ms)) fail(label, `publishedAt "${publishedAt}" is not a parseable date`)
  if (new Date(ms).toISOString() !== publishedAt) {
    fail(
      label,
      `publishedAt must be a full ISO-8601 UTC timestamp (got "${publishedAt}", expected "${new Date(ms).toISOString()}")`,
    )
  }
  if (ms > MAX_PUBLISHED_AT) {
    fail(label, `publishedAt ${publishedAt} is after the 2026-10-20T23:59:59Z cut-off`)
  }
  const [qStart, qEnd] = quarterRange(quarter)
  if (ms < qStart || ms > qEnd) {
    fail(label, `publishedAt ${publishedAt} falls outside quarter ${quarter}`)
  }
  const weekday = new Date(ms).getUTCDay()
  if (weekday === 0 || weekday === 6) {
    warn(`${label}: publishedAt ${publishedAt} is a weekend; README asks for a mid-quarter weekday`)
  }

  // strings
  checkLength(label, 'title', expectString(label, 'title', a.title), LIMITS.title)

  const slug = expectString(label, 'slug', a.slug)
  checkLength(label, 'slug', slug, LIMITS.slug)
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    fail(label, `slug "${slug}" must be kebab-case (lowercase letters, digits and single hyphens)`)
  }

  checkLength(label, 'excerpt', expectString(label, 'excerpt', a.excerpt), LIMITS.excerpt)
  checkLength(label, 'seoTitle', expectString(label, 'seoTitle', a.seoTitle), LIMITS.seoTitle)

  const seoDescription = expectString(label, 'seoDescription', a.seoDescription)
  checkLength(label, 'seoDescription', seoDescription, { max: LIMITS.seoDescription.max })
  const seoLen = len(seoDescription)
  if (seoLen < LIMITS.seoDescription.min) {
    fail(
      label,
      `seoDescription is ${seoLen} chars, README asks for ${LIMITS.seoDescription.min}–${LIMITS.seoDescription.idealMax}`,
    )
  }
  if (seoLen > LIMITS.seoDescription.idealMax) {
    warn(
      `${label}: seoDescription is ${seoLen} chars — ideal is ${LIMITS.seoDescription.min}–${LIMITS.seoDescription.idealMax} (hard max ${LIMITS.seoDescription.max})`,
    )
  }

  // tags
  if (!Array.isArray(a.tags) || a.tags.some((t) => typeof t !== 'string' || t.trim() === '')) {
    fail(label, 'tags must be an array of non-empty strings')
  }
  if (a.tags.length < LIMITS.tags.min || a.tags.length > LIMITS.tags.max) {
    fail(label, `tags has ${a.tags.length} entries, expected ${LIMITS.tags.min}–${LIMITS.tags.max}`)
  }
  if (new Set(a.tags).size !== a.tags.length) fail(label, 'tags contains duplicates')

  // body
  if (!Array.isArray(a.body) || a.body.length === 0) fail(label, 'body must be a non-empty array')
  a.body.forEach((entry, i) => {
    if (!entry || typeof entry !== 'object') fail(label, `body[${i}] must be an object`)
    if (!BODY_STYLES.has(entry.style)) {
      fail(
        label,
        `body[${i}].style "${entry.style}" is not one of ${Array.from(BODY_STYLES).join(', ')}`,
      )
    }
    expectString(label, `body[${i}].text`, entry.text)
    assertBalancedMarkup(label, i, entry.text)
  })

  // sources
  if (!Array.isArray(a.sources) || a.sources.length === 0) {
    fail(label, 'sources must be a non-empty array (every statistic needs a source)')
  }
  a.sources.forEach((source, i) => {
    expectString(label, `sources[${i}].label`, source?.label)
    const url = expectString(label, `sources[${i}].url`, source?.url)
    if (!/^https?:\/\//.test(url)) fail(label, `sources[${i}].url "${url}" must be http(s)`)
    const date = expectString(label, `sources[${i}].date`, source?.date)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) {
      fail(label, `sources[${i}].date "${date}" must be an ISO date (YYYY-MM-DD)`)
    }
    // An article may only cite material dated on or before its own publish day.
    const publishedDay = publishedAt.slice(0, 10)
    if (date > publishedDay) {
      fail(
        label,
        `sources[${i}].date "${date}" is after publishedAt ${publishedDay} — a source cannot postdate the article`,
      )
    }
  })

  // poster
  if (!a.poster || typeof a.poster !== 'object') fail(label, 'poster must be an object')
  expectString(label, 'poster.headline', a.poster.headline)
  expectString(label, 'poster.subhead', a.poster.subhead)
  expectString(label, 'poster.tagline', a.poster.tagline)
  assertPosterFits(a.poster, label)
}

function assertBalancedMarkup(label: string, index: number, text: string): void {
  const codeTicks = (text.match(/`/g) ?? []).length
  if (codeTicks % 2 !== 0) fail(label, `body[${index}].text has an unbalanced backtick`)
  const withoutCode = text.replace(/`[^`]*`/g, '')
  const withoutStrong = withoutCode.replace(/\*\*[^*]+\*\*/g, '')
  if ((withoutStrong.match(/\*/g) ?? []).length % 2 !== 0) {
    fail(label, `body[${index}].text has an unbalanced * emphasis marker`)
  }
  const openBrackets = (withoutCode.match(/\[/g) ?? []).length
  const linkPatterns = (withoutCode.match(/\[[^\]]+\]\((?:https?:\/\/|\/|mailto:)[^)\s]+\)/g) ?? [])
    .length
  if (openBrackets !== linkPatterns) {
    fail(
      label,
      `body[${index}].text has a malformed link — use [text](https://…) with no spaces in the URL`,
    )
  }
}

/* ----------------------------------------------------------- word counts -- */

function stripMarkup(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
}

function wordCount(body: BodyEntry[]): number {
  return body.reduce((total, entry) => {
    const words = stripMarkup(entry.text).trim().split(/\s+/).filter(Boolean)
    return total + words.length
  }, 0)
}

/* -------------------------------------------------------- portable text -- */

interface Span {
  _key: string
  _type: 'span'
  marks: string[]
  text: string
}

interface MarkDef {
  _type: 'link'
  _key: string
  href: string
  newTab: boolean
}

interface Block {
  _key: string
  _type: 'block'
  style: string
  markDefs: MarkDef[]
  children: Span[]
  listItem?: 'bullet'
  level?: number
}

const INLINE_RE = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\[[^\]]+\]\([^)\s]+\))/g

/** Parses **strong**, *em*, `code` and [text](url) into spans + markDefs. */
function parseInline(
  text: string,
  quarter: string,
  blockIndex: number,
): { children: Span[]; markDefs: MarkDef[] } {
  const children: Span[] = []
  const markDefs: MarkDef[] = []
  let cursor = 0

  const push = (value: string, marks: string[]) => {
    if (value === '') return
    children.push({
      _key: key(quarter, blockIndex, children.length),
      _type: 'span',
      marks,
      text: value,
    })
  }

  INLINE_RE.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = INLINE_RE.exec(text)) !== null) {
    push(text.slice(cursor, match.index), [])
    const token = match[0]
    if (match[1]) {
      push(token.slice(1, -1), ['code'])
    } else if (match[2]) {
      push(token.slice(2, -2), ['strong'])
    } else if (match[3]) {
      push(token.slice(1, -1), ['em'])
    } else {
      const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(token)
      if (!link) throw new Error(`Unparseable link token: ${token}`)
      const markKey = key(quarter, blockIndex, 'markDef', markDefs.length)
      markDefs.push({ _type: 'link', _key: markKey, href: link[2], newTab: true })
      push(link[1], [markKey])
    }
    cursor = match.index + token.length
  }
  push(text.slice(cursor), [])

  if (children.length === 0) {
    children.push({ _key: key(quarter, blockIndex, 0), _type: 'span', marks: [], text: '' })
  }
  return { children, markDefs }
}

function toPortableText(body: BodyEntry[], quarter: string): Block[] {
  return body.map((entry, blockIndex) => {
    const { children, markDefs } = parseInline(entry.text, quarter, blockIndex)
    const block: Block = {
      _key: key(quarter, blockIndex),
      _type: 'block',
      style: entry.style === 'bullet' ? 'normal' : entry.style,
      markDefs,
      children,
    }
    if (entry.style === 'bullet') {
      block.listItem = 'bullet'
      block.level = 1
    }
    return block
  })
}

/* ---------------------------------------------------------- poster render -- */

function renderPoster(loaded: Loaded): string {
  const { article, label } = loaded
  const quarterSlug = article.quarter.toLowerCase()
  const htmlPath = path.join(TMP_DIR, `${quarterSlug}.html`)
  const pngPath = path.join(POSTER_DIR, `${quarterSlug}.png`)

  fs.writeFileSync(
    htmlPath,
    renderPosterHtml({ poster: article.poster, quarter: article.quarter }, label),
    'utf8',
  )
  fs.rmSync(pngPath, { force: true })

  const profile = fs.mkdtempSync(path.join(TMP_DIR, 'chrome-profile-'))
  try {
    execFileSync(
      CHROME,
      [
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        '--default-background-color=00000000',
        `--user-data-dir=${profile}`,
        `--window-size=${POSTER_WIDTH},${POSTER_HEIGHT}`,
        `--force-device-scale-factor=${SCALE}`,
        '--virtual-time-budget=5000',
        `--screenshot=${pngPath}`,
        `file://${htmlPath}`,
      ],
      { stdio: ['ignore', 'ignore', 'pipe'] },
    )
  } catch (error) {
    const stderr = (error as { stderr?: Buffer }).stderr?.toString() ?? ''
    throw new Error(`${label}: headless Chrome failed to render the poster\n${stderr}`)
  } finally {
    fs.rmSync(profile, { recursive: true, force: true })
  }

  if (!fs.existsSync(pngPath)) fail(label, `Chrome produced no PNG at ${pngPath}`)
  const [width, height] = pngDimensions(pngPath)
  if (width !== EXPECTED_PNG_WIDTH || height !== EXPECTED_PNG_HEIGHT) {
    fail(
      label,
      `poster PNG is ${width}×${height}, expected ${EXPECTED_PNG_WIDTH}×${EXPECTED_PNG_HEIGHT}`,
    )
  }
  return pngPath
}

function pngDimensions(file: string): [number, number] {
  const out = execFileSync('/usr/bin/sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', file], {
    encoding: 'utf8',
  })
  const width = /pixelWidth:\s*(\d+)/.exec(out)
  const height = /pixelHeight:\s*(\d+)/.exec(out)
  if (!width || !height) throw new Error(`Could not read PNG dimensions from ${file}`)
  return [Number(width[1]), Number(height[1])]
}

/* ------------------------------------------------------------------ main -- */

function main(): void {
  const includeSample = process.argv.includes('--include-sample')

  if (!fs.existsSync(CONTENT_DIR)) {
    throw new Error(`No content directory at ${CONTENT_DIR}`)
  }

  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith('.json'))
    .filter((file) => includeSample || !file.startsWith('_'))
    .sort()

  if (files.length === 0) {
    throw new Error(
      includeSample
        ? `No JSON files in ${CONTENT_DIR}`
        : `No JSON files in ${CONTENT_DIR} (sample files are skipped without --include-sample)`,
    )
  }

  console.log(`Loading ${files.length} content file(s) from ${CONTENT_DIR}`)

  const loaded: Loaded[] = files.map((file) => {
    const full = path.join(CONTENT_DIR, file)
    let parsed: unknown
    try {
      parsed = JSON.parse(fs.readFileSync(full, 'utf8'))
    } catch (error) {
      throw new Error(`content/${file}: invalid JSON — ${(error as Error).message}`)
    }
    return { file, label: `content/${file}`, article: parsed as Article }
  })

  // per-file validation
  for (const item of loaded) validate(item)

  // cross-file uniqueness
  const seen = new Map<string, string>()
  for (const field of ['slug', 'quarter', 'title'] as const) {
    seen.clear()
    for (const item of loaded) {
      const value = item.article[field]
      const previous = seen.get(value)
      if (previous) {
        throw new Error(`Duplicate ${field} "${value}" in ${previous} and ${item.label}`)
      }
      seen.set(value, item.label)
    }
  }

  // word counts
  console.log('\nWord counts:')
  for (const item of loaded) {
    const words = wordCount(item.article.body)
    const flag =
      words < LIMITS.words.min || words > LIMITS.words.max
        ? ` <- outside ${LIMITS.words.min}–${LIMITS.words.max}`
        : ''
    console.log(`  ${item.article.quarter.padEnd(8)} ${String(words).padStart(5)} words${flag}`)
    if (flag) {
      warn(
        `${item.label}: ${words} words, README asks for ${LIMITS.words.min}–${LIMITS.words.max}`,
      )
    }
  }

  fs.mkdirSync(POSTER_DIR, { recursive: true })
  fs.mkdirSync(TMP_DIR, { recursive: true })

  if (!fs.existsSync(CHROME)) {
    throw new Error(`Google Chrome not found at ${CHROME} — required to render the posters`)
  }

  console.log('\nRendering posters:')
  const posterPaths = new Map<string, string>()
  for (const item of loaded) {
    const pngPath = renderPoster(item)
    posterPaths.set(item.article.quarter, pngPath)
    console.log(
      `  ${item.article.quarter.padEnd(8)} ${EXPECTED_PNG_WIDTH}×${EXPECTED_PNG_HEIGHT}  ${path.relative(SEED_DIR, pngPath)}`,
    )
  }

  // NDJSON
  const docs: unknown[] = [
    {
      _id: AUTHOR_ID,
      _type: 'author',
      name: 'HAZL Solutions team',
      role: 'HAZL Solutions',
    },
  ]

  for (const item of loaded) {
    const a = item.article
    const pngPath = posterPaths.get(a.quarter)
    if (!pngPath) fail(item.label, 'poster PNG missing after render')
    docs.push({
      _id: `insight-${a.quarter.toLowerCase()}`,
      _type: 'insight',
      title: a.title,
      slug: { _type: 'slug', current: a.slug },
      excerpt: a.excerpt,
      publishedAt: a.publishedAt,
      tags: a.tags,
      seoTitle: a.seoTitle,
      seoDescription: a.seoDescription,
      author: { _type: 'reference', _ref: AUTHOR_ID },
      coverImage: {
        _type: 'image',
        _sanityAsset: `image@file://${pngPath}`,
        alt: `Infographic: ${a.title.replace(/\s+/g, ' ').trim()}`,
        hotspot: { _type: 'sanity.imageHotspot', x: 0.5, y: 0.2, height: 0.4, width: 1 },
        crop: { _type: 'sanity.imageCrop', top: 0, bottom: 0, left: 0, right: 0 },
      },
      body: toPortableText(a.body, a.quarter),
    })
  }

  fs.writeFileSync(NDJSON_PATH, docs.map((doc) => JSON.stringify(doc)).join('\n') + '\n', 'utf8')
  fs.rmSync(TMP_DIR, { recursive: true, force: true })

  console.log(
    `\nWrote ${path.relative(SEED_DIR, NDJSON_PATH)} — 1 author + ${loaded.length} insight doc(s)`,
  )
  console.log(
    `Card crop reminder: the top ${POSTER_WIDTH}×${CARD_CROP_HEIGHT} CSS px (${EXPECTED_PNG_WIDTH}×${CARD_CROP_HEIGHT * SCALE} in the PNG) must read on its own.`,
  )
  if (warnings.length > 0) {
    console.log(`\n${warnings.length} warning(s):`)
    for (const message of warnings) console.log(`  ! ${message}`)
  } else {
    console.log('\nNo warnings.')
  }
  console.log('\nNothing was imported. Run the Sanity import yourself when you are ready.')
}

try {
  main()
} catch (error) {
  console.error(`\nBuild failed: ${(error as Error).message}`)
  process.exit(1)
}
