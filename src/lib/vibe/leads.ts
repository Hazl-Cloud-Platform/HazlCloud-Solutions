import { T, query, queryOne } from './db'
import type { LeadRow } from '@/types/vibe'

/** Deliberately permissive: the goal is to catch typos, not to adjudicate RFC 5322.
 *  Rejecting a valid address costs us a lead. */
const EMAIL_RE = /^[^\s@]+@[^\s@,]+\.[^\s@,]{2,}$/

export function normalizeEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase()
  if (email.length < 5 || email.length > 254) return null
  return EMAIL_RE.test(email) ? email : null
}

export async function createLead(args: {
  sessionId: string
  designId: string | null
  email: string
  note: string | null
  ipHash: string
}): Promise<LeadRow> {
  const row = await queryOne<LeadRow>(
    `INSERT INTO ${T.leads} ("session_id","design_id","email","note","ip_hash")
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [args.sessionId, args.designId, args.email, args.note?.slice(0, 2_000) ?? null, args.ipHash],
  )
  if (!row) throw new Error('failed to record the lead')
  return row
}

export async function markContacted(leadId: string, contacted: boolean): Promise<void> {
  await query(`UPDATE ${T.leads} SET "contacted_at" = ${contacted ? 'now()' : 'NULL'} WHERE "id" = $1`, [leadId])
}

export async function deleteLead(leadId: string): Promise<void> {
  await query(`DELETE FROM ${T.leads} WHERE "id" = $1`, [leadId])
}

/** Supports the privacy request path: erase everything tied to one address. */
export async function deleteLeadsByEmail(email: string): Promise<number> {
  const rows = await query<{ id: string }>(`DELETE FROM ${T.leads} WHERE lower("email") = lower($1) RETURNING "id"`, [
    email,
  ])
  return rows.length
}
