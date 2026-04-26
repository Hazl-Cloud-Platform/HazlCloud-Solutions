import { type LucideIcon } from 'lucide-react'

interface PrimaryButtonProps {
  children: React.ReactNode
  icon?: LucideIcon
  iconRight?: boolean
  delay?: number
  className?: string
  onClick?: () => void
}

export function PrimaryButton({
  children,
  icon: Icon,
  iconRight = false,
  delay = 0,
  className = '',
  onClick,
}: PrimaryButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`bg-white text-black rounded-full font-medium px-6 sm:px-8 py-3 sm:py-3.5 inline-flex items-center gap-2 hover:bg-gray-200 transition-colors animate-blur-fade-up ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {!iconRight && Icon && <Icon size={18} strokeWidth={2.2} />}
      <span>{children}</span>
      {iconRight && Icon && <Icon size={18} strokeWidth={2.2} />}
    </button>
  )
}

interface GlassPillWithIconProps {
  children: React.ReactNode
  icon?: LucideIcon
  iconRight?: boolean
  delay?: number
  className?: string
  href?: string
  onClick?: () => void
}

export function GlassPillWithIcon({
  children,
  icon: Icon,
  iconRight = false,
  delay = 0,
  className = '',
  href,
  onClick,
}: GlassPillWithIconProps) {
  const inner = (
    <>
      {!iconRight && Icon && <Icon size={18} />}
      <span className="text-sm">{children}</span>
      {iconRight && Icon && <Icon size={18} />}
    </>
  )

  const shared = `liquid-glass rounded-full font-medium text-white inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 animate-blur-fade-up ${className}`

  if (href) {
    return (
      <a href={href} className={shared} style={{ animationDelay: `${delay}ms` }}>
        {inner}
      </a>
    )
  }

  return (
    <button onClick={onClick} className={shared} style={{ animationDelay: `${delay}ms` }}>
      {inner}
    </button>
  )
}
