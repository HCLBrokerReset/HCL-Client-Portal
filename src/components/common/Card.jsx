/**
 * Card variants matching the design reference:
 * - default: white card, large radius, card shadow
 * - hero: gradient hero card (blue/cyan)
 * - dark: dark gradient card
 * - accented: white card with a colour bar on top
 */

export default function Card({ children, className = '', onClick, bar }) {
  const barColours = {
    blue: 'bg-bar-blue',
    alert: 'bg-bar-alert',
    success: 'bg-bar-success',
    gold: 'bg-hcl-gold',
  }

  const interactive = onClick
    ? 'cursor-pointer transition-transform active:scale-[0.99]'
    : ''

  return (
    <div
      className={`card overflow-hidden ${interactive} ${className}`}
      onClick={onClick}
    >
      {bar && <div className={`h-1.5 w-full ${barColours[bar] || 'bg-bar-blue'}`} />}
      {children}
    </div>
  )
}

export function HeroCard({ children, className = '' }) {
  return (
    <div className={`rounded-[30px] bg-card-hero p-5 text-white shadow-hero ${className}`}>
      {children}
    </div>
  )
}

export function DarkCard({ children, className = '' }) {
  return (
    <div className={`rounded-[30px] bg-card-dark p-5 text-white shadow-hero ${className}`}>
      {children}
    </div>
  )
}

export function MetricTile({ icon: Icon, label, value, sub, gradient }) {
  const gradients = {
    blue: 'bg-tile-blue',
    alert: 'bg-tile-alert',
    success: 'bg-tile-success',
    dark: 'bg-tile-dark',
    gold: 'bg-hcl-gold',
  }

  return (
    <div className={`rounded-[24px] p-4 text-white shadow-card-dark ${gradients[gradient] || gradients.blue}`}>
      <div className="flex items-center justify-between">
        <div className="text-sm text-white/75 leading-tight">{label}</div>
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/15 flex-shrink-0">
          <Icon size={17} />
        </div>
      </div>
      <div className="mt-5 text-3xl font-bold tracking-tight leading-none">{value}</div>
      {sub && <div className="mt-2 text-sm text-white/75">{sub}</div>}
    </div>
  )
}

export function GlassPill({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white ${className}`}>
      {children}
    </span>
  )
}

export function CardBody({ children, className = '' }) {
  return <div className={`p-5 ${className}`}>{children}</div>
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`px-5 py-4 border-b border-slate-100 dark:border-white/10 ${className}`}>
      {children}
    </div>
  )
}
