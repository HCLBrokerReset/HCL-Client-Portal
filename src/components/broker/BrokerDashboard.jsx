import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { format, parseISO } from 'date-fns'
import {
  Building2, FileText, AlertTriangle, CheckCircle, ChevronRight, Clock,
} from 'lucide-react'
import StatusBadge from '../common/StatusBadge'
import RenewalCountdown from '../common/RenewalCountdown'
import Card, { CardHeader, CardBody } from '../common/Card'
import Modal from '../common/Modal'
import GovernanceReportView from '../reports/GovernanceReportView'

export default function BrokerDashboard() {
  const { user } = useAuth()
  const { getClients, getReports, getCheckIns, getBrokerActions } = useData()

  const [viewing, setViewing] = useState(null) // { report, client, checkIns }

  // Only clients assigned to this broker
  const allClients = getClients()
  const myClients = allClients.filter((c) => c.brokerId === user.brokerId)

  const myActions = myClients.flatMap((c) =>
    getBrokerActions(c.id).map((a) => ({ ...a, clientName: c.businessName }))
  ).filter((a) => a.status !== 'resolved')
    .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs text-gold font-semibold uppercase tracking-widest mb-1">
          Broker View
        </p>
        <h1 className="text-2xl font-semibold text-navy dark:text-white tracking-tight">
          {user.name}
        </h1>
        <p className="text-gray-500 dark:text-white/40 text-sm mt-1">
          {myClients.length} client{myClients.length !== 1 ? 's' : ''} assigned · {format(new Date(), 'd MMMM yyyy')}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Client list */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-navy dark:text-white">Your Clients</h2>

          {myClients.length === 0 && (
            <Card>
              <CardBody>
                <p className="text-sm text-gray-400 text-center py-8">No clients assigned to you.</p>
              </CardBody>
            </Card>
          )}

          {myClients.map((client) => {
            const reports = getReports(client.id).filter((r) => r.status === 'published')
            const checkIns = getCheckIns(client.id)
            const latestReport = reports[0]
            const latestCheckIn = [...checkIns].sort((a, b) => b.month.localeCompare(a.month))[0]
            const openActions = getBrokerActions(client.id).filter((a) => a.status !== 'resolved')

            return (
              <Card key={client.id} className="hover:border-gold/40 transition-colors">
                <div className="px-6 py-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
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

                      {/* Open actions */}
                      {openActions.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600 dark:text-amber-400">
                          <AlertTriangle size={12} />
                          {openActions.length} open action{openActions.length > 1 ? 's' : ''} from HCL
                        </div>
                      )}
                    </div>

                    <RenewalCountdown renewalDate={client.renewalDate} className="flex-shrink-0" />
                  </div>

                  {/* Latest report */}
                  {latestReport ? (
                    <div
                      className="mt-4 pt-4 border-t border-gray-50 dark:border-white/5 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg px-3 py-2 -mx-3 transition-colors"
                      onClick={() =>
                        setViewing({ report: latestReport, client, checkIns })
                      }
                    >
                      <div className="flex items-center gap-3">
                        <FileText size={14} className="text-gray-400" />
                        <div>
                          <p className="text-xs font-medium text-navy dark:text-white">
                            Latest: {latestReport.title}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-white/40">
                            {latestReport.period} · Published {format(parseISO(latestReport.publishedAt), 'd MMM yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={latestReport.status} />
                        <ChevronRight size={14} className="text-gray-400" />
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 pt-4 border-t border-gray-50 dark:border-white/5">
                      <p className="text-xs text-gray-400 dark:text-white/40">
                        No published reports yet
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>

        {/* Right: Open actions */}
        <div className="space-y-4">
          <Card gold>
            <CardHeader>
              <h2 className="text-sm font-semibold text-navy dark:text-white flex items-center gap-2">
                <AlertTriangle size={14} className="text-gold" />
                Open Actions from HCL
              </h2>
            </CardHeader>
            <CardBody className="!px-4 !py-3">
              {myActions.length === 0 ? (
                <div className="text-center py-6">
                  <CheckCircle size={24} className="text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No open actions</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myActions.map((action) => (
                    <div
                      key={action.id}
                      className="bg-gray-50 dark:bg-white/5 rounded-xl p-3"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-navy dark:text-white">
                          {action.clientName}
                        </span>
                        <StatusBadge status={action.status} />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-white/50 leading-snug">
                        {action.description}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-white/30 mt-1">
                        Sent {format(parseISO(action.sentAt), 'd MMM yyyy')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* All reports list */}
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-navy dark:text-white flex items-center gap-2">
                <FileText size={14} className="text-gray-400" />
                All Reports
              </h2>
            </CardHeader>
            <CardBody className="!px-4 !py-3">
              {myClients.flatMap((c) =>
                getReports(c.id)
                  .filter((r) => r.status === 'published')
                  .map((r) => ({ ...r, clientName: c.businessName, client: c, checkIns: getCheckIns(c.id) }))
              ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg px-2 py-2 transition-colors"
                    onClick={() =>
                      setViewing({ report: r, client: r.client, checkIns: r.checkIns })
                    }
                  >
                    <div>
                      <p className="text-xs font-medium text-navy dark:text-white">{r.clientName}</p>
                      <p className="text-xs text-gray-400 dark:text-white/40">{r.period}</p>
                    </div>
                    <ChevronRight size={14} className="text-gray-300 dark:text-white/20" />
                  </div>
                ))}
              {myClients.flatMap((c) => getReports(c.id).filter((r) => r.status === 'published')).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No published reports</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Report viewer modal */}
      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title="Governance Report"
        size="2xl"
      >
        {viewing && (
          <GovernanceReportView
            report={viewing.report}
            client={viewing.client}
            checkIns={viewing.checkIns}
          />
        )}
      </Modal>
    </div>
  )
}
