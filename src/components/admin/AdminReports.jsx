import { useState } from 'react'
import { useData } from '../../context/DataContext'
import { format, parseISO } from 'date-fns'
import { Shield, ChevronRight, FileText } from 'lucide-react'
import StatusBadge from '../common/StatusBadge'
import Card, { DarkCard, GlassPill } from '../common/Card'
import Modal from '../common/Modal'
import GovernanceReportView from '../reports/GovernanceReportView'

export default function AdminReports() {
  const { getClients, getReports, getCheckIns } = useData()
  const [viewing, setViewing] = useState(null)

  const clients = getClients()
  const all = clients.flatMap(c =>
    getReports(c.id).map(r => ({ ...r, client: c, checkIns: getCheckIns(c.id) }))
  ).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))

  return (
    <div className="space-y-4">
      <DarkCard>
        <GlassPill>Admin</GlassPill>
        <h1 className="mt-2 text-2xl font-bold">All Reports</h1>
        <p className="text-sm text-white/75 mt-1">{all.length} report{all.length!==1?'s':''} across all clients</p>
      </DarkCard>

      {all.length===0 ? (
        <Card><div className="p-8 text-center">
          <FileText size={32} className="text-slate-200 dark:text-white/10 mx-auto mb-3"/>
          <p className="text-sm text-slate-400">No reports yet. Open a client file to create one.</p>
        </div></Card>
      ) : (
        <div className="space-y-3">
          {all.map(r => (
            <Card key={r.id} onClick={()=>setViewing(r)} className="cursor-pointer">
              <div className="p-4 flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-hcl-gold flex-shrink-0">
                  <Shield size={18} className="text-navy"/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{r.client.businessName}</span>
                    <StatusBadge status={r.status}/>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{r.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {r.period} · Created {format(parseISO(r.createdAt),'d MMM yyyy')}
                  </p>
                </div>
                <ChevronRight size={16} className="text-slate-300 flex-shrink-0"/>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!viewing} onClose={()=>setViewing(null)} title="Governance Report" size="2xl">
        {viewing && <GovernanceReportView report={viewing} client={viewing.client} checkIns={viewing.checkIns}/>}
      </Modal>
    </div>
  )
}
