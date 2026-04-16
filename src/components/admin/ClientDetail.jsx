import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import { format, parseISO } from 'date-fns'
import {
  ArrowLeft, AlertTriangle, Building2, User, Phone, Mail,
  Calendar, FileText, MessageSquare, Link2, ChevronRight,
} from 'lucide-react'
import StatusBadge from '../common/StatusBadge'
import RenewalCountdown from '../common/RenewalCountdown'
import Card, { CardHeader, CardBody } from '../common/Card'
import Modal from '../common/Modal'
import BrokerTracker from './BrokerTracker'
import ReportWriter from './ReportWriter'
import AdminMessages from './AdminMessages'
import {
  WAGE_BILL_LABELS,
  STAFF_CHANGE_LABELS,
  CONTRACT_LABELS,
  INCIDENT_LABELS,
  formatTurnover,
} from '../../utils/flagging'

const TABS = ['Overview', 'Check-ins', 'Reports', 'Broker Log', 'Messages']

export default function ClientDetail() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  const { getClient, getCheckIns, getReports, updateClient } = useData()

  const [activeTab, setActiveTab] = useState('Overview')
  const [showReportWriter, setShowReportWriter] = useState(false)
  const [editingReport, setEditingReport] = useState(null)

  const client = getClient(clientId)
  if (!client) {
    return (
      <div className="text-center py-16 text-gray-400">
        Client not found.{' '}
        <button onClick={() => navigate('/admin/clients')} className="text-gold hover:underline">
          Back to clients
        </button>
      </div>
    )
  }

  const checkIns = getCheckIns(clientId)
  const reports = getReports(clientId)

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div>
        <button
          onClick={() => navigate('/admin/clients')}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-navy dark:hover:text-white transition-colors mb-4"
        >
          <ArrowLeft size={14} />
          All clients
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-semibold text-navy dark:text-white tracking-tight">
                {client.businessName}
              </h1>
              <StatusBadge status={client.status} />
            </div>
            <p className="text-gray-500 dark:text-white/40 text-sm mt-1">
              {client.sector} · {client.contactName}
            </p>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => { setEditingReport(null); setShowReportWriter(true) }}
              className="flex items-center gap-2 px-4 py-2 bg-gold text-navy font-medium text-sm rounded-lg hover:bg-gold-300 transition-colors"
            >
              <FileText size={14} />
              New Report
            </button>
          </div>
        </div>
      </div>

      {/* Quick info bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <InfoChip icon={<Building2 size={13} />} label="Sector" value={client.sector} />
        <InfoChip
          icon={<Link2 size={13} />}
          label="Broker"
          value={`${client.brokerName} (${client.brokerCompany})`}
        />
        <InfoChip
          icon={<Calendar size={13} />}
          label="Renewal"
          value={format(parseISO(client.renewalDate), 'd MMM yyyy')}
          extra={<RenewalCountdown renewalDate={client.renewalDate} />}
        />
        <InfoChip
          icon={<Mail size={13} />}
          label="Email"
          value={client.contactEmail}
        />
      </div>

      {/* Notes */}
      {client.notes && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 flex gap-3">
          <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700 dark:text-amber-300">{client.notes}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-white/10">
        <nav className="flex gap-0 -mb-px overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-gold text-navy dark:text-white'
                  : 'border-transparent text-gray-400 hover:text-navy dark:hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'Overview' && (
        <OverviewTab client={client} checkIns={checkIns} reports={reports} />
      )}
      {activeTab === 'Check-ins' && (
        <CheckInsTab checkIns={checkIns} />
      )}
      {activeTab === 'Reports' && (
        <ReportsTab
          reports={reports}
          client={client}
          onNew={() => { setEditingReport(null); setShowReportWriter(true) }}
          onEdit={(r) => { setEditingReport(r); setShowReportWriter(true) }}
        />
      )}
      {activeTab === 'Broker Log' && (
        <BrokerTracker clientId={clientId} client={client} />
      )}
      {activeTab === 'Messages' && (
        <AdminMessages clientId={clientId} client={client} />
      )}

      {/* Report writer modal */}
      <Modal
        open={showReportWriter}
        onClose={() => { setShowReportWriter(false); setEditingReport(null) }}
        title={editingReport ? 'Edit Governance Report' : 'New Governance Report'}
        size="xl"
      >
        <ReportWriter
          client={client}
          checkIns={checkIns}
          existingReport={editingReport}
          onClose={() => { setShowReportWriter(false); setEditingReport(null) }}
        />
      </Modal>
    </div>
  )
}

// ---- Sub-components ----

function InfoChip({ icon, label, value, extra }) {
  return (
    <div className="bg-white dark:bg-navy-50 rounded-xl border border-gray-100 dark:border-white/10 px-4 py-3">
      <div className="flex items-center gap-1.5 text-gray-400 dark:text-white/30 mb-1">
        {icon}
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-sm font-medium text-navy dark:text-white truncate">{value}</p>
      {extra && <div className="mt-1">{extra}</div>}
    </div>
  )
}

function OverviewTab({ client, checkIns, reports }) {
  const lastThree = [...checkIns].reverse().slice(0, 3)
  const latestReport = reports[0]

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Recent check-ins summary */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-navy dark:text-white text-sm">Recent Check-ins</h3>
        </CardHeader>
        <CardBody className="!p-0">
          {lastThree.length === 0 ? (
            <p className="text-sm text-gray-400 px-6 py-8 text-center">No check-ins yet</p>
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
                      <span className="text-xs text-emerald-600 dark:text-emerald-400">Clear</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <MiniStat label="Turnover" value={formatTurnover(ci.data.estimatedTurnover)} />
                    <MiniStat label="Wage bill" value={WAGE_BILL_LABELS[ci.data.wageBillChange]} />
                    <MiniStat label="Contracts" value={CONTRACT_LABELS[ci.data.newContracts]} />
                    <MiniStat label="Incidents" value={INCIDENT_LABELS[ci.data.incidents]} />
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
          <h3 className="font-semibold text-navy dark:text-white text-sm">Latest Report</h3>
        </CardHeader>
        <CardBody>
          {!latestReport ? (
            <p className="text-sm text-gray-400 py-4 text-center">No reports generated yet</p>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <StatusBadge status={latestReport.status} />
                <span className="text-xs text-gray-400 dark:text-white/40">{latestReport.period}</span>
              </div>
              <h4 className="text-sm font-semibold text-navy dark:text-white mb-2">{latestReport.title}</h4>
              {latestReport.content?.executiveSummary && (
                <p className="text-sm text-gray-500 dark:text-white/50 leading-relaxed line-clamp-4">
                  {latestReport.content.executiveSummary}
                </p>
              )}
              <div className="mt-3 pt-3 border-t border-gray-50 dark:border-white/5">
                <p className="text-xs text-gray-400 dark:text-white/30">
                  Created {format(parseISO(latestReport.createdAt), 'd MMM yyyy')}
                  {latestReport.publishedAt && ` · Published ${format(parseISO(latestReport.publishedAt), 'd MMM yyyy')}`}
                </p>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
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

function CheckInsTab({ checkIns }) {
  const sorted = [...checkIns].sort((a, b) => b.month.localeCompare(a.month))

  if (sorted.length === 0) {
    return (
      <Card>
        <div className="px-6 py-12 text-center text-gray-400 text-sm">
          No check-ins have been submitted yet.
        </div>
      </Card>
    )
  }

  // Show side by side for last 3 months
  const latest = sorted.slice(0, 3)

  return (
    <div className="space-y-6">
      {/* Side-by-side comparison */}
      {latest.length > 1 && (
        <div>
          <h3 className="text-sm font-semibold text-navy dark:text-white mb-3">
            Month-by-month comparison
          </h3>
          <div className="overflow-x-auto">
            <div className="min-w-max grid gap-4" style={{ gridTemplateColumns: `repeat(${latest.length}, minmax(280px, 1fr))` }}>
              {latest.map((ci, idx) => (
                <CheckInCard key={ci.id} checkIn={ci} prev={latest[idx + 1]} highlight={idx === 0} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Full history */}
      <div>
        <h3 className="text-sm font-semibold text-navy dark:text-white mb-3">Full history</h3>
        <div className="space-y-3">
          {sorted.map((ci) => (
            <CheckInRow key={ci.id} checkIn={ci} />
          ))}
        </div>
      </div>
    </div>
  )
}

function CheckInCard({ checkIn: ci, prev, highlight }) {
  const turnoverChange = prev && prev.data.estimatedTurnover > 0
    ? ((ci.data.estimatedTurnover - prev.data.estimatedTurnover) / prev.data.estimatedTurnover * 100).toFixed(1)
    : null

  return (
    <Card className={highlight ? 'border-gold/40' : ''}>
      <CardHeader className={highlight ? '!bg-gold/5' : ''}>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-navy dark:text-white text-sm">{ci.month}</span>
          {highlight && <span className="text-xs text-gold font-medium">Latest</span>}
          {ci.flags?.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle size={11} />
              {ci.flags.length}
            </span>
          )}
        </div>
      </CardHeader>
      <CardBody className="space-y-2.5 !py-4">
        <Field label="Turnover">
          <span className="font-semibold">{formatTurnover(ci.data.estimatedTurnover)}</span>
          {turnoverChange !== null && (
            <span className={`ml-1 text-xs font-medium ${Math.abs(Number(turnoverChange)) > 15 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>
              ({turnoverChange > 0 ? '+' : ''}{turnoverChange}%)
            </span>
          )}
        </Field>
        <Field label="Wage bill">{WAGE_BILL_LABELS[ci.data.wageBillChange]}</Field>
        <Field label="Staff">{STAFF_CHANGE_LABELS[ci.data.staffChange]}</Field>
        <Field label="Contracts">{CONTRACT_LABELS[ci.data.newContracts]}</Field>
        <Field label="New work types">{ci.data.newTypesOfWork ? 'Yes' : 'No'}</Field>
        <Field label="New assets">{ci.data.newAssets ? `Yes — ${ci.data.newAssetsDetails}` : 'No'}</Field>
        <Field label="Incidents">{INCIDENT_LABELS[ci.data.incidents]}</Field>
        {ci.data.futureChanges && (
          <Field label="Future changes">
            <span className="text-gray-500 dark:text-white/50">{ci.data.futureChanges}</span>
          </Field>
        )}
        {ci.data.otherFlags && (
          <Field label="Other flags">
            <span className="text-gray-500 dark:text-white/50">{ci.data.otherFlags}</span>
          </Field>
        )}

        {ci.flags?.length > 0 && (
          <div className="pt-2 border-t border-gray-50 dark:border-white/5 mt-2">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">Flags raised:</p>
            {ci.flags.map((f, i) => (
              <p key={i} className="text-xs text-amber-600 dark:text-amber-400/80 leading-snug">· {f}</p>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <span className="text-xs text-gray-400 dark:text-white/30 block">{label}</span>
      <div className="text-xs text-navy dark:text-white font-medium mt-0.5">{children}</div>
    </div>
  )
}

function CheckInRow({ checkIn: ci }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card>
      <div
        className="px-5 py-4 cursor-pointer flex items-center gap-4"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-navy dark:text-white">{ci.month}</span>
            {ci.flags?.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <AlertTriangle size={11} />
                {ci.flags.length} flag{ci.flags.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">
            Submitted {format(parseISO(ci.submittedAt), 'd MMM yyyy')} ·{' '}
            Turnover: {formatTurnover(ci.data.estimatedTurnover)}
          </p>
        </div>
        <ChevronRight
          size={16}
          className={`text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
      </div>

      {expanded && (
        <div className="px-5 pb-4 border-t border-gray-50 dark:border-white/5 pt-4 grid sm:grid-cols-2 gap-2">
          <Field label="Wage bill">{WAGE_BILL_LABELS[ci.data.wageBillChange]}</Field>
          <Field label="Staff changes">{STAFF_CHANGE_LABELS[ci.data.staffChange]}</Field>
          <Field label="New contracts">{CONTRACT_LABELS[ci.data.newContracts]}</Field>
          <Field label="New work types">{ci.data.newTypesOfWork ? 'Yes' : 'No'}</Field>
          <Field label="New assets">{ci.data.newAssets ? `Yes — ${ci.data.newAssetsDetails}` : 'No'}</Field>
          <Field label="Incidents">{INCIDENT_LABELS[ci.data.incidents]}</Field>
          {ci.data.futureChanges && (
            <div className="sm:col-span-2">
              <Field label="Expected changes (90 days)">{ci.data.futureChanges}</Field>
            </div>
          )}
          {ci.data.otherFlags && (
            <div className="sm:col-span-2">
              <Field label="Other flags">{ci.data.otherFlags}</Field>
            </div>
          )}
          {ci.flags?.length > 0 && (
            <div className="sm:col-span-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 mt-1">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Governance flags raised:</p>
              {ci.flags.map((f, i) => (
                <p key={i} className="text-xs text-amber-700 dark:text-amber-300">· {f}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

function ReportsTab({ reports, client, onNew, onEdit }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-navy dark:text-white">
          Governance Reports ({reports.length})
        </h3>
        <button
          onClick={onNew}
          className="flex items-center gap-2 px-4 py-2 bg-gold text-navy font-medium text-sm rounded-lg hover:bg-gold-300 transition-colors"
        >
          <FileText size={13} />
          New Report
        </button>
      </div>

      {reports.length === 0 && (
        <Card>
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            No reports have been generated for this client yet.
          </div>
        </Card>
      )}

      {reports.map((r) => (
        <Card key={r.id} className="hover:border-gold/40 transition-colors">
          <div className="px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status={r.status} />
                  <span className="text-xs text-gray-400 dark:text-white/40">{r.period}</span>
                </div>
                <h4 className="font-semibold text-navy dark:text-white text-sm">{r.title}</h4>
                {r.content?.executiveSummary && (
                  <p className="text-xs text-gray-500 dark:text-white/40 mt-1 line-clamp-2">
                    {r.content.executiveSummary}
                  </p>
                )}
                <p className="text-xs text-gray-400 dark:text-white/30 mt-2">
                  Created {format(parseISO(r.createdAt), 'd MMM yyyy')}
                  {r.publishedAt && ` · Published ${format(parseISO(r.publishedAt), 'd MMM yyyy')}`}
                </p>
              </div>
              <button
                onClick={() => onEdit(r)}
                className="flex-shrink-0 text-xs text-gold hover:underline"
              >
                Edit / Export
              </button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
