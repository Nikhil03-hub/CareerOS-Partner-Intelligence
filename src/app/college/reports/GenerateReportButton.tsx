'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Download } from 'lucide-react'

export function GenerateReportButton({ collegeId, reportType, reportTitle }: {
  collegeId: string, reportType: string, reportTitle: string
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function generate() {
    setLoading(true)
    const supabase = createClient()

    try {
      // Create report record
      const { data: report, error } = await supabase.from('reports').insert({
        college_id: collegeId,
        type: reportType,
        title: `${reportTitle} — ${new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`,
        status: 'processing',
      }).select('id').single()

      if (error) throw error

      // Call server action to generate PDF
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: report.id, collegeId, reportType }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Generation failed')
      }

      toast.success(`${reportTitle} generated! Refreshing…`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={generate}
      disabled={loading}
      className="w-full flex items-center justify-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
    >
      <Download className="h-3.5 w-3.5" />
      {loading ? 'Generating…' : 'Generate'}
    </button>
  )
}
