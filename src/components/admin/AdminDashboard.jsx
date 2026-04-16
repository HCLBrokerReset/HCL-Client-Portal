import { useNavigate } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import { format, parseISO } from 'date-fns'
import { AlertTriangle, CheckCircle, Clock, Users, FileText, TrendingUp } from 'lucide-react'
import StatusBadge from '../common/StatusBadge'
import RenewalCountdown from '../common/RenewalCountdown'
import Card, { CardHeader, CardBody } from '../common/Card'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { getClients, getCheckIns, getReports, getBrokerActions } = useData()

  const clients = getClients()
  const allCheckIns = clients.flatMap((c) => getCheckIns(c.id))
  const allReports = clients.flatMap((c) => getReports(c.id))
  const allActions = clients.flatMap((c) => getBrokerActions(c.id))

  // Summary stats
  const stats = {
    total: clients.length,
    fileCurrent: clients.filter((c) => c.status === 'file-current').length,
    flagged: clients.filter((c) => c.status === 'flag-raised').length,
    action: clients.filter((c) => c.status === 'action-required').length,
    overdue: clients.filter((c) => c.status === 'overdue').length,
    openActions: allActions.filter((a) => a.status !== 'resolved').length,
  }

  // Sort clients: action-required first, then flag-raised, then overdue, then file-current
  const sortOrder = { 'action-required': 0, 'flag-raised': 1, overdue: 2, 'file-current': 3 }
  const sortedClients = [...clients].sort(
    (a, b) => (sortOrder[a.status] ?? 9) - (sortOrder[b.status] ?? 9)
  )

  // Recent check-ins across all clients
  const recentCheckIns = allCheckIns
    .filter((c) => c.flags && c.flags.length > 0)
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
    .slice(0, 5)

  return (
    <div className="space-y-8">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-semibold text-navy dark:text-white tracking-tight">
          Administration Dashboard
        </h1>
        <p className="text-gray-500 dark:text-white/40 text-sm mt-1">
          Overview of all client governance files — {format(new Date(), 'd MMMM yyyy')}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          label="Total Clients"
          value={stats.total}
          icon={<Users size={18} className="text-navy/60 dark:text-white/40" />}
        />
        <StatCard
          label="File Current"
          value={stats.fileCurrent}
          icon={<CheckCircle size={18} className="text-emerald-500" />}
          colour="emerald"
        />
        <StatCard
          label="Flags Raised"
          value={stats.flagged}
          icon={<AlertTriangle size={18} className="text-amber-500" />}
          colour="amber"
        />
        <StatCard
          label="Action Required"
          value={stats.action}
          icon={<AlertTriangle size={18} className="text-red-500" />}
          colour="red"
        />
        <StatCard
          label="Overdue"
          value={stats.overdue}
          icon={<Clock size={18} className="text-red-500" />}
          colour="red"
        />
        <StatCard
          label="Open Broker Actions"
          value={stats.openActions}
          icon={<TrendingUp size={18} className="text-gold" />}
          colour="gold"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Client list */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-semibold text-navy dark:text-white">
              Client Files
            </h2>
            <button
              onClick={() => navigate('/admin/clients')}
              className="text-sm text-gold hover:underline"
            >
              View all
            </button>
          </div>

          {sortedClients.map((client) => {
            const checkIns = getCheckIns(client.id)
            const lastCheckIn = checkIns[checkIns.length - 1]
            const reports = getReports(client.id)

            return (
              <Card
                key={client.id}
                onClick={() => navigate(`/admin/clients/${client.id}`)}
                className="hover:border-gold/40 transition-colors"
              >
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-navy dark:text-white text-sm">
                          {client.businessName}
                        </h3>
                        <StatusBadge status={client.status} />
                      </div>
                      <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">
                        {client.sector} · Broker: {client.brokerName} ({client.brokerCompany})
                      </p>
                    </div>
                    <RenewalCountdown renewalDate={client.renewalDate} className="text-right flex-shrink-0" />
                  </div>

                  {/* Check-in and report meta */}
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50 dark:border-white/5">
                    <div className="text-xs text-gray-400 dark:text-white/40">
                      <span className="font-medium text-navy dark:text-white/60">Last check-in:</span>{' '}
                      {lastCheckIn
                        ? format(parseISO(lastCheckIn.submittedAt), 'd MMM yyyy')
                        : 'None'}
                    </div>
                    {lastCheckIn?.flags?.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                        <AlertTriangle size={12} />
                        {lastCheckIn.flags.length} flag{lastCheckIn.flags.length > 1 ? 's' : ''}
                      </div>
                    )}
                    <div className="text-xs text-gray-400 dark:text-white/40 ml-auto">
                      <span className="font-medium text-navy dark:text-white/60">Reports:</span>{' '}
                      {reports.length}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Right panel: recent flags + quick actions */}
        <div className="space-y-6">
          {/* Recent governance alerts */}
          <Card gold>
            <CardHeader>
              <h2 className="text-sm font-semibold text-navy dark:text-white flex items-center gap-2">
                <AlertTriangle size={14} className="text-gold" />
                Recent Governance Alerts
              </h2>
            </CardHeader>
            <CardBody className="!px-4 !py-3">
              {recentCheckIns.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No active alerts</p>
              ) : (
                <div className="space-y-3">
                  {recentCheckIns.map((ci) => {
                    const client = clients.find((c) => c.id === ci.clientId)
                    return (
                      <div
                        key={ci.id}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg p-2 transition-colors"
                        onClick={() => navigate(`/admin/clients/${ci.clientId}`)}
                      >
                        <p className="text-xs font-semibold text-navy dark:text-white">
                          {client?.businessName}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">
                          {ci.month} · {ci.flags.length} flag{ci.flags.length > 1 ? 's' : ''}
                        </p>
                        <div className="mt-1 space-y-0.5">
                          {ci.flags.slice(0, 2).map((f, i) => (
                            <p key={i} className="text-xs text-amber-700 dark:text-amber-400 leading-snug">
                              · {f}
                            </p>
                          ))}
                          {ci.flags.length > 2 && (
                            <p className="text-xs text-gray-400">
                              +{ci.flags.length - 2} more
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Reports summary */}
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-navy dark:text-white flex items-center gap-2">
                <FileText size={14} className="text-gray-400" />
                Governance Reports
              </h2>
            </CardHeader>
            <CardBody className="!px-4 !py-3">
              <div className="space-y-2">
                {allReports.slice(0, 5).map((r) => {
                  const client = clients.find((c) => c.id === r.clientId)
                  return (
                    <div
                      key={r.id}
                      className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg px-2 py-1.5 transition-colors"
                      onClick={() => navigate(`/admin/clients/${r.clientId}?tab=reports`)}
                    >
                      <div>
                        <p className="text-xs font-medium text-navy dark:text-white">
                          {client?.businessName}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-white/40">{r.period}</p>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                  )
                })}
                {allReports.length === 0 && (
                  <p className="text-sm text-gray-400 py-4 text-center">No reports yet</p>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, colour }) {
  const colourMap = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
    red: 'text-red-600 dark:text-red-400',
    gold: 'text-gold',
  }

  return (
    <Card className="!rounded-xl">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400 dark:text-white/40 font-medium">{label}</span>
          {icon}
        </div>
        <p className={`text-2xl font-bold ${colour ? colourMap[colour] : 'text-navy dark:text-white'}`}>
          {value}
        </p>
      </div>
    </Card>
  )
}
