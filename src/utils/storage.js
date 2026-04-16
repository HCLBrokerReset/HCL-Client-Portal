// ============================================================
// HCL Client Portal — localStorage Persistence Layer
// ============================================================
// Wraps all data access in read/write helpers that use localStorage.
// To migrate to a real database, replace these functions with API calls.
// ============================================================

import {
  INITIAL_USERS,
  INITIAL_BROKERS,
  INITIAL_CLIENTS,
  INITIAL_CHECKINS,
  INITIAL_GOVERNANCE_REPORTS,
  INITIAL_BROKER_ACTIONS,
  INITIAL_MESSAGES,
} from '../data/initialData'

const KEYS = {
  USERS: 'hcl_users',
  BROKERS: 'hcl_brokers',
  CLIENTS: 'hcl_clients',
  CHECKINS: 'hcl_checkins',
  REPORTS: 'hcl_reports',
  BROKER_ACTIONS: 'hcl_broker_actions',
  MESSAGES: 'hcl_messages',
  INITIALISED: 'hcl_initialised',
}

/** Seed localStorage with demo data if not already done. */
export function initialiseStorage() {
  if (localStorage.getItem(KEYS.INITIALISED)) return

  localStorage.setItem(KEYS.USERS, JSON.stringify(INITIAL_USERS))
  localStorage.setItem(KEYS.BROKERS, JSON.stringify(INITIAL_BROKERS))
  localStorage.setItem(KEYS.CLIENTS, JSON.stringify(INITIAL_CLIENTS))
  localStorage.setItem(KEYS.CHECKINS, JSON.stringify(INITIAL_CHECKINS))
  localStorage.setItem(KEYS.REPORTS, JSON.stringify(INITIAL_GOVERNANCE_REPORTS))
  localStorage.setItem(KEYS.BROKER_ACTIONS, JSON.stringify(INITIAL_BROKER_ACTIONS))
  localStorage.setItem(KEYS.MESSAGES, JSON.stringify(INITIAL_MESSAGES))
  localStorage.setItem(KEYS.INITIALISED, 'true')
}

/** Hard reset — clears all data and re-seeds. Used for dev/demo. */
export function resetStorage() {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k))
  initialiseStorage()
}

// ---- Generic helpers ----

function getAll(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

function setAll(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}

function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

// ---- Users ----

export const userStorage = {
  getAll: () => getAll(KEYS.USERS),
  findByEmail: (email) =>
    getAll(KEYS.USERS).find((u) => u.email.toLowerCase() === email.toLowerCase()),
  findById: (id) => getAll(KEYS.USERS).find((u) => u.id === id),
}

// ---- Clients ----

export const clientStorage = {
  getAll: () => getAll(KEYS.CLIENTS),
  findById: (id) => getAll(KEYS.CLIENTS).find((c) => c.id === id),
  update: (id, updates) => {
    const all = getAll(KEYS.CLIENTS)
    const idx = all.findIndex((c) => c.id === id)
    if (idx === -1) return null
    all[idx] = { ...all[idx], ...updates }
    setAll(KEYS.CLIENTS, all)
    return all[idx]
  },
  create: (data) => {
    const all = getAll(KEYS.CLIENTS)
    const newClient = { id: generateId('client'), ...data, onboardedAt: new Date().toISOString() }
    all.push(newClient)
    setAll(KEYS.CLIENTS, all)
    return newClient
  },
}

// ---- Check-ins ----

export const checkInStorage = {
  getAll: () => getAll(KEYS.CHECKINS),
  forClient: (clientId) => getAll(KEYS.CHECKINS).filter((c) => c.clientId === clientId),
  findById: (id) => getAll(KEYS.CHECKINS).find((c) => c.id === id),
  forClientMonth: (clientId, month) =>
    getAll(KEYS.CHECKINS).find((c) => c.clientId === clientId && c.month === month),
  create: (data) => {
    const all = getAll(KEYS.CHECKINS)
    const newCheckIn = {
      id: generateId('checkin'),
      submittedAt: new Date().toISOString(),
      ...data,
    }
    all.push(newCheckIn)
    setAll(KEYS.CHECKINS, all)
    return newCheckIn
  },
  update: (id, updates) => {
    const all = getAll(KEYS.CHECKINS)
    const idx = all.findIndex((c) => c.id === id)
    if (idx === -1) return null
    all[idx] = { ...all[idx], ...updates }
    setAll(KEYS.CHECKINS, all)
    return all[idx]
  },
}

// ---- Governance Reports ----

export const reportStorage = {
  getAll: () => getAll(KEYS.REPORTS),
  forClient: (clientId) => getAll(KEYS.REPORTS).filter((r) => r.clientId === clientId),
  findById: (id) => getAll(KEYS.REPORTS).find((r) => r.id === id),
  create: (data) => {
    const all = getAll(KEYS.REPORTS)
    const newReport = {
      id: generateId('report'),
      createdAt: new Date().toISOString(),
      publishedAt: null,
      status: 'draft',
      ...data,
    }
    all.push(newReport)
    setAll(KEYS.REPORTS, all)
    return newReport
  },
  update: (id, updates) => {
    const all = getAll(KEYS.REPORTS)
    const idx = all.findIndex((r) => r.id === id)
    if (idx === -1) return null
    all[idx] = { ...all[idx], ...updates }
    setAll(KEYS.REPORTS, all)
    return all[idx]
  },
  delete: (id) => {
    const all = getAll(KEYS.REPORTS).filter((r) => r.id !== id)
    setAll(KEYS.REPORTS, all)
  },
}

// ---- Broker Actions ----

export const brokerActionStorage = {
  getAll: () => getAll(KEYS.BROKER_ACTIONS),
  forClient: (clientId) => getAll(KEYS.BROKER_ACTIONS).filter((a) => a.clientId === clientId),
  forBroker: (brokerId) => getAll(KEYS.BROKER_ACTIONS).filter((a) => a.brokerId === brokerId),
  findById: (id) => getAll(KEYS.BROKER_ACTIONS).find((a) => a.id === id),
  create: (data) => {
    const all = getAll(KEYS.BROKER_ACTIONS)
    const newAction = {
      id: generateId('baction'),
      sentAt: new Date().toISOString(),
      respondedAt: null,
      status: 'pending',
      ...data,
    }
    all.push(newAction)
    setAll(KEYS.BROKER_ACTIONS, all)
    return newAction
  },
  update: (id, updates) => {
    const all = getAll(KEYS.BROKER_ACTIONS)
    const idx = all.findIndex((a) => a.id === id)
    if (idx === -1) return null
    all[idx] = { ...all[idx], ...updates }
    setAll(KEYS.BROKER_ACTIONS, all)
    return all[idx]
  },
}

// ---- Messages ----

export const messageStorage = {
  getAll: () => getAll(KEYS.MESSAGES),
  forClient: (clientId) =>
    getAll(KEYS.MESSAGES)
      .filter((m) => m.clientId === clientId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
  create: (data) => {
    const all = getAll(KEYS.MESSAGES)
    const newMsg = {
      id: generateId('msg'),
      timestamp: new Date().toISOString(),
      read: false,
      ...data,
    }
    all.push(newMsg)
    setAll(KEYS.MESSAGES, all)
    return newMsg
  },
  markRead: (clientId, userId) => {
    const all = getAll(KEYS.MESSAGES)
    const updated = all.map((m) =>
      m.clientId === clientId && m.senderId !== userId ? { ...m, read: true } : m
    )
    setAll(KEYS.MESSAGES, updated)
  },
}
