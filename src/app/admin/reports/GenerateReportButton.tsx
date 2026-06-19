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

      // 3. Build and download PDF (jspdf loaded dynamically)
      const college = colleges.find(c => c.id === collegeId)
      await downloadPDF(data, college?.name || '', reportLabel)

      toast.success(`${reportLabel} report downloaded!`)
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
              <h3 className="font-semibold text-base">Generate {reportLabel} Report</h3>
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
                {colleges.map(c => (
                  <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                ))}
              </select>
            </div>

            <p className="text-xs text-muted-foreground">
              The report will pull live data from the platform and include an AI executive summary.
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
                disabled={loading}
                className="flex-[2] rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
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

async function downloadPDF(data: any, collegeName: string, reportLabel: string) {
  // Dynamic import to avoid SSR issues
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - jspdf loaded at runtime via npm
  const { default: jsPDF } = await import('jspdf')
  // @ts-ignore
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210, M = 16

  // ── Header ──────────────────────────────────────────
  doc.setFillColor(37, 99, 235)
  doc.rect(0, 0, W, 36, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('CareerOS Partner Intelligence', M, 14)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`${reportLabel} Report — ${collegeName}`, M, 22)

  doc.setFontSize(8)
  doc.text(`Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST   |   Track 5B — SummerSaaS Hackathon 2026`, M, 30)

  doc.setTextColor(30, 30, 30)
  let y = 48

  // ── AI Summary ──────────────────────────────────────
  if (data?.aiSummary) {
    doc.setFillColor(243, 246, 255)
    doc.roundedRect(M, y, W - M * 2, 28, 2, 2, 'F')
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(37, 99, 235)
    doc.text('AI EXECUTIVE SUMMARY', M + 4, y + 6)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(50, 50, 50)
    const summaryLines = doc.splitTextToSize(data.aiSummary.split('\n').slice(4).join(' ').slice(0, 400), W - M * 2 - 8)
    doc.text(summaryLines.slice(0, 4), M + 4, y + 12)
    y += 36
  }

  const m = data?.metrics || {}
  const students = m.students || {}
  const training = m.training || {}
  const revenue = m.revenue || {}

  // ── Key Metrics Grid ─────────────────────────────────
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
    ['Health Score', `${data?.college?.health_score || '—'}/100`],
    ['Total Rev Share', `₹${((revenue.total || 0) / 100000).toFixed(2)}L`],
  ]

  const colW = (W - M * 2) / 5
  metrics.forEach(([label, val], i) => {
    const col = i % 5
    const row = Math.floor(i / 5)
    const x = M + col * colW
    const yy = y + row * 18

    doc.setFillColor(248, 250, 252)
    doc.roundedRect(x, yy, colW - 2, 16, 1.5, 1.5, 'F')
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(37, 99, 235)
    doc.text(val, x + 4, yy + 9)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 116, 139)
    doc.text(label.toUpperCase(), x + 4, yy + 14)
  })
  y += Math.ceil(metrics.length / 5) * 18 + 8

  // ── Year Summaries Table ──────────────────────────────
  if (data?.yearSummaries?.length) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 30, 30)
    doc.text('PLACEMENT HISTORY', M, y)
    y += 3

    autoTable(doc, {
      startY: y,
      head: [['Academic Year', 'Offers', 'Companies', 'Avg CTC (LPA)', 'Highest CTC']],
      body: data.yearSummaries.map((yr: any) => [
        yr.academic_year || '',
        String(yr.offers || 0),
        String(yr.companies || 0),
        `₹${yr.avg_ctc_lpa || 0}L`,
        `₹${yr.highest_ctc_lpa || 0}L`,
      ]),
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: M, right: M },
    })
    y = (doc as any).lastAutoTable.finalY + 10
  }

  // ── Cohorts Table ─────────────────────────────────────
  if (data?.cohorts?.length) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 30, 30)
    doc.text('TRAINING COHORTS', M, y)
    y += 3

    autoTable(doc, {
      startY: y,
      head: [['Cohort Name', 'Enrolled', 'Completion %', 'Status']],
      body: data.cohorts.map((c: any) => [
        c.name || '',
        String(c.enrolled_count || 0),
        `${c.completion_pct || 0}%`,
        (c.status || '').toUpperCase(),
      ]),
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: M, right: M },
    })
    y = (doc as any).lastAutoTable.finalY + 10
  }

  // ── Revenue Table ─────────────────────────────────────
  if (data?.revShare?.length) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 30, 30)
    doc.text('REVENUE SHARE', M, y)
    y += 3

    autoTable(doc, {
      startY: y,
      head: [['Period', 'Gross Amount', 'Share Amount', 'Status']],
      body: data.revShare.map((r: any) => [
        r.period || '',
        `₹${((r.gross_amount || 0) / 100000).toFixed(2)}L`,
        `₹${((r.share_amount || 0) / 100000).toFixed(2)}L`,
        (r.payout_status || '').toUpperCase(),
      ]),
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: M, right: M },
    })
  }

  // ── Footer ────────────────────────────────────────────
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `CareerOS Partner Intelligence Platform · Confidential · Page ${i} of ${pageCount}`,
      W / 2, 290, { align: 'center' }
    )
  }

  // Download
  const filename = `CareerOS_${reportLabel.replace(/\s/g, '_')}_${collegeName.replace(/\s/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(filename)
}
