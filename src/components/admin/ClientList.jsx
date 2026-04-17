import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import { format, parseISO } from 'date-fns'
import { Search, ArrowRight, AlertTriangle } from 'lucide-react'
import StatusBadge from '../common/StatusBadge'
import RenewalCountdown from '../common/RenewalCountdown'
import Card from '../common/Card'

export default function ClientList() {
  const navigate = useNavigate()
  const { getClients, getCheckIns } = useData()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const clients = getClients()
  const filtered = clients.filter(c => {
    const q = search.toLowerCase()
    return (
      (!q || c.businessName.toLowerCase().includes(q) || c.sector.toLowerCase().includes(q) || c.brokerName.toLowerCase().includes(q)) &&
      (filterStatus === 'all' || c.status === filterStatus)
    )
  })
  const sortOrder = { 'action-required': 0, overdue: 1, 'flag-raised': 2, 'file-current': 3 }
  const sorted = [...filtered].sort((a,b) => (sortOrder[a.status]??9)-(sortOrder[b.status]??9))

  const barColour = s => s==='action-required'?'alert':s==='flag-raised'?'gold':'success'

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">All Clients</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          {clients.length} under governance
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search clients, sector, broker…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-[20px] border-0 bg-white pl-10 pr-4 py-3.5 text-sm text-slate-900 placeholder-slate-400 shadow-card outline-none focus:ring-2 focus:ring-royal/30 dark:bg-[#101a2e] dark:text-white"
        />
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['all','file-current','flag-raised','action-required','overdue'].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all flex-shrink-0 ${
              filterStatus === s
                ? 'bg-btn-primary text-white shadow-btn'
                : 'bg-white text-slate-600 shadow-card dark:bg-[#101a2e] dark:text-white/60'
            }`}
          >
            {s === 'all' ? 'All' : s.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {sorted.map(client => {
          const checkIns = getCheckIns(client.id)
          const last = [...checkIns].sort((a,b)=>b.month.localeCompare(a.month))[0]
          const flagged = checkIns.filter(c=>c.flags?.length>0)

          return (
            <Card key={client.id} bar={barColour(client.status)} onClick={() => navigate(`/admin/clients/${client.id}`)}>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-bold text-slate-900 dark:text-white">{client.businessName}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {client.sector} · {client.contactName}
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      Broker: {client.brokerName} — {client.brokerCompany}
                    </div>
                  </div>
                  <StatusBadge status={client.status} />
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <Chip label="Last check-in" value={last ? format(parseISO(last.submittedAt),'d MMM') : 'None'} />
                  <Chip label="Flags" value={flagged.length>0 ? `${flagged.length} raised` : 'Clear'} highlight={flagged.length>0} />
                  <Chip label="Renewal" value={<RenewalCountdown renewalDate={client.renewalDate} compact />} />
                </div>
              </div>
            </Card>
          )
        })}
        {sorted.length === 0 && (
          <Card><div className="p-8 text-center text-slate-400 text-sm">No clients match your filters.</div></Card>
        )}
      </div>
    </div>
  )
}

function Chip({ label, value, highlight }) {
  return (
    <div className="rounded-[16px] bg-slate-50 dark:bg-white/5 p-2.5">
      <div className="text-slate-400 dark:text-slate-500 text-[10px]">{label}</div>
      <div className={`mt-0.5 font-semibold ${highlight ? 'text-amber-600' : 'text-slate-800 dark:text-white'}`}>
        {value}
      </div>
    </div>
  )
}
