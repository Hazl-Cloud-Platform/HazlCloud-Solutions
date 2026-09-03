'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function AdminLogin({ emails }: { emails: string[] }) {
  const router = useRouter()
  const [email, setEmail] = useState(emails[0] ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/vibe/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null
      if (!res.ok || !data?.ok) {
        // The server returns one generic message for a bad email and a bad
        // password alike; surfacing it verbatim keeps that property.
        setError(data?.error ?? 'Sign-in failed.')
        setBusy(false)
        return
      }
      router.replace('/vibe/admin')
      router.refresh()
    } catch {
      setError('Could not reach the server.')
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-[360px]">
        <h1 className="text-[20px] font-bold tracking-[-.02em]">Vibe Studio</h1>
        <p className="mt-1.5 text-[13px] text-white/45">Admin access</p>

        <label htmlFor="admin-email" className="mt-6 block text-[11.5px] font-bold uppercase tracking-[.12em] text-white/40">
          Email
        </label>
        {emails.length > 1 ? (
          <select
            id="admin-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-[10px] border border-white/15 bg-white/[0.03] px-3.5 py-3 text-[14px] text-white focus:border-white/35 focus:outline-none"
          >
            {emails.map((e) => (
              <option key={e} value={e} className="bg-[#111]">
                {e}
              </option>
            ))}
          </select>
        ) : (
          <input
            id="admin-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-[10px] border border-white/15 bg-white/[0.03] px-3.5 py-3 text-[14px] text-white focus:border-white/35 focus:outline-none"
          />
        )}

        <label htmlFor="admin-pw" className="mt-4 block text-[11.5px] font-bold uppercase tracking-[.12em] text-white/40">
          Password
        </label>
        <input
          id="admin-pw"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 w-full rounded-[10px] border border-white/15 bg-white/[0.03] px-3.5 py-3 text-[14px] text-white focus:border-white/35 focus:outline-none"
        />

        {error && <p className="mt-3 text-[13px] text-[#f87171]">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="btn-accent mt-5 w-full rounded-lg px-5 py-3 text-[14px] font-bold disabled:opacity-60"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
