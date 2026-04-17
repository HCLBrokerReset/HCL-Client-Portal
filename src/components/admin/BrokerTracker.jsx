import { useState } from 'react'
import { useData } from '../../context/DataContext'
import { format, parseISO } from 'date-fns'
import { Plus, CheckCircle2, AlertTriangle, Send } from 'lucide-react'
import StatusBadge from '../common/StatusBadge'
import Card, { MetricTile } from '../common/Card'
import Modal from '../common/Modal'

export default function BrokerTracker({ clientId, client }) {
  const { getBrokerActions, createBrokerAction, updateBrokerAction } = useData()
  const [showNew, setShowNew] = useState(false)
  const [editing, setEditing] = useState(null)

  const actions = getBrokerActions(clientId)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Broker Accountability Log</h3>
          <p className="text-xs text-slate-400 mt-0.5">{client.brokerName} · {client.brokerCompany}</p>
        </div>
        <button onClick={()=>{setEditing(null);setShowNew(true)}}
          className="flex items-center gap-1.5 rounded-full bg-btn-primary px-4 py-2 text-xs font-semibold text-white shadow-btn">
          <Plus size={13}/> Log Action
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MetricTile icon={Send}         label="Total"      value={String(actions.length)}                                   sub="Logged"            gradient="dark"/>
        <MetricTile icon={AlertTriangle} label="Pending"   value={String(actions.filter(a=>a.status==='pending').length)}    sub="Awaiting response" gradient="alert"/>
        <MetricTile icon={CheckCircle2}  label="Resolved"  value={String(actions.filter(a=>a.status==='resolved').length)}   sub="Completed"         gradient="success"/>
      </div>

      {actions.length===0 && <Card><div className="p-8 text-center text-slate-400 text-sm">No broker actions logged yet.</div></Card>}

      <div className="space-y-3">
        {actions.map(action => (
          <ActionCard key={action.id} action={action}
            onEdit={()=>{setEditing(action);setShowNew(true)}}
            onUpdateStatus={(status, notes) => updateBrokerAction(action.id, {
              status, notes,
              respondedAt: status==='resolved' ? new Date().toISOString() : action.respondedAt
            })}
          />
        ))}
      </div>

      <Modal open={showNew} onClose={()=>{setShowNew(false);setEditing(null)}}
        title={editing?'Edit Action':'Log Broker Action'} size="md">
        <ActionForm clientId={clientId} client={client} existing={editing}
          onSave={data => {
            if (editing) updateBrokerAction(editing.id, data)
            else createBrokerAction({ clientId, brokerId: client.brokerId, brokerName: client.brokerName, brokerCompany: client.brokerCompany, ...data })
            setShowNew(false); setEditing(null)
          }}
          onCancel={()=>{setShowNew(false);setEditing(null)}}
        />
      </Modal>
    </div>
  )
}

function ActionCard({ action, onEdit, onUpdateStatus }) {
  const [noteInput, setNoteInput] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [pendingStatus, setPendingStatus] = useState('')

  const trigger = (status) => { setPendingStatus(status); setShowInput(true) }
  const save = () => { onUpdateStatus(pendingStatus, noteInput||action.notes); setShowInput(false); setNoteInput('') }

  return (
    <Card>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <StatusBadge status={action.status}/>
          <button onClick={onEdit} className="text-xs text-[#2447F9] hover:underline flex-shrink-0">Edit</button>
        </div>
        <p className="text-sm text-slate-600 dark:text-white/70 leading-relaxed">{action.description}</p>
        {action.notes && (
          <div className="mt-2 rounded-[16px] bg-slate-50 dark:bg-white/5 px-3 py-2 text-xs text-slate-500 dark:text-white/50">{action.notes}</div>
        )}
        <div className="text-xs text-slate-400 mt-2">
          Sent {format(parseISO(action.sentAt),'d MMM yyyy')}
          {action.respondedAt && ` · Responded ${format(parseISO(action.respondedAt),'d MMM yyyy')}`}
        </div>

        {action.status!=='resolved' && !showInput && (
          <div className="flex gap-2 mt-3">
            <button onClick={()=>trigger('resolved')}
              className="flex-1 flex items-center justify-center gap-1 rounded-[18px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 py-2.5 text-xs font-semibold">
              <CheckCircle2 size={12}/> Resolve
            </button>
            {action.status!=='escalated' && (
              <button onClick={()=>trigger('escalated')}
                className="flex-1 flex items-center justify-center gap-1 rounded-[18px] bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 py-2.5 text-xs font-semibold">
                <AlertTriangle size={12}/> Escalate
              </button>
            )}
          </div>
        )}

        {showInput && (
          <div className="mt-3 space-y-2">
            <textarea value={noteInput} onChange={e=>setNoteInput(e.target.value)}
              placeholder="Add a note (optional)…" rows={2}
              className="w-full rounded-[18px] border-0 bg-slate-100 dark:bg-white/5 px-4 py-3 text-sm outline-none dark:text-white resize-none"/>
            <div className="flex gap-2">
              <button onClick={save} className="btn-primary py-2.5 px-5 text-xs flex-1">Save</button>
              <button onClick={()=>setShowInput(false)} className="text-xs text-slate-400 px-4">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

function ActionForm({ existing, onSave, onCancel }) {
  const [desc, setDesc] = useState(existing?.description||'')
  const [status, setStatus] = useState(existing?.status||'pending')
  const [notes, setNotes] = useState(existing?.notes||'')

  return (
    <form onSubmit={e=>{e.preventDefault();if(desc.trim())onSave({description:desc.trim(),status,notes:notes.trim()})}} className="p-5 space-y-4">
      <div>
        <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">Description *</label>
        <textarea value={desc} onChange={e=>setDesc(e.target.value)} required rows={4}
          placeholder="Describe what was sent to the broker…"
          className="w-full rounded-[20px] border-0 bg-slate-100 dark:bg-white/5 px-4 py-3 text-sm outline-none dark:text-white resize-none"/>
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">Status</label>
        <div className="grid grid-cols-3 gap-2">
          {['pending','resolved','escalated'].map(s => (
            <button key={s} type="button" onClick={()=>setStatus(s)}
              className={`rounded-[18px] py-2.5 text-xs font-semibold capitalize transition-all ${status===s?'bg-btn-primary text-white shadow-btn':'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">Notes</label>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2}
          placeholder="Any additional context…"
          className="w-full rounded-[20px] border-0 bg-slate-100 dark:bg-white/5 px-4 py-3 text-sm outline-none dark:text-white resize-none"/>
      </div>
      <div className="flex gap-3">
        <button type="submit" className="btn-primary flex-1">{existing?'Update':'Log action'}</button>
        <button type="button" onClick={onCancel} className="btn-ghost px-6">Cancel</button>
      </div>
    </form>
  )
}
