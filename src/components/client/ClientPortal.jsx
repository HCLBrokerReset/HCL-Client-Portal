import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { format, parseISO, differenceInDays } from 'date-fns'
import {
  ClipboardCheck, FileText, MessageSquare, AlertTriangle, CheckCircle,
  Clock, ChevronRight, Building2, User,
} from 'lucide-react'
import StatusBadge from '../common/StatusBadge'
import RenewalCountdown from '../common/RenewalCountdown'
import Card, { CardHeader, CardBody } from '../common/Card'
import {
  WAGE_BILL_LABELS, STAFF_CHANGE_LABELS, CONTRACT_LABELS,
  INCIDENT_LABELS, formatTurnover,
} from '../../utils/flagging'

export default function ClientPortal() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { getClient, getCheckIns, getReports, getMessages } = useData()

  const client = getClient(user.clientId)
  if (!client) return <div className="text-center py-16 text-gray-400">Client record not found.</div>

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const checkIns = getCheckIns(user.clientId)
  const sorted = [...checkIns].sort((a, b) => b.month.localeCompare(a.month))
  const currentMonthCheckIn = checkIns.find((c) => c.month === currentMonth)
  const lastThree = sorted.slice(0, 3)

  const reports = getReports(user.clientId).filter((r) => r.status === 'published')
  const latestReport = reports[0]

  const messages = getMessages(user.clientId)
  const unreadCount = messages.filter((m) => !m.read && m.senderRole !== 'client').length

  const daysToRenewal = differenceInDays(parseISO(client.renewalDate), now)
  const renewalUrgent = daysToRenewal <= 60

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-gold font-semibold uppercase tracking-widest mb-1">
            Welcome back
          </p>
          <h1 className="text-2xl font-semibold text-navy dark:text-white tracking-tight">
            {client.businessName}
          </h1>
          <p className="text-gray-500 dark:text-white/40 text-sm mt-1">
            {format(now, 'EEEE, d MMMM yyyy')}
          </p>
        </div>
        <StatusBadge status={client.status} className="self-start sm:self-auto" />
      </div>

      {/* Prompt to complete check-in */}
      {!currentMonthCheckIn && (
        <div
          className="bg-navy dark:bg-white/10 rounded-2xl p-5 cursor-pointer hover:bg-navy-50 transition-colors group"
          onClick={() => navigate('/portal/checkin')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gold rounded-xl flex items-center justify-center flex-shrink-0">
                <ClipboardCheck size={22} className="text-navy" />
              </div>
              <div>
                <p className="text-white font-semibold">
                  {format(now, 'MMMM yyyy')} check-in due
                </p>
                <p className="text-white/50 text-sm mt-0.5">
                  Please complete your monthly governance check-in
                </p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gold group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      )}

      {currentMonthCheckIn && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle size={22} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-emerald-800 dark:text-emerald-300 font-semibold">
              {format(now, 'MMMM yyyy')} check-in complete
            </p>
            <p className="text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">
              Submitted {format(parseISO(currentMonthCheckIn.submittedAt), 'd MMM yyyy')}
            </p>
          </div>
        </div>
      )}

      {/* Key info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card gold className="hover:border-gold/60 transition-colors cursor-pointer" onClick={() => navigate('/portal/checkin')}>
          <CardBody>
            <div className="flex items-center gap-2 text-gray-400 dark:text-white/30 mb-2">
              <Building2 size={14} />
              <span className="text-xs uppercase tracking-wide">Your broker</span>
            </div>
            <p className="text-navy dark:text-white font-semibold text-sm">{client.brokerName}</p>
            <p className="text-gray-400 dark:text-white/40 text-xs mt-0.5">{client.brokerCompany}</p>
          </CardBody>
        </Card>

        <Card className="cursor-pointer hover:border-gold/40 transition-colors" onClick={() => navigate('/portal/reports')}>
          <CardBody>
            <div className="flex items-center gap-2 text-gray-400 dark:text-white/30 mb-2">
              <Clock size={14} />
              <span className="text-xs uppercase tracking-wide">Policy renewal</span>
            </div>
            <RenewalCountdown renewalDate={client.renewalDate} />
          </CardBody>
        </Card>

        <Card className={`cursor-pointer hover:border-gold/40 transition-colors ${unreadCount > 0 ? 'border-navy/20 dark:border-gold/30' : ''}`}
          onClick={() => navigate('/portal/messages')}>
          <CardBody>
            <div className="flex items-center gap-2 text-gray-400 dark:text-white/30 mb-2">
              <MessageSquare size={14} />
              <span className="text-xs uppercase tracking-wide">Messages</span>
            </div>
            <p className="text-navy dark:text-white font-semibold text-sm">
              {unreadCount > 0 ? (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-gold rounded-full" />
                  {unreadCount} unread
                </span>
              ) : (
                'No new messages'
              )}
            </p>
            <p className="text-gray-400 dark:text-white/40 text-xs mt-0.5">From Barry at HCL</p>
          </CardBody>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Last 3 check-ins */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-navy dark:text-white">Recent check-ins</h2>
              <button
                onClick={() => navigate('/portal/checkin')}
                className="text-xs text-gold hover:underline flex items-center gap-1"
              >
                New check-in <ChevronRight size={12} />
              </button>
            </div>
          </CardHeader>
          <CardBody className="!p-0">
            {lastThree.length === 0 ? (
              <p className="text-sm text-gray-400 px-6 py-8 text-center">
                No check-ins yet. Complete your first one above.
              </p>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-white/5">
                {lastThree.map((ci) => (
                  <div key={ci.id} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-navy dark:text-white">{ci.month}</span>
                      {ci.flags?.length > 0 ? (
                        <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                          <AlertTriangle size={11} />
                          {ci.flags.length} flag{ci.flags.length > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle size={11} />
                          Clear
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <MiniStat label="Turnover" value={formatTurnover(ci.data.estimatedTurnover)} />
                      <MiniStat label="Wage bill" value={WAGE_BILL_LABELS[ci.data.wageBillChange]} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Latest report */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-navy dark:text-white flex items-center gap-2">
                <FileText size={14} className="text-gray-400" />
                Latest governance report
              </h2>
              {reports.length > 1 && (
                <button
                  onClick={() => navigate('/portal/reports')}
                  className="text-xs text-gold hover:underline flex items-center gap-1"
                >
                  All reports <ChevronRight size={12} />
                </button>
              )}
            </div>
          </CardHeader>
          <CardBody>
            {!latestReport ? (
              <div className="py-4 text-center">
                <p className="text-sm text-gray-400">No reports published yet.</p>
                <p className="text-xs text-gray-300 dark:text-white/20 mt-1">
                  Barry at HCL will publish your first quarterly report here.
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <StatusBadge status={latestReport.status} />
                  <span className="text-xs text-gray-400 dark:text-white/40">{latestReport.period}</span>
                </div>
                <h3 className="text-sm font-semibold text-navy dark:text-white mb-2">
                  {latestReport.title}
                </h3>
                {latestReport.content?.executiveSummary && (
                  <p className="text-sm text-gray-500 dark:text-white/50 leading-relaxed line-clamp-3">
                    {latestReport.content.executiveSummary}
                  </p>
                )}
                <button
                  onClick={() => navigate('/portal/reports')}
                  className="mt-3 text-xs text-gold hover:underline flex items-center gap-1"
                >
                  View full report <ChevronRight size={12} />
                </button>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Renewal reminder */}
      {renewalUrgent && (
        <div className={`rounded-2xl border p-5 flex items-start gap-4 ${
          daysToRenewal <= 30
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
        }`}>
          <AlertTriangle size={18} className={daysToRenewal <= 30 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'} />
          <div>
            <p className={`font-semibold text-sm ${daysToRenewal <= 30 ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
              Your policy renewal is in {daysToRenewal} days
            </p>
            <p className={`text-xs mt-0.5 ${daysToRenewal <= 30 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
              Please ensure your broker ({client.brokerName} at {client.brokerCompany}) has all up-to-date information
              about your business before the renewal date of {format(parseISO(client.renewalDate), 'd MMMM yyyy')}.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function MiniStat({ label, value }) {
  return (
    <div>
      <span className="text-xs text-gray-400 dark:text-white/30">{label}: </span>
      <span className="text-xs text-navy dark:text-white font-medium">{value}</span>
    </div>
  )
}
