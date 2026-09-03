import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'
import { sslConfig, stripSslParams } from '../db'

const SUPA = 'postgresql://u:p@aws-0-us-west-2.pooler.supabase.com:6543/postgres'

describe('stripSslParams', () => {
  // node-postgres treats an sslmode in the URL as authoritative and REPLACES the
  // explicit ssl object with {} -- silently discarding the pinned Supabase CA, so
  // the connection then fails against their private root.
  it('removes sslmode', () => {
    expect(stripSslParams(`${SUPA}?sslmode=require`)).toBe(SUPA)
  })

  it('removes every ssl-affecting parameter', () => {
    const dirty = `${SUPA}?sslmode=verify-full&sslrootcert=/x.crt&sslcert=/y.crt&sslkey=/z.key&uselibpqcompat=true`
    expect(stripSslParams(dirty)).toBe(SUPA)
  })

  it('keeps unrelated parameters intact', () => {
    const out = stripSslParams(`${SUPA}?sslmode=require&application_name=vibe&connect_timeout=10`)
    expect(out).toContain('application_name=vibe')
    expect(out).toContain('connect_timeout=10')
    expect(out).not.toContain('sslmode')
  })

  it('leaves a clean URL byte-identical', () => {
    expect(stripSslParams(SUPA)).toBe(SUPA)
  })

  it('does not leave a dangling question mark', () => {
    expect(stripSslParams(`${SUPA}?sslmode=require`)).not.toMatch(/\?$/)
  })

  it('passes through a non-URL connection string unchanged', () => {
    const kv = 'host=localhost user=postgres sslmode=require'
    expect(stripSslParams(kv)).toBe(kv)
  })

  it('actually keeps the pinned CA that pg would otherwise discard', () => {
    // The bug in one assertion. sslConfig() still reads the ORIGINAL string (so
    // it can tell this is Supabase), while pg is handed a stripped one it will
    // not override.
    //
    // Reached via createRequire because @types/pg does not expose this internal
    // path through its package.json "exports".
    type ConnParams = new (o: unknown) => { ssl?: { ca?: string } }
    const req = createRequire(import.meta.url)
    const CP = req('pg/lib/connection-parameters.js') as ConnParams

    const dirty = `${SUPA}?sslmode=require`

    // Unstripped: pg builds its own ssl config and the pinned CA is gone.
    expect(new CP({ connectionString: dirty, ssl: sslConfig(dirty) }).ssl?.ca).toBeUndefined()

    // Stripped: it survives, and the connection can validate Supabase's private root.
    expect(new CP({ connectionString: stripSslParams(dirty), ssl: sslConfig(dirty) }).ssl?.ca).toContain(
      'BEGIN CERTIFICATE',
    )
  })
})

describe('sslConfig', () => {
  it('pins the Supabase root CA', () => {
    const cfg = sslConfig(SUPA) as { ca?: string; rejectUnauthorized?: boolean }
    expect(cfg.rejectUnauthorized).toBe(true)
    expect(cfg.ca).toContain('BEGIN CERTIFICATE')
  })

  it('still recognises Supabase after the params are stripped', () => {
    expect(sslConfig(stripSslParams(`${SUPA}?sslmode=require`))).toBeTruthy()
  })

  it('does not force TLS on a plain local database', () => {
    expect(sslConfig('postgresql://postgres@localhost:5432/dev')).toBeUndefined()
  })
})
