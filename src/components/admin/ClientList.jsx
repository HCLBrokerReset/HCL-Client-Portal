import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import { format, parseISO } from 'date-fns'
import { Search, Filter, AlertTriangle } from 'lucide-react'
import StatusBadge from '../common/StatusBadge'
import RenewalCountdown from '../common/RenewalCountdown'
import Card from '../common/Card'

export default function ClientList() {
  const navigate = useNavigate()
  const { getClients, getCheckIns } = useData()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const clients = getClients()

  const filtered = clients.filter((c) => {
    const matchSearch =
      !search ||
      c.businessName.toLowerCase().includes(search.toLowerCase()) ||
      c.sector.toLowerCase().includes(search.toLowerCase()) ||
      c.brokerName.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || c.status === filterStatus
    return matchSearch && matchStatus
  })

  const sortOrder = { 'action-required': 0, overdue: 1, 'flag-raised': 2, 'file-current': 3 }
  const sorted = [...filtered].sort(
    (a, b) => (sortOrder[a.status] ?? 9) - (sortOrder[b.status] ?? 9)
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy dark:text-white tracking-tight">
          All Clients
        </h1>
        <p className="text-gray-500 dark:text-white/40 text-sm mt-1">
          {clients.length} client{clients.length !== 1 ? 's' : ''} under governance
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients, sector, broker…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-navy-50 text-navy dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400 flex-shrink-0" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-navy-50 text-navy dark:text-white text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold/40"
          >
            <option value="all">All statuses</option>
            <option value="file-current">File Current</option>
            <option value="flag-raised">Flag Raised</option>
            <option value="action-required">Action Required</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Client table */}
      <div className="space-y-3">
        {sorted.length === 0 && (
          <Card>
            <div className="px-6 py-12 text-center text-gray-400">No clients match your filters.</div>
          </Card>
        )}
        {sorted.map((client) => {
          const checkIns = getCheckIns(client.id)
          const lastCheckIn = checkIns[checkIns.length - 1]
          const flaggedCheckIns = checkIns.filter((c) => c.flags?.length > 0)

          return (
            <Card
              key={client.id}
              onClick={() => navigate(`/admin/clients/${client.id}`)}
              className="hover:border-gold/40 transition-colors"
            >
              <div className="px-6 py-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                  {/* Client info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-base font-semibold text-navy dark:text-white">
                        {client.businessName}
                      </h3>
                      <StatusBadge status={client.status} />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-white/40">
                      {client.sector} · {client.contactName}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">
                      Broker: {client.brokerName} — {client.brokerCompany}
                    </p>
                  </div>

                  {/* Meta columns */}
                  <div className="flex gap-6 text-sm flex-shrink-0">
                    <div>
                      <p className="text-xs text-gray-400 dark:text-white/30 mb-0.5">Last check-in</p>
                      <p className="text-navy dark:text-white font-medium text-xs">
                        {lastCheckIn
                          ? format(parseISO(lastCheckIn.submittedAt), 'd MMM yyyy')
                          : 'None'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 dark:text-white/30 mb-0.5">Active flags</p>
                      <p className={`font-medium text-xs flex items-center gap-1 ${flaggedCheckIns.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'}`}>
                        {flaggedCheckIns.length > 0 && <AlertTriangle size={11} />}
                        {flaggedCheckIns.length > 0 ? `${flaggedCheckIns.length} month${flaggedCheckIns.length > 1 ? 's' : ''}` : 'None'}
                      </p>
                    </div>
                    <div>
                      <RenewalCountdown renewalDate={client.renewalDate} />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
