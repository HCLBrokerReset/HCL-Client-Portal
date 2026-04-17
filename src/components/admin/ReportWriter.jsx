import { useState } from 'react'
import { useData } from '../../context/DataContext'
import { Save, Send, Eye, Download, AlertTriangle } from 'lucide-react'
import { exportReportToPDF } from '../../utils/pdfExport'
import GovernanceReportView from '../reports/GovernanceReportView'

const QUARTERS = [
  { value: 'Q1 2026', label: 'Q1 2026 (January – March)' },
  { value: 'Q2 2026', label: 'Q2 2026 (April – June)' },
  { value: 'Q3 2026', label: 'Q3 2026 (July – September)' },
  { value: 'Q4 2026', label: 'Q4 2026 (October – December)' },
  { value: 'Q1 2027', label: 'Q1 2027 (January – March)' },
]

const RENEWAL_OPTIONS = [
  { value: 'action-required', label: 'Action Required',       active: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-300' },
  { value: 'flag-raised',     label: 'Review Recommended',    active: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-300' },
  { value: 'file-current',    label: 'File Current',          active: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-300' },
]

const inputCls = 'w-full rounded-[20px] border-0 bg-slate-100 dark:bg-white/5 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-royal/30 resize-none'
const labelCls = 'block text-sm font-semibold text-slate-900 dark:text-white mb-2'

export default function ReportWriter({ client, checkIns, existingReport, onClose }) {
  const { createReport, updateReport } = useData()
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)

  const generateSummary = () => {
    const flaggedMonths = checkIns.filter(ci => ci.flags?.length > 0)
    if (flaggedMonths.length === 0) {
      return `${client.businessName} has maintained a stable risk profile throughout the report period. Monthly check-ins indicate no material changes to turnover, staffing, contracts, or operational activities. The governance file is current and no broker intervention is required at this stage.`
    }
    const totalFlags = flaggedMonths.flatMap(ci => ci.flags).length
    return `${client.businessName} has experienced material changes during the report period. ${flaggedMonths.length} month${flaggedMonths.length > 1 ? 's' : ''} of check-ins have generated governance alerts, resulting in ${totalFlags} flag${totalFlags > 1 ? 's' : ''} in total. These changes have been reviewed by HCL and communicated to the broker. Please refer to the material changes section for full details.`
  }

  const [form, setForm] = useState({
    title:                    existingReport?.title || `${QUARTERS[0].value} Governance Report — ${client.businessName}`,
    period:                   existingReport?.period || QUARTERS[0].label,
    quarterValue:             existingReport ? QUARTERS.find(q => existingReport.period === q.label)?.value || QUARTERS[0].value : QUARTERS[0].value,
    executiveSummary:         existingReport?.content?.executiveSummary || generateSummary(),
    renewalReadiness:         existingReport?.content?.renewalReadiness || 'file-current',
    renewalNotes:             existingReport?.content?.renewalNotes || '',
    brokerAccountabilityNotes: existingReport?.content?.brokerAccountabilityNotes || '',
  })

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const handleQuarterChange = (quarterValue) => {
    const q = QUARTERS.find(q => q.value === quarterValue)
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
    if (existingReport) updateReport(existingReport.id, data)
    else createReport(data)
    await new Promise(r => setTimeout(r, 300))
    setSaving(false)
    onClose()
  }

  const handleExport = async () => {
    setExporting(true)
    const reportData = {
      title: form.title, period: form.period,
      content: {
        executiveSummary: form.executiveSummary,
        renewalReadiness: form.renewalReadiness,
        renewalNotes: form.renewalNotes,
        brokerAccountabilityNotes: form.brokerAccountabilityNotes,
      },
    }
    try { await exportReportToPDF({ report: reportData, client, checkIns, brokerActions: [] }) }
    catch (err) { console.error(err) }
    setExporting(false)
  }

  if (preview) {
    const previewReport = {
      id: existingReport?.id || 'preview',
      title: form.title, period: form.period,
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
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-white/10">
          <button onClick={() => setPreview(false)}
            className="text-sm font-semibold text-[#2447F9] hover:underline">
            ← Back to editor
          </button>
          <button onClick={handleExport} disabled={exporting}
            className="flex items-center gap-2 rounded-[18px] bg-hcl-gold px-4 py-2 text-xs font-bold text-navy shadow-gold disabled:opacity-70">
            <Download size={13}/>
            {exporting ? 'Generating…' : 'Export PDF'}
          </button>
        </div>
        <GovernanceReportView report={previewReport} client={client} checkIns={checkIns}/>
      </div>
    )
  }

  const flaggedCheckIns = checkIns.filter(ci => ci.flags?.length > 0)

  return (
    <div className="p-5 space-y-5">
      {flaggedCheckIns.length > 0 && (
        <div className="rounded-[20px] bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3">
          <p className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2 mb-2">
            <AlertTriangle size={13}/>
            Governance flags detected — include in report
          </p>
          {flaggedCheckIns.map(ci =>
            ci.flags.map((f, i) => (
              <p key={`${ci.id}-${i}`} className="text-xs text-amber-600 dark:text-amber-300 ml-4">· {ci.month}: {f}</p>
            ))
          )}
        </div>
      )}

      <div>
        <label className={labelCls}>Report quarter</label>
        <select value={form.quarterValue} onChange={e => handleQuarterChange(e.target.value)}
          className={inputCls}>
          {QUARTERS.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
        </select>
      </div>

      <div>
        <label className={labelCls}>Report title</label>
        <input type="text" value={form.title} onChange={e => set('title', e.target.value)}
          className={inputCls}/>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-slate-900 dark:text-white">Executive summary</label>
          <button type="button" onClick={() => set('executiveSummary', generateSummary())}
            className="text-xs font-semibold text-[#2447F9] hover:underline">
            Auto-generate
          </button>
        </div>
        <textarea value={form.executiveSummary} onChange={e => set('executiveSummary', e.target.value)}
          rows={5} className={inputCls}/>
      </div>

      <div>
        <label className={labelCls}>Renewal readiness status</label>
        <div className="grid grid-cols-3 gap-2">
          {RENEWAL_OPTIONS.map(opt => (
            <button key={opt.value} type="button" onClick={() => set('renewalReadiness', opt.value)}
              className={`rounded-[18px] py-2.5 px-2 border text-xs font-semibold text-center transition-all ${
                form.renewalReadiness === opt.value
                  ? opt.active
                  : 'border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/50'
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelCls}>Renewal notes</label>
        <textarea value={form.renewalNotes} onChange={e => set('renewalNotes', e.target.value)}
          rows={3} placeholder="Detail any renewal actions, disclosures required, or broker instructions…"
          className={inputCls}/>
      </div>

      <div>
        <label className={labelCls}>Broker communication notes</label>
        <textarea value={form.brokerAccountabilityNotes} onChange={e => set('brokerAccountabilityNotes', e.target.value)}
          rows={3} placeholder="Log all broker communications, dates, and outcomes for this period…"
          className={inputCls}/>
      </div>

      <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100 dark:border-white/10">
        <button onClick={() => setPreview(true)}
          className="btn-ghost flex items-center gap-2 px-4 py-2.5 text-xs">
          <Eye size={14}/> Preview
        </button>
        <button onClick={handleExport} disabled={exporting}
          className="flex items-center gap-2 rounded-[18px] border border-hcl-gold/40 text-amber-600 dark:text-amber-400 px-4 py-2.5 text-xs font-semibold disabled:opacity-70">
          <Download size={14}/> {exporting ? 'Generating…' : 'Export PDF'}
        </button>
        <button onClick={() => saveReport(false)} disabled={saving}
          className="flex items-center gap-2 rounded-[18px] bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white px-4 py-2.5 text-xs font-semibold disabled:opacity-70">
          <Save size={14}/> Save draft
        </button>
        <button onClick={() => saveReport(true)} disabled={saving}
          className="btn-primary flex items-center gap-2 px-5 py-2.5 text-xs ml-auto">
          <Send size={14}/> {saving ? 'Publishing…' : 'Publish to client'}
        </button>
      </div>
    </div>
  )
}
