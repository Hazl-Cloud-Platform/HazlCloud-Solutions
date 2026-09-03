import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {
  MAX_HTML_BYTES,
  MissingDesignError,
  StorageError,
  deleteDesign,
  designPath,
  readDesign,
  scanStorage,
  toAbsolute,
  writeDesign,
} from '../storage'

const S = '11111111-2222-4333-8444-555555555555'
const D = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
let root: string

beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), 'vibe-storage-'))
  process.env.VIBE_STORAGE_DIR = root
})

afterEach(async () => {
  await fs.rm(root, { recursive: true, force: true })
  delete process.env.VIBE_STORAGE_DIR
})

describe('path safety', () => {
  it('builds a path under the root', () => {
    expect(designPath(S, 0, D)).toBe(path.join(root, 'designs', S, `0-${D}.html`))
  })

  it('rejects a traversal attempt in the session id', () => {
    expect(() => designPath('../../etc', 0, D)).toThrow(StorageError)
  })

  it('rejects an id of 36 hyphens, which a loose regex would accept', () => {
    // /^[0-9a-f-]{36}$/ matches this. A real UUID pattern does not.
    expect(() => designPath('-'.repeat(36), 0, D)).toThrow(StorageError)
  })

  it('rejects a non-integer or out-of-range turn index', () => {
    expect(() => designPath(S, 1.5, D)).toThrow(StorageError)
    expect(() => designPath(S, -1, D)).toThrow(StorageError)
    expect(() => designPath(S, Number.NaN, D)).toThrow(StorageError)
  })

  it('rejects a sibling directory that merely shares the root prefix', () => {
    // Without the trailing path separator in the containment check,
    // "/tmp/vibe-storage-x-evil" starts with "/tmp/vibe-storage-x" and passes.
    process.env.VIBE_STORAGE_DIR = root
    expect(() => toAbsolute('../' + path.basename(root) + '-evil/x.html')).toThrow(StorageError)
  })

  it('throws when VIBE_STORAGE_DIR is unset rather than writing somewhere arbitrary', () => {
    delete process.env.VIBE_STORAGE_DIR
    expect(() => designPath(S, 0, D)).toThrow(/VIBE_STORAGE_DIR/)
  })
})

describe('writeDesign', () => {
  it('writes, hashes, and reads back', async () => {
    const html = '<!DOCTYPE html><html><body>hello</body></html>'
    const res = await writeDesign(S, 0, D, html)
    expect(res.bytes).toBe(Buffer.byteLength(html, 'utf8'))
    expect(res.sha256).toMatch(/^[0-9a-f]{64}$/)
    expect(res.relativePath).toBe(path.join('designs', S, `0-${D}.html`))
    await expect(readDesign(res.relativePath)).resolves.toBe(html)
  })

  it('leaves no temp file behind on success', async () => {
    await writeDesign(S, 0, D, '<html></html>')
    const files = await fs.readdir(path.join(root, 'designs', S))
    expect(files.filter((f) => f.startsWith('.tmp-'))).toHaveLength(0)
  })

  it('refuses a document over the byte cap', async () => {
    await expect(writeDesign(S, 0, D, 'x'.repeat(MAX_HTML_BYTES + 1))).rejects.toThrow(/over the/)
  })

  it('measures the cap in UTF-8 bytes', async () => {
    // 4 bytes per emoji: this is under the cap by .length and over it by bytes.
    const emoji = '\u{1F3A8}'.repeat(MAX_HTML_BYTES / 3)
    await expect(writeDesign(S, 0, D, emoji)).rejects.toThrow(/over the/)
  })

  it('overwrites the same turn atomically (the fallback case)', async () => {
    await writeDesign(S, 1, D, '<html>first</html>')
    await writeDesign(S, 1, D, '<html>second</html>')
    const out = await readDesign(path.join('designs', S, `1-${D}.html`))
    expect(out).toBe('<html>second</html>')
  })
})

describe('readDesign', () => {
  it('throws MissingDesignError instead of returning empty', async () => {
    // Returning '' would make the next turn silently rewrite from scratch at full
    // price and lose the visitor's design.
    await expect(readDesign(path.join('designs', S, `0-${D}.html`))).rejects.toThrow(MissingDesignError)
  })
})

describe('deleteDesign', () => {
  it('removes the file and is safe to repeat', async () => {
    const res = await writeDesign(S, 0, D, '<html></html>')
    await deleteDesign(res.relativePath)
    await expect(readDesign(res.relativePath)).rejects.toThrow(MissingDesignError)
    await expect(deleteDesign(res.relativePath)).resolves.toBeUndefined()
  })
})

describe('scanStorage', () => {
  it('reports counts and sizes', async () => {
    const a = await writeDesign(S, 0, D, '<html>' + 'a'.repeat(500) + '</html>')
    const b = await writeDesign(S, 1, D, '<html>b</html>')
    const stats = await scanStorage(new Set([a.relativePath, b.relativePath]))
    expect(stats.fileCount).toBe(2)
    expect(stats.totalBytes).toBe(a.bytes + b.bytes)
    expect(stats.largestBytes).toBe(a.bytes)
    expect(stats.orphans).toHaveLength(0)
  })

  it('flags a file with no database row as an orphan once it is old enough', async () => {
    const res = await writeDesign(S, 0, D, '<html></html>')
    const old = new Date(Date.now() - 60 * 60 * 1000)
    await fs.utimes(res.absolutePath, old, old)
    const stats = await scanStorage(new Set())
    expect(stats.orphans).toContain(res.relativePath)
  })

  it('never flags a recent file, which may be mid-insert', async () => {
    // The row is written after the file, so a just-written file legitimately has
    // no row yet. Sweeping it would delete a live design.
    const res = await writeDesign(S, 0, D, '<html></html>')
    const stats = await scanStorage(new Set())
    expect(stats.orphans).not.toContain(res.relativePath)
  })

  it('returns empty stats before anything has been written', async () => {
    const stats = await scanStorage(new Set())
    expect(stats.fileCount).toBe(0)
    expect(stats.totalBytes).toBe(0)
  })
})
