import { Sparkles, Code2, Activity, Shield } from 'lucide-react'

const SERVICES = [
  { key: 'ai',  icon: Sparkles,  label: 'AI Development',         sub: 'Tools, automation, agents' },
  { key: 'sw',  icon: Code2,     label: 'Software Development',   sub: 'Web apps, dashboards, portals' },
  { key: 'ops', icon: Activity,  label: 'Operations & DevOps',    sub: 'Deploy, monitor, maintain' },
  { key: 'sec', icon: Shield,    label: 'Security & Performance', sub: 'Safer, faster, scalable' },
]

export function ServicesStrip({ delay = 1000 }: { delay?: number }) {
  return (
    <div
      className="hidden md:grid grid-cols-4 gap-3 mt-10 animate-blur-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      {SERVICES.map(({ key, icon: Icon, label, sub }) => (
        <div key={key} className="liquid-glass rounded-2xl px-5 py-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Icon size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-white text-sm font-medium leading-tight">{label}</div>
            <div className="text-gray-400 text-xs mt-1 leading-snug">{sub}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
