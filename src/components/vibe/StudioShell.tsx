'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ArrowUp, Sparkles } from 'lucide-react'
import { readSse } from '@/lib/client/sse'
import { useCountUp } from './useCountUp'
import { ContactModal } from './ContactModal'
import { HiddenAdminTrigger } from './HiddenAdminTrigger'
import { MockupFrame } from './MockupFrame'
import { TurnstileGate, type TurnstileHandle } from './TurnstileGate'
import type { VibeErrorCode } from '@/types/vibe'

const EXAMPLES = [
  'A booking page for a physiotherapy clinic — pick a therapist, pick a time, see the price.',
  'A CRM dashboard for a roofing company: pipeline stages, revenue this month, open jobs.',
  'A storefront for a small-batch coffee roaster with subscriptions.',
  'An admin portal for a tutoring business: students, sessions, invoices.',
]

type Msg =
  | { id: number; role: 'you'; text: string }
  | { id: number; role: 'studio'; text: string }
  | { id: number; role: 'problem'; text: string; code?: VibeErrorCode }

/** Omit<> over a union collapses its members, so distribute it explicitly. */
type NewMsg = Msg extends infer M ? (M extends { id: number } ? Omit<M, 'id'> : never) : never

let nextId = 1

export function StudioShell({ turnstileSiteKey }: { turnstileSiteKey: string | null }) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState(false)
  const [html, setHtml] = useState<string | null>(null)
  const [turnsLeft, setTurnsLeft] = useState<number | null>(null)
  const [liveTokens, setLiveTokens] = useState(0)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [contactOpen, setContactOpen] = useState(false)
  const [exhausted, setExhausted] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const busyRef = useRef(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const turnstileRef = useRef<TurnstileHandle>(null)
  const tokens = useCountUp(liveTokens)

  const push = useCallback((m: NewMsg) => {
    setMessages((prev) => [...prev, { ...m, id: nextId++ } as Msg])
  }, [])

  // Rehydrate after a reload so a refresh does not throw the design away.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/vibe/session')
        const data = (await res.json()) as {
          ok: boolean
          html?: string | null
          turnsLeft?: number
          design?: { missing?: boolean } | null
        }
        if (cancelled || !data.ok) return
        if (data.html) setHtml(data.html)
        if (data.design?.missing) {
          push({ role: 'problem', text: 'We could not load your previous design. Starting fresh.' })
        }
        if (typeof data.turnsLeft === 'number') {
          setTurnsLeft(data.turnsLeft)
          if (data.turnsLeft <= 0) setExhausted(true)
        }
      } catch {
        // Offline or blocked: the studio still works for a fresh session.
      } finally {
        if (!cancelled) setLoaded(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [push])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  const send = useCallback(
    async (text: string) => {
      const message = text.trim()
      if (!message || busyRef.current) return

      busyRef.current = true
      setBusy(true)
      setLiveTokens(0)
      setProgress(0)
      setStatus('Getting started')
      push({ role: 'you', text: message })
      setPrompt('')

      // Turnstile tokens are single-use and live five minutes, so one is taken per
      // submit and the widget is reset afterwards regardless of the outcome.
      let turnstileToken: string | null = null
      try {
        turnstileToken = (await turnstileRef.current?.getToken()) ?? null
      } catch {
        turnstileToken = null
      }

      try {
        const res = await fetch('/api/vibe/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, turnstileToken }),
        })

        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string; code?: VibeErrorCode } | null
          push({ role: 'problem', text: data?.error ?? `Request failed (${res.status})`, code: data?.code })
          if (data?.code === 'turn_cap' || data?.code === 'ip_cap') setExhausted(true)
          return
        }

        await readSse(res, ({ event, data }) => {
          const d = data as Record<string, unknown>
          switch (event) {
            case 'accepted':
              setTurnsLeft(Number(d.turnsLeft ?? 0))
              break
            case 'status':
              setStatus(String(d.label ?? ''))
              break
            case 'note':
              push({ role: 'studio', text: String(d.delta ?? '') })
              break
            case 'progress':
              setProgress(Number(d.pct ?? 0))
              break
            case 'usage_tick':
              setLiveTokens(Number(d.totalTokens ?? 0))
              break
            case 'html':
              setHtml(String(d.html ?? ''))
              setProgress(100)
              break
            case 'error':
              push({ role: 'problem', text: String(d.message ?? 'Something went wrong'), code: d.code as VibeErrorCode })
              if (['turn_cap', 'ip_cap', 'budget_exceeded', 'daily_budget', 'session_cost'].includes(String(d.code))) {
                setExhausted(true)
              }
              break
            case 'done':
              setTurnsLeft(Number(d.turnsLeft ?? 0))
              // Only latch on a turn that actually ran. A `done` from a busy
              // signal or a transient failure carries no meaningful count, and
              // latching on it would end the session mid-flow with no way back
              // except a reload the visitor has been told not to bother with.
              if (d.changed === true && Number(d.turnsLeft ?? 0) <= 0) setExhausted(true)
              break
          }
        })
      } catch (err) {
        push({ role: 'problem', text: (err as Error).message || 'The connection dropped. Please try again.' })
      } finally {
        turnstileRef.current?.reset()
        busyRef.current = false
        setBusy(false)
        setStatus('')
      }
    },
    [push],
  )

  const canSend = !busy && !exhausted && prompt.trim().length > 0

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-5 py-3">
        <div className="flex items-center gap-3">
          <Link href="/startup" className="flex items-center gap-2 no-underline">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/hazlCloud-logo-bw2.png" alt="" width={26} height={26} className="h-[26px] w-[26px]" />
            <span className="text-[15px] font-bold tracking-[-.03em] text-white">HAZL</span>
            <span className="hidden text-[15px] font-semibold tracking-[-.03em] text-white/45 sm:inline">STUDIO</span>
          </Link>
          <span className="hidden rounded-full border border-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[.12em] text-white/45 md:inline">
            Preview only
          </span>
        </div>

        <div className="flex items-center gap-3">
          {turnsLeft !== null && (
            <span className="hidden text-[13px] text-white/45 sm:inline">
              {turnsLeft} {turnsLeft === 1 ? 'change' : 'changes'} left
            </span>
          )}
          <button
            type="button"
            onClick={() => setContactOpen(true)}
            className="btn-accent inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-[13.5px] font-bold"
          >
            Contact our team
            <ArrowRight size={16} strokeWidth={2.4} />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <section className="flex min-h-0 shrink-0 flex-col border-white/10 lg:w-[400px] lg:border-r">
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            {messages.length === 0 && (
              <div>
                <h1 className="text-[22px] font-bold leading-tight tracking-[-.03em]">
                  Describe the app you wish existed.
                </h1>
                <p className="mt-2.5 text-[14px] leading-relaxed text-white/60">
                  You&apos;ll get a real, working-looking interface in under a minute. It uses sample data — the point is
                  to see it, not to run it.
                </p>
                <p className="mt-5 mb-2.5 text-[11px] font-bold uppercase tracking-[.14em] text-white/35">
                  Try one of these
                </p>
                <div className="flex flex-col gap-2">
                  {EXAMPLES.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setPrompt(e)}
                      className="rounded-[10px] border border-white/10 bg-white/[0.02] p-3 text-left text-[13px] leading-snug text-white/70 transition-colors hover:border-white/25 hover:text-white"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3.5">
              {messages.map((m) => (
                <div key={m.id}>
                  {m.role === 'you' && (
                    <div className="ml-auto max-w-[92%] rounded-[12px] rounded-br-sm bg-white/[0.07] px-3.5 py-2.5 text-[13.5px] leading-relaxed">
                      {m.text}
                    </div>
                  )}
                  {m.role === 'studio' && (
                    <div className="flex gap-2.5 text-[13.5px] leading-relaxed text-white/75">
                      <Sparkles size={15} strokeWidth={2.2} className="mt-0.5 shrink-0 text-[var(--accent)]" />
                      <span>{m.text}</span>
                    </div>
                  )}
                  {m.role === 'problem' && (
                    <div className="rounded-[10px] border border-[var(--accent)]/25 bg-[var(--accent)]/[0.07] px-3.5 py-3 text-[13px] leading-relaxed text-white/80">
                      {m.text}
                      {m.code && ['turn_cap', 'ip_cap', 'budget_exceeded', 'daily_budget', 'session_cost'].includes(m.code) && (
                        <button
                          type="button"
                          onClick={() => setContactOpen(true)}
                          className="mt-2.5 block font-bold text-[var(--accent)] underline-offset-2 hover:underline"
                        >
                          Talk to our team →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {busy && (
                <div className="flex items-center gap-2.5 text-[13px] text-white/45" aria-live="polite">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent)]" />
                  {status || 'Working'}
                  {tokens > 0 && <span className="tabular-nums text-white/30">· {tokens.toLocaleString()} tokens</span>}
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 border-t border-white/10 p-4">
            {exhausted ? (
              <div className="rounded-[10px] border border-[var(--accent)]/30 bg-[var(--accent)]/[0.07] p-4">
                <p className="text-[13.5px] font-semibold leading-snug">That&apos;s the end of the free preview.</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/65">
                  Send it to our team and a real person will make it secure, scalable and ready for customers.
                </p>
                <button
                  type="button"
                  onClick={() => setContactOpen(true)}
                  className="btn-accent mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-[14px] font-bold"
                >
                  Contact our team
                  <ArrowRight size={16} strokeWidth={2.4} />
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (canSend) void send(prompt)
                }}
              >
                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value.slice(0, 1200))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault()
                        if (canSend) void send(prompt)
                      }
                    }}
                    rows={3}
                    disabled={busy || !loaded}
                    placeholder={html ? 'What should change?' : 'A booking page for my barbershop…'}
                    aria-label="Describe what you want to build"
                    className="w-full resize-none rounded-[10px] border border-white/15 bg-white/[0.03] p-3 pr-12 text-[13.5px] leading-relaxed text-white placeholder:text-white/30 focus:border-white/35 focus:outline-none disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!canSend}
                    aria-label="Send"
                    className="btn-accent absolute bottom-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-lg disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ArrowUp size={16} strokeWidth={2.6} />
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11.5px] text-white/30">
                  <span>{prompt.length > 1000 ? `${prompt.length}/1200` : 'Enter to send'}</span>
                  <HiddenAdminTrigger />
                </div>
              </form>
            )}
            <TurnstileGate ref={turnstileRef} siteKey={turnstileSiteKey} />
          </div>
        </section>

        <MockupFrame html={html} busy={busy} progress={progress} />
      </div>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} hasDesign={Boolean(html)} />
    </div>
  )
}
