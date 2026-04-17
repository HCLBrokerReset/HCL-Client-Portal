import { useNavigate } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import { format, parseISO } from 'date-fns'
import {
  Users, AlertTriangle, ClipboardList, FileText,
  ArrowRight, Sparkles, Activity,
} from 'lucide-react'
import StatusBadge from '../common/StatusBadge'
import Card, { MetricTile, DarkCard, GlassPill } from '../common/Card'
import RenewalCountdown from '../common/RenewalCountdown'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { getClients, getCheckIns, getReports, getBrokerActions } = useData()

  const clients = getClients()
  const allCheckIns = clients.flatMap(c => getCheckIns(c.id))
  const allReports = clients.flatMap(c => getReports(c.id))
  const allActions = clients.flatMap(c => getBrokerActions(c.id))

  const stats = {
    total: clients.length,
    flags: clients.filter(c => c.status === 'flag-raised' || c.status === 'action-required').length,
    openActions: allActions.filter(a => a.status !== 'resolved').length,
    reports: allReports.length,
  }

  // Priority sort
  const sortOrder = { 'action-required': 0, 'flag-raised': 1, overdue: 2, 'file-current': 3 }
  const sorted = [...clients].sort((a, b) => (sortOrder[a.status] ?? 9) - (sortOrder[b.status] ?? 9))

  // Top flagged check-in for focus card
  const topAlert = clients.find(c => c.status === 'action-required') || clients.find(c => c.status === 'flag-raised')

  const barColour = (status) =>
    status === 'action-required' ? 'alert' :
    status === 'flag-raised' ? 'gold' : 'success'

  return (
    <div className="space-y-4">
      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <MetricTile icon={Users}       label="Clients"      value={String(stats.total).padStart(2,'0')}    sub="Live portfolio"       gradient="blue" />
        <MetricTile icon={AlertTriangle} label="Flags"      value={String(stats.flags).padStart(2,'0')}    sub="Needs oversight"      gradient="alert" />
        <MetricTile icon={ClipboardList} label="Open"       value={String(stats.openActions).padStart(2,'0')} sub="Broker response due" gradient="success" />
        <MetricTile icon={FileText}    label="Reports"      value={String(stats.reports).padStart(2,'0')}  sub="Ready to export"      gradient="dark" />
      </div>

      {/* Today's focus */}
      {topAlert && (
        <DarkCard>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white/70">Today's focus</div>
              <div className="mt-1 text-xl font-bold leading-snug truncate">
                {topAlert.businessName} needs chasing
              </div>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 flex-shrink-0">
              <Sparkles size={20} />
            </div>
          </div>
          <div className="mt-2 text-sm text-white/75">{topAlert.notes}</div>
          <button
            onClick={() => navigate(`/admin/clients/${topAlert.id}?tab=Broker+Log`)}
            className="mt-4 rounded-[18px] bg-white px-4 py-3 text-sm font-bold text-slate-900 transition-transform active:scale-[0.98]"
          >
            Open accountability log
          </button>
        </DarkCard>
      )}

      {/* Client cards */}
      <div className="space-y-3">
        {sorted.map((client) => {
          const checkIns = getCheckIns(client.id)
          const last = [...checkIns].sort((a,b) => b.month.localeCompare(a.month))[0]
          const flagged = checkIns.filter(c => c.flags?.length > 0)

          return (
            <Card
              key={client.id}
              bar={barColour(client.status)}
              onClick={() => navigate(`/admin/clients/${client.id}`)}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-bold text-slate-900 dark:text-white truncate">
                      {client.businessName}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {client.sector} · {client.brokerName}
                    </div>
                  </div>
                  <StatusBadge status={client.status} />
                </div>

                {/* Stats row */}
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-[18px] bg-slate-50 p-3 dark:bg-white/5">
                    <div className="text-xs text-slate-500 dark:text-slate-400">Renewal</div>
                    <RenewalCountdown renewalDate={client.renewalDate} compact className="mt-1" />
                  </div>
                  <div className="rounded-[18px] bg-slate-50 p-3 dark:bg-white/5">
                    <div className="text-xs text-slate-500 dark:text-slate-400">Flags</div>
                    <div className={`mt-1 font-bold text-sm ${flagged.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {flagged.length > 0 ? `${flagged.length} month${flagged.length > 1 ? 's' : ''}` : 'Clear'}
                    </div>
                  </div>
                </div>

                {client.notes && (
                  <div className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {client.notes}
                  </div>
                )}

                <button className="btn-primary w-full mt-3 flex items-center justify-center gap-2">
                  Open client <ArrowRight size={15} />
                </button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
