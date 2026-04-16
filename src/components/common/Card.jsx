export default function Card({ children, className = '', gold = false, onClick }) {
  const base =
    'bg-white dark:bg-navy-50 rounded-2xl shadow-premium border border-gray-100 dark:border-white/10 overflow-hidden'
  const goldAccent = gold ? 'border-t-2 border-t-gold' : ''
  const interactive = onClick ? 'cursor-pointer hover:shadow-premium-lg transition-shadow' : ''

  return (
    <div className={`${base} ${goldAccent} ${interactive} ${className}`} onClick={onClick}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`px-6 py-5 border-b border-gray-100 dark:border-white/10 ${className}`}>
      {children}
    </div>
  )
}

export function CardBody({ children, className = '' }) {
  return <div className={`px-6 py-5 ${className}`}>{children}</div>
}
