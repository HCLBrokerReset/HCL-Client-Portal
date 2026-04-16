import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Download, AlertTriangle, CheckCircle, Building2, Calendar, Link2 } from 'lucide-react'
import StatusBadge from '../common/StatusBadge'
import { formatTurnover, WAGE_BILL_LABELS, CONTRACT_LABELS, INCIDENT_LABELS } from '../../utils/flagging'
import { exportReportToPDF } from '../../utils/pdfExport'
import { useData } from '../../context/DataContext'

export default function GovernanceReportView({ report, client, checkIns }) {
  const [exporting, setExporting] = useState(false)
  const { getBrokerActions } = useData()

  const brokerActions = getBrokerActions ? getBrokerActions(client.id) : []

  const handleExport = async () => {
    setExporting(true)
    try {
      await exportReportToPDF({ report, client, checkIns, brokerActions })
    } catch (err) {
      console.error('PDF export failed:', err)
      alert('PDF export failed. Check console for details.')
    }
    setExporting(false)
  }

  const renewalColour = {
    'action-required': 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    'flag-raised': 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    'file-current': 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
  }[report.content?.renewalReadiness] || 'text-gray-600 bg-gray-50 border-gray-200'

  const renewalLabel = {
    'action-required': 'Action Required',
    'flag-raised': 'Review Recommended',
    'file-current': 'File Current',
  }[report.content?.renewalReadiness] || report.content?.renewalReadiness

  return (
    <div className="overflow-y-auto">
      {/* PDF-style header */}
      <div className="bg-navy dark:bg-navy-200 px-8 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            {/* HCL badge */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gold rounded-lg flex items-center justify-center">
                <span className="text-navy font-bold text-sm">HCL</span>
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-tight">Herron Consultants Limited</p>
                <p className="text-gold/70 text-xs tracking-widest uppercase">Client Governance Report</p>
              </div>
            </div>
            <h1 className="text-white text-xl font-bold leading-tight">{report.title}</h1>
            <p className="text-gold/80 text-sm mt-1">{report.period}</p>
          </div>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-gold text-navy font-semibold text-sm rounded-lg hover:bg-gold-300 transition-colors disabled:opacity-70 flex-shrink-0"
          >
            <Download size={14} />
            {exporting ? 'Generating…' : 'Export PDF'}
          </button>
        </div>

        {/* Gold accent */}
        <div className="h-px bg-gradient-to-r from-gold/60 via-gold to-gold/60 mt-4" />

        {/* Client info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <InfoBlock icon={<Building2 size={12} />} label="Client" value={client.businessName} />
          <InfoBlock icon={<Building2 size={12} />} label="Sector" value={client.sector} />
          <InfoBlock icon={<Link2 size={12} />} label="Broker" value={`${client.brokerName} — ${client.brokerCompany}`} />
          <InfoBlock icon={<Calendar size={12} />} label="Renewal" value={format(parseISO(client.renewalDate), 'd MMMM yyyy')} />
        </div>
      </div>

      {/* Report body */}
      <div className="px-8 py-6 space-y-8">
        {/* Executive summary */}
        {report.content?.executiveSummary && (
          <Section title="Executive Summary">
            <p className="text-gray-600 dark:text-white/70 leading-relaxed text-sm">
              {report.content.executiveSummary}
            </p>
          </Section>
        )}

        {/* Monthly check-in summary */}
        <Section title="Monthly Check-In Summary">
          <CheckInTable checkIns={checkIns} period={report.period} />
        </Section>

        {/* Material changes */}
        {checkIns.some((ci) => ci.flags?.length > 0) && (
          <Section title="Material Changes Identified">
            <div className="space-y-2">
              {checkIns
                .filter((ci) => ci.flags?.length > 0)
                .sort((a, b) => a.month.localeCompare(b.month))
                .flatMap((ci) =>
                  ci.flags.map((f, i) => (
                    <div key={`${ci.id}-${i}`} className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg px-4 py-3">
                      <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 mr-2">{ci.month}</span>
                        <span className="text-xs text-amber-700 dark:text-amber-400">{f}</span>
                      </div>
                    </div>
                  ))
                )}
            </div>
          </Section>
        )}

        {/* Broker log */}
        {brokerActions.length > 0 && (
          <Section title="Broker Accountability Log">
            <div className="space-y-3">
              {brokerActions.map((a) => (
                <div key={a.id} className="border border-gray-100 dark:border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <StatusBadge status={a.status} />
                    <span className="text-xs text-gray-400 dark:text-white/40">
                      Sent {format(parseISO(a.sentAt), 'd MMM yyyy')}
                      {a.respondedAt && ` · Responded ${format(parseISO(a.respondedAt), 'd MMM yyyy')}`}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-white/70">{a.description}</p>
                  {a.notes && (
                    <p className="text-xs text-gray-400 dark:text-white/40 mt-2 italic">{a.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Renewal readiness */}
        {report.content?.renewalReadiness && (
          <Section title="Renewal Readiness">
            <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${renewalColour} mb-3`}>
              {report.content.renewalReadiness === 'file-current' ? (
                <CheckCircle size={16} />
              ) : (
                <AlertTriangle size={16} />
              )}
              <span className="font-semibold text-sm">{renewalLabel}</span>
            </div>
            {report.content.renewalNotes && (
              <p className="text-sm text-gray-600 dark:text-white/70 leading-relaxed">
                {report.content.renewalNotes}
              </p>
            )}
          </Section>
        )}

        {/* Broker notes */}
        {report.content?.brokerAccountabilityNotes && (
          <Section title="Broker Communication Notes">
            <p className="text-sm text-gray-600 dark:text-white/70 leading-relaxed">
              {report.content.brokerAccountabilityNotes}
            </p>
          </Section>
        )}

        {/* Disclaimer */}
        <div className="border-t border-gray-100 dark:border-white/10 pt-6">
          <p className="text-xs text-gray-400 dark:text-white/30 leading-relaxed">
            <strong className="text-gray-500 dark:text-white/40">Disclaimer:</strong> HCL provides non-advised governance
            services only. All insurance decisions remain with the client and their FCA-regulated broker. This report does
            not constitute insurance advice. Herron Consultants Limited is not authorised or regulated by the Financial
            Conduct Authority to give insurance advice.
          </p>
          <p className="text-xs text-gray-300 dark:text-white/20 mt-2">
            Report generated {format(new Date(), 'd MMMM yyyy')} · Herron Consultants Limited
          </p>
        </div>
      </div>
    </div>
  )
}

function InfoBlock({ icon, label, value }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-white/30 text-xs mb-0.5">
        {icon}
        <span className="uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-white text-sm font-medium leading-tight">{value}</p>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-0.5 h-5 bg-gold rounded-full" />
        <h2 className="text-base font-semibold text-navy dark:text-white">{title}</h2>
        <div className="flex-1 h-px bg-gray-100 dark:bg-white/10" />
      </div>
      {children}
    </div>
  )
}

function CheckInTable({ checkIns, period }) {
  const sorted = [...checkIns].sort((a, b) => a.month.localeCompare(b.month))

  if (sorted.length === 0) {
    return <p className="text-sm text-gray-400">No check-ins available for this period.</p>
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-white/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-navy text-white">
            <th className="text-left px-4 py-3 text-xs font-semibold">Month</th>
            <th className="text-left px-4 py-3 text-xs font-semibold">Turnover</th>
            <th className="text-left px-4 py-3 text-xs font-semibold">Wage bill</th>
            <th className="text-left px-4 py-3 text-xs font-semibold">New contracts</th>
            <th className="text-left px-4 py-3 text-xs font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((ci, idx) => (
            <tr
              key={ci.id}
              className={idx % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-surface dark:bg-white/5'}
            >
              <td className="px-4 py-3 text-navy dark:text-white font-medium text-xs">{ci.month}</td>
              <td className="px-4 py-3 text-navy dark:text-white text-xs">{formatTurnover(ci.data.estimatedTurnover)}</td>
              <td className="px-4 py-3 text-gray-500 dark:text-white/50 text-xs">{WAGE_BILL_LABELS[ci.data.wageBillChange]}</td>
              <td className="px-4 py-3 text-gray-500 dark:text-white/50 text-xs">{CONTRACT_LABELS[ci.data.newContracts]}</td>
              <td className="px-4 py-3">
                {ci.flags?.length > 0 ? (
                  <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                    <AlertTriangle size={11} />
                    {ci.flags.length} flag{ci.flags.length > 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                    <CheckCircle size={11} />
                    Clear
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
