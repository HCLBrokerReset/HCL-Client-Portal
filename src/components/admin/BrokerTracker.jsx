import { useState } from 'react'
import { useData } from '../../context/DataContext'
import { format, parseISO } from 'date-fns'
import { Plus, CheckCircle, AlertTriangle, Clock, Send } from 'lucide-react'
import StatusBadge from '../common/StatusBadge'
import Card, { CardHeader, CardBody } from '../common/Card'
import Modal from '../common/Modal'

export default function BrokerTracker({ clientId, client }) {
  const { getBrokerActions, createBrokerAction, updateBrokerAction } = useData()
  const [showNew, setShowNew] = useState(false)
  const [editingAction, setEditingAction] = useState(null)

  const actions = getBrokerActions(clientId)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-navy dark:text-white">
            Broker Accountability Log
          </h3>
          <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">
            Broker: {client.brokerName} — {client.brokerCompany}
          </p>
        </div>
        <button
          onClick={() => { setEditingAction(null); setShowNew(true) }}
          className="flex items-center gap-2 px-3 py-2 bg-navy dark:bg-white/10 text-white font-medium text-sm rounded-lg hover:bg-navy-50 transition-colors"
        >
          <Plus size={14} />
          Log Action
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <MiniStat
          label="Total logged"
          value={actions.length}
          icon={<Send size={14} className="text-gray-400" />}
        />
        <MiniStat
          label="Pending"
          value={actions.filter((a) => a.status === 'pending').length}
          icon={<Clock size={14} className="text-amber-500" />}
          colour="amber"
        />
        <MiniStat
          label="Escalated"
          value={actions.filter((a) => a.status === 'escalated').length}
          icon={<AlertTriangle size={14} className="text-red-500" />}
          colour="red"
        />
      </div>

      {actions.length === 0 && (
        <Card>
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            No broker actions have been logged yet.
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {actions.map((action) => (
          <ActionCard
            key={action.id}
            action={action}
            onEdit={() => { setEditingAction(action); setShowNew(true) }}
            onUpdateStatus={(status, notes) =>
              updateBrokerAction(action.id, {
                status,
                respondedAt: status === 'resolved' ? new Date().toISOString() : action.respondedAt,
                notes,
              })
            }
          />
        ))}
      </div>

      <Modal
        open={showNew}
        onClose={() => { setShowNew(false); setEditingAction(null) }}
        title={editingAction ? 'Edit Broker Action' : 'Log Broker Action'}
        size="md"
      >
        <ActionForm
          clientId={clientId}
          client={client}
          existing={editingAction}
          onSave={(data) => {
            if (editingAction) {
              updateBrokerAction(editingAction.id, data)
            } else {
              createBrokerAction({ clientId, brokerId: client.brokerId, brokerName: client.brokerName, brokerCompany: client.brokerCompany, ...data })
            }
            setShowNew(false)
            setEditingAction(null)
          }}
          onCancel={() => { setShowNew(false); setEditingAction(null) }}
        />
      </Modal>
    </div>
  )
}

function MiniStat({ label, value, icon, colour }) {
  const colours = { amber: 'text-amber-600 dark:text-amber-400', red: 'text-red-600 dark:text-red-400' }
  return (
    <Card className="!rounded-xl">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400 dark:text-white/40">{label}</span>
          {icon}
        </div>
        <p className={`text-xl font-bold ${colour ? colours[colour] : 'text-navy dark:text-white'}`}>
          {value}
        </p>
      </div>
    </Card>
  )
}

function ActionCard({ action, onEdit, onUpdateStatus }) {
  const [noteInput, setNoteInput] = useState('')
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [newStatus, setNewStatus] = useState('')

  const handleStatusChange = (status) => {
    setNewStatus(status)
    setShowNoteInput(true)
  }

  const handleSave = () => {
    onUpdateStatus(newStatus, noteInput || action.notes)
    setShowNoteInput(false)
    setNoteInput('')
  }

  return (
    <Card>
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge status={action.status} />
              <span className="text-xs text-gray-400 dark:text-white/40">
                Sent {format(parseISO(action.sentAt), 'd MMM yyyy')}
                {action.respondedAt &&
                  ` · Responded ${format(parseISO(action.respondedAt), 'd MMM yyyy')}`}
              </span>
            </div>
            <p className="text-sm text-navy dark:text-white leading-relaxed">
              {action.description}
            </p>
          </div>
          <button
            onClick={onEdit}
            className="text-xs text-gold hover:underline flex-shrink-0"
          >
            Edit
          </button>
        </div>

        {action.notes && (
          <div className="bg-gray-50 dark:bg-white/5 rounded-lg px-3 py-2 mb-3">
            <p className="text-xs text-gray-500 dark:text-white/50">{action.notes}</p>
          </div>
        )}

        {/* Status actions */}
        {action.status !== 'resolved' && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleStatusChange('resolved')}
              className="flex items-center gap-1 text-xs px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <CheckCircle size={12} />
              Mark resolved
            </button>
            {action.status !== 'escalated' && (
              <button
                onClick={() => handleStatusChange('escalated')}
                className="flex items-center gap-1 text-xs px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-100 transition-colors"
              >
                <AlertTriangle size={12} />
                Escalate
              </button>
            )}
          </div>
        )}

        {showNoteInput && (
          <div className="mt-3 space-y-2">
            <textarea
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Add a note (optional)…"
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-navy-50 text-navy dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="text-xs px-4 py-1.5 bg-navy dark:bg-gold dark:text-navy text-white rounded-lg hover:bg-navy-50 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setShowNoteInput(false)}
                className="text-xs px-4 py-1.5 text-gray-400 hover:text-navy dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

function ActionForm({ clientId, client, existing, onSave, onCancel }) {
  const [description, setDescription] = useState(existing?.description || '')
  const [status, setStatus] = useState(existing?.status || 'pending')
  const [notes, setNotes] = useState(existing?.notes || '')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!description.trim()) return
    onSave({ description: description.trim(), status, notes: notes.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-navy dark:text-white mb-1.5">
          Description *
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={4}
          placeholder="Describe what was sent to the broker and what action is required…"
          className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-navy-50 text-navy dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-navy dark:text-white mb-1.5">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-navy-50 text-navy dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
        >
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="escalated">Escalated</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-navy dark:text-white mb-1.5">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Any additional notes or context…"
          className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-navy-50 text-navy dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 resize-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="flex-1 bg-navy dark:bg-gold dark:text-navy text-white font-medium py-2.5 rounded-lg hover:bg-navy-50 transition-colors text-sm"
        >
          {existing ? 'Update action' : 'Log action'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 text-gray-400 hover:text-navy dark:hover:text-white transition-colors text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
