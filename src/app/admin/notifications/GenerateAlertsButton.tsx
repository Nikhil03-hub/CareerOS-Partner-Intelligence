'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Zap, Loader2 } from 'lucide-react'

export function GenerateAlertsButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleGenerate() {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications/generate-alerts', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      const { created, breakdown } = json
      toast.success(
        `${created} alerts generated — MOU: ${breakdown.mouExpiry} · Risk: ${breakdown.highRisk} · Completion: ${breakdown.lowCompletion}`
      )
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={loading}
      className="flex items-center gap-2 border border-primary text-primary hover:bg-primary/5 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
    >
      {loading
        ? <Loader2 className="h-4 w-4 animate-spin" />
        : <Zap className="h-4 w-4" />
      }
      {loading ? 'Scanning…' : 'Generate Alerts'}
    </button>
  )
}
