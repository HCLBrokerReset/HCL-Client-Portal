import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Download, AlertTriangle, CheckCircle2, Building2, Calendar, Link2, Shield } from 'lucide-react'
import StatusBadge from '../common/StatusBadge'
import { formatTurnover, WAGE_BILL_LABELS, CONTRACT_LABELS } from '../../utils/flagging'
import { exportReportToPDF } from '../../utils/pdfExport'
import { useData } from '../../context/DataContext'
import { GlassPill } from '../common/Card'

export default function GovernanceReportView({ report, client, checkIns }) {
  const [exporting, setExporting] = useState(false)
  const { getBrokerActions } = useData()
  const brokerActions = getBrokerActions ? getBrokerActions(client.id) : []

  const handleExport = async () => {
    setExporting(true)
    try { await exportReportToPDF({ report, client, checkIns, brokerActions }) }
    catch (err) { console.error('PDF export failed:', err) }
    setExporting(false)
  }

  const renewalColour = {
    'action-required': 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-200',
    'flag-raised':     'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200',
    'file-current':    'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200',
  }[report.content?.renewalReadiness] || 'bg-slate-50 text-slate-600 border-slate-200'

  return (
    <div className="overflow-y-auto">
      {/* Branded header */}
      <div className="bg-[linear-gradient(135deg,#0D1B2A,#132D52)] px-6 py-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-hcl-gold flex-shrink-0">
              <span className="text-navy font-black text-sm">HCL</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm">Herron Consultants Limited</p>
              <p className="text-gold/70 text-xs tracking-widest uppercase">Governance Report</p>
            </div>
          </div>
          <button onClick={handleExport} disabled={exporting}
            className="flex items-center gap-2 rounded-[18px] bg-hcl-gold px-4 py-2.5 text-sm font-bold text-navy flex-shrink-0 shadow-gold disabled:opacity-70">
            <Download size={14}/>
            {exporting ? 'Generating…' : 'PDF'}
          </button>
        </div>

        <div className="h-px bg-gradient-to-r from-gold/60 via-gold to-gold/60 mb-4"/>

        <h1 className="text-white text-lg font-bold leading-snug">{report.title}</h1>
        <p className="text-gold/70 text-sm mt-1">{report.period}</p>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <InfoBlock label="Client"  value={client.businessName}/>
          <InfoBlock label="Sector"  value={client.sector}/>
          <InfoBlock label="Broker"  value={`${client.brokerName}`}/>
          <InfoBlock label="Renewal" value={format(parseISO(client.renewalDate),'d MMM yyyy')}/>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-5 space-y-6">
        {report.content?.executiveSummary && (
          <Section title="Executive Summary">
            <p className="text-sm text-slate-600 dark:text-white/70 leading-relaxed">{report.content.executiveSummary}</p>
          </Section>
        )}

        <Section title="Monthly Check-In Summary">
          {checkIns.length===0
            ? <p className="text-sm text-slate-400">No check-ins available.</p>
            : (
              <div className="overflow-x-auto rounded-[20px] border border-slate-100 dark:border-white/10">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#0D1B2A] text-white">
                      {['Month','Turnover','Wage bill','Contracts','Status'].map(h => (
                        <th key={h} className="text-left px-3 py-2.5 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...checkIns].sort((a,b)=>a.month.localeCompare(b.month)).map((ci,i) => (
                      <tr key={ci.id} className={i%2===0?'bg-white dark:bg-transparent':'bg-slate-50 dark:bg-white/5'}>
                        <td className="px-3 py-2.5 font-semibold text-slate-900 dark:text-white">{ci.month}</td>
                        <td className="px-3 py-2.5 text-slate-700 dark:text-white/70">{formatTurnover(ci.data.estimatedTurnover)}</td>
                        <td className="px-3 py-2.5 text-slate-500 dark:text-white/50">{WAGE_BILL_LABELS[ci.data.wageBillChange]}</td>
                        <td className="px-3 py-2.5 text-slate-500 dark:text-white/50">{CONTRACT_LABELS[ci.data.newContracts]}</td>
                        <td className="px-3 py-2.5">
                          {ci.flags?.length>0
                            ? <span className="text-amber-600 font-semibold flex items-center gap-1"><AlertTriangle size={10}/>{ci.flags.length}</span>
                            : <span className="text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2 size={10}/>Clear</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </Section>

        {checkIns.some(ci=>ci.flags?.length>0) && (
          <Section title="Material Changes Identified">
            <div className="space-y-2">
              {checkIns.filter(ci=>ci.flags?.length>0)
                .sort((a,b)=>a.month.localeCompare(b.month))
                .flatMap(ci => ci.flags.map((f,i) => (
                  <div key={`${ci.id}-${i}`} className="flex items-start gap-3 rounded-[18px] bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 px-4 py-3">
                    <AlertTriangle size={13} className="text-amber-600 flex-shrink-0 mt-0.5"/>
                    <div>
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-300 mr-2">{ci.month}</span>
                      <span className="text-xs text-amber-700 dark:text-amber-400">{f}</span>
                    </div>
                  </div>
                )))
              }
            </div>
          </Section>
        )}

        {brokerActions.length>0 && (
          <Section title="Broker Accountability Log">
            <div className="space-y-3">
              {brokerActions.map(a => (
                <div key={a.id} className="rounded-[20px] border border-slate-100 dark:border-white/10 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <StatusBadge status={a.status}/>
                    <span className="text-xs text-slate-400">{format(parseISO(a.sentAt),'d MMM yyyy')}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-white/70">{a.description}</p>
                  {a.notes && <p className="text-xs text-slate-400 mt-1.5 italic">{a.notes}</p>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {report.content?.renewalReadiness && (
          <Section title="Renewal Readiness">
            <div className={`rounded-[18px] border px-4 py-3 flex items-center gap-3 ${renewalColour} mb-3`}>
              {report.content.renewalReadiness==='file-current'
                ? <CheckCircle2 size={15}/>
                : <AlertTriangle size={15}/>
              }
              <span className="font-bold text-sm capitalize">
                {{'action-required':'Action Required','flag-raised':'Review Recommended','file-current':'File Current'}[report.content.renewalReadiness]||report.content.renewalReadiness}
              </span>
            </div>
            {report.content.renewalNotes && (
              <p className="text-sm text-slate-600 dark:text-white/70 leading-relaxed">{report.content.renewalNotes}</p>
            )}
          </Section>
        )}

        {report.content?.brokerAccountabilityNotes && (
          <Section title="Broker Communication Notes">
            <p className="text-sm text-slate-600 dark:text-white/70 leading-relaxed">{report.content.brokerAccountabilityNotes}</p>
          </Section>
        )}

        {/* Disclaimer */}
        <div className="rounded-[20px] bg-slate-50 dark:bg-white/5 p-4 border border-slate-100 dark:border-white/10">
          <p className="text-xs text-slate-400 dark:text-white/30 leading-relaxed">
            <strong className="text-slate-500 dark:text-white/40">Disclaimer:</strong> HCL provides non-advised governance
            services only. All insurance decisions remain with the client and their FCA-regulated broker. This report does
            not constitute insurance advice. Herron Consultants Limited is not authorised or regulated by the FCA to give
            insurance advice.
          </p>
          <p className="text-xs text-slate-300 dark:text-white/20 mt-2">
            Generated {format(new Date(),'d MMMM yyyy')} · Herron Consultants Limited
          </p>
        </div>
      </div>
    </div>
  )
}

function InfoBlock({ label, value }) {
  return (
    <div>
      <p className="text-white/40 text-[10px] uppercase tracking-wide">{label}</p>
      <p className="text-white text-sm font-semibold mt-0.5 leading-tight truncate">{value}</p>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-1 h-5 rounded-full bg-hcl-gold flex-shrink-0"/>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h2>
        <div className="flex-1 h-px bg-slate-100 dark:bg-white/10"/>
      </div>
      {children}
    </div>
  )
}
