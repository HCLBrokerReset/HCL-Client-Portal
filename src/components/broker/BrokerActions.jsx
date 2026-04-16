import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { format, parseISO } from 'date-fns'
import { CheckCircle, AlertTriangle } from 'lucide-react'
import StatusBadge from '../common/StatusBadge'
import Card, { CardHeader, CardBody } from '../common/Card'

export default function BrokerActions() {
  const { user } = useAuth()
  const { getClients, getBrokerActions } = useData()

  const myClients = getClients().filter((c) => c.brokerId === user.brokerId)
  const allActions = myClients.flatMap((c) =>
    getBrokerActions(c.id).map((a) => ({ ...a, clientName: c.businessName }))
  ).sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))

  const open = allActions.filter((a) => a.status !== 'resolved')
  const resolved = allActions.filter((a) => a.status === 'resolved')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy dark:text-white tracking-tight">
          Open Actions
        </h1>
        <p className="text-gray-500 dark:text-white/40 text-sm mt-1">
          Actions and communications from Herron Consultants Limited
        </p>
      </div>

      {open.length === 0 && (
        <Card>
          <CardBody>
            <div className="text-center py-8">
              <CheckCircle size={32} className="text-emerald-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-navy dark:text-white">No open actions</p>
              <p className="text-xs text-gray-400 dark:text-white/40 mt-1">
                All communications from HCL are resolved or awaiting response.
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {open.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-navy dark:text-white">
            Requiring attention ({open.length})
          </h2>
          {open.map((a) => <ActionRow key={a.id} action={a} />)}
        </div>
      )}

      {resolved.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-navy dark:text-white opacity-60">
            Resolved ({resolved.length})
          </h2>
          {resolved.map((a) => <ActionRow key={a.id} action={a} resolved />)}
        </div>
      )}
    </div>
  )
}

function ActionRow({ action, resolved }) {
  return (
    <Card className={resolved ? 'opacity-60' : ''}>
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-navy dark:text-white">
                {action.clientName}
              </span>
              <StatusBadge status={action.status} />
            </div>
            <p className="text-sm text-gray-600 dark:text-white/70 leading-relaxed">
              {action.description}
            </p>
          </div>
          {action.status === 'escalated' && (
            <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          )}
        </div>

        {action.notes && (
          <div className="bg-gray-50 dark:bg-white/5 rounded-lg px-3 py-2 mb-2">
            <p className="text-xs text-gray-500 dark:text-white/50">{action.notes}</p>
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-white/30">
          <span>Sent {format(parseISO(action.sentAt), 'd MMM yyyy')}</span>
          {action.respondedAt && (
            <span>Responded {format(parseISO(action.respondedAt), 'd MMM yyyy')}</span>
          )}
        </div>
      </div>
    </Card>
  )
}
