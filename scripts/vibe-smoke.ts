/**
 * End-to-end check of the generation pipeline against the real gateway, with Next
 * out of the way. Creates a session, runs a turn, and reports what actually landed
 * on disk and in the ledger.
 *
 *   npm run vibe:smoke                          # turn 1, default prompt
 *   npm run vibe:smoke -- "a CRM dashboard"     # turn 1, custom prompt
 *   npm run vibe:smoke -- <session-uuid> "make it dark mode"   # follow-up turn
 *
 * The follow-up form is the one that matters: it exercises the SEARCH/REPLACE
 * path, which the whole cost model depends on being much cheaper than a rewrite.
 */
import { T, query } from '../src/lib/vibe/db'
import { runTurn } from '../src/lib/vibe/generate'
import { latestDesignHtml } from '../src/lib/vibe/designs'
import type { VibeEvent } from '../src/types/vibe'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const IP_HASH = '0'.repeat(64)

async function main() {
  const args = process.argv.slice(2)
  const resume = args[0] && UUID_RE.test(args[0]) ? args.shift()! : null
  const prompt =
    args.join(' ') ||
    'A booking page for a physiotherapy clinic in Calgary: pick a therapist, pick a time slot, see the price.'

  let sessionId: string
  let turnIndex = 0

  if (resume) {
    const rows = await query<{ id: string; turn_count: number }>(
      `SELECT "id","turn_count" FROM ${T.sessions} WHERE "id" = $1`,
      [resume],
    )
    if (!rows.length) throw new Error(`no such session: ${resume}`)
    sessionId = rows[0].id
    turnIndex = Number(rows[0].turn_count)
    await query(`UPDATE ${T.sessions} SET "turn_count" = "turn_count" + 1 WHERE "id" = $1`, [sessionId])
    console.log(`resuming session ${sessionId} at turn ${turnIndex}`)
  } else {
    sessionId = (
      await query<{ id: string }>(
        `INSERT INTO ${T.sessions} ("ip_hash","user_agent","turn_count") VALUES ($1,$2,1) RETURNING "id"`,
        [IP_HASH, 'smoke-test'],
      )
    )[0].id
    console.log(`session: ${sessionId}`)
  }

  console.log(`prompt: ${prompt}\n`)

  const seen: Record<string, number> = {}
  let note = ''
  let html = ''
  const t0 = Date.now()

  const res = await runTurn({
    sessionId,
    ipHash: IP_HASH,
    turnIndex,
    userMessage: prompt,
    emit: (e: VibeEvent) => {
      seen[e.type] = (seen[e.type] ?? 0) + 1
      if (e.type === 'note') note = e.delta
      if (e.type === 'html') html = e.html
      if (e.type === 'usage') console.log(`  usage: $${e.costUsd.toFixed(4)}  in=${e.inputTokens} out=${e.outputTokens}`)
      if (e.type === 'error') console.log(`  ERROR [${e.code}] ${e.message}`)
    },
  })

  console.log(`\nchanged=${res.changed} in ${((Date.now() - t0) / 1000).toFixed(1)}s`)
  console.log('events:', JSON.stringify(seen))
  console.log('note:', note)

  if (html) {
    const head = html.slice(html.indexOf('<head>') + 6, html.indexOf('</head>'))
    const anchors = html.match(/<a [^>]*href="http/g) ?? []
    console.log(`bytes: ${Buffer.byteLength(html, 'utf8')}`)
    console.log(`CSP first in head: ${head.trimStart().startsWith('<meta http-equiv="Content-Security-Policy"')}`)
    console.log(`tailwind pinned: ${html.includes('cdn.tailwindcss.com/3.4.16')}`)
    console.log(`off-site <a> links: ${anchors.length} (must be 0)`)
    console.log(`network calls: ${/\bfetch\(|XMLHttpRequest|WebSocket/.test(html)}  (must be false)`)
    const stored = await latestDesignHtml(sessionId)
    console.log(`on disk: ${stored ? `${stored.row.file_path} (${stored.row.bytes}B)` : 'MISSING'}`)
  }

  // How the turn was actually billed. `kind` is what tells us whether the cheap
  // edit path held or fell back to a full rewrite.
  const ledger = await query<{ kind: string; attempt: number; cost_usd: number; output_tokens: number; cache_read_tokens: number }>(
    `SELECT "kind","attempt","cost_usd","output_tokens","cache_read_tokens" FROM ${T.usage}
      WHERE "session_id" = $1 ORDER BY "id"`,
    [sessionId],
  )
  console.log('\nledger:')
  for (const r of ledger) {
    console.log(
      `  ${r.kind.padEnd(14)} attempt=${r.attempt}  out=${String(r.output_tokens).padStart(5)}  ` +
        `cacheRead=${String(r.cache_read_tokens).padStart(5)}  $${Number(r.cost_usd).toFixed(4)}`,
    )
  }
  const total = ledger.reduce((s, r) => s + Number(r.cost_usd), 0)
  console.log(`  session total: $${total.toFixed(4)}`)
  console.log(`\nfollow up with:\n  npm run vibe:smoke -- ${sessionId} "make it dark mode"`)
  process.exit(0)
}

main().catch((e: unknown) => {
  console.error(e)
  process.exit(1)
})
