import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

/**
 * Disk is the source of truth for generated documents; Postgres only holds the
 * pointer. Everything here is written so that a row can never reference a file
 * that is not fully on disk -- the opposite (a file with no row) is survivable and
 * is what the admin orphan sweep is for.
 */

/** A real UUID, not `/^[0-9a-f-]{36}$/`, which happily accepts 36 hyphens. These
 *  ids are interpolated into filesystem paths. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

export const MAX_HTML_BYTES = 128 * 1024
/** Refuse to write when the volume is this close to full, so a full disk fails a
 *  turn cleanly instead of leaving half-written documents. */
export const MIN_FREE_BYTES = 64 * 1024 * 1024

export class StorageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StorageError'
  }
}

export function storageRoot(): string {
  const dir = process.env.VIBE_STORAGE_DIR
  if (!dir) throw new StorageError('VIBE_STORAGE_DIR is not set')
  return path.resolve(dir)
}

function assertUuid(value: string, label: string): void {
  if (!UUID_RE.test(value)) throw new StorageError(`invalid ${label}`)
}

function assertTurnIndex(turnIndex: number): void {
  if (!Number.isInteger(turnIndex) || turnIndex < 0 || turnIndex > 999) {
    throw new StorageError('invalid turn index')
  }
}

/**
 * Resolves a design's absolute path and proves it stays inside the root.
 *
 * The containment check compares against `root + path.sep`, not bare `root`:
 * without the separator, `/var/lib/hazl-vibe-evil` starts with `/var/lib/hazl-vibe`
 * and would pass.
 */
export function designPath(sessionId: string, turnIndex: number, designId: string): string {
  assertUuid(sessionId, 'session id')
  assertUuid(designId, 'design id')
  assertTurnIndex(turnIndex)

  const root = storageRoot()
  const abs = path.resolve(root, 'designs', sessionId, `${turnIndex}-${designId}.html`)
  if (abs !== root && !abs.startsWith(root + path.sep)) {
    throw new StorageError('resolved path escaped the storage root')
  }
  return abs
}

/** Path relative to the root, which is what goes in the database. Keeps rows
 *  portable if the volume is ever remounted elsewhere. */
export function toRelative(absolute: string): string {
  return path.relative(storageRoot(), absolute)
}

export function toAbsolute(relative: string): string {
  const root = storageRoot()
  const abs = path.resolve(root, relative)
  if (!abs.startsWith(root + path.sep)) throw new StorageError('stored path escaped the storage root')
  return abs
}

async function freeBytes(dir: string): Promise<number> {
  try {
    const st = await fs.statfs(dir)
    return Number(st.bavail) * Number(st.bsize)
  } catch {
    return Number.POSITIVE_INFINITY // cannot measure: do not block on it
  }
}

export interface WriteResult {
  absolutePath: string
  relativePath: string
  bytes: number
  sha256: string
}

/**
 * Writes a document atomically.
 *
 * temp file -> fsync(file) -> rename -> fsync(directory). The directory fsync is
 * the step people leave out: without it the rename itself can be lost on power
 * loss, leaving a database row pointing at nothing.
 */
export async function writeDesign(
  sessionId: string,
  turnIndex: number,
  designId: string,
  html: string,
): Promise<WriteResult> {
  const bytes = Buffer.byteLength(html, 'utf8')
  if (bytes > MAX_HTML_BYTES) {
    throw new StorageError(`document is ${Math.round(bytes / 1024)}KB, over the ${MAX_HTML_BYTES / 1024}KB limit`)
  }

  const absolutePath = designPath(sessionId, turnIndex, designId)
  const dir = path.dirname(absolutePath)
  await fs.mkdir(dir, { recursive: true })

  if ((await freeBytes(dir)) < MIN_FREE_BYTES) {
    throw new StorageError('the storage volume is nearly full')
  }

  // Distinct prefix so the orphan sweep can recognise and skip in-flight writes.
  const tmp = path.join(dir, `.tmp-${designId}`)
  let handle: Awaited<ReturnType<typeof fs.open>> | null = null
  try {
    handle = await fs.open(tmp, 'w')
    await handle.writeFile(html, 'utf8')
    await handle.sync()
  } finally {
    await handle?.close()
  }

  try {
    await fs.rename(tmp, absolutePath)
    const dirHandle = await fs.open(dir, 'r')
    try {
      await dirHandle.sync()
    } finally {
      await dirHandle.close()
    }
  } catch (err) {
    // Never leave a temp file behind: on ENOSPC they would consume the last of
    // the free space and the sweep would have to guess at them.
    await fs.rm(tmp, { force: true }).catch(() => {})
    throw err
  }

  return {
    absolutePath,
    relativePath: toRelative(absolutePath),
    bytes,
    sha256: createHash('sha256').update(html, 'utf8').digest('hex'),
  }
}

export class MissingDesignError extends StorageError {
  constructor(relativePath: string) {
    super(`design file is missing: ${relativePath}`)
    this.name = 'MissingDesignError'
  }
}

/**
 * Reads a document back. Throws rather than returning empty when the file is
 * gone: a silent empty string would make the next turn rewrite from scratch at
 * full price and destroy the visitor's design.
 */
export async function readDesign(relativePath: string): Promise<string> {
  const abs = toAbsolute(relativePath)
  try {
    return await fs.readFile(abs, 'utf8')
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') throw new MissingDesignError(relativePath)
    throw err
  }
}

export async function deleteDesign(relativePath: string): Promise<void> {
  await fs.rm(toAbsolute(relativePath), { force: true })
}

/** Removes a whole session's directory (used when a session is purged). */
export async function deleteSessionDir(sessionId: string): Promise<void> {
  assertUuid(sessionId, 'session id')
  const root = storageRoot()
  const dir = path.resolve(root, 'designs', sessionId)
  if (!dir.startsWith(root + path.sep)) throw new StorageError('resolved path escaped the storage root')
  await fs.rm(dir, { recursive: true, force: true })
}

export interface StorageStats {
  fileCount: number
  totalBytes: number
  largestBytes: number
  freeBytes: number
  /** Files on disk with no row pointing at them, excluding in-flight temp files. */
  orphans: string[]
}

/** Temp files younger than this may still be mid-write; never sweep them. */
const ORPHAN_GRACE_MS = 10 * 60 * 1000

export async function scanStorage(knownRelativePaths: Set<string>): Promise<StorageStats> {
  const root = storageRoot()
  const designsRoot = path.join(root, 'designs')
  const stats: StorageStats = {
    fileCount: 0,
    totalBytes: 0,
    largestBytes: 0,
    freeBytes: await freeBytes(root),
    orphans: [],
  }

  const now = Date.now()
  let sessionDirs: string[] = []
  try {
    sessionDirs = await fs.readdir(designsRoot)
  } catch {
    return stats // nothing written yet
  }

  for (const sessionDir of sessionDirs) {
    const dir = path.join(designsRoot, sessionDir)
    let files: string[] = []
    try {
      files = await fs.readdir(dir)
    } catch {
      continue
    }
    for (const file of files) {
      const abs = path.join(dir, file)
      let st
      try {
        st = await fs.stat(abs)
      } catch {
        continue
      }
      if (!st.isFile()) continue

      const rel = path.relative(root, abs)
      const isTemp = file.startsWith('.tmp-')
      const age = now - st.mtimeMs

      if (isTemp) {
        if (age > ORPHAN_GRACE_MS) stats.orphans.push(rel)
        continue
      }

      stats.fileCount += 1
      stats.totalBytes += st.size
      if (st.size > stats.largestBytes) stats.largestBytes = st.size
      if (!knownRelativePaths.has(rel) && age > ORPHAN_GRACE_MS) stats.orphans.push(rel)
    }
  }

  return stats
}
