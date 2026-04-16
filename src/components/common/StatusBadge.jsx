const STATUS_CONFIG = {
  'file-current': {
    label: 'File Current',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  'flag-raised': {
    label: 'Flag Raised',
    classes: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  'action-required': {
    label: 'Action Required',
    classes: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
    dot: 'bg-red-500 animate-pulse',
  },
  overdue: {
    label: 'Overdue',
    classes: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
    dot: 'bg-red-600 animate-pulse',
  },
  // Broker action statuses
  pending: {
    label: 'Pending',
    classes: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  resolved: {
    label: 'Resolved',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  escalated: {
    label: 'Escalated',
    classes: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-500 animate-pulse',
  },
  // Report statuses
  draft: {
    label: 'Draft',
    classes: 'bg-gray-50 text-gray-600 border-gray-200',
    dot: 'bg-gray-400',
  },
  published: {
    label: 'Published',
    classes: 'bg-navy/5 text-navy border-navy/20 dark:bg-white/10 dark:text-white/80 dark:border-white/20',
    dot: 'bg-navy dark:bg-gold',
  },
  // Renewal readiness
  'renewal-ready': {
    label: 'Renewal Ready',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
}

export default function StatusBadge({ status, className = '' }) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    classes: 'bg-gray-50 text-gray-600 border-gray-200',
    dot: 'bg-gray-400',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.classes} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot}`} />
      {config.label}
    </span>
  )
}
