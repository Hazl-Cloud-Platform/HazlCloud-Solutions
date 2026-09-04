import { T, query, queryOne } from './db'
import { deleteDesign, readDesign, writeDesign } from './storage'
import type { DesignRow } from '@/types/vibe'

/**
 * Design records. The HTML itself lives on disk; these rows are the index that
 * makes it findable.
 *
 * Order is deliberate everywhere below: the FILE is written and fsynced before the
 * row is inserted, so a row can never point at a file that is not there. The
 * reverse (a file with no row) is recoverable and is what the orphan sweep handles.
 */
export async function saveDesign(args: {
  sessionId: string
  turnIndex: number
  designId: string
  html: string
  title: string
}): Promise<DesignRow> {
  // Whatever occupied this turn before, so its file can be cleaned up once the
  // replacement is safely committed. A fallback rewrite reuses the turn index but
  // gets a fresh design id, so without this the superseded file stays on disk
  // forever with no row pointing at it.
  const previous = await queryOne<{ file_path: string }>(
    `SELECT "file_path" FROM ${T.designs} WHERE "session_id" = $1 AND "turn_index" = $2`,
    [args.sessionId, args.turnIndex],
  )

  const written = await writeDesign(args.sessionId, args.turnIndex, args.designId, args.html)

  // UNIQUE(session_id, turn_index): a full-rewrite fallback REPLACES the failed
  // edit attempt for the same turn rather than creating a second row.
  const row = await queryOne<DesignRow>(
    `INSERT INTO ${T.designs} ("id","session_id","turn_index","title","file_path","bytes","sha256")
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT ("session_id","turn_index") DO UPDATE
       SET "title" = EXCLUDED."title", "file_path" = EXCLUDED."file_path",
           "bytes" = EXCLUDED."bytes", "sha256" = EXCLUDED."sha256", "created_at" = now()
     RETURNING *`,
    [args.designId, args.sessionId, args.turnIndex, args.title, written.relativePath, written.bytes, written.sha256],
  )
  if (!row) throw new Error('failed to record the design')

  // Only after the row commits, and only if the path actually changed. Best
  // effort: a failure here leaves an orphan, which the admin sweep handles --
  // whereas failing the turn would lose a design the visitor already has.
  if (previous && previous.file_path !== written.relativePath) {
    await deleteDesign(previous.file_path).catch((err: unknown) => {
      console.warn('[vibe] could not remove superseded design file', previous.file_path, err)
    })
  }

  return row
}

/**
 * The session's current document.
 *
 * `ORDER BY "turn_index" DESC` is why discardSessionDesigns() has to remove EVERY
 * design rather than just the newest: deleting only the latest promotes the
 * previous turn's page here, so "start a new design" would silently behave as an
 * undo. Archived designs are excluded so a discarded-but-lead-attached design can
 * never rehydrate the studio or become the base for an edit.
 */
export async function latestDesign(sessionId: string): Promise<DesignRow | null> {
  return queryOne<DesignRow>(
    `SELECT * FROM ${T.designs}
      WHERE "session_id" = $1 AND "archived_at" IS NULL
      ORDER BY "turn_index" DESC LIMIT 1`,
    [sessionId],
  )
}

/** Current document for a session, or null when there is not one yet. Propagates
 *  a missing file as an error rather than pretending the page was empty. */
export async function latestDesignHtml(sessionId: string): Promise<{ row: DesignRow; html: string } | null> {
  const row = await latestDesign(sessionId)
  if (!row) return null
  return { row, html: await readDesign(row.file_path) }
}

export async function getDesign(designId: string): Promise<DesignRow | null> {
  return queryOne<DesignRow>(`SELECT * FROM ${T.designs} WHERE "id" = $1`, [designId])
}

export async function getDesignHtml(designId: string): Promise<{ row: DesignRow; html: string } | null> {
  const row = await getDesign(designId)
  if (!row) return null
  return { row, html: await readDesign(row.file_path) }
}

/** Removes the file first, then the row: a row with no file is a visible,
 *  sweepable inconsistency, whereas a file with no row is invisible. */
export async function removeDesign(designId: string): Promise<boolean> {
  const row = await getDesign(designId)
  if (!row) return false
  await deleteDesign(row.file_path).catch((err: unknown) => {
    console.error('[vibe] failed to unlink design file', row.file_path, err)
    throw err
  })
  await query(`DELETE FROM ${T.designs} WHERE "id" = $1`, [designId])
  return true
}

/**
 * Splits a session's designs into the ones to destroy and the ones to keep.
 *
 * A design a visitor already asked us to contact them about is a sales record:
 * ContactModal tells them "we've saved your design", and staleDesignIds() already
 * exempts lead-attached designs from the retention purge. Destroying it on a later
 * click would break both. Archiving hides it from the visitor just as completely --
 * latestDesign() skips archived rows -- while keeping the snapshot.
 *
 * Pure, and separate from the query, so the decision is testable without a database.
 */
export function partitionForDiscard(
  rows: { id: string; has_lead: boolean }[],
): { remove: string[]; archive: string[] } {
  const remove: string[] = []
  const archive: string[] = []
  for (const row of rows) (row.has_lead ? archive : remove).push(row.id)
  return { remove, archive }
}

/**
 * Discards a session's entire design lineage, so the next turn starts from
 * scratch instead of editing what the visitor just threw away.
 *
 * Not `deleteSessionDir()`: that removes the whole directory, which would take the
 * archived lead-attached files with it.
 */
export async function discardSessionDesigns(sessionId: string): Promise<{ removed: number; archived: number }> {
  const rows = await query<{ id: string; has_lead: boolean }>(
    `SELECT d."id", EXISTS (SELECT 1 FROM ${T.leads} l WHERE l."design_id" = d."id") AS has_lead
       FROM ${T.designs} d
      WHERE d."session_id" = $1 AND d."archived_at" IS NULL
      ORDER BY d."turn_index" ASC`,
    [sessionId],
  )

  const { remove, archive } = partitionForDiscard(rows)

  if (archive.length) {
    await query(`UPDATE ${T.designs} SET "archived_at" = now() WHERE "id" = ANY($1)`, [archive])
  }

  // Oldest first. If this throws partway the NEWEST design still exists, so
  // latestDesign() keeps returning the page the visitor is looking at and the UI
  // stays truthful. Newest-first would leave an older design promoted to current,
  // which is the silent-undo failure reached by an error path instead of by design.
  let removed = 0
  for (const id of remove) {
    if (await removeDesign(id)) removed += 1
  }

  return { removed, archived: archive.length }
}

export async function allDesignPaths(): Promise<Set<string>> {
  const rows = await query<{ file_path: string }>(`SELECT "file_path" FROM ${T.designs}`)
  return new Set(rows.map((r) => r.file_path))
}
