'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Download, Loader2, X } from 'lucide-react'

interface College { id: string; name: string; code: string }

interface Props {
  reportType: string
  reportLabel: string
  colleges: College[]
}

export function GenerateReportButton({ reportType, reportLabel, colleges }: Props) {
  const [open, setOpen] = useState(false)
  const [collegeId, setCollegeId] = useState(colleges[0]?.id || '')
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    if (!collegeId) return toast.error('Select a college')
    setLoading(true)

    try {
      // 1. Create a report record
      const createRes = await fetch('/api/reports/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collegeId, reportType }),
      })
      const { reportId, error: createErr } = await createRes.json()
      if (createErr) throw new Error(createErr)

      // 2. Generate report data from live DB
      const genRes = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, collegeId, reportType }),
      })
      const { data, error: genErr } = await genRes.json()
      if (genErr) throw new Error(genErr)

      // 3. Build and download PDF
      const college = colleges.find(c => c.id === collegeId)
      await downloadPDF(data, college?.name || '', reportLabel, reportType)

      toast.success(`${reportLabel} downloaded!`)
      setOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'PDF generation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors flex items-center gap-1.5"
      >
        <Download className="h-3.5 w-3.5" />
        Generate
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card border rounded-xl p-6 w-[380px] shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base">Generate {reportLabel}</h3>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5">Select College</label>
              <select
                value={collegeId}
                onChange={e => setCollegeId(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select a college...</option>
                {colleges.map(c => (
                  <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                ))}
              </select>
            </div>

            <p className="text-xs text-muted-foreground">
              Pulls live data and includes an AI executive summary.
            </p>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading || !collegeId}
                className="flex-[2] rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
                ) : (
                  <><Download className="h-4 w-4" /> Download PDF</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Type-specific header colours
const TYPE_COLORS: Record<string, [number, number, number]> = {
  placement:  [37, 99, 235],   // blue
  health:     [99, 102, 241],  // indigo
  quarterly:  [124, 58, 237],  // violet
  revenue:    [16, 185, 129],  // emerald
}

async function downloadPDF(data: any, collegeName: string, reportLabel: string, reportType: string) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const { default: jsPDF } = await import('jspdf')
  await import('jspdf-autotable') // side-effect: registers autoTable on jsPDF.prototype

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210, M = 16
  const [r, g, b] = TYPE_COLORS[reportType] || [37, 99, 235]

  // ── Header ──────────────────────────────────────────────────────────────────
  doc.setFillColor(r, g, b)
  doc.rect(0, 0, W, 38, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('CareerOS Partner Intelligence', M, 13)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  // reportLabel already contains the full name (e.g. "Placement Report") — no extra "Report"
  doc.text(`${reportLabel} — ${collegeName}`, M, 22)

  doc.setFontSize(8)
  doc.text(
    `Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST   |   CareerOS Partner Intelligence · Confidential`,
    M, 31
  )

  doc.setTextColor(30, 30, 30)
  let y = 48

  // ── AI Summary ──────────────────────────────────────────────────────────────
  if (data?.aiSummary) {
    doc.setFillColor(243, 246, 255)
    doc.roundedRect(M, y, W - M * 2, 28, 2, 2, 'F')
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(r, g, b)
    doc.text('AI EXECUTIVE SUMMARY', M + 4, y + 6)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(50, 50, 50)
    const summaryText = data.aiSummary.split('\n').slice(4).join(' ').slice(0, 400)
    const summaryLines = doc.splitTextToSize(summaryText, W - M * 2 - 8)
    doc.text(summaryLines.slice(0, 4), M + 4, y + 13)
    y += 36
  }

  const m = data?.metrics || {}
  const students = m.students || {}
  const training = m.training || {}
  const revenue = m.revenue || {}

  // ── Key Metrics Grid ────────────────────────────────────────────────────────
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
    ['Rev Share (Total)', `Rs.${((revenue.total || 0) / 100000).toFixed(2)}L`],
  ]

  const colW = (W - M * 2) / 5
  metrics.forEach(([label, val], i) => {
    const col = i % 5
    const row = Math.floor(i / 5)
    const x = M + col * colW
    const yy = y + row * 18
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

  // ── Placement History (placement + quarterly reports) ────────────────────────
  if ((reportType === 'placement' || reportType === 'quarterly') && data?.yearSummaries?.length) {
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

  // ── Health Score Breakdown (health report) ───────────────────────────────────
  if (reportType === 'health') {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 30, 30)
    doc.text('COLLEGE HEALTH SCORE BREAKDOWN', M, y)
    y += 3

    const hs = data?.college?.health_score || 0
    const factors = [
      ['Placement Rate', `${students.placementRate || 0}%`, students.placementRate >= 70 ? 'Strong' : 'Needs Work'],
      ['Training Completion', `${training.avgCompletion || 0}%`, training.avgCompletion >= 60 ? 'On Track' : 'Lagging'],
      ['Student Risk', `${students.highRisk || 0} high-risk`, students.highRisk < 20 ? 'Healthy' : 'Alert'],
      ['Revenue Share', `Rs.${((revenue.total || 0) / 100000).toFixed(2)}L`, revenue.total > 0 ? 'Active' : 'No Data'],
      ['Overall Score', `${hs}/100`, hs >= 70 ? 'Healthy' : hs >= 50 ? 'Moderate' : 'Critical'],
    ]

    ;(doc as any).autoTable({
      startY: y,
      head: [['Factor', 'Value', 'Status']],
      body: factors,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [r, g, b], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: M, right: M },
    })
    y = (doc as any).lastAutoTable.finalY + 10
  }

  // ── Training Cohorts (placement + quarterly + health) ───────────────────────
  if (reportType !== 'revenue' && data?.cohorts?.length) {
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

  // ── FDP Sessions (quarterly report) ─────────────────────────────────────────
  if (reportType === 'quarterly' && data?.fdp?.length) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 30, 30)
    doc.text('FDP SESSIONS', M, y)
    y += 3

    ;(doc as any).autoTable({
      startY: y,
      head: [['Title', 'Date', 'Status', 'Registered']],
      body: data.fdp.map((f: any) => [
        f.title || '',
        f.date ? new Date(f.date).toLocaleDateString('en-IN') : '—',
        (f.status || '').toUpperCase(),
        String(f.registered_count || 0),
      ]),
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [r, g, b], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: M, right: M },
    })
    y = (doc as any).lastAutoTable.finalY + 10
  }

  // ── Revenue Share (revenue + quarterly reports) ─────────────────────────────
  if ((reportType === 'revenue' || reportType === 'quarterly') && data?.revShare?.length) {
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
    y = (doc as any).lastAutoTable.finalY + 10
  }

  // ── MOU Info (quarterly report) ──────────────────────────────────────────────
  if ((reportType === 'quarterly' || reportType === 'health') && data?.mou) {
    const mu = data.mou
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 30, 30)
    doc.text('MOU / PARTNERSHIP DETAILS', M, y)
    y += 3

    ;(doc as any).autoTable({
      startY: y,
      head: [['Field', 'Value']],
      body: [
        ['MOU Title', mu.title || '—'],
        ['Status', (mu.status || '—').toUpperCase()],
        ['Expiry Date', mu.expiry_date ? new Date(mu.expiry_date).toLocaleDateString('en-IN') : '—'],
        ['Revenue Share %', `${mu.revenue_share_pct || 0}%`],
        ['Seats', String(mu.seats_purchased || 0)],
      ],
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [r, g, b], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: M, right: M },
    })
  }

  // ── Footer ────────────────────────────────────────────────────────────────────
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `CareerOS Partner Intelligence Platform  |  Confidential  |  Page ${i} of ${pageCount}`,
      W / 2, 290, { align: 'center' }
    )
  }

  const filename = `CareerOS_${reportType}_${collegeName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(filename)
}
