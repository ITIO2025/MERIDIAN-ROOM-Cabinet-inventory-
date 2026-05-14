import type { PricingResult, BOQItem } from './types'
import { formatCurrency, formatNumber } from './pricing-engine'

// ─── Dynamic import to avoid SSR issues ──────────────────────────────────────

async function loadJsPDF() {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  return { jsPDF, autoTable }
}

// ─── Color Palette ────────────────────────────────────────────────────────────

const C = {
  primary:   [17, 17, 17]       as [number, number, number],
  secondary: [30, 30, 30]       as [number, number, number],
  accent:    [198, 169, 105]    as [number, number, number],
  white:     [255, 255, 255]    as [number, number, number],
  gray:      [120, 120, 120]    as [number, number, number],
  lightGray: [240, 240, 240]    as [number, number, number],
  success:   [0, 168, 107]      as [number, number, number],
  warning:   [255, 184, 0]      as [number, number, number],
  danger:    [229, 57, 53]      as [number, number, number],
}

// ─── Generate Quotation PDF ────────────────────────────────────────────────────

export async function generateQuotationPDF(result: PricingResult): Promise<void> {
  const { jsPDF, autoTable } = await loadJsPDF()

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pw = doc.internal.pageSize.getWidth()   // 210mm
  const ph = doc.internal.pageSize.getHeight()  // 297mm
  const margin = 15

  // ─── Helper functions ─────────────────────────────────────────────────────

  const setFont = (size: number, style: 'normal' | 'bold' = 'normal', color = C.primary) => {
    doc.setFontSize(size)
    doc.setFont('helvetica', style)
    doc.setTextColor(...color)
  }

  const rect = (x: number, y: number, w: number, h: number, color: [number, number, number], r = 0) => {
    doc.setFillColor(...color)
    if (r > 0) doc.roundedRect(x, y, w, h, r, r, 'F')
    else doc.rect(x, y, w, h, 'F')
  }

  const line = (x1: number, y1: number, x2: number, y2: number, color = C.lightGray, w = 0.3) => {
    doc.setDrawColor(...color)
    doc.setLineWidth(w)
    doc.line(x1, y1, x2, y2)
  }

  const quoNumber = `QUO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`
  const today = new Date()
  const dateStr = today.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
  const validDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    .toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 1 — HEADER + PROJECT INFO + COST SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════

  // Header Background
  rect(0, 0, pw, 50, C.primary)
  rect(0, 48, pw, 4, C.accent)

  // Logo Block
  rect(margin, 10, 10, 10, C.accent, 2)
  setFont(8, 'bold', C.primary)
  doc.text('M', margin + 3.5, 17.5)

  setFont(14, 'bold', C.white)
  doc.text('MERIDIAN ROOM', margin + 14, 17)
  setFont(7, 'normal', C.accent)
  doc.text('LUXURY BUILT-IN  |  PRECISION ENGINEERING', margin + 14, 22)

  // Company info
  setFont(7, 'normal', [180, 180, 180])
  doc.text('123 Sukhumvit Road, Bangkok 10110  |  Tel: 02-XXX-XXXX  |  info@meridianroom.co.th', margin + 14, 28)

  // Quotation number (top right)
  setFont(9, 'bold', C.accent)
  doc.text('QUOTATION', pw - margin, 17, { align: 'right' })
  setFont(8, 'normal', [180, 180, 180])
  doc.text(quoNumber, pw - margin, 23, { align: 'right' })
  setFont(7, 'normal', [150, 150, 150])
  doc.text(`Date: ${dateStr}`, pw - margin, 29, { align: 'right' })
  doc.text(`Valid until: ${validDate}`, pw - margin, 34, { align: 'right' })

  let y = 60

  // ─── Project & Customer Info ──────────────────────────────────────────────

  // Two column info boxes
  const boxW = (pw - margin * 2 - 5) / 2

  // Left: Customer
  rect(margin, y, boxW, 30, C.lightGray, 2)
  rect(margin, y, boxW, 5, C.secondary, 2)
  setFont(6, 'bold', C.accent)
  doc.text('CUSTOMER', margin + 3, y + 3.5)
  setFont(8, 'bold', C.primary)
  doc.text(result.input.customerName || '-', margin + 3, y + 11)
  setFont(7, 'normal', C.gray)
  doc.text(`Sales: ${result.input.sales || '-'}`, margin + 3, y + 17)
  doc.text(`Designer: ${result.input.designer || '-'}`, margin + 3, y + 22)
  doc.text(`Location: ${result.input.province}`, margin + 3, y + 27)

  // Right: Project
  const rx = margin + boxW + 5
  rect(rx, y, boxW, 30, C.lightGray, 2)
  rect(rx, y, boxW, 5, C.secondary, 2)
  setFont(6, 'bold', C.accent)
  doc.text('PROJECT', rx + 3, y + 3.5)
  setFont(8, 'bold', C.primary)
  doc.text(result.input.projectName || 'Untitled Project', rx + 3, y + 11)
  setFont(7, 'normal', C.gray)
  doc.text(`Type: ${result.input.projectType}`, rx + 3, y + 17)
  doc.text(`Size: ${result.input.width} x ${result.input.height} x ${result.input.depth} mm`, rx + 3, y + 22)
  doc.text(`Qty: ${result.input.quantity} unit(s)  |  Install: ${result.input.installationType}`, rx + 3, y + 27)

  y += 38

  // ─── Specification Summary ────────────────────────────────────────────────

  rect(margin, y, pw - margin * 2, 5, C.secondary, 2)
  setFont(7, 'bold', C.accent)
  doc.text('SPECIFICATIONS', margin + 3, y + 3.5)
  y += 7

  const specs = [
    ['Board', `${result.input.boardType} ${result.input.boardThickness}mm`],
    ['Surface', result.input.surfaceType],
    ['Edge', result.input.edgeType],
    ['Door', `${result.input.doorType} (${result.input.doorCount} panels)`],
    ['Hardware', result.input.hardwareBrand],
    ['Shelves', `${result.input.shelfCount}`],
    ['Drawers', `${result.input.drawerCount}`],
  ]

  const specCols = 4
  const specW = (pw - margin * 2) / specCols
  specs.forEach((s, i) => {
    const col = i % specCols
    const row = Math.floor(i / specCols)
    const sx = margin + col * specW
    const sy = y + row * 7
    setFont(6, 'normal', C.gray)
    doc.text(s[0] + ':', sx + 1, sy + 3)
    setFont(6, 'bold', C.primary)
    doc.text(s[1], sx + 16, sy + 3)
  })

  y += Math.ceil(specs.length / specCols) * 7 + 6

  // ─── Cost Summary ─────────────────────────────────────────────────────────

  rect(margin, y, pw - margin * 2, 5, C.secondary, 2)
  setFont(7, 'bold', C.accent)
  doc.text('COST SUMMARY', margin + 3, y + 3.5)
  y += 7

  const breakdown = [
    ['Board Material',  result.costBreakdown.boardMaterial],
    ['Surface Finish',  result.costBreakdown.surfaceFinish],
    ['Edge Banding',    result.costBreakdown.edgebanding],
    ['Hardware',        result.costBreakdown.hardware],
    ['Factory Labor',   result.costBreakdown.laborFactory],
    ['Installation',    result.costBreakdown.laborInstallation],
    ['Transport',       result.costBreakdown.transport],
    ['Overhead (14%)',  result.costBreakdown.overhead],
  ]

  breakdown.forEach((row, i) => {
    if (i % 2 === 0) rect(margin, y, pw - margin * 2, 6, [248, 248, 248])
    setFont(7, 'normal', C.gray)
    doc.text(row[0] as string, margin + 3, y + 4.2)
    setFont(7, 'bold', C.primary)
    doc.text(formatCurrency(row[1] as number), pw - margin - 3, y + 4.2, { align: 'right' })
    const pct = result.netCost > 0 ? ((row[1] as number / result.netCost) * 100).toFixed(1) + '%' : '0%'
    setFont(6, 'normal', C.gray)
    doc.text(pct, pw - margin - 40, y + 4.2, { align: 'right' })
    y += 6
  })

  // Total line
  line(margin, y, pw - margin, y, C.accent, 0.5)
  y += 3
  setFont(8, 'bold', C.primary)
  doc.text('Net Cost', margin + 3, y + 4)
  doc.text(formatCurrency(result.netCost), pw - margin - 3, y + 4, { align: 'right' })
  y += 10

  // Price Box
  rect(margin, y, pw - margin * 2, 20, C.primary, 3)
  // Gold side accent
  rect(margin, y, 4, 20, C.accent, 2)

  setFont(7, 'normal', [150, 150, 150])
  doc.text('SELLING PRICE', margin + 8, y + 6)
  setFont(14, 'bold', C.accent)
  doc.text(formatCurrency(result.sellingPrice), margin + 8, y + 14)

  // Margin badge
  const marginColor = result.grossMarginPercent >= 35 ? C.success :
    result.grossMarginPercent >= 25 ? C.warning : C.danger
  rect(pw - margin - 35, y + 5, 32, 10, marginColor, 2)
  setFont(8, 'bold', C.white)
  doc.text(`GP ${result.grossMarginPercent.toFixed(1)}%`, pw - margin - 19, y + 11.5, { align: 'center' })

  setFont(7, 'normal', [120, 120, 120])
  doc.text(`Profit: ${formatCurrency(result.grossProfit)}`, pw - margin - 35, y + 18)

  y += 28

  // VAT note
  if (result.vatAmount > 0) {
    setFont(7, 'normal', C.gray)
    doc.text(`+ VAT 7%: ${formatCurrency(result.vatAmount)}  |  Total incl. VAT: ${formatCurrency(result.totalWithVAT)}`, margin, y)
    y += 7
  }

  // ─── AI Warnings on Page 1 ────────────────────────────────────────────────

  const dangers = result.aiAnalysis.warnings.filter(w => w.level !== 'INFO')
  if (dangers.length > 0) {
    rect(margin, y, pw - margin * 2, 5, [255, 248, 220], 2)
    setFont(6, 'bold', C.warning)
    doc.text(`⚠  AI Analysis: ${result.aiAnalysis.summary}`, margin + 3, y + 3.5)
    y += 7
  }

  // ─── Signatures ───────────────────────────────────────────────────────────

  y = Math.max(y, ph - 45)
  line(margin, y, pw - margin, y)
  y += 8

  const sigW = (pw - margin * 2 - 20) / 2

  // Left sig
  line(margin, y + 12, margin + sigW, y + 12, C.primary)
  setFont(7, 'normal', C.gray)
  doc.text('Authorized by MERIDIAN ROOM', margin + sigW / 2, y + 16, { align: 'center' })

  // Right sig
  const rsX = margin + sigW + 20
  line(rsX, y + 12, rsX + sigW, y + 12, C.primary)
  doc.text('Customer Approval', rsX + sigW / 2, y + 16, { align: 'center' })

  // Footer
  rect(0, ph - 10, pw, 10, C.primary)
  setFont(6, 'normal', [150, 150, 150])
  doc.text('MERIDIAN ROOM Co., Ltd.  |  Precision Engineering in Furniture™', pw / 2, ph - 4, { align: 'center' })

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 2 — FULL BOQ
  // ═══════════════════════════════════════════════════════════════════════════

  doc.addPage()

  // Header (smaller on page 2+)
  rect(0, 0, pw, 18, C.primary)
  rect(0, 16, pw, 2, C.accent)
  setFont(9, 'bold', C.white)
  doc.text('MERIDIAN ROOM', margin, 10)
  setFont(7, 'normal', C.accent)
  doc.text('Bill of Quantities (BOQ)', margin, 15)
  setFont(7, 'normal', [150, 150, 150])
  doc.text(`${quoNumber}  |  ${result.input.projectName || 'Project'}`, pw - margin, 10, { align: 'right' })
  doc.text(`Page 2`, pw - margin, 15, { align: 'right' })

  // Group BOQ by category
  const categories: Record<string, { label: string; items: BOQItem[] }> = {
    MATERIAL:     { label: 'MATERIAL — Board & Substrates', items: [] },
    SURFACE:      { label: 'SURFACE — Finish & Coating', items: [] },
    EDGE:         { label: 'EDGE BANDING', items: [] },
    HARDWARE:     { label: 'HARDWARE & ACCESSORIES', items: [] },
    LABOR:        { label: 'FACTORY LABOR', items: [] },
    INSTALLATION: { label: 'INSTALLATION', items: [] },
    OVERHEAD:     { label: 'OVERHEAD & LOGISTICS', items: [] },
  }

  result.boqItems.forEach(item => {
    if (categories[item.category]) categories[item.category].items.push(item)
  })

  let tableY = 24
  Object.entries(categories).forEach(([key, group]) => {
    if (!group.items.length) return

    // Section header
    rect(margin, tableY, pw - margin * 2, 6, C.secondary, 1)
    setFont(7, 'bold', C.accent)
    doc.text(group.label, margin + 3, tableY + 4.2)

    const subtotal = group.items.reduce((s, i) => s + i.totalPrice, 0)
    setFont(7, 'bold', C.accent)
    doc.text(formatCurrency(subtotal), pw - margin - 3, tableY + 4.2, { align: 'right' })
    tableY += 6

    autoTable(doc, {
      startY: tableY,
      margin: { left: margin, right: margin },
      head: [['#', 'Description', 'Unit', 'Qty', 'Unit Price', 'Total']],
      body: group.items.map(item => [
        item.id,
        item.description + (item.spec ? `\n${item.spec}` : ''),
        item.unit,
        formatNumber(item.quantity),
        formatCurrency(item.unitPrice),
        formatCurrency(item.totalPrice),
      ]),
      headStyles: {
        fillColor: C.primary,
        textColor: C.accent,
        fontSize: 6,
        fontStyle: 'bold',
        cellPadding: 2,
      },
      bodyStyles: {
        fontSize: 6.5,
        textColor: C.primary,
        cellPadding: 2,
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 14, halign: 'center' },
        3: { cellWidth: 14, halign: 'right' },
        4: { cellWidth: 24, halign: 'right' },
        5: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
      },
      styles: { font: 'helvetica', lineColor: [230, 230, 230], lineWidth: 0.2 },
      tableLineColor: [200, 200, 200],
      tableLineWidth: 0.2,
    })

    tableY = (doc as any).lastAutoTable.finalY + 4
  })

  // Grand Total
  rect(margin, tableY, pw - margin * 2, 10, C.lightGray, 2)
  setFont(8, 'bold', C.primary)
  doc.text('TOTAL COST (NET)', margin + 4, tableY + 6.5)
  doc.text(formatCurrency(result.netCost), pw - margin - 4, tableY + 6.5, { align: 'right' })

  rect(0, ph - 10, pw, 10, C.primary)
  setFont(6, 'normal', [150, 150, 150])
  doc.text('MERIDIAN ROOM Co., Ltd.  |  Precision Engineering in Furniture™', pw / 2, ph - 4, { align: 'center' })

  // ─── Save ────────────────────────────────────────────────────────────────

  const filename = `${quoNumber}_${(result.input.customerName || 'Customer').replace(/\s/g, '_')}.pdf`
  doc.save(filename)
}

// ─── Generate BOQ-only PDF ─────────────────────────────────────────────────────

export async function generateBOQPDF(result: PricingResult): Promise<void> {
  const { jsPDF, autoTable } = await loadJsPDF()
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pw = doc.internal.pageSize.getWidth()
  const margin = 12

  doc.setFillColor(...C.primary)
  doc.rect(0, 0, pw, 15, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...C.accent)
  doc.text('MERIDIAN ROOM — Bill of Quantities', margin, 10)
  doc.setFontSize(7)
  doc.setTextColor(180, 180, 180)
  doc.text(`Project: ${result.input.projectName || 'Untitled'}  |  Customer: ${result.input.customerName || '-'}`, pw / 2, 10, { align: 'center' })
  doc.text(`${new Date().toLocaleDateString('th-TH')}`, pw - margin, 10, { align: 'right' })

  autoTable(doc, {
    startY: 20,
    margin: { left: margin, right: margin },
    head: [['ID', 'Category', 'Description', 'Spec', 'Unit', 'Qty', 'Unit Price (THB)', 'Total (THB)', '% of Cost']],
    body: result.boqItems.map(item => [
      item.id,
      item.category,
      item.description,
      item.spec || '-',
      item.unit,
      formatNumber(item.quantity),
      formatCurrency(item.unitPrice),
      formatCurrency(item.totalPrice),
      result.netCost > 0 ? ((item.totalPrice / result.netCost) * 100).toFixed(1) + '%' : '0%',
    ]),
    headStyles: { fillColor: C.primary, textColor: C.accent, fontSize: 7, fontStyle: 'bold' },
    bodyStyles: { fontSize: 6.5, textColor: C.primary },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    footStyles: { fillColor: C.secondary, textColor: C.accent, fontStyle: 'bold' },
    foot: [['', '', '', '', '', '', 'NET COST', formatCurrency(result.netCost), '100%']],
    styles: { font: 'helvetica' },
    columnStyles: {
      0: { cellWidth: 20 },
      5: { halign: 'right' },
      6: { halign: 'right' },
      7: { halign: 'right', fontStyle: 'bold' },
      8: { halign: 'center' },
    },
  })

  doc.save(`BOQ_${result.input.projectName || 'Project'}.pdf`)
}
