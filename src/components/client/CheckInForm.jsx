import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { format } from 'date-fns'
import { CheckCircle, AlertTriangle, ChevronRight, ChevronLeft, Info } from 'lucide-react'
import { analyseCheckIn, formatTurnover } from '../../utils/flagging'
import { notifyAdminOfFlags, notifyClientCheckInReceived } from '../../utils/emailNotifications'
import Card, { CardBody } from '../common/Card'

const STEPS = ['Business overview', 'People & contracts', 'Risk & changes', 'Review & submit']

export default function CheckInForm({ onComplete }) {
  const { user } = useAuth()
  const { getClient, getCheckIns, createCheckIn, updateClient } = useData()

  const client = getClient(user.clientId)
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const checkIns = getCheckIns(user.clientId)
  const sorted = [...checkIns].sort((a, b) => a.month.localeCompare(b.month))
  // Find the most recent check-in that is NOT for the current month (for comparison)
  const prevCheckIn = [...sorted].reverse().find((ci) => ci.month !== currentMonth) || null
  const alreadySubmitted = checkIns.find((ci) => ci.month === currentMonth)

  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [raisedFlags, setRaisedFlags] = useState([])

  const [form, setForm] = useState({
    estimatedTurnover: '',
    wageBillChange: 'no-change',
    staffChange: 'no-change',
    newContracts: 'no',
    newTypesOfWork: false,
    newAssets: false,
    newAssetsDetails: '',
    incidents: 'no',
    futureChanges: '',
    otherFlags: '',
  })

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async () => {
    const data = {
      ...form,
      estimatedTurnover: Number(form.estimatedTurnover) || 0,
    }

    const flags = analyseCheckIn(data, prevCheckIn?.data || null)
    const checkIn = createCheckIn({
      clientId: user.clientId,
      month: currentMonth,
      data,
      flags,
      alertSent: flags.length > 0,
    })

    // Update client status if flags raised
    if (flags.length > 0) {
      const hasSignificant = flags.some((f) => f.includes('Significant incident') || (f.includes('Wage bill') && f.includes('significantly')))
      updateClient(user.clientId, { status: hasSignificant ? 'action-required' : 'flag-raised' })
    }

    // Notifications (console placeholder)
    if (flags.length > 0) {
      await notifyAdminOfFlags({
        clientName: client.businessName,
        clientId: user.clientId,
        month: currentMonth,
        flags,
      })
    }

    await notifyClientCheckInReceived({
      clientEmail: client.contactEmail,
      clientName: client.contactName,
      month: currentMonth,
      hasFlags: flags.length > 0,
    })

    setRaisedFlags(flags)
    setSubmitted(true)
    if (onComplete) onComplete()
  }

  const canProceed = [
    form.estimatedTurnover !== '' && Number(form.estimatedTurnover) >= 0,
    true, // step 1 always valid
    true, // step 2 always valid
    true, // review always valid
  ][step]

  if (alreadySubmitted && !submitted) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={32} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-xl font-semibold text-navy dark:text-white mb-2">Already submitted</h2>
        <p className="text-gray-500 dark:text-white/40 text-sm">
          Your {currentMonth} check-in has already been submitted. Only one check-in per month is required.
        </p>
        <p className="text-xs text-gray-400 dark:text-white/30 mt-3">
          Return to your dashboard to view your file status.
        </p>
      </div>
    )
  }

  if (submitted) {
    return (
      <SuccessScreen
        flags={raisedFlags}
        month={currentMonth}
        turnover={Number(form.estimatedTurnover)}
      />
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-navy dark:text-white tracking-tight">
          Monthly Check-In
        </h1>
        <p className="text-gray-500 dark:text-white/40 text-sm mt-1">
          {format(now, 'MMMM yyyy')} — {client?.businessName}
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 transition-colors ${
                  i < step
                    ? 'bg-emerald-500 text-white'
                    : i === step
                    ? 'bg-navy dark:bg-gold dark:text-navy text-white'
                    : 'bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-white/30'
                }`}
              >
                {i < step ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span
                className={`text-xs font-medium hidden sm:block ${
                  i === step ? 'text-navy dark:text-white' : 'text-gray-400 dark:text-white/30'
                }`}
              >
                {s}
              </span>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-px bg-gray-200 dark:bg-white/10 mx-2" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Previous month comparison notice */}
      {prevCheckIn && step === 0 && (
        <div className="flex gap-3 bg-navy/5 dark:bg-white/5 border border-navy/10 dark:border-white/10 rounded-xl px-4 py-3 mb-6">
          <Info size={15} className="text-navy/50 dark:text-white/30 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-navy/60 dark:text-white/50">
            Your last check-in was in <strong>{prevCheckIn.month}</strong> with a declared turnover of{' '}
            <strong>{formatTurnover(prevCheckIn.data.estimatedTurnover)}</strong>. Changes exceeding 15%
            will automatically raise a governance alert.
          </p>
        </div>
      )}

      <Card>
        <CardBody className="!p-0">
          {step === 0 && <Step0 form={form} set={set} />}
          {step === 1 && <Step1 form={form} set={set} />}
          {step === 2 && <Step2 form={form} set={set} />}
          {step === 3 && <StepReview form={form} prevData={prevCheckIn?.data} client={client} month={currentMonth} />}
        </CardBody>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-400 hover:text-navy dark:hover:text-white transition-colors disabled:opacity-0 disabled:pointer-events-none"
        >
          <ChevronLeft size={16} />
          Back
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed}
            className="flex items-center gap-2 px-6 py-2.5 bg-navy dark:bg-gold dark:text-navy text-white font-medium text-sm rounded-lg hover:bg-navy-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
            <ChevronRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-2.5 bg-gold text-navy font-semibold text-sm rounded-lg hover:bg-gold-300 transition-colors shadow-gold"
          >
            <CheckCircle size={16} />
            Submit check-in
          </button>
        )}
      </div>
    </div>
  )
}

// ---- Step 0: Business overview ----

function Step0({ form, set }) {
  return (
    <div className="p-6 space-y-6">
      <SectionTitle step={1} title="Business overview" subtitle="Tell us about this month's financials" />

      <FormField
        label="Estimated turnover this month"
        hint="Your best estimate of revenue generated this month"
        required
      >
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">£</span>
          <input
            type="number"
            min="0"
            step="1000"
            value={form.estimatedTurnover}
            onChange={(e) => set('estimatedTurnover', e.target.value)}
            placeholder="0"
            className="w-full pl-8 pr-4 py-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-navy-100 text-navy dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
          />
        </div>
      </FormField>

      <FormField
        label="Has your wage bill changed since last month?"
        hint="Including employer NI, pension contributions, and any overtime"
      >
        <Select
          value={form.wageBillChange}
          onChange={(v) => set('wageBillChange', v)}
          options={[
            { value: 'no-change', label: 'No change' },
            { value: 'increased-slightly', label: 'Increased slightly' },
            { value: 'increased-significantly', label: 'Increased significantly' },
            { value: 'decreased', label: 'Decreased' },
          ]}
        />
      </FormField>
    </div>
  )
}

// ---- Step 1: People & contracts ----

function Step1({ form, set }) {
  return (
    <div className="p-6 space-y-6">
      <SectionTitle step={2} title="People & contracts" subtitle="Staff changes and new business" />

      <FormField label="Have staff numbers changed?">
        <Select
          value={form.staffChange}
          onChange={(v) => set('staffChange', v)}
          options={[
            { value: 'no-change', label: 'No change' },
            { value: 'hired-1-2', label: 'Hired 1–2 staff' },
            { value: 'hired-3-or-more', label: 'Hired 3 or more staff' },
            { value: 'reduced-headcount', label: 'Reduced headcount' },
          ]}
        />
      </FormField>

      <FormField label="New contracts or clients won this month?">
        <Select
          value={form.newContracts}
          onChange={(v) => set('newContracts', v)}
          options={[
            { value: 'no', label: 'No' },
            { value: 'yes-small', label: 'Yes — small contract' },
            { value: 'yes-significant', label: 'Yes — significant contract' },
          ]}
        />
      </FormField>

      <FormField
        label="Started any new types of work not done before?"
        hint="e.g. entering a new trade, sector, or activity type"
      >
        <YesNo value={form.newTypesOfWork} onChange={(v) => set('newTypesOfWork', v)} />
      </FormField>
    </div>
  )
}

// ---- Step 2: Risk & changes ----

function Step2({ form, set }) {
  return (
    <div className="p-6 space-y-6">
      <SectionTitle step={3} title="Risk & changes" subtitle="Assets, incidents, and future plans" />

      <FormField
        label="New premises, vehicles, or equipment?"
        hint="Any significant asset additions this month"
      >
        <YesNo value={form.newAssets} onChange={(v) => set('newAssets', v)} />
      </FormField>

      {form.newAssets && (
        <FormField label="Please describe the new assets" required>
          <textarea
            value={form.newAssetsDetails}
            onChange={(e) => set('newAssetsDetails', e.target.value)}
            rows={2}
            placeholder="e.g. Two new vans, site cabin on Runcorn project…"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-navy-100 text-navy dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 resize-none"
          />
        </FormField>
      )}

      <FormField label="Any incidents, near misses, complaints or potential claims?">
        <Select
          value={form.incidents}
          onChange={(v) => set('incidents', v)}
          options={[
            { value: 'no', label: 'No' },
            { value: 'minor', label: 'Minor incident / near-miss / complaint' },
            { value: 'significant', label: 'Significant incident / claim / potential claim' },
          ]}
        />
      </FormField>

      <FormField
        label="Significant changes expected in the next 90 days?"
        hint="New projects, contracts, staff changes, relocations etc."
      >
        <textarea
          value={form.futureChanges}
          onChange={(e) => set('futureChanges', e.target.value)}
          rows={3}
          placeholder="Optional — tell us what's coming up…"
          className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-navy-100 text-navy dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 resize-none"
        />
      </FormField>

      <FormField label="Anything else to flag?">
        <textarea
          value={form.otherFlags}
          onChange={(e) => set('otherFlags', e.target.value)}
          rows={2}
          placeholder="Optional — any other information relevant to your governance file…"
          className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-navy-100 text-navy dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 resize-none"
        />
      </FormField>
    </div>
  )
}

// ---- Step 3: Review ----

function StepReview({ form, prevData, client, month }) {
  const data = { ...form, estimatedTurnover: Number(form.estimatedTurnover) || 0 }
  const flags = analyseCheckIn(data, prevData || null)

  const turnoverChange = prevData?.estimatedTurnover > 0
    ? ((data.estimatedTurnover - prevData.estimatedTurnover) / prevData.estimatedTurnover * 100).toFixed(1)
    : null

  return (
    <div className="p-6 space-y-6">
      <SectionTitle step={4} title="Review & submit" subtitle="Check your answers before submitting" />

      <div className="space-y-3">
        <ReviewRow label="Estimated turnover">
          <span className="font-semibold">{formatTurnover(data.estimatedTurnover)}</span>
          {turnoverChange !== null && (
            <span className={`ml-2 text-xs font-medium ${Math.abs(Number(turnoverChange)) > 15 ? 'text-amber-600' : 'text-gray-400'}`}>
              ({turnoverChange > 0 ? '+' : ''}{turnoverChange}% vs last month)
            </span>
          )}
        </ReviewRow>
        <ReviewRow label="Wage bill change">{WBL(form.wageBillChange)}</ReviewRow>
        <ReviewRow label="Staff numbers">{SCL(form.staffChange)}</ReviewRow>
        <ReviewRow label="New contracts">{CL(form.newContracts)}</ReviewRow>
        <ReviewRow label="New types of work">{form.newTypesOfWork ? 'Yes' : 'No'}</ReviewRow>
        <ReviewRow label="New assets">
          {form.newAssets ? `Yes — ${form.newAssetsDetails || 'details not provided'}` : 'No'}
        </ReviewRow>
        <ReviewRow label="Incidents">{IL(form.incidents)}</ReviewRow>
        {form.futureChanges && (
          <ReviewRow label="Future changes">{form.futureChanges}</ReviewRow>
        )}
        {form.otherFlags && (
          <ReviewRow label="Other flags">{form.otherFlags}</ReviewRow>
        )}
      </div>

      {flags.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={15} className="text-amber-600 dark:text-amber-400" />
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              {flags.length} governance alert{flags.length > 1 ? 's' : ''} will be raised
            </p>
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">
            Barry at HCL will be notified automatically and will follow up with you.
          </p>
          <ul className="space-y-1">
            {flags.map((f, i) => (
              <li key={i} className="text-xs text-amber-700 dark:text-amber-300">· {f}</li>
            ))}
          </ul>
        </div>
      )}

      {flags.length === 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle size={15} className="text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm text-emerald-700 dark:text-emerald-400">
            No governance alerts this month. Your file looks current.
          </p>
        </div>
      )}

      <p className="text-xs text-gray-400 dark:text-white/30 leading-relaxed">
        By submitting this check-in you confirm the information provided is accurate to the best of your knowledge.
        HCL provides non-advised governance services only. All insurance decisions remain with your FCA-regulated broker.
      </p>
    </div>
  )
}

// Helper label functions for review
const WBL = (v) => ({ 'no-change': 'No change', 'increased-slightly': 'Increased slightly', 'increased-significantly': 'Increased significantly', decreased: 'Decreased' }[v] || v)
const SCL = (v) => ({ 'no-change': 'No change', 'hired-1-2': 'Hired 1–2 staff', 'hired-3-or-more': 'Hired 3 or more staff', 'reduced-headcount': 'Reduced headcount' }[v] || v)
const CL = (v) => ({ no: 'No', 'yes-small': 'Yes — small contract', 'yes-significant': 'Yes — significant contract' }[v] || v)
const IL = (v) => ({ no: 'No', minor: 'Minor incident / near-miss', significant: 'Significant incident / claim' }[v] || v)

function ReviewRow({ label, children }) {
  return (
    <div className="flex gap-3 py-2.5 border-b border-gray-50 dark:border-white/5 last:border-0">
      <span className="text-xs text-gray-400 dark:text-white/30 w-36 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-navy dark:text-white flex-1">{children}</span>
    </div>
  )
}

// ---- Shared sub-components ----

function SectionTitle({ step, title, subtitle }) {
  return (
    <div>
      <p className="text-xs text-gold font-semibold uppercase tracking-widest mb-1">Step {step} of 4</p>
      <h2 className="text-lg font-semibold text-navy dark:text-white">{title}</h2>
      {subtitle && <p className="text-sm text-gray-400 dark:text-white/40 mt-0.5">{subtitle}</p>}
    </div>
  )
}

function FormField({ label, hint, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-navy dark:text-white mb-1">
        {label}
        {required && <span className="text-gold ml-1">*</span>}
      </label>
      {hint && <p className="text-xs text-gray-400 dark:text-white/30 mb-2">{hint}</p>}
      {children}
    </div>
  )
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-navy-100 text-navy dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold appearance-none"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

function YesNo({ value, onChange }) {
  return (
    <div className="flex gap-3">
      {[{ label: 'No', val: false }, { label: 'Yes', val: true }].map(({ label, val }) => (
        <button
          key={label}
          type="button"
          onClick={() => onChange(val)}
          className={`flex-1 py-3 rounded-lg border text-sm font-medium transition-all ${
            value === val
              ? 'bg-navy dark:bg-gold dark:text-navy text-white border-navy dark:border-gold'
              : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/50 hover:border-navy dark:hover:border-white/30'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function SuccessScreen({ flags, month, turnover }) {
  return (
    <div className="max-w-md mx-auto text-center py-12">
      <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
        <CheckCircle size={32} className="text-emerald-600 dark:text-emerald-400" />
      </div>
      <h2 className="text-xl font-semibold text-navy dark:text-white mb-2">Check-in submitted</h2>
      <p className="text-gray-500 dark:text-white/40 text-sm mb-6">
        Your {month} governance check-in has been received.
      </p>

      {flags.length > 0 ? (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-left mb-6">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-2">
            <AlertTriangle size={14} />
            {flags.length} governance alert{flags.length > 1 ? 's' : ''} raised
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
            Barry at HCL has been notified and will follow up with you shortly.
          </p>
          {flags.map((f, i) => (
            <p key={i} className="text-xs text-amber-700 dark:text-amber-300">· {f}</p>
          ))}
        </div>
      ) : (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 mb-6">
          <p className="text-sm text-emerald-700 dark:text-emerald-400">
            No governance alerts this month. Your file is current.
          </p>
        </div>
      )}

      <p className="text-xs text-gray-400 dark:text-white/30">
        You can return to your dashboard to view your file status.
      </p>
    </div>
  )
}
