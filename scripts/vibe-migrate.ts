/**
 * Applies the Vibe Studio schema. Run with:
 *   npm run vibe:migrate
 *
 * Uses MIGRATION_DATABASE_URL (Supabase's DIRECT connection, port 5432) rather
 * than DATABASE_URL (the transaction-mode pooler, 6543): PgBouncer in transaction
 * mode cannot hold a multi-statement DDL transaction reliably.
 */
import { Client } from 'pg'
import { applySchema } from '../src/lib/vibe/schema'
import { sslConfig, stripSslParams } from '../src/lib/vibe/db'

async function main() {
  const url = process.env.MIGRATION_DATABASE_URL
  if (!url) {
    // Deliberately no fallback to DATABASE_URL: that points at Supabase's
    // transaction pooler, which cannot hold a multi-statement DDL transaction.
    // Falling back would half-apply the schema and look like it worked.
    throw new Error(
      'MIGRATION_DATABASE_URL is not set. It must be the DIRECT connection (port 5432), ' +
        'not the pooler. Run under `doppler run -p hazl-general -c prd`.',
    )
  }

  const host = new URL(url).host
  console.log(`Applying Sol-Vibe-Code schema to ${host} ...`)

  const client = new Client({ connectionString: stripSslParams(url), ssl: sslConfig(url) })
  await client.connect()
  try {
    await applySchema(client)
    const { rows } = await client.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name LIKE 'Sol-Vibe-Code\\_%'
        ORDER BY table_name`,
    )
    console.log(`Schema applied. ${rows.length} tables:`)
    for (const r of rows) console.log(`  - ${r.table_name}`)
  } finally {
    await client.end()
  }
}

main().catch((err: unknown) => {
  console.error('Migration failed:', err instanceof Error ? err.message : err)
  process.exit(1)
})
