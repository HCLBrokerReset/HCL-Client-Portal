import { useState } from 'react'
import { useData } from '../../context/DataContext'
import { format } from 'date-fns'
import { Save, Send, Eye, Download, AlertTriangle, CheckCircle } from 'lucide-react'
import { exportReportToPDF } from '../../utils/pdfExport'
import GovernanceReportView from '../reports/GovernanceReportView'
import { analyseCheckIn } from '../../utils/flagging'

const QUARTERS = [
  { value: 'Q1 2026', label: 'Q1 2026 (January – March)' },
  { value: 'Q2 2026', label: 'Q2 2026 (April – June)' },
  { value: 'Q3 2026', label: 'Q3 2026 (July – September)' },
  { value: 'Q4 2026', label: 'Q4 2026 (October – December)' },
  { value: 'Q1 2027', label: 'Q1 2027 (January – March)' },
]

const RENEWAL_OPTIONS = [
  { value: 'action-required', label: 'Action Required' },
  { value: 'flag-raised', label: 'Review Recommended' },
  { value: 'file-current', label: 'File Current' },
]

export default function ReportWriter({ client, checkIns, existingReport, onClose }) {
  const { createReport, updateReport } = useData()
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Auto-generate executive summary from check-in data
  const generateSummary = () => {
    const flaggedMonths = checkIns.filter((ci) => ci.flags?.length > 0)
    if (flaggedMonths.length === 0) {
      return `${client.businessName} has maintained a stable risk profile throughout the report period. Monthly check-ins indicate no material changes to turnover, staffing, contracts, or operational activities. The governance file is current and no broker intervention is required at this stage.`
    }

    const totalFlags = flaggedMonths.flatMap((ci) => ci.flags).length
    return `${client.businessName} has experienced material changes during the report period. ${flaggedMonths.length} month${flaggedMonths.length > 1 ? 's' : ''} of check-ins have generated governance alerts, resulting in ${totalFlags} flag${totalFlags > 1 ? 's' : ''} in total. These changes have been reviewed by HCL and communicated to the broker. Please refer to the material changes section for full details.`
  }

  const [form, setForm] = useState({
    title: existingReport?.title || `${QUARTERS[0].value} Governance Report — ${client.businessName}`,
    period: existingReport?.period || QUARTERS[0].label,
    quarterValue: existingReport ? QUARTERS.find((q) => existingReport.period === q.label)?.value || QUARTERS[0].value : QUARTERS[0].value,
    executiveSummary: existingReport?.content?.executiveSummary || generateSummary(),
    renewalReadiness: existingReport?.content?.renewalReadiness || 'file-current',
    renewalNotes: existingReport?.content?.renewalNotes || '',
    brokerAccountabilityNotes: existingReport?.content?.brokerAccountabilityNotes || '',
  })

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  const handleQuarterChange = (quarterValue) => {
    const q = QUARTERS.find((q) => q.value === quarterValue)
    set('quarterValue', quarterValue)
    set('period', q.label)
    set('title', `${quarterValue} Governance Report — ${client.businessName}`)
  }

  const saveReport = async (publish = false) => {
    setSaving(true)
    const data = {
      clientId: client.id,
      title: form.title,
      period: form.period,
      status: publish ? 'published' : 'draft',
      publishedAt: publish ? new Date().toISOString() : (existingReport?.publishedAt || null),
      content: {
        executiveSummary: form.executiveSummary,
        renewalReadiness: form.renewalReadiness,
        renewalNotes: form.renewalNotes,
        brokerAccountabilityNotes: form.brokerAccountabilityNotes,
      },
    }

    if (existingReport) {
      updateReport(existingReport.id, data)
    } else {
      createReport(data)
    }

    await new Promise((r) => setTimeout(r, 300))
    setSaving(false)
    onClose()
  }

  const handleExport = async () => {
    setExporting(true)
    const reportData = {
      title: form.title,
      period: form.period,
      content: {
        executiveSummary: form.executiveSummary,
        renewalReadiness: form.renewalReadiness,
        renewalNotes: form.renewalNotes,
        brokerAccountabilityNotes: form.brokerAccountabilityNotes,
      },
    }
    try {
      await exportReportToPDF({ report: reportData, client, checkIns, brokerActions: [] })
    } catch (err) {
      console.error(err)
    }
    setExporting(false)
  }

  if (preview) {
    const previewReport = {
      id: existingReport?.id || 'preview',
      title: form.title,
      period: form.period,
      status: 'draft',
      createdAt: existingReport?.createdAt || new Date().toISOString(),
      publishedAt: existingReport?.publishedAt || null,
      content: {
        executiveSummary: form.executiveSummary,
        renewalReadiness: form.renewalReadiness,
        renewalNotes: form.renewalNotes,
        brokerAccountabilityNotes: form.brokerAccountabilityNotes,
      },
    }

    return (
      <div>
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 dark:border-white/10">
          <button
            onClick={() => setPreview(false)}
            className="text-sm text-gold hover:underline"
          >
            ← Back to editor
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-gold text-navy font-medium text-sm rounded-lg hover:bg-gold-300 transition-colors"
          >
            <Download size={13} />
            {exporting ? 'Generating…' : 'Export PDF'}
          </button>
        </div>
        <GovernanceReportView report={previewReport} client={client} checkIns={checkIns} />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Flags summary */}
      {checkIns.filter((ci) => ci.flags?.length > 0).length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2 mb-2">
            <AlertTriangle size={13} />
            Governance flags detected — include in report
          </p>
          {checkIns.filter((ci) => ci.flags?.length > 0).map((ci) =>
            ci.flags.map((f, i) => (
              <p key={`${ci.id}-${i}`} className="text-xs text-amber-700 dark:text-amber-300 ml-4">
                · {ci.month}: {f}
              </p>
            ))
          )}
        </div>
      )}

      {/* Quarter */}
      <div>
        <label className="block text-sm font-medium text-navy dark:text-white mb-1.5">
          Report quarter
        </label>
        <select
          value={form.quarterValue}
          onChange={(e) => handleQuarterChange(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-navy-50 text-navy dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
        >
          {QUARTERS.map((q) => (
            <option key={q.value} value={q.value}>{q.label}</option>
          ))}
        </select>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-navy dark:text-white mb-1.5">
          Report title
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-navy-50 text-navy dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
        />
      </div>

      {/* Executive summary */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-navy dark:text-white">
            Executive summary
          </label>
          <button
            type="button"
            onClick={() => set('executiveSummary', generateSummary())}
            className="text-xs text-gold hover:underline"
          >
            Auto-generate
          </button>
        </div>
        <textarea
          value={form.executiveSummary}
          onChange={(e) => set('executiveSummary', e.target.value)}
          rows={5}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-navy-50 text-navy dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 resize-none leading-relaxed"
        />
      </div>

      {/* Renewal readiness */}
      <div>
        <label className="block text-sm font-medium text-navy dark:text-white mb-1.5">
          Renewal readiness status
        </label>
        <div className="flex gap-3">
          {RENEWAL_OPTIONS.map((opt) => {
            const colours = {
              'action-required': 'border-red-400 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
              'flag-raised': 'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
              'file-current': 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
            }
            const inactive = 'border-gray-200 dark:border-white/10 text-gray-400 bg-white dark:bg-navy-50'

            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => set('renewalReadiness', opt.value)}
                className={`flex-1 py-2.5 px-3 rounded-lg border text-xs font-medium transition-all text-center ${
                  form.renewalReadiness === opt.value ? colours[opt.value] : inactive
                }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Renewal notes */}
      <div>
        <label className="block text-sm font-medium text-navy dark:text-white mb-1.5">
          Renewal notes
        </label>
        <textarea
          value={form.renewalNotes}
          onChange={(e) => set('renewalNotes', e.target.value)}
          rows={3}
          placeholder="Detail any renewal actions, disclosures required, or broker instructions…"
          className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-navy-50 text-navy dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 resize-none"
        />
      </div>

      {/* Broker notes */}
      <div>
        <label className="block text-sm font-medium text-navy dark:text-white mb-1.5">
          Broker communication notes
        </label>
        <textarea
          value={form.brokerAccountabilityNotes}
          onChange={(e) => set('brokerAccountabilityNotes', e.target.value)}
          rows={3}
          placeholder="Log all broker communications, dates, and outcomes for this period…"
          className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-navy-50 text-navy dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100 dark:border-white/10">
        <button
          onClick={() => setPreview(true)}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-white/10 text-navy dark:text-white font-medium text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        >
          <Eye size={14} />
          Preview
        </button>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2.5 border border-gold/40 text-gold font-medium text-sm rounded-lg hover:bg-gold/5 transition-colors disabled:opacity-70"
        >
          <Download size={14} />
          {exporting ? 'Generating…' : 'Export PDF'}
        </button>
        <button
          onClick={() => saveReport(false)}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-white/10 text-navy dark:text-white font-medium text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-white/20 transition-colors disabled:opacity-70"
        >
          <Save size={14} />
          Save draft
        </button>
        <button
          onClick={() => saveReport(true)}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 bg-navy dark:bg-gold dark:text-navy text-white font-medium text-sm rounded-lg hover:bg-navy-50 transition-colors disabled:opacity-70 ml-auto"
        >
          <Send size={14} />
          {saving ? 'Publishing…' : 'Publish to client'}
        </button>
      </div>
    </div>
  )
}
