'use client'

import { useState } from 'react'
import { toast } from 'sonner'

export function FixRealismButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ high: number; medium: number; low: number; avgReadiness: number } | null>(null)

  async function handleFix() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/fix-realism', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      setResult(json.stats.risk)
      toast.success(`Realism fixed! ${json.stats.total} students updated. Avg readiness: ${json.stats.avgReadiness}%`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleFix}
        disabled={loading}
        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
      >
        {loading ? 'Fixing…' : 'Run Fix'}
      </button>
      {result && (
        <span className="text-xs text-muted-foreground">
          ✓ High: {result.high} · Medium: {result.medium} · Low: {result.low}
        </span>
      )}
    </div>
  )
}
