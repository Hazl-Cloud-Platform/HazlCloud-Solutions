import { AlertTriangle, ShieldOff, Gauge, Wrench, ArrowRight } from 'lucide-react'

const PROBLEMS = [
  {
    icon: AlertTriangle,
    title: 'Your app crashes when users actually show up',
    body: 'AI tools build something that works for one person. Real traffic, real edge cases, real concurrent users - that is a different problem. Most MVPs go down within their first 30 days of real use.',
  },
  {
    icon: ShieldOff,
    title: 'It is not secure, and you would not know if it were hacked',
    body: 'Default AI scaffolding ships with the API keys exposed, the database open, and no logging. The first sign of trouble is usually an angry email from a user - or a stranger in your data.',
  },
  {
    icon: Gauge,
    title: 'It slows to a crawl as you grow',
    body: 'Queries that work for 10 rows do not work for 10,000. Pages that load in a second on your laptop take 12 seconds in production. Your users leave before they ever see the value.',
  },
  {
    icon: Wrench,
    title: 'Nobody can fix it but the AI that built it',
    body: 'When something breaks at 2am, you cannot ask Claude to ship a hotfix to production. You need a human partner who has read the code, knows the system, and can intervene.',
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
            AI makes building easy.
            <br />
            <span className="text-gray-500">Running software is hard.</span>
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
            We turn fragile prototypes into reliable, scalable businesses - without rewriting from scratch.
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
