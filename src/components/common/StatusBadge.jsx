const CONFIG = {
  'file-current': { label: 'Current', classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  'flag-raised':  { label: 'Flag',    classes: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  'action-required': { label: 'Action', classes: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
  overdue:        { label: 'Overdue', classes: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
  pending:        { label: 'Pending', classes: 'bg-amber-100 text-amber-700' },
  resolved:       { label: 'Resolved', classes: 'bg-emerald-100 text-emerald-700' },
  escalated:      { label: 'Escalated', classes: 'bg-rose-100 text-rose-700' },
  draft:          { label: 'Draft', classes: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/60' },
  published:      { label: 'Published', classes: 'bg-[#2447F9]/10 text-[#2447F9] dark:bg-[#2447F9]/20 dark:text-blue-400' },
}

export default function StatusBadge({ status, className = '' }) {
  const cfg = CONFIG[status] || { label: status, classes: 'bg-slate-100 text-slate-600' }
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${cfg.classes} ${className}`}>
      {cfg.label}
    </span>
  )
}
