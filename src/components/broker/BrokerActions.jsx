import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { format, parseISO } from 'date-fns'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import StatusBadge from '../common/StatusBadge'
import Card, { DarkCard, GlassPill } from '../common/Card'

export default function BrokerActions() {
  const { user } = useAuth()
  const { getClients, getBrokerActions } = useData()

  const myClients = getClients().filter(c=>c.brokerId===user.brokerId)
  const all = myClients
    .flatMap(c => getBrokerActions(c.id).map(a=>({...a,clientName:c.businessName})))
    .sort((a,b)=>new Date(b.sentAt)-new Date(a.sentAt))

  const open = all.filter(a=>a.status!=='resolved')
  const resolved = all.filter(a=>a.status==='resolved')

  return (
    <div className="space-y-4">
      <DarkCard>
        <GlassPill>HCL Communications</GlassPill>
        <h1 className="mt-2 text-2xl font-bold">Open Actions</h1>
        <p className="text-sm text-white/75 mt-1">Actions and communications from Herron Consultants Limited</p>
      </DarkCard>

      {open.length===0 && (
        <Card>
          <div className="p-8 text-center">
            <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-3"/>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">No open actions</p>
            <p className="text-xs text-slate-400 mt-1">All communications are resolved.</p>
          </div>
        </Card>
      )}

      {open.length>0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white px-1">Requiring attention ({open.length})</h2>
          {open.map(a => <ActionRow key={a.id} action={a}/>)}
        </div>
      )}

      {resolved.length>0 && (
        <div className="space-y-3 opacity-60">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white px-1">Resolved ({resolved.length})</h2>
          {resolved.map(a => <ActionRow key={a.id} action={a}/>)}
        </div>
      )}
    </div>
  )
}

function ActionRow({ action }) {
  return (
    <Card>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <span className="text-sm font-bold text-slate-900 dark:text-white">{action.clientName}</span>
          <StatusBadge status={action.status}/>
        </div>
        <p className="text-sm text-slate-600 dark:text-white/70 leading-relaxed">{action.description}</p>
        {action.notes && (
          <div className="mt-2 rounded-[16px] bg-slate-50 dark:bg-white/5 px-3 py-2 text-xs text-slate-500 dark:text-white/50">{action.notes}</div>
        )}
        <div className="flex gap-4 text-xs text-slate-400 mt-2">
          <span>Sent {format(parseISO(action.sentAt),'d MMM yyyy')}</span>
          {action.respondedAt && <span>Responded {format(parseISO(action.respondedAt),'d MMM yyyy')}</span>}
        </div>
        {action.status!=='resolved' && (
          <div className="flex gap-2 mt-3">
            <button className="btn-success flex-1 py-3 text-xs flex items-center justify-center gap-1.5">
              <CheckCircle2 size={13}/> Mark done
            </button>
            <button className="btn-ghost flex-1 py-3 text-xs">Reply to HCL</button>
          </div>
        )}
      </div>
    </Card>
  )
}
