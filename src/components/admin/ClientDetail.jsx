import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import { format, parseISO } from 'date-fns'
import { ArrowLeft, AlertTriangle, FileText, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import StatusBadge from '../common/StatusBadge'
import RenewalCountdown from '../common/RenewalCountdown'
import Card, { HeroCard, GlassPill } from '../common/Card'
import Modal from '../common/Modal'
import BrokerTracker from './BrokerTracker'
import ReportWriter from './ReportWriter'
import AdminMessages from './AdminMessages'
import {
  WAGE_BILL_LABELS, STAFF_CHANGE_LABELS, CONTRACT_LABELS,
  INCIDENT_LABELS, formatTurnover,
} from '../../utils/flagging'

const TABS = ['Overview', 'Check-ins', 'Reports', 'Broker Log', 'Messages']

export default function ClientDetail() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  const { getClient, getCheckIns, getReports } = useData()

  const [tab, setTab] = useState('Overview')
  const [showReportWriter, setShowReportWriter] = useState(false)
  const [editingReport, setEditingReport] = useState(null)

  const client = getClient(clientId)
  if (!client) return (
    <div className="text-center py-16 text-slate-400 text-sm">
      Client not found.{' '}
      <button onClick={() => navigate('/admin/clients')} className="text-[#2447F9] underline">Back</button>
    </div>
  )

  const checkIns = getCheckIns(clientId)
  const reports = getReports(clientId)

  const statusGrad = {
    'file-current': 'bg-card-hero',
    'flag-raised': 'bg-[linear-gradient(135deg,#FF7A59,#F7A35C)]',
    'action-required': 'bg-[linear-gradient(135deg,#FF7A59,#F7A35C)]',
  }[client.status] || 'bg-card-hero'

  return (
    <div className="space-y-4">
      {/* Back */}
      <button
        onClick={() => navigate('/admin/clients')}
        className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft size={14} /> All clients
      </button>

      {/* Hero */}
      <div className={`rounded-[30px] ${statusGrad} p-5 text-white shadow-hero`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <GlassPill>{client.sector}</GlassPill>
            <h1 className="mt-2 text-2xl font-bold leading-tight">{client.businessName}</h1>
            <p className="text-sm text-white/80 mt-1">Broker: {client.brokerName} · {client.brokerCompany}</p>
          </div>
          <StatusBadge status={client.status} className="!bg-white/20 !text-white flex-shrink-0" />
        </div>

        <div className="flex gap-2 mt-4 flex-wrap">
          <GlassPill>
            <RenewalCountdown renewalDate={client.renewalDate} compact className="text-white" />
          </GlassPill>
          <GlassPill>{client.contactEmail}</GlassPill>
        </div>

        {client.notes && (
          <div className="mt-3 text-sm text-white/80 bg-white/10 rounded-2xl p-3">
            {client.notes}
          </div>
        )}

        <button
          onClick={() => { setEditingReport(null); setShowReportWriter(true) }}
          className="mt-4 rounded-[18px] bg-white px-4 py-3 text-sm font-bold text-slate-900 flex items-center gap-2 transition-transform active:scale-[0.98]"
        >
          <FileText size={14} /> New Report
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold flex-shrink-0 transition-all ${
              tab === t
                ? 'bg-btn-primary text-white shadow-btn'
                : 'bg-white text-slate-600 shadow-card dark:bg-[#101a2e] dark:text-white/60'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview'   && <OverviewTab client={client} checkIns={checkIns} reports={reports} />}
      {tab === 'Check-ins'  && <CheckInsTab checkIns={checkIns} />}
      {tab === 'Reports'    && (
        <ReportsTab reports={reports} onNew={() => { setEditingReport(null); setShowReportWriter(true) }}
          onEdit={r => { setEditingReport(r); setShowReportWriter(true) }} />
      )}
      {tab === 'Broker Log' && <BrokerTracker clientId={clientId} client={client} />}
      {tab === 'Messages'   && <AdminMessages clientId={clientId} client={client} />}

      <Modal open={showReportWriter} onClose={() => { setShowReportWriter(false); setEditingReport(null) }}
        title={editingReport ? 'Edit Report' : 'New Governance Report'} size="xl">
        <ReportWriter client={client} checkIns={checkIns} existingReport={editingReport}
          onClose={() => { setShowReportWriter(false); setEditingReport(null) }} />
      </Modal>
    </div>
  )
}

function OverviewTab({ client, checkIns, reports }) {
  const recent = [...checkIns].sort((a,b)=>b.month.localeCompare(a.month)).slice(0,3)
  const latestReport = reports[0]

  return (
    <div className="space-y-3">
      <Card>
        <div className="p-4">
          <h3 className="font-bold text-slate-900 dark:text-white mb-3">Recent Check-ins</h3>
          {recent.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No check-ins yet</p>
          ) : (
            <div className="space-y-3">
              {recent.map(ci => (
                <div key={ci.id} className="rounded-[20px] bg-slate-50 dark:bg-white/5 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-900 dark:text-white text-sm">{ci.month}</span>
                    {ci.flags?.length > 0
                      ? <span className="text-xs text-amber-600 font-semibold flex items-center gap-1"><AlertTriangle size={11}/>{ci.flags.length} flag{ci.flags.length>1?'s':''}</span>
                      : <span className="text-xs text-emerald-600 font-semibold">Clear</span>
                    }
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span className="text-slate-500">Turnover: <strong className="text-slate-800 dark:text-white">{formatTurnover(ci.data.estimatedTurnover)}</strong></span>
                    <span className="text-slate-500">Wage: <strong className="text-slate-800 dark:text-white">{WAGE_BILL_LABELS[ci.data.wageBillChange]}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {latestReport && (
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900 dark:text-white">Latest Report</h3>
              <StatusBadge status={latestReport.status} />
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{latestReport.title}</p>
            {latestReport.content?.executiveSummary && (
              <p className="text-xs text-slate-500 dark:text-white/50 mt-1 line-clamp-3 leading-relaxed">
                {latestReport.content.executiveSummary}
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

function CheckInsTab({ checkIns }) {
  const sorted = [...checkIns].sort((a,b)=>b.month.localeCompare(a.month))
  const latest3 = sorted.slice(0,3)

  if (sorted.length === 0) return (
    <Card><div className="p-8 text-center text-slate-400 text-sm">No check-ins submitted yet.</div></Card>
  )

  return (
    <div className="space-y-4">
      {latest3.length > 1 && (
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Side-by-side comparison</h3>
          <div className="overflow-x-auto">
            <div className="flex gap-3 min-w-max">
              {latest3.map((ci, idx) => <CompareCard key={ci.id} ci={ci} prev={latest3[idx+1]} isLatest={idx===0} />)}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Full history</h3>
        {sorted.map(ci => <CheckInRow key={ci.id} ci={ci} />)}
      </div>
    </div>
  )
}

function CompareCard({ ci, prev, isLatest }) {
  const change = prev?.data?.estimatedTurnover > 0
    ? ((ci.data.estimatedTurnover - prev.data.estimatedTurnover) / prev.data.estimatedTurnover * 100).toFixed(1)
    : null

  return (
    <div className={`w-64 card p-4 flex-shrink-0 ${isLatest ? 'ring-2 ring-[#2447F9]/30' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-slate-900 dark:text-white text-sm">{ci.month}</span>
        {isLatest && <span className="text-xs text-[#2447F9] font-semibold">Latest</span>}
      </div>
      <div className="space-y-2 text-xs">
        <Row label="Turnover">
          <strong>{formatTurnover(ci.data.estimatedTurnover)}</strong>
          {change !== null && (
            <span className={`ml-1 ${Math.abs(Number(change))>15?'text-amber-600':'text-slate-400'}`}>
              ({change>0?'+':''}{change}%)
            </span>
          )}
        </Row>
        <Row label="Wage bill">{WAGE_BILL_LABELS[ci.data.wageBillChange]}</Row>
        <Row label="Contracts">{CONTRACT_LABELS[ci.data.newContracts]}</Row>
        <Row label="Incidents">{INCIDENT_LABELS[ci.data.incidents]}</Row>
      </div>
      {ci.flags?.length > 0 && (
        <div className="mt-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 p-2">
          {ci.flags.slice(0,2).map((f,i) => (
            <p key={i} className="text-[10px] text-amber-700 dark:text-amber-400 leading-snug">· {f}</p>
          ))}
        </div>
      )}
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div>
      <span className="text-slate-400">{label}: </span>
      <span className="text-slate-800 dark:text-white font-medium">{children}</span>
    </div>
  )
}

function CheckInRow({ ci }) {
  const [open, setOpen] = useState(false)
  return (
    <Card>
      <div className="p-4 cursor-pointer" onClick={() => setOpen(v=>!v)}>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-semibold text-slate-900 dark:text-white text-sm">{ci.month}</span>
            {ci.flags?.length > 0 && (
              <span className="ml-2 text-xs text-amber-600 font-medium">{ci.flags.length} flag{ci.flags.length>1?'s':''}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{formatTurnover(ci.data.estimatedTurnover)}</span>
            {open ? <ChevronUp size={14} className="text-slate-400"/> : <ChevronDown size={14} className="text-slate-400"/>}
          </div>
        </div>
        {open && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/10 grid grid-cols-2 gap-2 text-xs">
            <Row label="Wage bill">{WAGE_BILL_LABELS[ci.data.wageBillChange]}</Row>
            <Row label="Staff">{STAFF_CHANGE_LABELS[ci.data.staffChange]}</Row>
            <Row label="Contracts">{CONTRACT_LABELS[ci.data.newContracts]}</Row>
            <Row label="New work">{ci.data.newTypesOfWork?'Yes':'No'}</Row>
            <Row label="Assets">{ci.data.newAssets?`Yes — ${ci.data.newAssetsDetails}`:'No'}</Row>
            <Row label="Incidents">{INCIDENT_LABELS[ci.data.incidents]}</Row>
            {ci.data.futureChanges && <div className="col-span-2"><Row label="Future">{ci.data.futureChanges}</Row></div>}
            {ci.flags?.length > 0 && (
              <div className="col-span-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-2 mt-1">
                {ci.flags.map((f,i) => <p key={i} className="text-[11px] text-amber-700 dark:text-amber-400">· {f}</p>)}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

function ReportsTab({ reports, onNew, onEdit }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm">Reports ({reports.length})</h3>
        <button onClick={onNew} className="flex items-center gap-1.5 rounded-full bg-btn-primary px-4 py-2 text-xs font-semibold text-white shadow-btn">
          <Plus size={13}/> New Report
        </button>
      </div>
      {reports.map(r => (
        <Card key={r.id} onClick={() => onEdit(r)}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-1">
              <StatusBadge status={r.status} />
              <span className="text-xs text-slate-400">{r.period}</span>
            </div>
            <p className="font-bold text-slate-900 dark:text-white text-sm mt-1">{r.title}</p>
            {r.content?.executiveSummary && (
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{r.content.executiveSummary}</p>
            )}
          </div>
        </Card>
      ))}
      {reports.length === 0 && <Card><div className="p-8 text-center text-slate-400 text-sm">No reports yet.</div></Card>}
    </div>
  )
}
