'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AdminOverview, UsageDay } from '@/types/vibe'
import type { AdminDesign, AdminLead } from '@/lib/vibe/adminQueries'
import { DesignPreview } from './DesignPreview'

type Tab = 'overview' | 'leads' | 'designs' | 'usage'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'leads', label: 'Leads' },
  { id: 'designs', label: 'Designs' },
  { id: 'usage', label: 'Usage' },
]

/**
 * Every amount in this console is US dollars. The rate card is quoted per MTok in
 * USD and `cost_usd` is stored in USD, so nothing here is ever converted -- but
 * HAZL bills in CAD, and a bare "$12.34" on a Canadian desk is ambiguous enough
 * to be read as the wrong number. The currency is named wherever a figure stands
 * on its own.
 */
const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const money = (n: number) => USD.format(n)
const moneyUsd = (n: number) => `${USD.format(n)} USD`
const edits = (n: number) => `${n} ${n === 1 ? 'edit' : 'edits'}`
const bytes = (n: number) => (n > 1 << 20 ? `${(n / (1 << 20)).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`)
const when = (s: string) => new Date(s).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

export function AdminConsole({ email }: { email: string }) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [fallback, setFallback] = useState<{ edits: number; fallbacks: number; rate: number } | null>(null)
  const [leads, setLeads] = useState<AdminLead[]>([])
  const [designs, setDesigns] = useState<AdminDesign[]>([])
  const [usage, setUsage] = useState<UsageDay[]>([])
  const [days, setDays] = useState(30)
  const [withLeadOnly, setWithLeadOnly] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [o, l, d, u] = await Promise.all([
      fetch('/api/vibe/admin/overview').then((r) => r.json()),
      fetch('/api/vibe/admin/leads').then((r) => r.json()),
      fetch(`/api/vibe/admin/designs?withLead=${withLeadOnly ? '1' : '0'}`).then((r) => r.json()),
      fetch(`/api/vibe/admin/usage?days=${days}`).then((r) => r.json()),
    ])
    if (o.ok) {
      setOverview(o.overview)
      setFallback(o.fallback)
    }
    if (l.ok) setLeads(l.leads)
    if (d.ok) setDesigns(d.designs)
    if (u.ok) setUsage(u.rows)
  }, [days, withLeadOnly])

  useEffect(() => {
    void load()
  }, [load])

  const say = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(null), 3500)
  }

  const act = async (fn: () => Promise<Response>, done: string) => {
    if (busy) return
    setBusy(true)
    try {
      const res = await fn()
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null
      say(res.ok && data?.ok ? done : (data?.error ?? 'That did not work.'))
      await load()
    } finally {
      setBusy(false)
    }
  }

  const logout = async () => {
    await fetch('/api/vibe/admin/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
    router.replace('/vibe/admin/login')
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-[1120px] px-6 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-[19px] font-bold tracking-[-.02em]">Vibe Studio</h1>
          <p className="mt-0.5 text-[12.5px] text-white/40">
            Signed in as {email}
            {/* One shared password means this name is self-asserted, not proven.
                Saying so is better than implying an audit trail we do not have. */}
            <span className="text-white/25"> · shared password, so this is not verified identity</span>
          </p>
        </div>
        <button onClick={logout} className="btn-outline rounded-lg px-4 py-2 text-[13px] font-semibold">
          Sign out
        </button>
      </header>

      <nav className="mt-5 flex gap-1.5" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3.5 py-2 text-[13.5px] font-semibold transition-colors ${
              tab === t.id ? 'bg-white/10 text-white' : 'text-white/45 hover:text-white'
            }`}
          >
            {t.label}
            {t.id === 'leads' && overview && overview.leadsUncontacted > 0 && (
              <span className="ml-2 rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[10.5px] font-bold text-black">
                {overview.leadsUncontacted}
              </span>
            )}
          </button>
        ))}
      </nav>

      {toast && (
        <p className="mt-4 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3.5 py-2.5 text-[13px]">
          {toast}
        </p>
      )}

      {tab === 'overview' && overview && (
        <OverviewTab overview={overview} fallback={fallback} act={act} busy={busy} />
      )}

      {tab === 'leads' && (
        <section className="mt-6">
          {leads.length === 0 && <Empty>No one has asked to be contacted yet.</Empty>}
          <div className="flex flex-col gap-2.5">
            {leads.map((l) => (
              <article key={l.id} className="rounded-[12px] border border-white/10 bg-white/[0.02] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <a href={`mailto:${l.email}`} className="text-[15px] font-bold text-[var(--accent)] hover:underline">
                      {l.email}
                    </a>
                    <p className="mt-1 text-[12.5px] text-white/40">
                      {when(l.created_at)} · {l.turn_count} {l.turn_count === 1 ? 'turn' : 'turns'}
                      {l.contacted_at && <span className="text-[#4ade80]"> · contacted</span>}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {l.design_id && (
                      <button
                        onClick={() => setPreview(l.design_id)}
                        className="btn-outline rounded-lg px-3 py-1.5 text-[12.5px] font-semibold"
                      >
                        Preview
                      </button>
                    )}
                    <button
                      onClick={() =>
                        act(
                          () =>
                            fetch(`/api/vibe/admin/leads/${l.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ contacted: !l.contacted_at }),
                            }),
                          l.contacted_at ? 'Marked as not contacted.' : 'Marked as contacted.',
                        )
                      }
                      className="btn-outline rounded-lg px-3 py-1.5 text-[12.5px] font-semibold"
                    >
                      {l.contacted_at ? 'Undo' : 'Mark contacted'}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete the lead from ${l.email}? This cannot be undone.`)) {
                          void act(() => fetch(`/api/vibe/admin/leads/${l.id}`, { method: 'DELETE' }), 'Lead deleted.')
                        }
                      }}
                      className="btn-outline rounded-lg px-3 py-1.5 text-[12.5px] font-semibold text-white/60"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {l.first_prompt && (
                  <p className="mt-3 border-l-2 border-white/10 pl-3 text-[13px] leading-relaxed text-white/55">
                    “{l.first_prompt}”
                  </p>
                )}
                {l.note && <p className="mt-2 text-[13px] leading-relaxed text-white/70">{l.note}</p>}
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'designs' && (
        <section className="mt-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-[13px] text-white/60">
              <input type="checkbox" checked={withLeadOnly} onChange={(e) => setWithLeadOnly(e.target.checked)} />
              Only designs with a lead
            </label>
            <span className="flex-1" />
            <button
              disabled={busy}
              onClick={() => {
                if (confirm('Delete every design older than 30 days that has no lead attached?')) {
                  void act(
                    () =>
                      fetch('/api/vibe/admin/designs', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'purge_stale', days: 30 }),
                      }),
                    'Old designs purged.',
                  )
                }
              }}
              className="btn-outline rounded-lg px-3 py-1.5 text-[12.5px] font-semibold disabled:opacity-50"
            >
              Purge older than 30 days
            </button>
            <button
              disabled={busy}
              onClick={() =>
                act(
                  () =>
                    fetch('/api/vibe/admin/designs', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'sweep_orphans' }),
                    }),
                  'Orphaned files swept.',
                )
              }
              className="btn-outline rounded-lg px-3 py-1.5 text-[12.5px] font-semibold disabled:opacity-50"
            >
              Sweep orphan files
            </button>
            <button
              disabled={busy}
              onClick={() =>
                act(
                  () =>
                    fetch('/api/vibe/admin/designs', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'prune_logins', days: 30 }),
                    }),
                  'Old login attempts pruned.',
                )
              }
              className="btn-outline rounded-lg px-3 py-1.5 text-[12.5px] font-semibold disabled:opacity-50"
            >
              Prune login log
            </button>
          </div>

          {designs.length === 0 && <Empty>Nothing generated yet.</Empty>}
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {designs.map((d) => (
              <article key={d.id} className="rounded-[12px] border border-white/10 bg-white/[0.02] p-3.5">
                <h3 className="truncate text-[14px] font-semibold" title={d.title}>
                  {d.title}
                </h3>
                <p className="mt-1 text-[12px] text-white/40">
                  {when(d.created_at)} · turn {d.turn_index + 1} · {bytes(d.bytes)}
                  {d.has_lead && <span className="text-[var(--accent)]"> · lead</span>}
                </p>
                {d.first_prompt && <p className="mt-2 line-clamp-2 text-[12.5px] text-white/45">{d.first_prompt}</p>}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setPreview(d.id)}
                    className="btn-outline flex-1 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${d.title}"? The file is removed from disk.`)) {
                        void act(() => fetch(`/api/vibe/admin/designs/${d.id}`, { method: 'DELETE' }), 'Design deleted.')
                      }
                    }}
                    className="btn-outline rounded-lg px-3 py-1.5 text-[12.5px] font-semibold text-white/60"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'usage' && <UsageTab usage={usage} days={days} setDays={setDays} />}

      {preview && <DesignPreview designId={preview} onClose={() => setPreview(null)} />}
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-[12px] border border-dashed border-white/10 px-4 py-10 text-center text-[13.5px] text-white/35">
      {children}
    </p>
  )
}

function Meter({ label, spent, budget }: { label: string; spent: number; budget: number }) {
  const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0
  // Amber at 75%, red at 90%: the point is to notice before the studio goes dark
  // on the primary conversion page, not after.
  const colour = pct >= 90 ? '#ef4444' : pct >= 75 ? '#f59e0b' : 'var(--accent)'
  return (
    <div className="rounded-[12px] border border-white/10 bg-white/[0.02] p-4">
      <p className="text-[11.5px] font-bold uppercase tracking-[.12em] text-white/40">
        {label}
        <span className="text-white/25"> · USD</span>
      </p>
      <p className="mt-2 text-[24px] font-bold tracking-[-.02em] tabular-nums">
        {money(spent)}
        <span className="text-[14px] font-medium text-white/35"> of {money(budget)}</span>
      </p>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full transition-[width]" style={{ width: `${pct}%`, background: colour }} />
      </div>
    </div>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-[12px] border border-white/10 bg-white/[0.02] p-4">
      <p className="text-[11.5px] font-bold uppercase tracking-[.12em] text-white/40">{label}</p>
      <p className="mt-2 text-[24px] font-bold tracking-[-.02em] tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-[12.5px] text-white/40">{sub}</p>}
    </div>
  )
}

function OverviewTab({
  overview,
  fallback,
  act,
  busy,
}: {
  overview: AdminOverview
  fallback: { edits: number; fallbacks: number; rate: number } | null
  act: (fn: () => Promise<Response>, done: string) => Promise<void>
  busy: boolean
}) {
  const [monthly, setMonthly] = useState(String(overview.monthBudgetUsd))
  const [daily, setDaily] = useState(String(overview.dayBudgetUsd))
  const [changes, setChanges] = useState(String(overview.maxTurnsPerSession))

  return (
    <section className="mt-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Meter label="This month" spent={overview.monthSpendUsd} budget={overview.monthBudgetUsd} />
        <Meter label="Today" spent={overview.daySpendUsd} budget={overview.dayBudgetUsd} />
        <Stat
          label="Sessions"
          value={String(overview.sessions1d)}
          sub={`${overview.sessions7d} this week · ${overview.sessions30d} this month`}
        />
        <Stat
          label="Leads"
          value={String(overview.leadsTotal)}
          sub={`${overview.leadsRecent} in 7 days · ${overview.leadsUncontacted} uncontacted`}
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat
          label="Stored designs"
          value={String(overview.designCount)}
          sub={`${bytes(overview.diskBytes)} on disk · largest ${bytes(overview.largestBytes)}`}
        />
        <Stat
          label="Disk free"
          value={overview.diskFreeBytes ? bytes(overview.diskFreeBytes) : '—'}
          sub="Generation fails cleanly below 64 MB"
        />
        {fallback && (
          <Stat
            label="Edit fallback rate"
            value={`${Math.round(fallback.rate * 100)}%`}
            sub={
              fallback.edits === 0
                ? 'No edit turns yet'
                : `${fallback.fallbacks} of ${fallback.edits} edit calls · over 35% means rewrites are cheaper`
            }
          />
        )}
      </div>

      <div className="mt-6 rounded-[12px] border border-white/10 bg-white/[0.02] p-5">
        <h2 className="text-[15px] font-bold">Limits</h2>
        <p className="mt-1 text-[12.5px] text-white/45">
          Spending is checked before every model call, in US dollars. When a limit is reached the studio offers
          visitors a call instead.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-[12.5px] text-white/60">
            Monthly (USD)
            <input
              type="number"
              min={0}
              max={5000}
              step="1"
              value={monthly}
              onChange={(e) => setMonthly(e.target.value)}
              className="mt-1.5 block w-32 rounded-lg border border-white/15 bg-white/[0.03] px-3 py-2 text-[14px] tabular-nums text-white focus:border-white/35 focus:outline-none"
            />
          </label>
          <label className="text-[12.5px] text-white/60">
            Daily (USD)
            <input
              type="number"
              min={0}
              max={1000}
              step="0.5"
              value={daily}
              onChange={(e) => setDaily(e.target.value)}
              className="mt-1.5 block w-32 rounded-lg border border-white/15 bg-white/[0.03] px-3 py-2 text-[14px] tabular-nums text-white focus:border-white/35 focus:outline-none"
            />
          </label>
          <label className="text-[12.5px] text-white/60">
            Changes per session
            <input
              type="number"
              min={1}
              max={20}
              step="1"
              value={changes}
              onChange={(e) => setChanges(e.target.value)}
              className="mt-1.5 block w-32 rounded-lg border border-white/15 bg-white/[0.03] px-3 py-2 text-[14px] tabular-nums text-white focus:border-white/35 focus:outline-none"
            />
          </label>
          <button
            disabled={busy}
            onClick={() =>
              act(
                () =>
                  fetch('/api/vibe/admin/settings', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      monthlyBudgetUsd: Number(monthly),
                      dailyBudgetUsd: Number(daily),
                      maxTurnsPerSession: Number(changes),
                    }),
                  }),
                'Limits updated.',
              )
            }
            className="btn-accent rounded-lg px-4 py-2.5 text-[13.5px] font-bold disabled:opacity-50"
          >
            Save limits
          </button>
        </div>

        <p className="mt-3 text-[12.5px] leading-relaxed text-white/40">
          A change is one visitor prompt: the first generation plus its refinements, so{' '}
          {overview.maxTurnsPerSession} means one design and {edits(overview.maxTurnsPerSession - 1)}. It applies to
          sessions already running, and at roughly $0.15 a change it moves spend directly. One IP address is still
          held to {overview.maxTurnsPerIpDay} changes a day across every session it starts, and a single session
          still stops at its {money(overview.sessionBudgetUsd)} spend ceiling — around eight to twelve changes at
          the current rate card, and set in code rather than here.
        </p>

        <div className="mt-5 border-t border-white/10 pt-4">
          <p className="text-[12.5px] text-white/45">
            Pricing in use, USD per MTok: ${overview.pricing.input_per_mtok} in, ${overview.pricing.output_per_mtok}{' '}
            out, cache write ${overview.pricing.cache_write_per_mtok}, cache read $
            {overview.pricing.cache_read_per_mtok}. Each call is priced when it happens, so changing these never
            rewrites past spend.
          </p>
          <button
            disabled={busy}
            onClick={() => {
              if (confirm('Sign out every admin session, including this one?')) {
                void act(
                  () =>
                    fetch('/api/vibe/admin/settings', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ signOutAll: true }),
                    }),
                  'All admin sessions signed out.',
                )
              }
            }}
            className="btn-outline mt-3 rounded-lg px-3.5 py-2 text-[12.5px] font-semibold disabled:opacity-50"
          >
            Sign out all admins
          </button>
        </div>
      </div>
    </section>
  )
}

function UsageTab({ usage, days, setDays }: { usage: UsageDay[]; days: number; setDays: (d: number) => void }) {
  const max = Math.max(0.0001, ...usage.map((u) => u.costUsd))
  const total = usage.reduce((s, u) => s + u.costUsd, 0)

  return (
    <section className="mt-6">
      <div className="mb-4 flex items-center gap-2">
        {[30, 90, 365].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`rounded-lg px-3 py-1.5 text-[12.5px] font-semibold ${
              days === d ? 'bg-white/10 text-white' : 'text-white/45 hover:text-white'
            }`}
          >
            {d} days
          </button>
        ))}
        <span className="ml-auto text-[13px] text-white/50 tabular-nums">Total {moneyUsd(total)}</span>
      </div>

      <p className="mb-4 text-[12.5px] text-white/35">
        Amounts are US dollars, priced at the rate card in force when each call ran.
      </p>

      {usage.length === 0 ? (
        <Empty>No model calls in this window.</Empty>
      ) : (
        <div className="overflow-x-auto rounded-[12px] border border-white/10">
          <table className="w-full min-w-[680px] text-[13px]">
            <thead>
              <tr className="border-b border-white/10 text-left text-[11.5px] uppercase tracking-[.1em] text-white/40">
                <th className="px-3.5 py-2.5 font-bold">Day</th>
                <th className="px-3.5 py-2.5 font-bold">Calls</th>
                <th className="px-3.5 py-2.5 text-right font-bold">In</th>
                <th className="px-3.5 py-2.5 text-right font-bold">Out</th>
                <th className="px-3.5 py-2.5 text-right font-bold">Cache read</th>
                <th className="px-3.5 py-2.5 text-right font-bold">Fallbacks</th>
                <th className="px-3.5 py-2.5 text-right font-bold">Cost (USD)</th>
                <th className="w-[110px] px-3.5 py-2.5" />
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {usage.map((u) => (
                <tr key={u.day} className="border-b border-white/[0.06] last:border-0">
                  <td className="px-3.5 py-2.5">{u.day}</td>
                  <td className="px-3.5 py-2.5">{u.calls}</td>
                  <td className="px-3.5 py-2.5 text-right text-white/60">{u.inputTokens.toLocaleString()}</td>
                  <td className="px-3.5 py-2.5 text-right text-white/60">{u.outputTokens.toLocaleString()}</td>
                  <td className="px-3.5 py-2.5 text-right text-white/40">{u.cacheReadTokens.toLocaleString()}</td>
                  <td className={`px-3.5 py-2.5 text-right ${u.fallbacks > 0 ? 'text-[#f59e0b]' : 'text-white/25'}`}>
                    {u.fallbacks}
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-semibold">{money(u.costUsd)}</td>
                  <td className="px-3.5 py-2.5">
                    <div className="h-1.5 rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-[var(--accent)]"
                        style={{ width: `${(u.costUsd / max) * 100}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
