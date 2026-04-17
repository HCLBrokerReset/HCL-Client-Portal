import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { format, parseISO } from 'date-fns'
import { Shield, ChevronRight, FileText } from 'lucide-react'
import StatusBadge from '../common/StatusBadge'
import Card from '../common/Card'
import Modal from '../common/Modal'
import GovernanceReportView from '../reports/GovernanceReportView'

export default function ClientReports() {
  const { user } = useAuth()
  const { getClient, getReports, getCheckIns } = useData()
  const [viewing, setViewing] = useState(null)

  const client = getClient(user.clientId)
  const reports = getReports(user.clientId).filter(r=>r.status==='published')
  const checkIns = getCheckIns(user.clientId)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Governance Reports</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Published quarterly reports from HCL</p>
      </div>

      {reports.length===0 ? (
        <Card>
          <div className="p-8 text-center">
            <FileText size={32} className="text-slate-200 dark:text-white/10 mx-auto mb-3"/>
            <p className="text-sm text-slate-400">No reports published yet.</p>
            <p className="text-xs text-slate-300 dark:text-white/20 mt-1">Barry will publish your first quarterly report here.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map(r => (
            <Card key={r.id} onClick={()=>setViewing(r)} className="cursor-pointer">
              <div className="p-4 flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-hcl-gold flex-shrink-0">
                  <Shield size={18} className="text-navy"/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{r.period}</span>
                    <StatusBadge status={r.status}/>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{r.title}</p>
                  <p className="text-xs text-slate-300 dark:text-white/20 mt-0.5">
                    Published {format(parseISO(r.publishedAt),'d MMMM yyyy')}
                  </p>
                </div>
                <ChevronRight size={16} className="text-slate-300 dark:text-white/20 flex-shrink-0"/>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!viewing} onClose={()=>setViewing(null)} title="Governance Report" size="2xl">
        {viewing && <GovernanceReportView report={viewing} client={client} checkIns={checkIns}/>}
      </Modal>
    </div>
  )
}
