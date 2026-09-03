/**
 * Health check for the Vibe Studio's database side. Run with:
 *   npm run vibe:check
 *
 * Also asserts which host we resolved to. The dev command layers two `doppler run`
 * invocations and the INNER one wins on a key collision -- so if dr-keys ever
 * defined DATABASE_URL, we would silently be writing to the wrong database.
 */
import { Client } from 'pg'
import { sslConfig } from '../src/lib/vibe/db'

const TABLES = [
  'Sol-Vibe-Code_sessions',
  'Sol-Vibe-Code_turns',
  'Sol-Vibe-Code_designs',
  'Sol-Vibe-Code_leads',
  'Sol-Vibe-Code_usage_events',
  'Sol-Vibe-Code_login_attempts',
  'Sol-Vibe-Code_settings',
]

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set (run under `doppler run -p hazl-general -c prd`)')

  const host = new URL(url).host
  console.log(`host: ${host}`)
  if (!/supabase\.(co|com|net)/.test(host)) {
    console.warn(`WARNING: ${host} does not look like the HAZL Supabase instance.`)
  }

  const client = new Client({ connectionString: url, ssl: sslConfig(url) })
  await client.connect()
  try {
    let missing = 0
    for (const t of TABLES) {
      const { rows } = await client.query<{ n: number }>(`SELECT count(*)::int AS n FROM "${t}"`).catch(() => ({
        rows: [],
      }))
      if (!rows.length) {
        console.log(`  MISSING  ${t}`)
        missing += 1
      } else {
        console.log(`  ok       ${t.padEnd(30)} ${rows[0].n} rows`)
      }
    }

    const { rows: settings } = await client.query<{ key: string; value: string }>(
      `SELECT "key","value" FROM "Sol-Vibe-Code_settings" ORDER BY "key"`,
    )
    console.log('\nsettings:')
    for (const s of settings) console.log(`  ${s.key.padEnd(22)} ${s.value}`)

    // Month-to-date spend, computed exactly the way the budget gate does it: the
    // boundary is derived in JS and bound as a parameter, never with
    // date_trunc(... AT TIME ZONE 'UTC'), which resolves against the SESSION's
    // TimeZone and would silently shift the window by hours.
    const now = new Date()
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    const { rows: spend } = await client.query<{ spent: number }>(
      `SELECT COALESCE(sum("cost_usd"), 0) AS spent FROM "Sol-Vibe-Code_usage_events" WHERE "created_at" >= $1`,
      [monthStart],
    )
    const spent = Number(spend[0]?.spent ?? 0)
    console.log(`\nmonth-to-date spend (since ${monthStart.toISOString()}): $${spent.toFixed(4)}`)
    if (typeof spent !== 'number' || Number.isNaN(spent)) {
      throw new Error('spend did not parse as a number -- check the pg numeric type parser in db.ts')
    }

    if (missing) {
      console.error(`\n${missing} table(s) missing -- run: npm run vibe:migrate`)
      process.exit(1)
    }
    console.log('\nAll good.')
  } finally {
    await client.end()
  }
}

main().catch((err: unknown) => {
  console.error('Check failed:', err instanceof Error ? err.message : err)
  process.exit(1)
})
