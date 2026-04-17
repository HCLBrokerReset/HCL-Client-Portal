import { differenceInDays, format, parseISO } from 'date-fns'

export default function RenewalCountdown({ renewalDate, className = '', compact = false }) {
  const days = differenceInDays(parseISO(renewalDate), new Date())

  const urgency =
    days < 0 ? 'overdue' :
    days <= 30 ? 'critical' :
    days <= 60 ? 'warning' :
    days <= 90 ? 'soon' : 'ok'

  const colour = {
    overdue: 'text-rose-600 dark:text-rose-400',
    critical: 'text-rose-600 dark:text-rose-400',
    warning: 'text-amber-600 dark:text-amber-400',
    soon: 'text-amber-500',
    ok: 'text-emerald-600 dark:text-emerald-400',
  }[urgency]

  const label =
    days < 0 ? `${Math.abs(days)}d overdue` :
    days === 0 ? 'Today' :
    `${days} days`

  if (compact) {
    return (
      <div className={className}>
        <div className={`font-bold text-sm ${colour}`}>{label}</div>
      </div>
    )
  }

  return (
    <div className={className}>
      <p className={`text-sm font-semibold ${colour}`}>{label} to renewal</p>
      <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">
        {format(parseISO(renewalDate), 'd MMM yyyy')}
      </p>
    </div>
  )
}
