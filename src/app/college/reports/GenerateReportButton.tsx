'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Download, Loader2 } from 'lucide-react'

export function GenerateReportButton({
  collegeId, reportType, reportTitle, collegeName,
}: {
  collegeId: string
  reportType: string
  reportTitle: string
  collegeName?: string
}) {
  const [loading, setLoading] = useState(false)
  const [coBrand, setCoBrand] = useState(true)
  const router = useRouter()

  async function generate() {
    if (!collegeId) return toast.error('College ID not found — please refresh and try again')
    setLoading(true)
    try {
      const createRes = await fetch('/api/reports/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collegeId, reportType }),
      })
      const { reportId, error: createErr } = await createRes.json()
      if (createErr) throw new Error(createErr)

      const genRes = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, collegeId, reportType }),
      })
      const { data, error: genErr } = await genRes.json()
      if (genErr) throw new Error(genErr)

      await downloadPDF(data, reportTitle, reportType, coBrand, collegeName)
      toast.success(`${reportTitle} downloaded!`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Report generation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={coBrand}
          onChange={e => setCoBrand(e.target.checked)}
          className="rounded border-border h-3.5 w-3.5 accent-primary"
        />
        <span className="text-[11px] text-muted-foreground">Co-brand with college logo (G5)</span>
      </label>
      <button
        onClick={generate}
        disabled={loading}
        className="w-full flex items-center justify-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
        {loading ? 'Generating...' : 'Generate'}
      </button>
    </div>
  )
}

const TYPE_COLORS: Record<string, [number, number, number]> = {
  placement:  [37, 99, 235],
  training:   [59, 130, 246],
  revenue:    [16, 185, 129],
  executive:  [124, 58, 237],
  health:     [99, 102, 241],
  quarterly:  [124, 58, 237],
}

async function downloadPDF(
  data: any, reportTitle: string, reportType: string,
  coBrand = false, collegeNameProp?: string
) {
  // @ts-ignore
  const { default: jsPDF } = await import('jspdf')
  await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210, M = 16
  const [r, g, b] = TYPE_COLORS[reportType] || [37, 99, 235]
  const collegeName = data?.college?.name || collegeNameProp || 'College'

  // Header
  doc.setFillColor(r, g, b)
  doc.rect(0, 0, W, coBrand ? 46 : 38, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('CareerOS Partner Intelligence', M, 13)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`${reportTitle} — ${collegeName}`, M, 22)
  doc.setFontSize(8)
  doc.text(
    `Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST   |   Confidential`,
    M, 31
  )

  // Co-brand strip (G5)
  if (coBrand) {
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    const cbText = `[ ${collegeName.toUpperCase()} ]  in partnership with  SKILL TANK PVT. LTD.`
    doc.text(cbText, M, 42)
    doc.text('Co-branded Document', W - M - (doc as any).getTextWidth('Co-branded Document'), 42)
  }

  doc.setTextColor(30, 30, 30)
  let y = coBrand ? 56 : 48

  // AI Executive Summary
  if (data?.aiSummary) {
    doc.setFillColor(243, 246, 255)
    doc.roundedRect(M, y, W - M * 2, 28, 2, 2, 'F')
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(r, g, b)
    doc.text('AI EXECUTIVE SUMMARY', M + 4, y + 6)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(50, 50, 50)
    const txt = data.aiSummary.split('\n').slice(4).join(' ').slice(0, 400)
    doc.text(doc.splitTextToSize(txt, W - M * 2 - 8).slice(0, 4), M + 4, y + 13)
    y += 36
  }

  const m = data?.metrics || {}
  const students = m.students || {}
  const training = m.training || {}
  const revenue = m.revenue || {}

  // Key Metrics
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 30, 30)
  doc.text('KEY METRICS', M, y)
  y += 6

  const metrics = [
    ['Total Students', String(students.total || 0)],
    ['Placed', String(students.placed || 0)],
    ['Placement Rate', `${students.placementRate || 0}%`],
    ['Avg Readiness', `${students.avgReadiness || 0}%`],
    ['High Risk', String(students.highRisk || 0)],
    ['Avg CGPA', String(students.avgCgpa || '—')],
    ['Training Cohorts', String(training.cohorts || 0)],
    ['Avg Completion', `${training.avgCompletion || 0}%`],
    ['Health Score', `${data?.college?.health_score ?? '—'}/100`],
    ['Rev Share', `Rs.${((revenue.total || 0) / 100000).toFixed(2)}L`],
  ]
  const colW = (W - M * 2) / 5
  metrics.forEach(([label, val], i) => {
    const col = i % 5, row = Math.floor(i / 5)
    const x = M + col * colW, yy = y + row * 18
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(x, yy, colW - 2, 16, 1.5, 1.5, 'F')
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(r, g, b)
    doc.text(val, x + 4, yy + 9)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 116, 139)
    doc.text(label.toUpperCase(), x + 4, yy + 14)
  })
  y += Math.ceil(metrics.length / 5) * 18 + 8

  // Placement History
  if ((reportType === 'placement' || reportType === 'executive') && data?.yearSummaries?.length) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 30, 30)
    doc.text('PLACEMENT HISTORY (YEAR-ON-YEAR)', M, y)
    y += 3
    ;(doc as any).autoTable({
      startY: y,
      head: [['Academic Year', 'Offers', 'Companies', 'Avg CTC (LPA)', 'Top Offer', 'Top Company']],
      body: data.yearSummaries.map((yr: any) => [
        yr.academic_year || '',
        String(yr.offers || 0),
        String(yr.companies || 0),
        `Rs.${yr.avg_lpa || 0}L`,
        `Rs.${yr.top_offer_lpa || 0}L`,
        yr.top_company || '—',
      ]),
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [r, g, b], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: M, right: M },
    })
    y = (doc as any).lastAutoTable.finalY + 10
  }

  // Training Cohorts
  if ((reportType === 'training' || reportType === 'executive') && data?.cohorts?.length) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 30, 30)
    doc.text('TRAINING COHORTS', M, y)
    y += 3
    ;(doc as any).autoTable({
      startY: y,
      head: [['Cohort Name', 'Enrolled', 'Completion %', 'Status']],
      body: data.cohorts.map((c: any) => [
        c.name || '',
        String(c.enrolled_count || 0),
        `${c.completion_pct || 0}%`,
        (c.status || '').toUpperCase(),
      ]),
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [r, g, b], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: M, right: M },
    })
    y = (doc as any).lastAutoTable.finalY + 10
  }

  // Revenue
  if ((reportType === 'revenue' || reportType === 'executive') && data?.revShare?.length) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 30, 30)
    doc.text('REVENUE SHARE HISTORY', M, y)
    y += 3
    ;(doc as any).autoTable({
      startY: y,
      head: [['Period', 'Gross Amount', 'Share Amount', 'Status']],
      body: data.revShare.map((rv: any) => [
        rv.period || '',
        `Rs.${((rv.gross_amount || 0) / 100000).toFixed(2)}L`,
        `Rs.${((rv.share_amount || 0) / 100000).toFixed(2)}L`,
        (rv.payout_status || '').toUpperCase(),
      ]),
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [r, g, b], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: M, right: M },
    })
  }

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(150)
    doc.text(
      `CareerOS Partner Intelligence  |  Confidential  |  Page ${i} of ${pageCount}`,
      W / 2, 290, { align: 'center' }
    )
  }

  const filename = `CareerOS_${reportType}_${collegeName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(filename)
}
