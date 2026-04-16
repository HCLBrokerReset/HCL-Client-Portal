// ============================================================
// HCL Client Portal — PDF Export Utility
// ============================================================
// Generates a PDF-quality governance report using jsPDF.
// Branded with HCL dark navy header and gold accent line.
// ============================================================

import { format, parseISO } from 'date-fns'
import {
  WAGE_BILL_LABELS,
  STAFF_CHANGE_LABELS,
  CONTRACT_LABELS,
  INCIDENT_LABELS,
  formatTurnover,
} from './flagging'

const NAVY = [13, 27, 42]        // #0D1B2A
const GOLD = [201, 168, 76]      // #C9A84C
const WHITE = [255, 255, 255]
const LIGHT_GREY = [245, 245, 243]
const DARK_GREY = [80, 80, 80]
const MID_GREY = [140, 140, 140]

/**
 * Generate and download the governance report PDF.
 */
export async function exportReportToPDF({ report, client, checkIns, brokerActions }) {
  const { jsPDF } = await import('jspdf')
  await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = 210
  const margin = 20
  const contentW = pageW - margin * 2

  let y = 0

  // ---- HEADER ----
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, pageW, 45, 'F')

  // Gold accent line
  doc.setFillColor(...GOLD)
  doc.rect(0, 45, pageW, 1.5, 'F')

  // HCL logo area
  doc.setFillColor(...GOLD)
  doc.roundedRect(margin, 12, 20, 20, 3, 3, 'F')
  doc.setTextColor(...NAVY)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('HCL', margin + 10, 24.5, { align: 'center' })

  // Company name
  doc.setTextColor(...WHITE)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Herron Consultants Limited', margin + 26, 21)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GOLD)
  doc.text('CLIENT GOVERNANCE REPORT', margin + 26, 29)

  // Date top right
  doc.setTextColor(200, 200, 200)
  doc.setFontSize(8)
  doc.text(format(new Date(), 'd MMMM yyyy'), pageW - margin, 20, { align: 'right' })

  y = 58

  // ---- REPORT TITLE ----
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...NAVY)
  doc.text(report.title, margin, y)
  y += 8

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...MID_GREY)
  doc.text(report.period, margin, y)
  y += 14

  // ---- CLIENT INFO BOX ----
  doc.setFillColor(...LIGHT_GREY)
  doc.roundedRect(margin, y, contentW, 36, 3, 3, 'F')
  doc.setFillColor(...GOLD)
  doc.roundedRect(margin, y, 3, 36, 1.5, 1.5, 'F')

  const col1 = margin + 8
  const col2 = margin + contentW / 2

  const infoRow = (label, value, x, yPos) => {
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...MID_GREY)
    doc.text(label.toUpperCase(), x, yPos)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...NAVY)
    doc.text(value || '—', x, yPos + 5)
  }

  infoRow('Client', client.businessName, col1, y + 8)
  infoRow('Sector', client.sector, col1, y + 20)
  infoRow('Broker', `${client.brokerName} — ${client.brokerCompany}`, col2, y + 8)
  infoRow('Renewal Date', format(parseISO(client.renewalDate), 'd MMMM yyyy'), col2, y + 20)

  y += 44

  // ---- SECTION: Executive Summary ----
  if (report.content?.executiveSummary) {
    sectionHeader(doc, 'Executive Summary', margin, y)
    y += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...DARK_GREY)
    const lines = doc.splitTextToSize(report.content.executiveSummary, contentW)
    doc.text(lines, margin, y)
    y += lines.length * 5 + 8
  }

  // ---- SECTION: Month-by-month check-in summary ----
  const relevantCheckIns = getRelevantCheckIns(checkIns, report.period)

  if (relevantCheckIns.length > 0) {
    y = checkNewPage(doc, y, 60)
    sectionHeader(doc, 'Monthly Check-In Summary', margin, y)
    y += 8

    const tableBody = relevantCheckIns.map((ci) => [
      ci.month,
      formatTurnover(ci.data.estimatedTurnover),
      WAGE_BILL_LABELS[ci.data.wageBillChange] || '—',
      CONTRACT_LABELS[ci.data.newContracts] || '—',
      ci.flags?.length > 0 ? `${ci.flags.length} flag${ci.flags.length > 1 ? 's' : ''}` : 'Clear',
    ])

    doc.autoTable({
      startY: y,
      head: [['Month', 'Turnover', 'Wage bill', 'Contracts', 'Status']],
      body: tableBody,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 3, textColor: DARK_GREY },
      headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: LIGHT_GREY },
      columnStyles: {
        0: { cellWidth: 25 },
        4: { fontStyle: 'bold' },
      },
    })

    y = doc.lastAutoTable.finalY + 10
  }

  // ---- SECTION: Material Changes ----
  const allFlags = relevantCheckIns.flatMap((ci) =>
    (ci.flags || []).map((f) => ({ month: ci.month, flag: f }))
  )

  if (allFlags.length > 0) {
    y = checkNewPage(doc, y, 50)
    sectionHeader(doc, 'Material Changes Identified', margin, y)
    y += 8

    allFlags.forEach(({ month, flag }) => {
      if (y > 270) {
        doc.addPage()
        addFooter(doc, pageW, margin)
        y = 20
      }
      doc.setFillColor(255, 251, 235)
      doc.roundedRect(margin, y - 4, contentW, 10, 2, 2, 'F')
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...GOLD)
      doc.text(month, margin + 3, y + 1)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...DARK_GREY)
      doc.text(flag, margin + 20, y + 1)
      y += 13
    })
    y += 4
  }

  // ---- SECTION: Broker Accountability Log ----
  if (brokerActions && brokerActions.length > 0) {
    y = checkNewPage(doc, y, 60)
    sectionHeader(doc, 'Broker Accountability Log', margin, y)
    y += 8

    const bTableBody = brokerActions.map((a) => [
      format(parseISO(a.sentAt), 'd MMM yyyy'),
      a.description.substring(0, 80) + (a.description.length > 80 ? '…' : ''),
      a.respondedAt ? format(parseISO(a.respondedAt), 'd MMM yyyy') : 'Awaiting',
      a.status.charAt(0).toUpperCase() + a.status.slice(1),
    ])

    doc.autoTable({
      startY: y,
      head: [['Sent', 'Description', 'Response', 'Status']],
      body: bTableBody,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 3, textColor: DARK_GREY },
      headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: LIGHT_GREY },
      columnStyles: {
        0: { cellWidth: 28 },
        2: { cellWidth: 28 },
        3: { cellWidth: 22 },
      },
    })

    y = doc.lastAutoTable.finalY + 10
  }

  // ---- SECTION: Renewal Readiness ----
  if (report.content?.renewalReadiness) {
    y = checkNewPage(doc, y, 50)
    sectionHeader(doc, 'Renewal Readiness', margin, y)
    y += 8

    const readinessLabel = {
      'action-required': 'Action Required — Material changes must be disclosed before renewal',
      'flag-raised': 'Review Recommended — Some changes noted, broker review advised',
      'file-current': 'File Current — No material changes identified',
    }[report.content.renewalReadiness] || report.content.renewalReadiness

    const readinessColour = {
      'action-required': [220, 38, 38],
      'flag-raised': [217, 119, 6],
      'file-current': [5, 150, 105],
    }[report.content.renewalReadiness] || DARK_GREY

    doc.setFillColor(...readinessColour, 0.1)
    doc.roundedRect(margin, y - 3, contentW, 14, 3, 3, 'F')
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...readinessColour)
    doc.text(readinessLabel, margin + 5, y + 5)
    y += 18

    if (report.content.renewalNotes) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...DARK_GREY)
      const lines = doc.splitTextToSize(report.content.renewalNotes, contentW)
      doc.text(lines, margin, y)
      y += lines.length * 5 + 6
    }
  }

  // ---- SECTION: Broker Notes ----
  if (report.content?.brokerAccountabilityNotes) {
    y = checkNewPage(doc, y, 40)
    sectionHeader(doc, 'Broker Communication Notes', margin, y)
    y += 8

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...DARK_GREY)
    const lines = doc.splitTextToSize(report.content.brokerAccountabilityNotes, contentW)
    doc.text(lines, margin, y)
    y += lines.length * 5 + 8
  }

  // ---- DISCLAIMER (last page) ----
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addFooter(doc, pageW, margin)
  }

  // Download
  const filename = `HCL-Governance-Report-${client.businessName.replace(/\s+/g, '-')}-${report.period.replace(/\s+/g, '-')}.pdf`
  doc.save(filename)
}

// ---- Helpers ----

function sectionHeader(doc, title, x, y) {
  doc.setFillColor(...NAVY)
  doc.rect(x, y, 3, 7, 'F')
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...NAVY)
  doc.text(title, x + 6, y + 5)
  doc.setDrawColor(220, 220, 220)
  doc.line(x + doc.getStringUnitWidth(title) * 11 * 0.35 + 12, y + 4, 190, y + 4)
}

function addFooter(doc, pageW, margin) {
  const pageH = 297
  const footerY = pageH - 18

  doc.setFillColor(245, 245, 243)
  doc.rect(0, footerY - 4, pageW, 22, 'F')
  doc.setFillColor(...GOLD)
  doc.rect(0, footerY - 4, pageW, 0.8, 'F')

  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(140, 140, 140)

  const disclaimer =
    'HCL provides non-advised governance services only. All insurance decisions remain with the client and their FCA-regulated broker. This report does not constitute insurance advice.'
  const lines = doc.splitTextToSize(disclaimer, pageW - margin * 2)
  doc.text(lines, margin, footerY + 1)

  doc.text(
    `Herron Consultants Limited · Generated ${format(new Date(), 'd MMMM yyyy')}`,
    pageW - margin,
    footerY + 10,
    { align: 'right' }
  )
}

function checkNewPage(doc, y, requiredSpace) {
  if (y + requiredSpace > 270) {
    doc.addPage()
    return 20
  }
  return y
}

function getRelevantCheckIns(checkIns, period) {
  // Simple: return Q1 = Jan-Mar, Q2 = Apr-Jun, Q3 = Jul-Sep, Q4 = Oct-Dec
  const quarterMonths = {
    'Q1': ['01', '02', '03'],
    'Q2': ['04', '05', '06'],
    'Q3': ['07', '08', '09'],
    'Q4': ['10', '11', '12'],
  }
  const quarter = Object.keys(quarterMonths).find((q) => period.includes(q))
  const yearMatch = period.match(/\d{4}/)
  const year = yearMatch ? yearMatch[0] : null

  if (!quarter || !year) return checkIns

  const months = quarterMonths[quarter].map((m) => `${year}-${m}`)
  return checkIns.filter((ci) => months.includes(ci.month))
    .sort((a, b) => a.month.localeCompare(b.month))
}
