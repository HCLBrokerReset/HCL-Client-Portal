import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { format, parseISO, differenceInDays } from 'date-fns'
import {
  Activity, ClipboardList, FileText, MessageSquare,
  ArrowRight, CalendarClock, AlertTriangle, CheckCircle2,
} from 'lucide-react'
import Card, { HeroCard, DarkCard, MetricTile, GlassPill } from '../common/Card'
import StatusBadge from '../common/StatusBadge'
import { formatTurnover, WAGE_BILL_LABELS } from '../../utils/flagging'

export default function ClientPortal() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { getClient, getCheckIns, getReports, getMessages } = useData()

  const client = getClient(user.clientId)
  if (!client) return <div className="text-center py-16 text-slate-400 text-sm">Client record not found.</div>

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  const checkIns = getCheckIns(user.clientId)
  const sorted = [...checkIns].sort((a,b)=>b.month.localeCompare(a.month))
  const currentCheckIn = checkIns.find(c=>c.month===currentMonth)
  const lastThree = sorted.slice(0,3)

  const publishedReports = getReports(user.clientId).filter(r=>r.status==='published')
  const latestReport = publishedReports[0]

  const messages = getMessages(user.clientId)
  const unread = messages.filter(m=>!m.read && m.senderRole!=='client').length

  const days = differenceInDays(parseISO(client.renewalDate), now)

  const heroGrad = {
    'file-current': 'bg-card-hero',
    'flag-raised': 'bg-[linear-gradient(135deg,#FF7A59,#F7A35C)]',
    'action-required': 'bg-[linear-gradient(135deg,#FF7A59,#F7A35C)]',
  }[client.status] || 'bg-card-hero'

  const statusLabel = {
    'file-current': 'File current',
    'flag-raised': 'Flag raised',
    'action-required': 'Action required',
    overdue: 'Overdue',
  }[client.status] || client.status

  return (
    <div className="space-y-4">
      {/* Hero status card */}
      <div className={`rounded-[30px] ${heroGrad} p-5 text-white shadow-hero`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-sm text-white/75">Governance status</div>
            <div className="mt-1 text-3xl font-bold leading-tight">{statusLabel}</div>
          </div>
          <div className="grid h-14 w-14 place-items-center rounded-[22px] bg-white/15 flex-shrink-0">
            <Activity size={24} />
          </div>
        </div>
        {client.notes
          ? <p className="mt-3 text-sm text-white/80">{client.notes}</p>
          : <p className="mt-3 text-sm text-white/80">Your governance file is being monitored. Complete your monthly check-in to keep it current.</p>
        }
        <div className="flex gap-2 mt-4 flex-wrap">
          <GlassPill>Renewal {format(parseISO(client.renewalDate),'d MMM yyyy')}</GlassPill>
          <GlassPill>Broker {client.brokerName}</GlassPill>
        </div>
      </div>

      {/* Metric tiles */}
      <div className="grid grid-cols-2 gap-3">
        <MetricTile
          icon={CalendarClock}
          label="Countdown"
          value={days >= 0 ? `${days}d` : 'Due'}
          sub="To renewal"
          gradient={days <= 60 ? 'alert' : 'dark'}
        />
        <MetricTile
          icon={FileText}
          label="Latest report"
          value={latestReport ? 'Ready' : 'None'}
          sub={latestReport ? latestReport.period : 'Pending from HCL'}
          gradient="success"
        />
      </div>

      {/* Check-in prompt / done confirmation */}
      {!currentCheckIn ? (
        <Card onClick={() => navigate('/portal/checkin')}>
          <div className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="font-bold text-slate-900 dark:text-white text-base">
                  {format(now,'MMMM yyyy')} check-in
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Not done yet</div>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-hcl-gold flex-shrink-0">
                <ClipboardList size={18} className="text-navy" />
              </div>
            </div>
            <button className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
              Start monthly check-in <ArrowRight size={15}/>
            </button>
          </div>
        </Card>
      ) : (
        <div className="rounded-[28px] bg-[linear-gradient(135deg,#17B26A,#3DD598)] p-4 text-white">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={22} />
            <div>
              <p className="font-bold text-sm">{format(now,'MMMM yyyy')} check-in complete</p>
              <p className="text-white/80 text-xs mt-0.5">
                Submitted {format(parseISO(currentCheckIn.submittedAt),'d MMM yyyy')}
                {currentCheckIn.flags?.length > 0 && ` · ${currentCheckIn.flags.length} flags raised`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Last 3 check-ins */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white px-1">Recent check-ins</h3>
        {lastThree.length === 0 ? (
          <Card><div className="p-6 text-center text-slate-400 text-sm">No check-ins yet.</div></Card>
        ) : (
          lastThree.map(ci => (
            <Card key={ci.id}>
              <div className="p-4 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 dark:text-white text-sm">{ci.month}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Turnover {formatTurnover(ci.data.estimatedTurnover)}
                  </div>
                </div>
                {ci.flags?.length > 0
                  ? <span className="text-xs text-amber-600 font-semibold flex items-center gap-1 flex-shrink-0"><AlertTriangle size={11}/>{ci.flags.length} flagged</span>
                  : <span className="text-xs text-emerald-600 font-semibold flex-shrink-0">Clear</span>
                }
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Messages prompt */}
      {unread > 0 && (
        <Card onClick={() => navigate('/portal/messages')}>
          <div className="p-4 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-btn-primary flex-shrink-0">
              <MessageSquare size={18} className="text-white"/>
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-900 dark:text-white text-sm">{unread} unread message{unread>1?'s':''}</p>
              <p className="text-xs text-slate-500 mt-0.5">From Barry at HCL</p>
            </div>
            <ArrowRight size={16} className="text-slate-400"/>
          </div>
        </Card>
      )}

      {/* Renewal warning */}
      {days <= 60 && days >= 0 && (
        <div className={`rounded-[28px] p-4 ${days<=30 ? 'bg-[linear-gradient(135deg,#FF7A59,#F7A35C)]' : 'bg-[linear-gradient(135deg,#FF7A59,#F7A35C)]/80'} text-white`}>
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="flex-shrink-0 mt-0.5"/>
            <div>
              <p className="font-bold text-sm">Renewal in {days} days</p>
              <p className="text-white/80 text-xs mt-1">
                Ensure {client.brokerName} at {client.brokerCompany} has all current information before {format(parseISO(client.renewalDate),'d MMMM yyyy')}.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
