import { differenceInDays, format, parseISO } from 'date-fns'

export default function RenewalCountdown({ renewalDate, className = '' }) {
  const days = differenceInDays(parseISO(renewalDate), new Date())
  const formatted = format(parseISO(renewalDate), 'd MMMM yyyy')

  const urgency =
    days < 0 ? 'overdue' :
    days <= 30 ? 'critical' :
    days <= 60 ? 'warning' :
    days <= 90 ? 'soon' : 'ok'

  const colors = {
    overdue: 'text-red-600 dark:text-red-400',
    critical: 'text-red-600 dark:text-red-400',
    warning: 'text-amber-600 dark:text-amber-400',
    soon: 'text-amber-500 dark:text-amber-400',
    ok: 'text-emerald-600 dark:text-emerald-400',
  }

  const label =
    days < 0 ? `Overdue by ${Math.abs(days)} days` :
    days === 0 ? 'Renews today' :
    days === 1 ? '1 day to renewal' :
    `${days} days to renewal`

  return (
    <div className={className}>
      <p className={`text-sm font-semibold ${colors[urgency]}`}>{label}</p>
      <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">{formatted}</p>
    </div>
  )
}
