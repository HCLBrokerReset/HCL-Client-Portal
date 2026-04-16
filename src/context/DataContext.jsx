import { createContext, useContext, useState, useCallback } from 'react'
import {
  clientStorage,
  checkInStorage,
  reportStorage,
  brokerActionStorage,
  messageStorage,
} from '../utils/storage'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  // Force re-renders by bumping a counter — simple but effective for localStorage
  const [version, setVersion] = useState(0)
  const refresh = useCallback(() => setVersion((v) => v + 1), [])

  const value = {
    version,
    refresh,

    // Clients
    getClients: () => clientStorage.getAll(),
    getClient: (id) => clientStorage.findById(id),
    updateClient: (id, updates) => { clientStorage.update(id, updates); refresh() },
    createClient: (data) => { const c = clientStorage.create(data); refresh(); return c },

    // Check-ins
    getCheckIns: (clientId) => checkInStorage.forClient(clientId).sort(
      (a, b) => a.month.localeCompare(b.month)
    ),
    getCheckIn: (id) => checkInStorage.findById(id),
    getCheckInForMonth: (clientId, month) => checkInStorage.forClientMonth(clientId, month),
    createCheckIn: (data) => { const c = checkInStorage.create(data); refresh(); return c },
    updateCheckIn: (id, updates) => { const c = checkInStorage.update(id, updates); refresh(); return c },

    // Reports
    getReports: (clientId) => reportStorage.forClient(clientId).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    ),
    getReport: (id) => reportStorage.findById(id),
    createReport: (data) => { const r = reportStorage.create(data); refresh(); return r },
    updateReport: (id, updates) => { const r = reportStorage.update(id, updates); refresh(); return r },
    deleteReport: (id) => { reportStorage.delete(id); refresh() },

    // Broker Actions
    getBrokerActions: (clientId) => brokerActionStorage.forClient(clientId).sort(
      (a, b) => new Date(b.sentAt) - new Date(a.sentAt)
    ),
    getBrokerActionsForBroker: (brokerId) => brokerActionStorage.forBroker(brokerId),
    createBrokerAction: (data) => { const a = brokerActionStorage.create(data); refresh(); return a },
    updateBrokerAction: (id, updates) => { const a = brokerActionStorage.update(id, updates); refresh(); return a },

    // Messages
    getMessages: (clientId) => messageStorage.forClient(clientId),
    sendMessage: (data) => { const m = messageStorage.create(data); refresh(); return m },
    markMessagesRead: (clientId, userId) => { messageStorage.markRead(clientId, userId); refresh() },
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
