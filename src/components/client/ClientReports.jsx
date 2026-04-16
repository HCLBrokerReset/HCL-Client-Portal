import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { format, parseISO } from 'date-fns'
import { FileText, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import StatusBadge from '../common/StatusBadge'
import Card, { CardHeader, CardBody } from '../common/Card'
import Modal from '../common/Modal'
import GovernanceReportView from '../reports/GovernanceReportView'

export default function ClientReports() {
  const { user } = useAuth()
  const { getClient, getReports, getCheckIns } = useData()

  const client = getClient(user.clientId)
  const reports = getReports(user.clientId).filter((r) => r.status === 'published')
  const checkIns = getCheckIns(user.clientId)

  const [viewing, setViewing] = useState(null)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy dark:text-white tracking-tight">
          Governance Reports
        </h1>
        <p className="text-gray-500 dark:text-white/40 text-sm mt-1">
          Your published quarterly governance reports from HCL
        </p>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-8">
              <FileText size={32} className="text-gray-200 dark:text-white/10 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No reports published yet.</p>
              <p className="text-xs text-gray-300 dark:text-white/20 mt-1">
                Barry at HCL will publish your quarterly governance report here once prepared.
              </p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Card
              key={r.id}
              className="hover:border-gold/40 transition-colors cursor-pointer"
              onClick={() => setViewing(r)}
            >
              <div className="px-6 py-5 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={r.status} />
                    <span className="text-xs text-gray-400 dark:text-white/40">{r.period}</span>
                  </div>
                  <h3 className="font-semibold text-navy dark:text-white text-sm">{r.title}</h3>
                  {r.content?.executiveSummary && (
                    <p className="text-xs text-gray-400 dark:text-white/40 mt-1 line-clamp-2">
                      {r.content.executiveSummary}
                    </p>
                  )}
                  <p className="text-xs text-gray-300 dark:text-white/20 mt-2">
                    Published {format(parseISO(r.publishedAt), 'd MMMM yyyy')}
                  </p>
                </div>
                <ChevronRight size={16} className="text-gray-300 dark:text-white/20 flex-shrink-0" />
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title="Governance Report"
        size="2xl"
      >
        {viewing && (
          <GovernanceReportView
            report={viewing}
            client={client}
            checkIns={checkIns}
          />
        )}
      </Modal>
    </div>
  )
}
