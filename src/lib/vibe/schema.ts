import type { PoolClient, Client } from 'pg'

/**
 * The whole Vibe Studio schema as one idempotent statement block.
 *
 * Table names carry the mandated `Sol-Vibe-Code_` prefix, which contains capitals
 * and a hyphen -- so every identifier MUST stay double-quoted. An unquoted
 * reference fails loudly at query time rather than silently hitting a different
 * relation, which is the one mercy of this naming.
 *
 * No table stores generated HTML. The documents live on disk under
 * VIBE_STORAGE_DIR and `designs.file_path` is the pointer; Postgres is the index.
 */
export const VIBE_DDL = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- One anonymous studio visit.
CREATE TABLE IF NOT EXISTS "Sol-Vibe-Code_sessions" (
  "id"                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  "ip_hash"               char(64)    NOT NULL,
  "user_agent"            text        NULL,
  "referrer"              text        NULL,
  "first_prompt"          text        NULL,
  "turn_count"            integer     NOT NULL DEFAULT 0,
  "turnstile_verified_at" timestamptz NULL,
  "created_at"            timestamptz NOT NULL DEFAULT now(),
  "last_turn_at"          timestamptz NULL
);
CREATE INDEX IF NOT EXISTS "Sol-Vibe-Code_sessions_ip_created_idx"
  ON "Sol-Vibe-Code_sessions" ("ip_hash", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "Sol-Vibe-Code_sessions_created_idx"
  ON "Sol-Vibe-Code_sessions" ("created_at" DESC);

-- Chat history handed back to the model. User prompts and the short assistant
-- note ONLY -- never document HTML, which would defeat the disk-first design and
-- make every later turn pay to re-read superseded copies.
CREATE TABLE IF NOT EXISTS "Sol-Vibe-Code_turns" (
  "id"         bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "session_id" uuid        NOT NULL REFERENCES "Sol-Vibe-Code_sessions"("id") ON DELETE CASCADE,
  "ip_hash"    char(64)    NOT NULL,
  "role"       text        NOT NULL CHECK ("role" IN ('user','assistant')),
  "content"    text        NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "Sol-Vibe-Code_turns_session_idx"
  ON "Sol-Vibe-Code_turns" ("session_id", "id");
-- Serves the per-IP daily turn cap without a join back to sessions.
CREATE INDEX IF NOT EXISTS "Sol-Vibe-Code_turns_ip_created_idx"
  ON "Sol-Vibe-Code_turns" ("ip_hash", "created_at" DESC);

-- One row per generated document version. UNIQUE(session_id, turn_index) means a
-- full-rewrite fallback REPLACES its failed edit attempt rather than inserting a
-- second row for the same turn.
CREATE TABLE IF NOT EXISTS "Sol-Vibe-Code_designs" (
  "id"         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  "session_id" uuid        NOT NULL REFERENCES "Sol-Vibe-Code_sessions"("id") ON DELETE CASCADE,
  "turn_index" integer     NOT NULL,
  "title"      text        NOT NULL DEFAULT 'Untitled mockup',
  "file_path"  text        NOT NULL,
  "bytes"      integer     NOT NULL,
  "sha256"     char(64)    NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "Sol-Vibe-Code_designs_turn_uq" UNIQUE ("session_id", "turn_index")
);
CREATE INDEX IF NOT EXISTS "Sol-Vibe-Code_designs_session_idx"
  ON "Sol-Vibe-Code_designs" ("session_id", "turn_index" DESC);
CREATE INDEX IF NOT EXISTS "Sol-Vibe-Code_designs_created_idx"
  ON "Sol-Vibe-Code_designs" ("created_at" DESC);

-- The point of the whole feature.
CREATE TABLE IF NOT EXISTS "Sol-Vibe-Code_leads" (
  "id"           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  "session_id"   uuid        NOT NULL REFERENCES "Sol-Vibe-Code_sessions"("id") ON DELETE CASCADE,
  "design_id"    uuid        NULL REFERENCES "Sol-Vibe-Code_designs"("id") ON DELETE SET NULL,
  "email"        text        NOT NULL,
  "note"         text        NULL,
  "ip_hash"      char(64)    NOT NULL,
  "created_at"   timestamptz NOT NULL DEFAULT now(),
  "contacted_at" timestamptz NULL
);
CREATE INDEX IF NOT EXISTS "Sol-Vibe-Code_leads_created_idx"
  ON "Sol-Vibe-Code_leads" ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "Sol-Vibe-Code_leads_ip_created_idx"
  ON "Sol-Vibe-Code_leads" ("ip_hash", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "Sol-Vibe-Code_leads_email_idx"
  ON "Sol-Vibe-Code_leads" (lower("email"));

-- One row per Anthropic API call. Priced at write time, so re-pricing later never
-- rewrites history. (turn_index, attempt) is what lets the admin separate the two
-- calls of a single failed edit turn and report a real fallback rate.
CREATE TABLE IF NOT EXISTS "Sol-Vibe-Code_usage_events" (
  "id"                    bigint        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "session_id"            uuid          NULL REFERENCES "Sol-Vibe-Code_sessions"("id") ON DELETE SET NULL,
  "model"                 text          NOT NULL,
  "kind"                  text          NOT NULL DEFAULT 'generate',
  "turn_index"            integer       NOT NULL DEFAULT 0,
  "attempt"               integer       NOT NULL DEFAULT 1,
  "input_tokens"          integer       NOT NULL DEFAULT 0,
  "output_tokens"         integer       NOT NULL DEFAULT 0,
  "cache_creation_tokens" integer       NOT NULL DEFAULT 0,
  "cache_read_tokens"     integer       NOT NULL DEFAULT 0,
  "cost_usd"              numeric(12,6) NOT NULL,
  "created_at"            timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "Sol-Vibe-Code_usage_created_idx"
  ON "Sol-Vibe-Code_usage_events" ("created_at" DESC) INCLUDE ("cost_usd");
CREATE INDEX IF NOT EXISTS "Sol-Vibe-Code_usage_session_idx"
  ON "Sol-Vibe-Code_usage_events" ("session_id");

-- Admin login rate limiting and audit. NOTE: with one shared password the email
-- is self-asserted, not authenticated -- see adminAuth.ts.
CREATE TABLE IF NOT EXISTS "Sol-Vibe-Code_login_attempts" (
  "id"         bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "ip_hash"    char(64)    NOT NULL,
  "email"      text        NULL,
  "ok"         boolean     NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "Sol-Vibe-Code_login_ip_created_idx"
  ON "Sol-Vibe-Code_login_attempts" ("ip_hash", "created_at" DESC);

CREATE TABLE IF NOT EXISTS "Sol-Vibe-Code_settings" (
  "key"        text        PRIMARY KEY,
  "value"      text        NOT NULL,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- Seeded once; ON CONFLICT DO NOTHING so a re-run never stomps an admin edit.
-- Rates are the verified Opus 4.8 card: $5 in, $25 out, cache write 1.25x,
-- cache read 0.1x, all per MTok.
INSERT INTO "Sol-Vibe-Code_settings" ("key","value") VALUES
  ('monthly_budget_usd', '100'),
  ('daily_budget_usd', '3.50'),
  ('admin_session_epoch', '1'),
  ('pricing', '{"input_per_mtok":5,"output_per_mtok":25,"cache_write_per_mtok":6.25,"cache_read_per_mtok":0.5}')
ON CONFLICT ("key") DO NOTHING;
`

/**
 * Applies the DDL under an advisory lock so two boots, or a redeploy racing a
 * migration, cannot interleave. Deliberately NOT called on pool connect: on a
 * serverless host that would re-run the whole block on every cold start.
 */
export async function applySchema(client: PoolClient | Client): Promise<void> {
  await client.query('BEGIN')
  try {
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', ['sol-vibe-code-schema'])
    await client.query(VIBE_DDL)
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  }
}
