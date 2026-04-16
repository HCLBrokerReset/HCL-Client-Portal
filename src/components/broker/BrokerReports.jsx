import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { format, parseISO } from 'date-fns'
import { FileText, ChevronRight } from 'lucide-react'
import StatusBadge from '../common/StatusBadge'
import Card from '../common/Card'
import Modal from '../common/Modal'
import GovernanceReportView from '../reports/GovernanceReportView'

export default function BrokerReports() {
  const { user } = useAuth()
  const { getClients, getReports, getCheckIns } = useData()
  const [viewing, setViewing] = useState(null)

  const allClients = getClients()
  const myClients = allClients.filter((c) => c.brokerId === user.brokerId)

  const allReports = myClients.flatMap((c) =>
    getReports(c.id)
      .filter((r) => r.status === 'published')
      .map((r) => ({ ...r, client: c, checkIns: getCheckIns(c.id) }))
  ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy dark:text-white tracking-tight">
          Governance Reports
        </h1>
        <p className="text-gray-500 dark:text-white/40 text-sm mt-1">
          All published governance reports for your clients
        </p>
      </div>

      {allReports.length === 0 ? (
        <Card>
          <div className="px-6 py-12 text-center">
            <FileText size={32} className="text-gray-200 dark:text-white/10 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No published reports yet.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {allReports.map((r) => (
            <Card
              key={r.id}
              className="hover:border-gold/40 transition-colors cursor-pointer"
              onClick={() => setViewing(r)}
            >
              <div className="px-6 py-5 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-navy dark:text-white">
                      {r.client.businessName}
                    </span>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-sm font-medium text-navy dark:text-white">{r.title}</p>
                  <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">
                    {r.period} · Published {format(parseISO(r.publishedAt), 'd MMMM yyyy')}
                  </p>
                </div>
                <ChevronRight size={16} className="text-gray-300 dark:text-white/20 flex-shrink-0" />
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Governance Report" size="2xl">
        {viewing && (
          <GovernanceReportView
            report={viewing}
            client={viewing.client}
            checkIns={viewing.checkIns}
          />
        )}
      </Modal>
    </div>
  )
}
