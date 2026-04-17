import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { format, parseISO } from 'date-fns'
import { AlertTriangle, FileText, ChevronRight, Building2, CheckCircle2, ArrowRight } from 'lucide-react'
import StatusBadge from '../common/StatusBadge'
import RenewalCountdown from '../common/RenewalCountdown'
import Card, { MetricTile, GlassPill, DarkCard } from '../common/Card'
import Modal from '../common/Modal'
import GovernanceReportView from '../reports/GovernanceReportView'

export default function BrokerDashboard() {
  const { user } = useAuth()
  const { getClients, getReports, getCheckIns, getBrokerActions } = useData()
  const [viewing, setViewing] = useState(null)

  const myClients = getClients().filter(c=>c.brokerId===user.brokerId)
  const myActions = myClients
    .flatMap(c => getBrokerActions(c.id).map(a=>({...a,clientName:c.businessName})))
    .filter(a=>a.status!=='resolved')
    .sort((a,b)=>new Date(b.sentAt)-new Date(a.sentAt))

  return (
    <div className="space-y-4">
      {/* Intro hero */}
      <DarkCard>
        <GlassPill>Broker view</GlassPill>
        <h1 className="mt-2 text-2xl font-bold">{user.name}</h1>
        <p className="text-sm text-white/75 mt-1">Assigned clients and open flags · {format(new Date(),'d MMMM yyyy')}</p>
      </DarkCard>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <MetricTile icon={Building2} label="Assigned" value={String(myClients.length).padStart(2,'0')} sub="Live accounts" gradient="blue"/>
        <MetricTile icon={AlertTriangle} label="Open flags" value={String(myActions.length).padStart(2,'0')} sub="Action needed" gradient={myActions.length>0?'alert':'success'}/>
      </div>

      {/* Client cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white px-1">Your clients</h2>
        {myClients.length===0 && (
          <Card><div className="p-8 text-center text-slate-400 text-sm">No clients assigned.</div></Card>
        )}
        {myClients.map(client => {
          const reports = getReports(client.id).filter(r=>r.status==='published')
          const checkIns = getCheckIns(client.id)
          const latestReport = reports[0]
          const openActions = getBrokerActions(client.id).filter(a=>a.status!=='resolved')

          return (
            <Card key={client.id} bar={client.status==='action-required'?'alert':client.status==='flag-raised'?'gold':'success'}>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-bold text-slate-900 dark:text-white">{client.businessName}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{client.sector} · {client.contactName}</div>
                    {openActions.length>0 && (
                      <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 mt-1">
                        <AlertTriangle size={11}/>{openActions.length} open action{openActions.length>1?'s':''} from HCL
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-1">
                    <StatusBadge status={client.status}/>
                    <RenewalCountdown renewalDate={client.renewalDate} compact/>
                  </div>
                </div>

                <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">{client.notes}</div>

                {latestReport && (
                  <button
                    onClick={() => setViewing({ report: latestReport, client, checkIns })}
                    className="mt-3 w-full flex items-center justify-between rounded-[20px] bg-slate-50 dark:bg-white/5 px-4 py-3"
                  >
                    <div className="flex items-center gap-2 text-left">
                      <FileText size={14} className="text-slate-400"/>
                      <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">{latestReport.period}</p>
                        <p className="text-xs text-slate-400">Published {format(parseISO(latestReport.publishedAt),'d MMM yyyy')}</p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-400"/>
                  </button>
                )}

                <button className="btn-ghost w-full mt-2 flex items-center justify-center gap-2">
                  Open client view <ArrowRight size={15}/>
                </button>
              </div>
            </Card>
          )
        })}
      </div>

      <Modal open={!!viewing} onClose={()=>setViewing(null)} title="Governance Report" size="2xl">
        {viewing && <GovernanceReportView report={viewing.report} client={viewing.client} checkIns={viewing.checkIns}/>}
      </Modal>
    </div>
  )
}
