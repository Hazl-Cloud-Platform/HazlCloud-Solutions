import { Boxes, ShieldOff, Laptop, Wallet, ArrowRight } from 'lucide-react'

const PROBLEMS = [
  {
    icon: Boxes,
    title: 'App sprawl nobody owns',
    body: 'Dozens of one-off AI-built apps and dashboards; no inventory, no owner, no version control.',
  },
  {
    icon: ShieldOff,
    title: 'AI agents with keys to production',
    body: 'Coding agents pointed at real databases without a sandbox, guardrails or alerts.',
  },
  {
    icon: Laptop,
    title: "Hosted on someone's laptop",
    body: 'The app everyone relies on goes down when its builder goes on vacation.',
  },
  {
    icon: Wallet,
    title: 'Spend nobody can see',
    body: 'Token and cloud costs spread across teams with no budgets, telemetry or ROI.',
  },
]

export function ProblemSection() {
  return (
    <section id="problems" className="relative bg-black text-white px-4 sm:px-6 md:px-12 py-20 md:py-32 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <div className="mb-14 md:mb-20 max-w-3xl">
          <div className="text-xs font-medium tracking-[0.18em] uppercase text-gray-500 mb-5">
            The problem
          </div>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal leading-[1.05] text-white"
            style={{ letterSpacing: '-0.035em' }}
          >
            Your teams can build an app in an afternoon.
            <br />
            <span className="text-gray-500">Someone still has to run it.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12 md:gap-y-16">
          {PROBLEMS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex flex-col gap-4">
              <div className="w-11 h-11 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center">
                <Icon size={20} className="text-white" strokeWidth={1.6} />
              </div>
              <h3
                className="text-xl md:text-2xl font-medium text-white leading-snug"
                style={{ letterSpacing: '-0.02em' }}
              >
                {title}
              </h3>
              <p className="text-gray-400 text-base leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-20 md:mt-28 pt-10 border-t border-white/10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <p
            className="text-xl md:text-2xl text-white max-w-2xl leading-snug"
            style={{ letterSpacing: '-0.02em' }}
          >
            We give IT a safe, governed way to say yes — without slowing the business down.
          </p>
          <a
            href="/approach"
            className="liquid-glass rounded-full px-6 py-3 text-sm font-medium text-white inline-flex items-center gap-2 self-start"
          >
            See how we work
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  )
}
