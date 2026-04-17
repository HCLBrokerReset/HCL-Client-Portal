import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { format } from 'date-fns'
import { CheckCircle2, AlertTriangle, Send, ChevronLeft, ChevronRight } from 'lucide-react'
import { analyseCheckIn, formatTurnover } from '../../utils/flagging'
import { notifyAdminOfFlags, notifyClientCheckInReceived } from '../../utils/emailNotifications'
import Card, { DarkCard, GlassPill } from '../common/Card'

const STEPS = ['Overview', 'People', 'Risk', 'Review']

export default function CheckInForm() {
  const { user } = useAuth()
  const { getClient, getCheckIns, createCheckIn, updateClient } = useData()

  const client = getClient(user.clientId)
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  const checkIns = getCheckIns(user.clientId)
  const prevCheckIn = [...checkIns].sort((a,b)=>b.month.localeCompare(a.month)).find(ci=>ci.month!==currentMonth) || null
  const alreadySubmitted = checkIns.find(ci=>ci.month===currentMonth)

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
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const handleSubmit = async () => {
    const data = { ...form, estimatedTurnover: Number(form.estimatedTurnover)||0 }
    const flags = analyseCheckIn(data, prevCheckIn?.data||null)
    createCheckIn({ clientId: user.clientId, month: currentMonth, data, flags, alertSent: flags.length>0 })
    if (flags.length>0) {
      const hasSignificant = flags.some(f=>f.includes('Significant')||(f.includes('Wage')&&f.includes('significantly')))
      updateClient(user.clientId, { status: hasSignificant ? 'action-required' : 'flag-raised' })
      await notifyAdminOfFlags({ clientName: client.businessName, clientId: user.clientId, month: currentMonth, flags })
    }
    await notifyClientCheckInReceived({ clientEmail: client.contactEmail, clientName: client.contactName, month: currentMonth, hasFlags: flags.length>0 })
    setRaisedFlags(flags)
    setSubmitted(true)
  }

  if (alreadySubmitted && !submitted) {
    return (
      <div className="space-y-4">
        <DarkCard>
          <GlassPill>Monthly check-in</GlassPill>
          <h1 className="mt-3 text-2xl font-bold">Already submitted</h1>
          <p className="mt-2 text-sm text-white/80">{currentMonth} has already been received.</p>
        </DarkCard>
        <Card><div className="p-6 text-center">
          <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-3"/>
          <p className="text-slate-600 dark:text-white/70 text-sm">One check-in per month is all that's needed. You're all done.</p>
        </div></Card>
      </div>
    )
  }

  if (submitted) return <SuccessScreen flags={raisedFlags} month={currentMonth} />

  const canProceed = step===0 ? (form.estimatedTurnover!=='' && Number(form.estimatedTurnover)>=0) : true

  return (
    <div className="space-y-4">
      {/* Header */}
      <DarkCard>
        <GlassPill>Monthly check-in</GlassPill>
        <h1 className="mt-3 text-2xl font-bold leading-tight">
          Fast. Tappable.<br/>Proper app flow.
        </h1>
        <p className="mt-2 text-sm text-white/80">
          {format(now,'MMMM yyyy')} · {client?.businessName}
        </p>
        {/* Progress dots */}
        <div className="flex gap-2 mt-4">
          {STEPS.map((s,i) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${i<=step?'bg-white':'bg-white/25'}`}/>
          ))}
        </div>
        <div className="text-xs text-white/60 mt-1">Step {step+1} of {STEPS.length} — {STEPS[step]}</div>
      </DarkCard>

      {/* Previous month note */}
      {prevCheckIn && step===0 && (
        <div className="rounded-[20px] bg-[#2447F9]/10 dark:bg-[#2447F9]/20 border border-[#2447F9]/20 px-4 py-3 text-sm text-[#2447F9] dark:text-blue-300">
          Last month: <strong>{formatTurnover(prevCheckIn.data.estimatedTurnover)}</strong> — changes over 15% trigger a governance alert.
        </div>
      )}

      {/* Step content */}
      {step===0 && <Step0 form={form} set={set}/>}
      {step===1 && <Step1 form={form} set={set}/>}
      {step===2 && <Step2 form={form} set={set}/>}
      {step===3 && <StepReview form={form} prev={prevCheckIn?.data} month={currentMonth}/>}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        {step > 0 ? (
          <button onClick={()=>setStep(s=>s-1)}
            className="btn-ghost flex items-center gap-2 flex-1">
            <ChevronLeft size={16}/> Back
          </button>
        ) : <div className="flex-1"/>}

        {step < STEPS.length-1 ? (
          <button onClick={()=>setStep(s=>s+1)} disabled={!canProceed}
            className="btn-primary flex items-center justify-center gap-2 flex-1 disabled:opacity-50">
            Continue <ChevronRight size={16}/>
          </button>
        ) : (
          <button onClick={handleSubmit}
            className="btn-success flex items-center justify-center gap-2 flex-1">
            Submit check-in <Send size={15}/>
          </button>
        )}
      </div>
    </div>
  )
}

function Step0({ form, set }) {
  return (
    <div className="space-y-3">
      <QCard title="Estimated turnover this month" hint="Your best estimate of revenue this month">
        <div className="relative mt-3">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">£</span>
          <input type="number" min="0" step="1000" value={form.estimatedTurnover}
            onChange={e=>set('estimatedTurnover',e.target.value)}
            placeholder="0"
            className="w-full rounded-[20px] border-0 bg-slate-100 pl-8 pr-4 py-4 text-sm outline-none focus:ring-2 focus:ring-royal/30 dark:bg-white/5 dark:text-white"
          />
        </div>
      </QCard>
      <QCard title="Has your wage bill changed?">
        <TwoChoice value={form.wageBillChange} onChange={v=>set('wageBillChange',v)}
          options={[
            {v:'no-change',l:'No change'},
            {v:'increased-slightly',l:'Increased slightly'},
            {v:'increased-significantly',l:'Increased significantly'},
            {v:'decreased',l:'Decreased'},
          ]}
        />
      </QCard>
    </div>
  )
}

function Step1({ form, set }) {
  return (
    <div className="space-y-3">
      <QCard title="Have staff numbers changed?">
        <TwoChoice value={form.staffChange} onChange={v=>set('staffChange',v)}
          options={[
            {v:'no-change',l:'No change'},
            {v:'hired-1-2',l:'Hired 1–2'},
            {v:'hired-3-or-more',l:'Hired 3 or more'},
            {v:'reduced-headcount',l:'Reduced headcount'},
          ]}
        />
      </QCard>
      <QCard title="New contracts or clients won?">
        <TwoChoice value={form.newContracts} onChange={v=>set('newContracts',v)}
          options={[{v:'no',l:'No'},{v:'yes-small',l:'Yes — small'},{v:'yes-significant',l:'Yes — significant'}]}
        />
      </QCard>
      <QCard title="Started any new types of work not done before?">
        <YesNo value={form.newTypesOfWork} onChange={v=>set('newTypesOfWork',v)}/>
      </QCard>
    </div>
  )
}

function Step2({ form, set }) {
  return (
    <div className="space-y-3">
      <QCard title="New premises, vehicles, or equipment?">
        <YesNo value={form.newAssets} onChange={v=>set('newAssets',v)}/>
      </QCard>
      {form.newAssets && (
        <QCard title="Describe the new assets">
          <textarea value={form.newAssetsDetails} onChange={e=>set('newAssetsDetails',e.target.value)}
            rows={2} placeholder="e.g. Two new vans, site cabin…"
            className="w-full rounded-[20px] border-0 bg-slate-100 px-4 py-4 text-sm outline-none focus:ring-2 focus:ring-royal/30 dark:bg-white/5 dark:text-white resize-none mt-3"/>
        </QCard>
      )}
      <QCard title="Any incidents, near misses, or potential claims?">
        <TwoChoice value={form.incidents} onChange={v=>set('incidents',v)}
          options={[{v:'no',l:'No'},{v:'minor',l:'Minor'},{v:'significant',l:'Significant'}]}
        />
      </QCard>
      <QCard title="Significant changes expected in next 90 days?">
        <textarea value={form.futureChanges} onChange={e=>set('futureChanges',e.target.value)}
          rows={3} placeholder="New projects, contracts, staff changes…"
          className="w-full rounded-[20px] border-0 bg-slate-100 px-4 py-4 text-sm outline-none focus:ring-2 focus:ring-royal/30 dark:bg-white/5 dark:text-white resize-none mt-3"/>
      </QCard>
      <QCard title="Anything else to flag?">
        <textarea value={form.otherFlags} onChange={e=>set('otherFlags',e.target.value)}
          rows={2} placeholder="Type here…"
          className="w-full rounded-[20px] border-0 bg-slate-100 px-4 py-4 text-sm outline-none focus:ring-2 focus:ring-royal/30 dark:bg-white/5 dark:text-white resize-none mt-3"/>
      </QCard>
    </div>
  )
}

function StepReview({ form, prev, month }) {
  const data = {...form, estimatedTurnover: Number(form.estimatedTurnover)||0}
  const flags = analyseCheckIn(data, prev||null)
  const change = prev?.estimatedTurnover>0
    ? ((data.estimatedTurnover-prev.estimatedTurnover)/prev.estimatedTurnover*100).toFixed(1)
    : null

  const WBL = v => ({  'no-change':'No change','increased-slightly':'Increased slightly','increased-significantly':'Increased significantly',decreased:'Decreased' }[v]||v)
  const SCL = v => ({ 'no-change':'No change','hired-1-2':'Hired 1–2','hired-3-or-more':'Hired 3+','reduced-headcount':'Reduced' }[v]||v)
  const CL  = v => ({ no:'No','yes-small':'Yes – small','yes-significant':'Yes – significant' }[v]||v)
  const IL  = v => ({ no:'No',minor:'Minor',significant:'Significant' }[v]||v)

  return (
    <div className="space-y-3">
      <Card>
        <div className="p-4 space-y-2">
          <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-3">Your answers</p>
          <ReviewRow label="Turnover">
            <strong>{formatTurnover(data.estimatedTurnover)}</strong>
            {change!==null && <span className={`ml-1.5 text-xs font-semibold ${Math.abs(Number(change))>15?'text-amber-600':'text-slate-400'}`}>({change>0?'+':''}{change}%)</span>}
          </ReviewRow>
          <ReviewRow label="Wage bill">{WBL(form.wageBillChange)}</ReviewRow>
          <ReviewRow label="Staff">{SCL(form.staffChange)}</ReviewRow>
          <ReviewRow label="Contracts">{CL(form.newContracts)}</ReviewRow>
          <ReviewRow label="New work">{form.newTypesOfWork?'Yes':'No'}</ReviewRow>
          <ReviewRow label="New assets">{form.newAssets?`Yes — ${form.newAssetsDetails||'…'}`:'No'}</ReviewRow>
          <ReviewRow label="Incidents">{IL(form.incidents)}</ReviewRow>
          {form.futureChanges && <ReviewRow label="Future">{form.futureChanges}</ReviewRow>}
          {form.otherFlags && <ReviewRow label="Other">{form.otherFlags}</ReviewRow>}
        </div>
      </Card>

      {flags.length>0 ? (
        <div className="rounded-[24px] bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
          <p className="font-bold text-amber-700 dark:text-amber-400 text-sm flex items-center gap-2 mb-2">
            <AlertTriangle size={14}/> {flags.length} governance alert{flags.length>1?'s':''} will be raised
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">Barry at HCL will be notified automatically.</p>
          {flags.map((f,i)=><p key={i} className="text-xs text-amber-700 dark:text-amber-300">· {f}</p>)}
        </div>
      ) : (
        <div className="rounded-[24px] bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 flex items-center gap-3">
          <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400"/>
          <p className="text-sm text-emerald-700 dark:text-emerald-400">No governance alerts this month. File looks current.</p>
        </div>
      )}
      <p className="text-xs text-slate-400 leading-relaxed px-1">
        By submitting you confirm this information is accurate. HCL provides non-advised governance services only.
      </p>
    </div>
  )
}

function ReviewRow({ label, children }) {
  return (
    <div className="flex gap-3 py-2 border-b border-slate-100 dark:border-white/5 last:border-0 text-sm">
      <span className="text-slate-400 w-24 flex-shrink-0 text-xs pt-0.5">{label}</span>
      <span className="text-slate-800 dark:text-white flex-1">{children}</span>
    </div>
  )
}

function QCard({ title, hint, children }) {
  return (
    <Card>
      <div className="p-4">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
        {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
        {children}
      </div>
    </Card>
  )
}

function TwoChoice({ value, onChange, options }) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {options.map(o => (
        <button key={o.v} onClick={()=>onChange(o.v)}
          className={`rounded-[18px] px-3 py-3 text-sm font-semibold transition-all ${
            value===o.v
              ? 'bg-btn-primary text-white shadow-btn'
              : 'bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-300'
          }`}>
          {o.l}
        </button>
      ))}
    </div>
  )
}

function YesNo({ value, onChange }) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {[{v:false,l:'No'},{v:true,l:'Yes'}].map(o => (
        <button key={String(o.v)} onClick={()=>onChange(o.v)}
          className={`rounded-[18px] px-3 py-3 text-sm font-semibold transition-all ${
            value===o.v
              ? 'bg-btn-primary text-white shadow-btn'
              : 'bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-300'
          }`}>
          {o.l}
        </button>
      ))}
    </div>
  )
}

function SuccessScreen({ flags, month }) {
  return (
    <div className="space-y-4">
      <div className="rounded-[30px] bg-[linear-gradient(135deg,#17B26A,#3DD598)] p-6 text-white shadow-hero text-center">
        <CheckCircle2 size={48} className="mx-auto mb-3 opacity-90"/>
        <h2 className="text-2xl font-bold">Check-in submitted</h2>
        <p className="text-white/80 text-sm mt-2">{month} received by HCL</p>
      </div>
      {flags.length>0 ? (
        <Card>
          <div className="p-4">
            <p className="font-bold text-amber-700 dark:text-amber-400 text-sm flex items-center gap-2 mb-2">
              <AlertTriangle size={14}/>{flags.length} governance alert{flags.length>1?'s':''} raised
            </p>
            <p className="text-xs text-slate-500 dark:text-white/50 mb-2">Barry at HCL has been notified and will follow up.</p>
            {flags.map((f,i)=><p key={i} className="text-xs text-amber-700 dark:text-amber-400">· {f}</p>)}
          </div>
        </Card>
      ) : (
        <Card>
          <div className="p-4 flex items-center gap-3">
            <CheckCircle2 size={20} className="text-emerald-500"/>
            <p className="text-sm text-slate-700 dark:text-white/80">No alerts this month. Your file is current.</p>
          </div>
        </Card>
      )}
    </div>
  )
}
