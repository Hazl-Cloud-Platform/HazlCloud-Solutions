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
  return row
}

export async function latestDesign(sessionId: string): Promise<DesignRow | null> {
  return queryOne<DesignRow>(
    `SELECT * FROM ${T.designs} WHERE "session_id" = $1 ORDER BY "turn_index" DESC LIMIT 1`,
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

export async function allDesignPaths(): Promise<Set<string>> {
  const rows = await query<{ file_path: string }>(`SELECT "file_path" FROM ${T.designs}`)
  return new Set(rows.map((r) => r.file_path))
}
