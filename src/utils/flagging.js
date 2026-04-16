// ============================================================
// HCL Client Portal — Auto-flagging Engine
// ============================================================
// Compares a new check-in against the previous month's data
// and generates governance alerts when material changes are detected.
// ============================================================

/**
 * Analyse a new check-in submission and return any flags raised.
 * @param {Object} newData - The submitted check-in form data
 * @param {Object|null} previousData - The previous month's check-in data (null if first check-in)
 * @returns {string[]} Array of flag strings describing each alert
 */
export function analyseCheckIn(newData, previousData) {
  const flags = []

  // --- Turnover change > 15% ---
  if (previousData && previousData.estimatedTurnover > 0) {
    const change =
      (newData.estimatedTurnover - previousData.estimatedTurnover) /
      previousData.estimatedTurnover
    if (Math.abs(change) > 0.15) {
      const direction = change > 0 ? 'increased' : 'decreased'
      const pct = Math.round(Math.abs(change) * 100)
      flags.push(
        `Turnover ${direction} by ${pct}% vs previous month (threshold: 15%)`
      )
    }
  }

  // --- Wage bill increased significantly ---
  if (newData.wageBillChange === 'increased-significantly') {
    flags.push('Wage bill increased significantly')
  }

  // --- Significant new contract ---
  if (newData.newContracts === 'yes-significant') {
    flags.push('Significant new contract declared')
  }

  // --- New types of work ---
  if (newData.newTypesOfWork === true) {
    flags.push('New types of work not previously undertaken declared')
  }

  // --- Any incident, near-miss or complaint ---
  if (newData.incidents === 'minor') {
    flags.push('Minor incident, near-miss or complaint reported')
  }
  if (newData.incidents === 'significant') {
    flags.push('Significant incident, near-miss, complaint or potential claim reported')
  }

  return flags
}

/**
 * Determine client status based on check-in history and flags.
 * @param {Object[]} checkIns - Array of check-ins for this client
 * @param {string} renewalDate - ISO date string of renewal date
 * @returns {'file-current'|'flag-raised'|'action-required'|'overdue'}
 */
export function deriveClientStatus(checkIns, renewalDate) {
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // Check if overdue (no check-in submitted for current month by 15th)
  const currentMonthCheckIn = checkIns.find((c) => c.month === currentMonth)
  const dayOfMonth = now.getDate()
  if (!currentMonthCheckIn && dayOfMonth > 15) {
    return 'overdue'
  }

  // Check for action-required flags (significant incidents or significant wage increase)
  const hasActionRequired = checkIns.some(
    (c) =>
      c.flags &&
      c.flags.some(
        (f) =>
          f.includes('Significant incident') ||
          (f.includes('Wage bill') && f.includes('significantly'))
      )
  )
  if (hasActionRequired) return 'action-required'

  // Check for any flags at all
  const hasFlags = checkIns.some((c) => c.flags && c.flags.length > 0)
  if (hasFlags) return 'flag-raised'

  return 'file-current'
}

/**
 * Format a turnover value as GBP string.
 */
export function formatTurnover(value) {
  if (!value && value !== 0) return 'N/A'
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Human-readable label for wage bill change values.
 */
export const WAGE_BILL_LABELS = {
  'no-change': 'No change',
  'increased-slightly': 'Increased slightly',
  'increased-significantly': 'Increased significantly',
  decreased: 'Decreased',
}

export const STAFF_CHANGE_LABELS = {
  'no-change': 'No change',
  'hired-1-2': 'Hired 1–2 staff',
  'hired-3-or-more': 'Hired 3 or more staff',
  'reduced-headcount': 'Reduced headcount',
}

export const CONTRACT_LABELS = {
  no: 'No',
  'yes-small': 'Yes — small contract',
  'yes-significant': 'Yes — significant contract',
}

export const INCIDENT_LABELS = {
  no: 'No',
  minor: 'Minor incident / near-miss / complaint',
  significant: 'Significant incident / claim / complaint',
}
